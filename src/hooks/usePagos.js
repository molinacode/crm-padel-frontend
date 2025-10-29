import { useState, useEffect } from 'react';
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

  const fetchPagos = async () => {
    setLoading(true);
    try {
      const selectClause = options.withAlumno
        ? `
          *,
          alumnos (nombre)
        `
        : '*';

      let query = supabase.from('pagos').select(selectClause);

      // Aplicar filtros
      if (options.alumnoId) {
        query = query.eq('alumno_id', options.alumnoId);
      }

      if (options.mesCubierto) {
        query = query.eq('mes_cubierto', options.mesCubierto);
      }

      // Ordenar
      if (options.orderBy) {
        query = query.order(options.orderBy.column || 'fecha_pago', {
          ascending: options.orderBy.ascending !== false,
        });
      } else {
        query = query.order('fecha_pago', { ascending: false });
      }

      // Limitar cantidad
      if (options.limit) {
        query = query.limit(options.limit);
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
  };

  useEffect(() => {
    fetchPagos();
  }, [JSON.stringify(options)]);

  return {
    pagos,
    loading,
    error,
    refetch: fetchPagos,
  };
};
