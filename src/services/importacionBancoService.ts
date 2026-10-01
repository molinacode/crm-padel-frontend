import { supabase } from '../lib/supabase';
import type { TablesInsert } from '../types/supabase';
import {
  huellaMovimiento,
  lineaCsvDeId,
  type MovimientoBancario,
} from '../utils/importarPagosCsv';

export interface FilaImportacionPago {
  movimiento: MovimientoBancario;
  alumnoId: string;
  /** Segundo alumno en pagos conjuntos (opcional). */
  alumnoId2: string;
  score: number;
  seleccionado: boolean;
  estadoConciliacion: 'auto_match' | 'conflicto' | 'pendiente' | 'gasto' | 'duplicado';
}

export interface ResultadoImportacionBanco {
  importId: string;
  creados: number;
  duplicados: number;
  gastosDetectados: number;
  descartados: number;
}

function mensajeError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: string }).message || '');
    const details = String((err as { details?: string }).details || '');
    const hint = String((err as { hint?: string }).hint || '');
    return [msg, details, hint].filter(Boolean).join(' — ') || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Huellas ya usadas en pagos o en movimientos de importaciones anteriores. */
export async function buscarHuellasExistentes(
  huellas: string[]
): Promise<Set<string>> {
  const unicas = [...new Set(huellas.filter(Boolean))];
  const encontradas = new Set<string>();
  if (!unicas.length) return encontradas;

  // Chunks: evita IN gigantes en el proxy
  const CHUNK = 80;
  for (let i = 0; i < unicas.length; i += CHUNK) {
    const slice = unicas.slice(i, i + CHUNK);
    const { data: enPagos, error: errPagos } = await supabase
      .from('pagos')
      .select('huella_movimiento')
      .in('huella_movimiento', slice);
    if (errPagos) throw new Error(mensajeError(errPagos, 'Error buscando huellas en pagos'));
    for (const row of enPagos || []) {
      if (row.huella_movimiento) encontradas.add(String(row.huella_movimiento));
    }

    const { data: enMovs, error: errMovs } = await supabase
      .from('importaciones_banco_movimientos')
      .select('huella_movimiento')
      .in('huella_movimiento', slice);
    if (errMovs) {
      throw new Error(mensajeError(errMovs, 'Error buscando huellas en movimientos'));
    }
    for (const row of enMovs || []) {
      if (row.huella_movimiento) encontradas.add(String(row.huella_movimiento));
    }
  }

  return encontradas;
}

function bancoDelLote(filas: FilaImportacionPago[]): 'ing' | 'revolut' | 'desconocido' {
  const bancos = filas
    .map(f => f.movimiento.bancoOrigen)
    .filter((b): b is 'ing' | 'revolut' | 'desconocido' =>
      b === 'ing' || b === 'revolut' || b === 'desconocido'
    );
  const primero = bancos[0] || 'desconocido';
  if (!bancos.length) return 'desconocido';
  return bancos.every(b => b === primero) ? primero : 'desconocido';
}

function estadoMatchDb(
  estado: FilaImportacionPago['estadoConciliacion']
): 'auto_match' | 'pendiente' | 'aceptado' | 'descartado' | 'duplicado' {
  if (estado === 'auto_match') return 'auto_match';
  if (estado === 'duplicado') return 'duplicado';
  if (estado === 'gasto') return 'descartado';
  // conflicto / pendiente confirmados al importar → aceptado
  return 'aceptado';
}

function splitCantidades(total: number, tieneSegundo: boolean): [number, number] {
  if (!tieneSegundo) return [total, 0];
  const a = Math.round((total / 2) * 100) / 100;
  const b = Math.round((total - a) * 100) / 100;
  return [a, b];
}

/**
 * Persiste el lote de importación, los movimientos de ingreso aceptados
 * y los pagos enlazados. Los gastos no se guardan (siguen a mano).
 */
export async function confirmarImportacionBanco(params: {
  nombreArchivo: string;
  filas: FilaImportacionPago[];
}): Promise<ResultadoImportacionBanco> {
  const { nombreArchivo, filas } = params;
  const ingresos = filas.filter(f => f.movimiento.tipoMovimiento === 'ingreso');
  const gastosDetectados = filas.filter(
    f => f.movimiento.tipoMovimiento === 'gasto'
  ).length;

  const seleccionados = ingresos.filter(f => f.seleccionado && f.alumnoId);
  if (!seleccionados.length) {
    throw new Error('No hay movimientos seleccionados para crear pagos.');
  }

  const huellas = seleccionados.flatMap(f => {
    const h = huellaMovimiento(f.movimiento);
    return f.alumnoId2 && f.alumnoId2 !== f.alumnoId ? [h, `${h}#2`] : [h];
  });
  const existentes = await buscarHuellasExistentes(huellas);

  const aCrear = seleccionados.filter(f => {
    const h = huellaMovimiento(f.movimiento);
    return !existentes.has(h);
  });
  const duplicados = seleccionados.length - aCrear.length;
  const descartados = ingresos.filter(f => !f.seleccionado || !f.alumnoId).length;

  const { data: lote, error: errLote } = await supabase
    .from('importaciones_banco')
    .insert({
      nombre_archivo: nombreArchivo || 'extracto.csv',
      banco: bancoDelLote(filas),
      estado: 'confirmada',
      total_lineas: filas.length,
      total_ingresos: ingresos.length,
      total_gastos: gastosDetectados,
      total_aceptadas: aCrear.length,
      total_duplicadas: duplicados,
      total_descartadas: descartados + gastosDetectados,
      total_creadas_en_pagos: 0,
    } satisfies TablesInsert<'importaciones_banco'>)
    .select('id')
    .single();

  if (errLote) {
    throw new Error(mensajeError(errLote, 'No se pudo crear el lote de importación.'));
  }
  const importId = lote?.id as string;
  if (!importId) throw new Error('No se pudo crear el lote de importación.');

  let creados = 0;

  for (const fila of aCrear) {
    const mov = fila.movimiento;
    const huella = huellaMovimiento(mov);
    const fechaIso = new Date(`${mov.fechaOperacion}T12:00:00`).toISOString();
    const mesCubierto = mov.fechaOperacion.slice(0, 7);
    const tieneSegundo =
      Boolean(fila.alumnoId2) && fila.alumnoId2 !== fila.alumnoId;
    const total = Math.abs(mov.importe);
    const [cant1, cant2] = splitCantidades(total, tieneSegundo);

    const { data: movimiento, error: errMov } = await supabase
      .from('importaciones_banco_movimientos')
      .insert({
        import_id: importId,
        linea_csv: lineaCsvDeId(mov.id),
        fecha_operacion: mov.fechaOperacion,
        importe: total,
        tipo_movimiento: 'ingreso',
        concepto_raw: mov.concepto,
        ordenante_raw: mov.ordenante || null,
        referencia_raw: mov.referencia || null,
        categoria: mov.categoria || null,
        subcategoria: mov.subcategoria || null,
        tipo_origen: mov.tipoOrigen || null,
        estado_origen: mov.estadoOrigen || null,
        moneda: mov.moneda || 'EUR',
        huella_movimiento: huella,
        alumno_id_sugerido: fila.score >= 40 ? fila.alumnoId : null,
        alumno_id_confirmado: fila.alumnoId,
        confianza_match: fila.score || null,
        motivo_match: [
          fila.score ? `score=${fila.score}` : null,
          `estado=${fila.estadoConciliacion}`,
          tieneSegundo ? `pagador2=${fila.alumnoId2}` : null,
          tieneSegundo ? `split=${cant1}+${cant2}` : null,
        ]
          .filter(Boolean)
          .join('; '),
        estado_match: estadoMatchDb(fila.estadoConciliacion),
        es_duplicado: false,
      } satisfies TablesInsert<'importaciones_banco_movimientos'>)
      .select('id')
      .single();

    if (errMov) {
      throw new Error(
        mensajeError(errMov, `No se pudo guardar el movimiento (${mov.concepto}).`)
      );
    }
    const movimientoId = movimiento?.id as string;
    if (!movimientoId) throw new Error('No se pudo guardar el movimiento.');

    const { data: pago, error: errPago } = await supabase
      .from('pagos')
      .insert({
        alumno_id: fila.alumnoId,
        cantidad: cant1,
        tipo_pago: 'mensual',
        mes_cubierto: mesCubierto,
        metodo: 'transferencia',
        fecha_pago: fechaIso,
        // CHECK en BD: manual | import_csv | api
        origen_registro: 'import_csv',
        huella_movimiento: huella,
        importacion_movimiento_id: movimientoId,
        clases_cubiertas: tieneSegundo
          ? `Pago conjunto (${cant1} EUR de ${total} EUR)`
          : null,
      } satisfies TablesInsert<'pagos'>)
      .select('id')
      .single();

    if (errPago) {
      throw new Error(
        mensajeError(errPago, `No se pudo crear el pago de ${mov.concepto}.`)
      );
    }
    const pagoId = pago?.id as string;
    if (!pagoId) throw new Error('No se pudo crear el pago.');

    const { error: errLink } = await supabase
      .from('importaciones_banco_movimientos')
      .update({ pago_id_creado: pagoId })
      .eq('id', movimientoId);
    if (errLink) {
      throw new Error(mensajeError(errLink, 'No se pudo enlazar el pago al movimiento.'));
    }
    creados += 1;

    if (tieneSegundo && cant2 > 0) {
      const huella2 = `${huella}#2`;
      if (existentes.has(huella2)) continue;

      const { error: errPago2 } = await supabase.from('pagos').insert({
        alumno_id: fila.alumnoId2,
        cantidad: cant2,
        tipo_pago: 'mensual',
        mes_cubierto: mesCubierto,
        metodo: 'transferencia',
        fecha_pago: fechaIso,
        origen_registro: 'import_csv',
        huella_movimiento: huella2,
        // UNIQUE(importacion_movimiento_id): solo el primer pago enlaza
        importacion_movimiento_id: null,
        clases_cubiertas: `Pago conjunto (${cant2} EUR de ${total} EUR; con ${fila.alumnoId})`,
      } satisfies TablesInsert<'pagos'>);

      if (errPago2) {
        throw new Error(
          mensajeError(
            errPago2,
            `No se pudo crear el segundo pago de ${mov.concepto}.`
          )
        );
      }
      creados += 1;
    }
  }

  const { error: errUpdate } = await supabase
    .from('importaciones_banco')
    .update({
      total_creadas_en_pagos: creados,
      total_aceptadas: aCrear.length,
      total_duplicadas: duplicados,
    })
    .eq('id', importId);
  if (errUpdate) {
    throw new Error(mensajeError(errUpdate, 'No se pudo actualizar el lote.'));
  }

  return {
    importId,
    creados,
    duplicados,
    gastosDetectados,
    descartados,
  };
}
