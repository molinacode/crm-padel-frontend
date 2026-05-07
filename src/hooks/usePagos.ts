import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables } from '../types/supabase';

/**
 * Hook para cargar pagos
 * @param {object} options - Opciones de filtrado
 * @returns {{ pagos: array, loading: boolean, error: object, refetch: function }}
 */
type Pago = Tables<'pagos'> & { alumnos?: { nombre: string | null } | null };
interface QueryBuilderUntyped {
  eq: (key: string, value: unknown) => QueryBuilderUntyped;
  order: (column: string, options: { ascending: boolean }) => QueryBuilderUntyped;
  limit: (n: number) => QueryBuilderUntyped;
  then: PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>['then'];
}
interface SupabaseUntyped {
  from: (table: string) => { select: (selectClause: string) => QueryBuilderUntyped };
}
interface UsePagosOptions {
  withAlumno?: boolean;
  alumnoId?: string;
  mesCubierto?: string;
  orderBy?: { column?: keyof Pago | 'fecha_pago'; ascending?: boolean };
  limit?: number;
}

export const usePagos = (options: UsePagosOptions = {}) => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  // Memoizar opciones para evitar cambios innecesarios
  const optionsMemo = useMemo(() => ({
    withAlumno: options.withAlumno,
    alumnoId: options.alumnoId,
    mesCubierto: options.mesCubierto,
    orderBy: options.orderBy,
    limit: options.limit,
  }), [options.withAlumno, options.alumnoId, options.mesCubierto, options.orderBy, options.limit]);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      const selectClause = optionsMemo.withAlumno
        ? `
          *,
          alumnos (nombre)
        `
        : '*';

      let query = (supabase as unknown as SupabaseUntyped)
        .from('pagos')
        .select(selectClause);

      // Aplicar filtros
      if (optionsMemo.alumnoId) {
        query = query.eq('alumno_id', optionsMemo.alumnoId);
      }

      if (optionsMemo.mesCubierto) {
        query = query.eq('mes_cubierto', optionsMemo.mesCubierto);
      }

      // Ordenar
      if (optionsMemo.orderBy) {
        query = query.order(optionsMemo.orderBy.column || 'fecha_pago', {
          ascending: optionsMemo.orderBy.ascending !== false,
        });
      } else {
        query = query.order('fecha_pago', { ascending: false });
      }

      // Limitar cantidad
      if (optionsMemo.limit) {
        query = query.limit(optionsMemo.limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setPagos(Array.isArray(data) ? (data as Pago[]) : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando pagos:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [optionsMemo]);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void fetchPagos();
    });
  }, [fetchPagos]);

  return {
    pagos,
    loading,
    error,
    refetch: fetchPagos,
  };
};


