import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useFichaEjercicioData(ejercicioId) {
  const [ejercicio, setEjercicio] = useState(null);
  const [clasesAsignadas, setClasesAsignadas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [ejRes, clasesRes] = await Promise.all([
        supabase.from('ejercicios').select('*').eq('id', ejercicioId).single(),
        supabase
          .from('clases_ejercicios')
          .select(
            `id, clases (id, nombre, nivel_clase, tipo_clase, dia_semana, hora_inicio, hora_fin)`
          )
          .eq('ejercicio_id', ejercicioId),
      ]);

      if (ejRes.error) throw ejRes.error;
      setEjercicio(ejRes.data);
      setClasesAsignadas(clasesRes.error ? [] : clasesRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [ejercicioId]);

  useEffect(() => {
    if (ejercicioId) cargar();
  }, [ejercicioId, cargar]);

  return { ejercicio, clasesAsignadas, loading, recargar: cargar };
}
