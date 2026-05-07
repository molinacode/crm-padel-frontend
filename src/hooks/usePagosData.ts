import { useCallback, useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { filtrarAlumnosActivos } from '../utils/alumnoUtils';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables } from '../types/supabase';

type Alumno = Tables<'alumnos'>;
type Pago = Tables<'pagos'> & { alumnos?: { nombre: string | null } | null };

export function usePagosData() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [alumnosRes, pagosRes] = await Promise.all([
        supabase
          .from('alumnos')
          .select('*')
          .or('activo.eq.true,activo.is.null')
          .order('nombre'),
        supabase.from('pagos').select(`*, alumnos (nombre)`).order('fecha_pago', { ascending: false }),
      ]);
      if (alumnosRes.error) throw alumnosRes.error;
      if (pagosRes.error) throw pagosRes.error;

      const alumnosActivos = filtrarAlumnosActivos((alumnosRes.data as Alumno[] | null) || [], new Date());
      setAlumnos(alumnosActivos);
      setPagos(((pagosRes.data as Pago[] | null) || []));
      setError(null);
    } catch (err) {
      console.error('usePagosData error:', err);
      setAlumnos([]);
      setPagos([]);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargar();
    });
  }, [refreshTrigger, cargar]);

  const reload = () => setRefreshTrigger((prev) => prev + 1);
  return { alumnos, pagos, loading, error, reload };
}


