import { useMemo } from 'react';
import { getWeekNumber, getYear } from '../utils/date';
import { normalizeText } from '../utils/text';

// Hook para calcular estructuras agregadas y estadísticas de instalaciones
export function useInstalacionesStats({
  eventos,
  pagos,
  gastosMaterial,
  pagosInternasMap,
  getTipoClase,
}) {
  const datosProcesados = useMemo(() => {
    const diario = {};
    const semanal = {};
    const mensual = {};
    const anual = {};

    // helpers importados de utils/date

    if (Array.isArray(eventos)) {
      eventos.forEach(ev => {
        if (!ev || !ev.fecha) return;
        const estadoEv = (ev?.estado || '').toLowerCase();
        if (
          estadoEv === 'cancelada' ||
          estadoEv === 'cancelado' ||
          estadoEv === 'eliminada' ||
          estadoEv === 'eliminado' ||
          estadoEv === 'anulada' ||
          estadoEv === 'anulado'
        ) {
          return;
        }

        const fechaEv = new Date(ev.fecha);
        const dia = fechaEv.toISOString().split('T')[0];
        const semana = `${fechaEv.getFullYear()}-W${getWeekNumber(fechaEv)}`;
        const mes = `${fechaEv.getFullYear()}-${String(
          fechaEv.getMonth() + 1
        ).padStart(2, '0')}`;
        const año = getYear(fechaEv);

        const nombreClase = ev.clases?.nombre;
        const tipoClase = ev.clases?.tipo_clase;
        const { tipo, valor } = getTipoClase(nombreClase, tipoClase);

        // Helper para verificar si es interna
        const esInterna = ev => {
          const t = normalizeText(ev.clases?.tipo_clase);
          const n = normalizeText(ev.clases?.nombre);
          return t.includes('interna') || n.includes('interna');
        };

        // Diario
        if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
        if (tipo === 'ingreso') {
          if (esInterna(ev)) {
            const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
            const estado = pagosInternasMap?.get(key) || 'pendiente';
            if (estado === 'pagada') diario[dia].ingresos += valor;
          } else {
            diario[dia].ingresos += valor;
          }
        }
        if (tipo === 'gasto') {
          // Excluir manualmente eventos marcados como "sin alquiler"
          if (ev.excluir_alquiler === true) {
            return;
          }
          const hoyRef = new Date();
          hoyRef.setHours(0, 0, 0, 0);
          if (fechaEv <= hoyRef) diario[dia].gastos += valor;
        }

        // Semanal
        if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
        if (tipo === 'ingreso') {
          if (esInterna(ev)) {
            const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
            const estado = pagosInternasMap?.get(key) || 'pendiente';
            if (estado === 'pagada') semanal[semana].ingresos += valor;
          } else {
            semanal[semana].ingresos += valor;
          }
        }
        if (tipo === 'gasto') {
          if (ev.excluir_alquiler === true) {
            return;
          }
          const hoyRef = new Date();
          hoyRef.setHours(0, 0, 0, 0);
          if (fechaEv <= hoyRef) semanal[semana].gastos += valor;
        }

        // Mensual
        if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
        if (tipo === 'ingreso') {
          if (esInterna(ev)) {
            const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
            const estado = pagosInternasMap?.get(key) || 'pendiente';
            if (estado === 'pagada') mensual[mes].ingresos += valor;
          } else {
            mensual[mes].ingresos += valor;
          }
        }
        if (tipo === 'gasto') {
          if (ev.excluir_alquiler === true) {
            return;
          }
          const hoyRef = new Date();
          hoyRef.setHours(0, 0, 0, 0);
          if (fechaEv <= hoyRef) mensual[mes].gastos += valor;
        }

        // Anual
        if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
        if (tipo === 'ingreso') {
          if (esInterna(ev)) {
            const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
            const estado = pagosInternasMap?.get(key) || 'pendiente';
            if (estado === 'pagada') anual[año].ingresos += valor;
          } else {
            anual[año].ingresos += valor;
          }
        }
        if (tipo === 'gasto') {
          if (ev.excluir_alquiler === true) {
            return;
          }
          const hoyRef = new Date();
          hoyRef.setHours(0, 0, 0, 0);
          if (fechaEv <= hoyRef) anual[año].gastos += valor;
        }
      });
    }

    if (Array.isArray(pagos)) {
      pagos.forEach(pago => {
        const fechaPago = new Date(pago.fecha_pago);
        const dia = fechaPago.toISOString().split('T')[0];
        const semana = `${fechaPago.getFullYear()}-W${getWeekNumber(
          fechaPago
        )}`;
        const mes = `${fechaPago.getFullYear()}-${String(
          fechaPago.getMonth() + 1
        ).padStart(2, '0')}`;
        const año = getYear(fechaPago);

        if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
        diario[dia].ingresos += pago.cantidad;

        if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
        semanal[semana].ingresos += pago.cantidad;

        if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
        mensual[mes].ingresos += pago.cantidad;

        if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
        anual[año].ingresos += pago.cantidad;
      });
    }

    if (Array.isArray(gastosMaterial) && gastosMaterial.length > 0) {
      gastosMaterial.forEach(gasto => {
        const fechaGasto = new Date(gasto.fecha_gasto);
        const dia = fechaGasto.toISOString().split('T')[0];
        const semana = `${fechaGasto.getFullYear()}-W${getWeekNumber(
          fechaGasto
        )}`;
        const mes = `${fechaGasto.getFullYear()}-${String(
          fechaGasto.getMonth() + 1
        ).padStart(2, '0')}`;
        const año = getYear(fechaGasto);

        if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
        diario[dia].gastos += gasto.cantidad;

        if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
        semanal[semana].gastos += gasto.cantidad;

        if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
        mensual[mes].gastos += gasto.cantidad;

        if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
        anual[año].gastos += gasto.cantidad;
      });
    }

    return { diario, semanal, mensual, anual };
  }, [eventos, pagos, gastosMaterial, pagosInternasMap, getTipoClase]);

  const estadisticas = useMemo(() => {
    const { diario, semanal, mensual, anual } = datosProcesados;
    const hoy = new Date().toISOString().split('T')[0];
    const semanaActual = `${new Date().getFullYear()}-W${getWeekNumber(
      new Date()
    )}`;
    const mesActual = `${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}`;
    const añoActual = new Date().getFullYear();

    return {
      diario: {
        ingresos: diario[hoy]?.ingresos || 0,
        gastos: diario[hoy]?.gastos || 0,
        balance: (diario[hoy]?.ingresos || 0) - (diario[hoy]?.gastos || 0),
      },
      semanal: {
        ingresos: semanal[semanaActual]?.ingresos || 0,
        gastos: semanal[semanaActual]?.gastos || 0,
        balance:
          (semanal[semanaActual]?.ingresos || 0) -
          (semanal[semanaActual]?.gastos || 0),
      },
      mensual: {
        ingresos: mensual[mesActual]?.ingresos || 0,
        gastos: mensual[mesActual]?.gastos || 0,
        balance:
          (mensual[mesActual]?.ingresos || 0) -
          (mensual[mesActual]?.gastos || 0),
      },
      anual: {
        ingresos: anual[añoActual]?.ingresos || 0,
        gastos: anual[añoActual]?.gastos || 0,
        balance:
          (anual[añoActual]?.ingresos || 0) - (anual[añoActual]?.gastos || 0),
      },
    };
  }, [datosProcesados]);

  return { datosProcesados, estadisticas };
}


