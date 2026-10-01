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

/** Huellas ya usadas en pagos o en movimientos de importaciones anteriores. */
export async function buscarHuellasExistentes(
  huellas: string[]
): Promise<Set<string>> {
  const unicas = [...new Set(huellas.filter(Boolean))];
  const encontradas = new Set<string>();
  if (!unicas.length) return encontradas;

  const { data: enPagos, error: errPagos } = await supabase
    .from('pagos')
    .select('huella_movimiento')
    .in('huella_movimiento', unicas);
  if (errPagos) throw errPagos;
  for (const row of enPagos || []) {
    if (row.huella_movimiento) encontradas.add(String(row.huella_movimiento));
  }

  const { data: enMovs, error: errMovs } = await supabase
    .from('importaciones_banco_movimientos')
    .select('huella_movimiento')
    .in('huella_movimiento', unicas);
  if (errMovs) throw errMovs;
  for (const row of enMovs || []) {
    if (row.huella_movimiento) encontradas.add(String(row.huella_movimiento));
  }

  return encontradas;
}

function bancoDelLote(filas: FilaImportacionPago[]): string {
  const bancos = filas.map(f => f.movimiento.bancoOrigen).filter(Boolean);
  const primero = bancos[0] || 'desconocido';
  return bancos.every(b => b === primero) ? primero : 'mixto';
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

  const huellas = seleccionados.map(f => huellaMovimiento(f.movimiento));
  const existentes = await buscarHuellasExistentes(huellas);

  const aCrear = seleccionados.filter(
    f => !existentes.has(huellaMovimiento(f.movimiento))
  );
  const duplicados = seleccionados.length - aCrear.length;
  const descartados = ingresos.filter(f => !f.seleccionado || !f.alumnoId).length;

  const { data: lote, error: errLote } = await supabase
    .from('importaciones_banco')
    .insert({
      nombre_archivo: nombreArchivo || 'extracto.csv',
      banco: bancoDelLote(filas),
      estado: 'completada',
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

  if (errLote) throw errLote;
  const importId = lote?.id as string;
  if (!importId) throw new Error('No se pudo crear el lote de importación.');

  let creados = 0;

  for (const fila of aCrear) {
    const mov = fila.movimiento;
    const huella = huellaMovimiento(mov);
    const fechaIso = new Date(mov.fechaOperacion).toISOString();
    const mesCubierto = mov.fechaOperacion.slice(0, 7);
    const estadoMatch =
      fila.estadoConciliacion === 'auto_match'
        ? 'auto_match'
        : fila.estadoConciliacion === 'conflicto'
          ? 'conflicto'
          : 'confirmado';

    const { data: movimiento, error: errMov } = await supabase
      .from('importaciones_banco_movimientos')
      .insert({
        import_id: importId,
        linea_csv: lineaCsvDeId(mov.id),
        fecha_operacion: mov.fechaOperacion,
        importe: Math.abs(mov.importe),
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
        motivo_match: fila.score
          ? `score=${fila.score}; estado=${fila.estadoConciliacion}`
          : null,
        estado_match: estadoMatch,
        es_duplicado: false,
      } satisfies TablesInsert<'importaciones_banco_movimientos'>)
      .select('id')
      .single();

    if (errMov) throw errMov;
    const movimientoId = movimiento?.id as string;
    if (!movimientoId) throw new Error('No se pudo guardar el movimiento.');

    const { data: pago, error: errPago } = await supabase
      .from('pagos')
      .insert({
        alumno_id: fila.alumnoId,
        cantidad: Math.abs(mov.importe),
        tipo_pago: 'mensual',
        mes_cubierto: mesCubierto,
        metodo: 'transferencia',
        fecha_pago: fechaIso,
        origen_registro: 'importacion_banco',
        huella_movimiento: huella,
        importacion_movimiento_id: movimientoId,
      } satisfies TablesInsert<'pagos'>)
      .select('id')
      .single();

    if (errPago) throw errPago;
    const pagoId = pago?.id as string;
    if (!pagoId) throw new Error('No se pudo crear el pago.');

    const { error: errLink } = await supabase
      .from('importaciones_banco_movimientos')
      .update({ pago_id_creado: pagoId })
      .eq('id', movimientoId);
    if (errLink) throw errLink;

    creados += 1;
  }

  const { error: errUpdate } = await supabase
    .from('importaciones_banco')
    .update({
      total_creadas_en_pagos: creados,
      total_aceptadas: aCrear.length,
      total_duplicadas: duplicados,
    })
    .eq('id', importId);
  if (errUpdate) throw errUpdate;

  return {
    importId,
    creados,
    duplicados,
    gastosDetectados,
    descartados,
  };
}
