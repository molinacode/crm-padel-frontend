import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables } from '../types/supabase';

type Profesor = Tables<'profesores'>;

interface EventoClaseMini {
  id: string;
  fecha: string;
  estado: string | null;
}

interface ClaseProfesor {
  id: string;
  nombre: string | null;
  nivel_clase: string | null;
  tipo_clase: string | null;
  dia_semana: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  eventos_clase?: EventoClaseMini[] | null;
}

interface ProximaClase extends ClaseProfesor {
  evento: EventoClaseMini;
}

export function useFichaProfesorData(profesorId: string | null) {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [clases, setClases] = useState<ClaseProfesor[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!profesorId) {
      setProfesor(null);
      setClases([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: profesorData, error: profesorError } = await supabase
        .from('profesores')
        .select('*')
        .eq('id', profesorId)
        .single();
      if (profesorError) throw profesorError;
      const profesorTyped = (profesorData as Profesor | null) || null;
      setProfesor(profesorTyped);

      const { data: clasesData, error: clasesError } = await supabase
        .from('clases')
        .select(
          `
          id,
          nombre,
          nivel_clase,
          tipo_clase,
          dia_semana,
          hora_inicio,
          hora_fin,
          eventos_clase ( id, fecha, estado )
        `
        )
        .eq('profesor', profesorTyped?.nombre || '');
      if (clasesError) throw clasesError;
      setClases((clasesData as ClaseProfesor[] | null) || []);
    } finally {
      setLoading(false);
    }
  }, [profesorId]);

  useEffect(() => {
    if (!profesorId) return undefined;
    return scheduleEffectWork(() => {
      void cargar();
    });
  }, [profesorId, cargar]);

  const proximasClases = useMemo(() => {
    const hoy = new Date();
    const result: ProximaClase[] = [];
    clases.forEach(clase => {
      clase.eventos_clase?.forEach((evento: EventoClaseMini) => {
        const fechaEvento = new Date(evento.fecha);
        if (fechaEvento >= hoy && evento.estado !== 'cancelada') {
          result.push({ ...clase, evento });
        }
      });
    });
    return result.sort(
      (a, b) => +new Date(a.evento.fecha) - +new Date(b.evento.fecha)
    );
  }, [clases]);

  return { profesor, clases, proximasClases, loading, recargar: cargar };
}


