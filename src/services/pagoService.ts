import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../types/supabase';

type Pago = Tables<'pagos'>;

interface PagoWithAlumno extends Pago {
  alumnos?: { nombre: string | null } | null;
}

interface QueryOptions {
  withAlumno?: boolean;
  alumnoId?: string;
  mesCubierto?: string;
  orderBy?: { column?: keyof Pago | 'fecha_pago'; ascending?: boolean };
  limit?: number;
}

interface DataResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

interface IngresosResult {
  ingresos: number;
  error: PostgrestError | Error | null;
}

export const pagoService = {
  async getAll(options: QueryOptions = {}): Promise<DataResult<Pago[] | PagoWithAlumno[]>> {
    try {
      const selectClause = options.withAlumno
        ? `
          *,
          alumnos (nombre)
        `
        : '*';

      let query = supabase.from('pagos').select(selectClause);

      if (options.alumnoId) {
        query = query.eq('alumno_id', options.alumnoId);
      }

      if (options.mesCubierto) {
        query = query.eq('mes_cubierto', options.mesCubierto);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column || 'fecha_pago', {
          ascending: options.orderBy.ascending !== false,
        });
      } else {
        query = query.order('fecha_pago', { ascending: false });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      return { data: (data as Pago[] | PagoWithAlumno[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo pagos:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async getPagosMesActual(): Promise<DataResult<PagoWithAlumno[]>> {
    try {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('pagos')
        .select('*, alumnos (nombre)')
        .eq('mes_cubierto', mesActual);

      return { data: (data as PagoWithAlumno[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo pagos del mes:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async calcularIngresosDelMes(): Promise<IngresosResult> {
    try {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('pagos')
        .select('cantidad')
        .eq('mes_cubierto', mesActual);

      if (error) return { ingresos: 0, error };

      const pagos = (data as Pick<Pago, 'cantidad'>[] | null) || [];
      const ingresos = pagos.reduce((acc, pago) => acc + (pago.cantidad || 0), 0);
      return { ingresos, error: null };
    } catch (error) {
      console.error('Error calculando ingresos:', error);
      return {
        ingresos: 0,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async create(pago: TablesInsert<'pagos'>): Promise<DataResult<Pago>> {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .insert(pago)
        .select()
        .single();

      return { data: (data as Pago | null) || null, error };
    } catch (error) {
      console.error('Error creando pago:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async update(id: string, updates: TablesUpdate<'pagos'>): Promise<DataResult<Pago>> {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data: (data as Pago | null) || null, error };
    } catch (error) {
      console.error('Error actualizando pago:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },

  async delete(id: string): Promise<DataResult<Pago[]>> {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', id);

      return { data: (data as Pago[] | null) || [], error };
    } catch (error) {
      console.error('Error eliminando pago:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Error desconocido'),
      };
    }
  },
};
