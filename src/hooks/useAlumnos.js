import { useState, useEffect } from 'react';
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

  const fetchAlumnos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('alumnos').select('*');

      // Aplicar filtros
      if (options.activo !== undefined) {
        query = query.eq('activo', options.activo);
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column || 'nombre', {
          ascending: options.orderBy.ascending !== false,
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
  };

  useEffect(() => {
    fetchAlumnos();
  }, [JSON.stringify(options)]);

  return {
    alumnos,
    loading,
    error,
    refetch: fetchAlumnos,
  };
};
