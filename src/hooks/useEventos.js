import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';

/**
 * Hook para cargar eventos de clase
 * @param {object} options - Opciones de filtrado
 * @returns {{ eventos: array, loading: boolean, error: object, refetch: function }}
 */
export const useEventos = (options = {}) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      let selectClause = `
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        clase_id,
        clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
      `;

      let query = supabase.from('eventos_clase').select(selectClause);

      // Filtrar por estado
      if (options.estadoIncluido === 'programada') {
        query = query.or('estado.is.null,estado.eq.programada');
      } else if (options.excluirEliminados) {
        query = query.or('estado.is.null,estado.neq.eliminado');
      }

      // Filtrar por fecha
      if (options.semanaActual) {
        const { lunes, domingo } = obtenerRangoSemanaISO();
        query = query.gte('fecha', lunes).lte('fecha', domingo);
      }

      if (options.fechaInicio) {
        query = query.gte('fecha', options.fechaInicio);
      }

      if (options.fechaFin) {
        query = query.lte('fecha', options.fechaFin);
      }

      if (options.fecha) {
        query = query.eq('fecha', options.fecha);
      }

      // Ordenar
      if (options.orderBy) {
        query = query.order(options.orderBy.column || 'fecha', {
          ascending: options.orderBy.ascending !== false,
        });
      } else {
        query = query.order('fecha', { ascending: true });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setEventos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError(err);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [JSON.stringify(options)]);

  return {
    eventos,
    loading,
    error,
    refetch: fetchEventos,
  };
};
