import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type PagoMinimo = Pick<Tables<'pagos'>, 'cantidad' | 'fecha_pago'>;
type GastoMinimo = Pick<Tables<'gastos_material'>, 'cantidad' | 'fecha_gasto'>;

interface SerieIngresosGastos {
  mes: string;
  ingresos: number;
  gastos: number;
}

interface IngresosVsGastosParams {
  desde: string;
  hasta: string;
}

interface IngresosVsGastosResult {
  series: SerieIngresosGastos[];
  error: PostgrestError | Error | null;
}

export const reportesService = {
  async getIngresosVsGastosPorMes({
    desde,
    hasta,
  }: IngresosVsGastosParams): Promise<IngresosVsGastosResult> {
    try {
      const pagosQuery = supabase
        .from('pagos')
        .select('cantidad, fecha_pago')
        .gte('fecha_pago', `${desde}T00:00:00.000Z`)
        .lte('fecha_pago', `${hasta}T23:59:59.999Z`);

      const gastosQuery = supabase
        .from('gastos_material')
        .select('cantidad, fecha_gasto')
        .gte('fecha_gasto', desde)
        .lte('fecha_gasto', hasta);

      const [{ data: pagos, error: errorPagos }, { data: gastos, error: errorGastos }] =
        await Promise.all([pagosQuery, gastosQuery]);

      const pagosData = (pagos as PagoMinimo[] | null) || [];
      const gastosData =
        errorGastos &&
        (errorGastos.message?.includes('does not exist') ||
          errorGastos.code === 'PGRST116')
          ? []
          : ((gastos as GastoMinimo[] | null) || []);

      if (errorPagos) {
        throw errorPagos;
      }

      const mapa = new Map<string, SerieIngresosGastos>();

      const addValor = (
        fechaISO: string | null,
        campo: 'ingresos' | 'gastos',
        valor: number | null
      ): void => {
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

      pagosData.forEach((pago) => {
        addValor(pago.fecha_pago, 'ingresos', pago.cantidad);
      });

      gastosData.forEach((gasto) => {
        addValor(gasto.fecha_gasto, 'gastos', gasto.cantidad);
      });

      const series = Array.from(mapa.values()).sort((a, b) =>
        a.mes.localeCompare(b.mes)
      );

      return { series, error: null };
    } catch (error) {
      console.error('Error en getIngresosVsGastosPorMes:', error);
      return {
        series: [],
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },
};
