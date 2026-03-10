import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSelectorTematica() {
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [profesoresDisponibles, setProfesoresDisponibles] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [profesorSeleccionado, setProfesorSeleccionado] = useState('');

  const abrirSelector = useCallback(async () => {
    try {
      setMostrarSelector(true);
      // Cargar clases (solo id, nombre, tipo)
      const { data: clases, error: clasesError } = await supabase
        .from('clases')
        .select('id, nombre, tipo_clase, nivel_clase, dia_semana')
        .order('nombre', { ascending: true });
      if (clasesError) throw clasesError;

      // Cargar profesores
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores')
        .select('id, nombre, apellidos, activo')
        .order('nombre', { ascending: true });
      if (profesoresError) throw profesoresError;

      setClasesDisponibles(clases || []);
      setProfesoresDisponibles(
        (profesores || []).filter(p => p.activo !== false)
      );
    } catch (e) {
      console.error('Error cargando selector temática:', e);
      alert('No se pudieron cargar clases o profesores');
      setMostrarSelector(false);
    }
  }, []);

  const cerrarSelector = useCallback(() => {
    setMostrarSelector(false);
    setClaseSeleccionada('');
    setProfesorSeleccionado('');
  }, []);

  const continuar = useCallback(() => {
    if (!claseSeleccionada || !profesorSeleccionado) {
      alert('Selecciona clase y profesor');
      return false;
    }
    return true;
  }, [claseSeleccionada, profesorSeleccionado]);

  return {
    mostrarSelector,
    clasesDisponibles,
    profesoresDisponibles,
    claseSeleccionada,
    setClaseSeleccionada,
    profesorSeleccionado,
    setProfesorSeleccionado,
    abrirSelector,
    cerrarSelector,
    continuar,
  };
}
