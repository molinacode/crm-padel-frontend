import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type Profesor = Tables<'profesores'>;

interface ClaseEvento {
  id: string;
  nombre: string | null;
  nivel_clase: string | null;
  tipo_clase: string | null;
  profesor: string | null;
}

interface EventoRaw {
  id: string;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: string | null;
  clase_id: string | null;
  clases: ClaseEvento | null;
}

interface EventoVistaProfesor {
  id: string;
  start: Date;
  end: Date;
  resource: { estado: string | null; clase_id: string | null; clase: ClaseEvento | null };
  profesor?: string;
}

/**
 * Carga los eventos (ventana amplia) y los profesores para VistaProfesor
 * Normaliza eventos con campos start/end (Date) y resource (clase/estado)
 */
export function useVistaProfesorData() {
  const [eventos, setEventos] = useState<EventoVistaProfesor[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Ventana amplia de fechas (-24 meses, +24 meses)
        const hoyBase = new Date();
        hoyBase.setHours(0, 0, 0, 0);
        const inicioVentana = new Date(hoyBase);
        inicioVentana.setDate(inicioVentana.getDate() - 730);
        const finVentana = new Date(hoyBase);
        finVentana.setDate(finVentana.getDate() + 730);

        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_clase')
          .select(
            `
            id,
            fecha,
            hora_inicio,
            hora_fin,
            estado,
            clase_id,
            clases (id, nombre, nivel_clase, tipo_clase, profesor)
          `
          )
          .gte('fecha', inicioVentana.toISOString().split('T')[0])
          .lte('fecha', finVentana.toISOString().split('T')[0]);

        if (eventosError) throw eventosError;

        // Normalizar eventos a estructura usada en VistaProfesor
        const eventosNormalizados = ((eventosData as EventoRaw[] | null) || [])
          .map(ev => {
            const startStr = `${ev.fecha}T${ev.hora_inicio || '00:00:00'}`;
            const endStr = ev.hora_fin
              ? `${ev.fecha}T${ev.hora_fin}`
              : `${ev.fecha}T${ev.hora_inicio || '00:00:00'}`;
            return {
              id: ev.id,
              start: new Date(startStr),
              end: new Date(endStr),
              resource: { estado: ev.estado, clase_id: ev.clase_id, clase: ev.clases },
              profesor: ev.clases?.profesor || undefined,
            };
          })
          .sort((a, b) => {
            if (a.start.getTime() !== b.start.getTime())
              return +a.start - +b.start;
            return 0;
          });

        const { data: profesoresData, error: profesoresError } = await supabase
          .from('profesores')
          .select('*');
        if (profesoresError) throw profesoresError;

        setEventos(eventosNormalizados);
        setProfesores((profesoresData as Profesor[] | null) || []);
        setError(null);
      } catch (err) {
        console.error('Error cargando VistaProfesorData:', err);
        setError(err);
        setEventos([]);
        setProfesores([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return { eventos, profesores, loading, error };
}


