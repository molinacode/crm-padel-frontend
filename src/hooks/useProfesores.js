import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useProfesores() {
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarProfesores = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profesores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProfesores(data || []);
    } catch (error) {
      console.error('Error cargando profesores:', error);
      alert('Error al cargar los profesores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProfesores();
  }, [cargarProfesores]);

  const eliminarProfesor = useCallback(async id => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este profesor?'))
      return;

    try {
      const { error } = await supabase.from('profesores').delete().eq('id', id);

      if (error) throw error;

      setProfesores(prev => prev.filter(p => p.id !== id));
      alert('Profesor eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando profesor:', error);
      alert('Error al eliminar el profesor');
    }
  }, []);

  return {
    profesores,
    loading,
    eliminarProfesor,
    recargar: cargarProfesores,
  };
}
