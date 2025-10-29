import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useEjercicios() {
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarEjercicios = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEjercicios(data || []);
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      alert('Error al cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEjercicios();
  }, [cargarEjercicios]);

  const eliminarEjercicio = useCallback(async id => {
    if (
      !window.confirm('¿Estás seguro de que quieres eliminar este ejercicio?')
    )
      return;

    try {
      const { error } = await supabase.from('ejercicios').delete().eq('id', id);

      if (error) throw error;

      setEjercicios(prev => prev.filter(e => e.id !== id));
      alert('Ejercicio eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando ejercicio:', error);
      alert('Error al eliminar el ejercicio');
    }
  }, []);

  return {
    ejercicios,
    loading,
    eliminarEjercicio,
    recargar: cargarEjercicios,
  };
}
