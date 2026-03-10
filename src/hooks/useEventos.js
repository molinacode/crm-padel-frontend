import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Memoizar opciones para evitar cambios innecesarios
  const optionsMemo = useMemo(() => ({
    estadoIncluido: options.estadoIncluido,
    excluirEliminados: options.excluirEliminados,
    semanaActual: options.semanaActual,
    fechaInicio: options.fechaInicio,
    fechaFin: options.fechaFin,
    fecha: options.fecha,
    orderBy: options.orderBy,
  }), [options.estadoIncluido, options.excluirEliminados, options.semanaActual, options.fechaInicio, options.fechaFin, options.fecha, options.orderBy]);

  const fetchEventos = useCallback(async () => {
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
      if (optionsMemo.estadoIncluido === 'programada') {
        query = query.or('estado.is.null,estado.eq.programada');
      } else if (optionsMemo.excluirEliminados) {
        query = query.or('estado.is.null,estado.neq.eliminado');
      }

      // Filtrar por fecha
      if (optionsMemo.semanaActual) {
        const { lunes, domingo } = obtenerRangoSemanaISO();
        query = query.gte('fecha', lunes).lte('fecha', domingo);
      }

      if (optionsMemo.fechaInicio) {
        query = query.gte('fecha', optionsMemo.fechaInicio);
      }

      if (optionsMemo.fechaFin) {
        query = query.lte('fecha', optionsMemo.fechaFin);
      }

      if (optionsMemo.fecha) {
        query = query.eq('fecha', optionsMemo.fecha);
      }

      // Ordenar
      if (optionsMemo.orderBy) {
        query = query.order(optionsMemo.orderBy.column || 'fecha', {
          ascending: optionsMemo.orderBy.ascending !== false,
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
  }, [optionsMemo]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  return {
    eventos,
    loading,
    error,
    refetch: fetchEventos,
  };
};
