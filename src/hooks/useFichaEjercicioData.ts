import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

type Ejercicio = Tables<'ejercicios'>;

interface ClaseResumen {
  id: string;
  nombre: string | null;
  nivel_clase: string | null;
  tipo_clase: string | null;
  dia_semana: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
}

interface ClaseEjercicioRow {
  id: string;
  clases: ClaseResumen | null;
}

export function useFichaEjercicioData(ejercicioId: string | null) {
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null);
  const [clasesAsignadas, setClasesAsignadas] = useState<ClaseEjercicioRow[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!ejercicioId) {
      setEjercicio(null);
      setClasesAsignadas([]);
      setLoading(false);
      return;
    }
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
      setEjercicio((ejRes.data as Ejercicio | null) || null);
      setClasesAsignadas(
        clasesRes.error ? [] : ((clasesRes.data as ClaseEjercicioRow[] | null) || [])
      );
    } finally {
      setLoading(false);
    }
  }, [ejercicioId]);

  useEffect(() => {
    if (!ejercicioId) return undefined;
    return scheduleEffectWork(() => {
      void cargar();
    });
  }, [ejercicioId, cargar]);

  return { ejercicio, clasesAsignadas, loading, recargar: cargar };
}


