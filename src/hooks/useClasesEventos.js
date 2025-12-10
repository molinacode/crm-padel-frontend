import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export function useClasesEventos(refresh = 0) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const { data: eventosData, error } = await supabase
          .from('eventos_clase')
          .select(`*, clases (*)`)
          .order('fecha', { ascending: true });

        if (error) throw error;

        // Procesar eventos con alumnos asignados y asistencias
        const eventosProcesados = await Promise.all(
          (eventosData || []).map(async ev => {
            const { data: asignaciones } = await supabase
              .from('alumnos_clases')
              .select('alumno_id, alumnos(nombre, id)')
              .eq('clase_id', ev.clase_id);

            const { data: asistencias } = await supabase
              .from('asistencias')
              .select('alumno_id, asistio, justificacion')
              .eq('clase_id', ev.clase_id)
              .eq('fecha', ev.fecha);

            const alumnosAsignados =
              asignaciones?.map(a => a.alumnos).filter(Boolean) || [];
            const alumnosPresentes =
              asistencias?.filter(a => a.asistio).length || 0;
            const alumnosJustificados =
              asignaciones
                ?.filter(a =>
                  asistencias?.some(
                    as =>
                      as.alumno_id === a.alumno_id &&
                      as.asistio === false &&
                      as.justificacion
                  )
                )
                .map(a => a.alumnos)
                .filter(Boolean) || [];

            const capacidad =
              ev.clases?.tipo_clase === 'particular'
                ? 1
                : ev.clases?.capacidad_maxima || 4;
            const huecosDisponibles = Math.max(0, capacidad - alumnosPresentes);
            const huecosReales = Math.max(
              0,
              capacidad - alumnosAsignados.length
            );

            return {
              id: ev.id,
              start: new Date(`${ev.fecha}T${ev.hora_inicio || '00:00'}`),
              end: new Date(`${ev.fecha}T${ev.hora_fin || '00:00'}`),
              title: ev.clases?.nombre || 'Sin nombre',
              resource: ev,
              alumnosAsignados,
              alumnosPresentes,
              alumnosJustificados,
              huecosDisponibles,
              huecosReales,
            };
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

    cargarEventos();
  }, [refresh]);

  const eventosProximos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.start);
      fechaEvento.setHours(0, 0, 0, 0);
      return (
        fechaEvento >= hoy &&
        evento.resource.estado !== 'cancelada' &&
        evento.resource.estado !== 'eliminado'
      );
    });
  }, [eventos]);

  const eventosImpartidos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos.filter(evento => {
      const fechaEvento = new Date(evento.start);
      fechaEvento.setHours(0, 0, 0, 0);
      return fechaEvento < hoy && evento.resource.estado !== 'cancelada';
    });
  }, [eventos]);

  const eventosCancelados = useMemo(() => {
    return eventos.filter(evento => evento.resource.estado === 'cancelada');
  }, [eventos]);

  return {
    eventos,
    eventosProximos,
    eventosImpartidos,
    eventosCancelados,
    loading,
  };
}
