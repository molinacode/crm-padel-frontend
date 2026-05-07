import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables } from '../types/supabase';

type Profesor = Tables<'profesores'>;

export function useProfesores() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarProfesores = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profesores')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      setProfesores((data as Profesor[] | null) || []);
    } catch (error) {
      console.error('Error cargando profesores:', error);
      alert('Error al cargar los profesores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargarProfesores();
    });
  }, [cargarProfesores]);

  const eliminarProfesor = useCallback(async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este profesor?')) return;
    try {
      const { error } = await supabase.from('profesores').delete().eq('id', id);
      if (error) throw error;
      setProfesores((prev) => prev.filter((p) => p.id !== id));
      alert('Profesor eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando profesor:', error);
      alert('Error al eliminar el profesor');
    }
  }, []);

  return { profesores, loading, eliminarProfesor, recargar: cargarProfesores };
}


