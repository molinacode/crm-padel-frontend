import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';

export function useClasesData() {
  const [clases, setClases] = useState([]);
  const [eventosSemana, setEventosSemana] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        setClases(clasesRes.data || []);
        setEventosSemana(eventosRes.data || []);
        setAsignaciones(asigRes.data || []);
        setError(null);
      } catch (err) {
        console.error('useClasesData error:', err);
        setError(err);
        setClases([]);
        setEventosSemana([]);
        setAsignaciones([]);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return { clases, eventosSemana, asignaciones, loading, error };
}
