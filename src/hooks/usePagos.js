import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para cargar pagos
 * @param {object} options - Opciones de filtrado
 * @returns {{ pagos: array, loading: boolean, error: object, refetch: function }}
 */
export const usePagos = (options = {}) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      let query = supabase.from('pagos').select(selectClause);

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

      setPagos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando pagos:', err);
      setError(err);
      setPagos([]);
    } finally {
      setLoading(false);
    }
  }, [optionsMemo]);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  return {
    pagos,
    loading,
    error,
    refetch: fetchPagos,
  };
};
