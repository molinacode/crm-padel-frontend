import { useMemo } from 'react';
import { getWeekNumber, getYear } from '../utils/date';
import { normalizeText } from '../utils/text';

interface EventoInstalacion {
  fecha?: string;
  estado?: string | null;
  excluir_alquiler?: boolean;
  clase_id?: string | null;
  clases?: { id?: string | null; nombre?: string | null; tipo_clase?: string | null };
}
interface PagoLike { fecha_pago: string; cantidad: number }
interface GastoLike { fecha_gasto: string; cantidad: number }

type SeriesMap = Record<string, { ingresos: number; gastos: number }>;

export function useInstalacionesStats({
  eventos,
  pagos,
  gastosMaterial,
  pagosInternasMap,
  getTipoClase,
}: {
  eventos: EventoInstalacion[];
  pagos: PagoLike[];
  gastosMaterial: GastoLike[];
  pagosInternasMap?: Map<string, string>;
  getTipoClase: (nombre?: string | null, tipo?: string | null) => { tipo: 'ingreso' | 'gasto'; valor: number };
}) {
  const datosProcesados = useMemo(() => {
    const diario: SeriesMap = {};
    const semanal: SeriesMap = {};
    const mensual: SeriesMap = {};
    const anual: SeriesMap = {};

    const add = (target: SeriesMap, key: string, tipo: 'ingreso' | 'gasto', valor: number) => {
      if (!target[key]) target[key] = { ingresos: 0, gastos: 0 };
      target[key][tipo === 'ingreso' ? 'ingresos' : 'gastos'] += valor;
    };

    (eventos || []).forEach((ev) => {
      if (!ev?.fecha) return;
      const estadoEv = (ev.estado || '').toLowerCase();
      if (['cancelada', 'cancelado', 'eliminada', 'eliminado', 'anulada', 'anulado'].includes(estadoEv)) return;

      const fechaEv = new Date(ev.fecha);
      const dia = fechaEv.toISOString().split('T')[0];
      const semana = `${fechaEv.getFullYear()}-W${getWeekNumber(fechaEv)}`;
      const mes = `${fechaEv.getFullYear()}-${String(fechaEv.getMonth() + 1).padStart(2, '0')}`;
      const ano = String(getYear(fechaEv));
      const { tipo, valor } = getTipoClase(ev.clases?.nombre, ev.clases?.tipo_clase);
      const excluirAlquiler = ev.excluir_alquiler === true;
      const esInterna = (() => {
        const t = normalizeText(ev.clases?.tipo_clase);
        const n = normalizeText(ev.clases?.nombre);
        return t.includes('interna') || n.includes('interna');
      })();

      const estadoInterna = pagosInternasMap?.get(`${ev.clases?.id || ev.clase_id}|${dia}`) || 'pendiente';
      const sumaIngreso = tipo === 'ingreso' && (!esInterna || estadoInterna === 'pagada');
      const hoyRef = new Date(); hoyRef.setHours(0, 0, 0, 0);
      const sumaGasto = tipo === 'gasto' && !excluirAlquiler && fechaEv <= hoyRef;

      if (sumaIngreso) { add(diario, dia, 'ingreso', valor); add(semanal, semana, 'ingreso', valor); add(mensual, mes, 'ingreso', valor); add(anual, ano, 'ingreso', valor); }
      if (sumaGasto) { add(diario, dia, 'gasto', valor); add(semanal, semana, 'gasto', valor); add(mensual, mes, 'gasto', valor); add(anual, ano, 'gasto', valor); }
    });

    (pagos || []).forEach((pago) => {
      const f = new Date(pago.fecha_pago);
      const dia = f.toISOString().split('T')[0];
      const semana = `${f.getFullYear()}-W${getWeekNumber(f)}`;
      const mes = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
      const ano = String(getYear(f));
      add(diario, dia, 'ingreso', pago.cantidad);
      add(semanal, semana, 'ingreso', pago.cantidad);
      add(mensual, mes, 'ingreso', pago.cantidad);
      add(anual, ano, 'ingreso', pago.cantidad);
    });

    (gastosMaterial || []).forEach((gasto) => {
      const f = new Date(gasto.fecha_gasto);
      const dia = f.toISOString().split('T')[0];
      const semana = `${f.getFullYear()}-W${getWeekNumber(f)}`;
      const mes = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
      const ano = String(getYear(f));
      add(diario, dia, 'gasto', gasto.cantidad);
      add(semanal, semana, 'gasto', gasto.cantidad);
      add(mensual, mes, 'gasto', gasto.cantidad);
      add(anual, ano, 'gasto', gasto.cantidad);
    });

    return { diario, semanal, mensual, anual };
  }, [eventos, pagos, gastosMaterial, pagosInternasMap, getTipoClase]);

  const estadisticas = useMemo(() => {
    const { diario, semanal, mensual, anual } = datosProcesados;
    const hoy = new Date().toISOString().split('T')[0];
    const semanaActual = `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`;
    const mesActual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const anoActual = String(new Date().getFullYear());
    const mk = (m: SeriesMap, k: string) => ({ ingresos: m[k]?.ingresos || 0, gastos: m[k]?.gastos || 0, balance: (m[k]?.ingresos || 0) - (m[k]?.gastos || 0) });
    return { diario: mk(diario, hoy), semanal: mk(semanal, semanaActual), mensual: mk(mensual, mesActual), anual: mk(anual, anoActual) };
  }, [datosProcesados]);

  return { datosProcesados, estadisticas };
}


