import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para cargar y gestionar alumnos
 * @param {object} options - Opciones de filtrado
 * @returns {{ alumnos: array, loading: boolean, error: object, refetch: function }}
 */
export const useAlumnos = (options = {}) => {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoizar opciones para evitar cambios innecesarios
  const optionsMemo = useMemo(() => ({
    activo: options.activo,
    orderBy: options.orderBy,
  }), [options.activo, options.orderBy]);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('alumnos').select('*');

      // Aplicar filtros
      if (optionsMemo.activo !== undefined) {
        query = query.eq('activo', optionsMemo.activo);
      }

      if (optionsMemo.orderBy) {
        query = query.order(optionsMemo.orderBy.column || 'nombre', {
          ascending: optionsMemo.orderBy.ascending !== false,
        });
      } else {
        query = query.order('nombre', { ascending: true });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setAlumnos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando alumnos:', err);
      setError(err);
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  }, [optionsMemo]);

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  return {
    alumnos,
    loading,
    error,
    refetch: fetchAlumnos,
  };
};
