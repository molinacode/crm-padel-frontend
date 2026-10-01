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
  /** Pagadores adicionales en pagos conjuntos (opcionales, hasta 3 en total). */
  alumnoId2: string;
  alumnoId3: string;
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

/** Ids de pagadores únicos (máx. 3), el primero es el principal. */
export function pagadoresDeFila(fila: Pick<FilaImportacionPago, 'alumnoId' | 'alumnoId2' | 'alumnoId3'>): string[] {
  const ids: string[] = [];
  for (const id of [fila.alumnoId, fila.alumnoId2, fila.alumnoId3]) {
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, 3);
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

/** Reparte el total en N partes (céntimos); el resto va a la última. */
function splitCantidades(total: number, n: number): number[] {
  if (n <= 1) return [total];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const parts = Array.from({ length: n }, () => base);
  parts[n - 1] += cents - base * n;
  return parts.map(c => c / 100);
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
    const n = pagadoresDeFila(f).length;
    return Array.from({ length: n }, (_, i) => (i === 0 ? h : `${h}#${i + 1}`));
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
    const pagadores = pagadoresDeFila(fila);
    const total = Math.abs(mov.importe);
    const cantidades = splitCantidades(total, pagadores.length);
    const esConjunto = pagadores.length > 1;

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
          esConjunto ? `pagadores=${pagadores.join(',')}` : null,
          esConjunto ? `split=${cantidades.join('+')}` : null,
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

    for (let i = 0; i < pagadores.length; i += 1) {
      const alumnoId = pagadores[i];
      const cantidad = cantidades[i];
      const huellaPago = i === 0 ? huella : `${huella}#${i + 1}`;
      if (i > 0 && existentes.has(huellaPago)) continue;

      const { data: pago, error: errPago } = await supabase
        .from('pagos')
        .insert({
          alumno_id: alumnoId,
          cantidad,
          tipo_pago: 'mensual',
          mes_cubierto: mesCubierto,
          metodo: 'transferencia',
          fecha_pago: fechaIso,
          // CHECK en BD: manual | import_csv | api
          origen_registro: 'import_csv',
          huella_movimiento: huellaPago,
          // UNIQUE(importacion_movimiento_id): solo el primer pago enlaza
          importacion_movimiento_id: i === 0 ? movimientoId : null,
          clases_cubiertas: esConjunto
            ? `Pago conjunto (${cantidad} EUR de ${total} EUR; ${pagadores.length} pagadores)`
            : null,
        } satisfies TablesInsert<'pagos'>)
        .select('id')
        .single();

      if (errPago) {
        throw new Error(
          mensajeError(
            errPago,
            `No se pudo crear el pago ${i + 1} de ${mov.concepto}.`
          )
        );
      }
      const pagoId = pago?.id as string;
      if (!pagoId) throw new Error('No se pudo crear el pago.');

      if (i === 0) {
        const { error: errLink } = await supabase
          .from('importaciones_banco_movimientos')
          .update({ pago_id_creado: pagoId })
          .eq('id', movimientoId);
        if (errLink) {
          throw new Error(
            mensajeError(errLink, 'No se pudo enlazar el pago al movimiento.')
          );
        }
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
