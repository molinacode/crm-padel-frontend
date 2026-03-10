import { supabase } from '../lib/supabase';

/**
 * Servicio de reportes y analytics.
 * Centraliza consultas agregadas para la página de Reportes.
 */

export const reportesService = {
  /**
   * Ingresos (pagos) y gastos (gastos_material) agregados por mes
   * en el rango [desde, hasta].
   *
   * @param {{ desde: string, hasta: string }} params - fechas ISO (yyyy-mm-dd)
   * @returns {Promise<{ series: Array<{ mes: string, ingresos: number, gastos: number }>, error: any }>}
   */
  async getIngresosVsGastosPorMes({ desde, hasta }) {
    try {
      // Consultar pagos en el rango
      const pagosQuery = supabase
        .from('pagos')
        .select('cantidad, fecha_pago')
        .gte('fecha_pago', `${desde}T00:00:00.000Z`)
        .lte('fecha_pago', `${hasta}T23:59:59.999Z`);

      // Consultar gastos de material en el rango (si la tabla existe)
      const gastosQuery = supabase
        .from('gastos_material')
        .select('cantidad, fecha_gasto')
        .gte('fecha_gasto', desde)
        .lte('fecha_gasto', hasta);

      const [{ data: pagos, error: errorPagos }, { data: gastos, error: errorGastos }] =
        await Promise.all([pagosQuery, gastosQuery]);

      // Si la tabla de gastos no existe o no tiene RLS configurado, tratamos el error como "0 gastos"
      const pagosData = pagos || [];
      const gastosData =
        errorGastos &&
        (errorGastos.message?.includes('does not exist') ||
          errorGastos.code === 'PGRST116')
          ? []
          : gastos || [];

      if (errorPagos) {
        throw errorPagos;
      }

      // Agregar por mes (YYYY-MM)
      const mapa = new Map();

      const addValor = (fechaISO, campo, valor) => {
        if (!fechaISO) return;
        const fecha = new Date(fechaISO);
        if (Number.isNaN(fecha.getTime())) return;
        const mesClave = `${fecha.getFullYear()}-${String(
          fecha.getMonth() + 1
        ).padStart(2, '0')}`;
        const actual = mapa.get(mesClave) || { mes: mesClave, ingresos: 0, gastos: 0 };
        actual[campo] += Number(valor) || 0;
        mapa.set(mesClave, actual);
      };

      pagosData.forEach(pago => {
        addValor(pago.fecha_pago, 'ingresos', pago.cantidad);
      });

      gastosData.forEach(gasto => {
        addValor(gasto.fecha_gasto, 'gastos', gasto.cantidad);
      });

      const series = Array.from(mapa.values()).sort((a, b) =>
        a.mes.localeCompare(b.mes)
      );

      return { series, error: null };
    } catch (error) {
      console.error('Error en getIngresosVsGastosPorMes:', error);
      return { series: [], error };
    }
  },
};

