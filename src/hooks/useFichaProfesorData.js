import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useFichaProfesorData(profesorId) {
  const [profesor, setProfesor] = useState(null);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profesorData, error: profesorError } = await supabase
        .from('profesores')
        .select('*')
        .eq('id', profesorId)
        .single();
      if (profesorError) throw profesorError;
      setProfesor(profesorData);

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
        .eq('profesor', profesorData.nombre);
      if (clasesError) throw clasesError;
      setClases(clasesData || []);
    } finally {
      setLoading(false);
    }
  }, [profesorId]);

  useEffect(() => {
    if (profesorId) cargar();
  }, [profesorId, cargar]);

  const proximasClases = useMemo(() => {
    const hoy = new Date();
    const result = [];
    clases.forEach(clase => {
      clase.eventos_clase?.forEach(evento => {
        const fechaEvento = new Date(evento.fecha);
        if (fechaEvento >= hoy && evento.estado !== 'cancelada') {
          result.push({ ...clase, evento });
        }
      });
    });
    return result.sort(
      (a, b) => new Date(a.evento.fecha) - new Date(b.evento.fecha)
    );
  }, [clases]);

  return { profesor, clases, proximasClases, loading, recargar: cargar };
}
