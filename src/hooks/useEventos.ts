import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables } from '../types/supabase';

type Evento = Tables<'eventos_clase'>;
type EventoConClaseResumen = Pick<
  Evento,
  'id' | 'fecha' | 'hora_inicio' | 'hora_fin' | 'estado' | 'clase_id'
> & {
  clases: {
    id: string;
    nombre: string | null;
    tipo_clase: string | null;
    nivel_clase: string | null;
    dia_semana: string | null;
  } | null;
};

interface EventosOptions {
  estadoIncluido?: 'programada';
  excluirEliminados?: boolean;
  semanaActual?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  fecha?: string;
  orderBy?: { column?: string; ascending?: boolean };
}

export const useEventos = (options: EventosOptions = {}) => {
  const [eventos, setEventos] = useState<EventoConClaseResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  const optionsMemo = useMemo(
    () => ({
      estadoIncluido: options.estadoIncluido,
      excluirEliminados: options.excluirEliminados,
      semanaActual: options.semanaActual,
      fechaInicio: options.fechaInicio,
      fechaFin: options.fechaFin,
      fecha: options.fecha,
      orderBy: options.orderBy,
    }),
    [
      options.estadoIncluido,
      options.excluirEliminados,
      options.semanaActual,
      options.fechaInicio,
      options.fechaFin,
      options.fecha,
      options.orderBy,
    ]
  );

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('eventos_clase').select(`
        id, fecha, hora_inicio, hora_fin, estado, clase_id,
        clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
      `);

      if (optionsMemo.estadoIncluido === 'programada') query = query.or('estado.is.null,estado.eq.programada');
      else if (optionsMemo.excluirEliminados) query = query.or('estado.is.null,estado.neq.eliminado');

      if (optionsMemo.semanaActual) {
        const { lunes, domingo } = obtenerRangoSemanaISO();
        query = query.gte('fecha', lunes).lte('fecha', domingo);
      }
      if (optionsMemo.fechaInicio) query = query.gte('fecha', optionsMemo.fechaInicio);
      if (optionsMemo.fechaFin) query = query.lte('fecha', optionsMemo.fechaFin);
      if (optionsMemo.fecha) query = query.eq('fecha', optionsMemo.fecha);

      if (optionsMemo.orderBy) {
        query = query.order(optionsMemo.orderBy.column || 'fecha', {
          ascending: optionsMemo.orderBy.ascending !== false,
        });
      } else {
        query = query.order('fecha', { ascending: true });
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setEventos(Array.isArray(data) ? (data as EventoConClaseResumen[]) : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [optionsMemo]);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void fetchEventos();
    });
  }, [fetchEventos]);

  return { eventos, loading, error, refetch: fetchEventos };
};


