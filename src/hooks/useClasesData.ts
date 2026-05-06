import { useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';
import type { Tables } from '../types/supabase';

type Clase = Tables<'clases'>;
type EventoSemana = Pick<
  Tables<'eventos_clase'>,
  'id' | 'fecha' | 'hora_inicio' | 'hora_fin' | 'estado' | 'clase_id'
>;
type Asignacion = Pick<Tables<'alumnos_clases'>, 'clase_id' | 'alumno_id'>;

export function useClasesData() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [eventosSemana, setEventosSemana] = useState<EventoSemana[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const { lunes, domingo } = obtenerRangoSemanaISO();

        const [clasesRes, eventosRes, asigRes] = await Promise.all([
          supabase.from('clases').select('*'),
          supabase
            .from('eventos_clase')
            .select(`id, fecha, hora_inicio, hora_fin, estado, clase_id`)
            .or('estado.is.null,estado.neq.eliminado')
            .gte('fecha', lunes)
            .lte('fecha', domingo),
          supabase.from('alumnos_clases').select('clase_id, alumno_id'),
        ]);

        if (clasesRes.error) throw clasesRes.error;
        if (eventosRes.error) throw eventosRes.error;
        if (asigRes.error) throw asigRes.error;

        setClases((clasesRes.data as Clase[] | null) || []);
        setEventosSemana((eventosRes.data as EventoSemana[] | null) || []);
        setAsignaciones((asigRes.data as Asignacion[] | null) || []);
        setError(null);
      } catch (err) {
        console.error('useClasesData error:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        setClases([]);
        setEventosSemana([]);
        setAsignaciones([]);
      } finally {
        setLoading(false);
      }
    };

    void cargar();
  }, []);

  return { clases, eventosSemana, asignaciones, loading, error };
}


