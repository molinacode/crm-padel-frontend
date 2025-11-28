import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePagosData() {
  const [alumnos, setAlumnos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const cargar = async () => {
    setLoading(true);
    try {
      const [alumnosRes, pagosRes] = await Promise.all([
        supabase
          .from('alumnos')
          .select('*')
          .eq('activo', true)
          .order('nombre'),
        supabase
          .from('pagos')
          .select(`*, alumnos (nombre)`)
          .order('fecha_pago', { ascending: false }),
      ]);
      if (alumnosRes.error) throw alumnosRes.error;
      if (pagosRes.error) throw pagosRes.error;
      setAlumnos(alumnosRes.data || []);
      setPagos(pagosRes.data || []);
      setError(null);
    } catch (err) {
      console.error('usePagosData error:', err);
      setAlumnos([]);
      setPagos([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [refreshTrigger]);

  const reload = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { alumnos, pagos, loading, error, reload };
}
