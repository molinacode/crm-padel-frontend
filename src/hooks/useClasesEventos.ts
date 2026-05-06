import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface EventoProcesado {
  id: string;
  start: Date;
  end: Date;
  title: string;
  resource: Record<string, unknown>;
  alumnosAsignados: Array<Record<string, unknown>>;
  alumnosPresentes: number;
  alumnosJustificados: Array<Record<string, unknown>>;
  huecosDisponibles: number;
  huecosReales: number;
}

export function useClasesEventos(refresh = 0) {
  const [eventos, setEventos] = useState<EventoProcesado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const { data: eventosData, error } = await supabase
          .from('eventos_clase')
          .select(`*, clases (*)`)
          .order('fecha', { ascending: true });
        if (error) throw error;

        const eventosProcesados = await Promise.all(
          ((eventosData as Array<Record<string, unknown>> | null) || []).map(async (ev) => {
            const { data: asignaciones } = await supabase
              .from('alumnos_clases')
              .select('alumno_id, alumnos(nombre, id)')
              .eq('clase_id', ev.clase_id as string);

            const { data: asistencias } = await supabase
              .from('asistencias')
              .select('alumno_id, asistio, justificacion')
              .eq('clase_id', ev.clase_id as string)
              .eq('fecha', ev.fecha as string);

            const alumnosAsignados =
              (asignaciones as Array<Record<string, unknown>> | null)
                ?.map((a) => a.alumnos as Record<string, unknown>)
                .filter(Boolean) || [];
            const alumnosPresentes =
              (asistencias as Array<Record<string, unknown>> | null)?.filter((a) => Boolean(a.asistio)).length || 0;
            const alumnosJustificados =
              (asignaciones as Array<Record<string, unknown>> | null)
                ?.filter((a) =>
                  (asistencias as Array<Record<string, unknown>> | null)?.some(
                    (as) => as.alumno_id === a.alumno_id && as.asistio === false && Boolean(as.justificacion)
                  )
                )
                .map((a) => a.alumnos as Record<string, unknown>)
                .filter(Boolean) || [];

            const clases = (ev.clases || {}) as Record<string, unknown>;
            const capacidad =
              clases.tipo_clase === 'particular' ? 1 : Number(clases.capacidad_maxima || 4);
            const huecosDisponibles = Math.max(0, capacidad - alumnosPresentes);
            const huecosReales = Math.max(0, capacidad - alumnosAsignados.length);

            return {
              id: String(ev.id),
              start: new Date(`${ev.fecha}T${(ev.hora_inicio as string) || '00:00'}`),
              end: new Date(`${ev.fecha}T${(ev.hora_fin as string) || '00:00'}`),
              title: (clases.nombre as string) || 'Sin nombre',
              resource: ev,
              alumnosAsignados,
              alumnosPresentes,
              alumnosJustificados,
              huecosDisponibles,
              huecosReales,
            } as EventoProcesado;
          })
        );
        setEventos(eventosProcesados);
      } catch (err) {
        console.error('Error cargando eventos:', err);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };
    void cargarEventos();
  }, [refresh]);

  const eventosProximos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos.filter((evento) => {
      const fechaEvento = new Date(evento.start);
      fechaEvento.setHours(0, 0, 0, 0);
      const estado = String((evento.resource.estado as string) || '');
      return fechaEvento >= hoy && estado !== 'cancelada' && estado !== 'eliminado';
    });
  }, [eventos]);

  const eventosImpartidos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos.filter((evento) => {
      const fechaEvento = new Date(evento.start);
      fechaEvento.setHours(0, 0, 0, 0);
      const estado = String((evento.resource.estado as string) || '');
      return fechaEvento < hoy && estado !== 'cancelada';
    });
  }, [eventos]);

  const eventosCancelados = useMemo(() => {
    return eventos.filter((evento) => String((evento.resource.estado as string) || '') === 'cancelada');
  }, [eventos]);

  return { eventos, eventosProximos, eventosImpartidos, eventosCancelados, loading };
}


