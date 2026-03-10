import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { esAlumnoActivo } from '../utils/alumnoUtils';

export function useOtrosAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: alumnosAsignados, error: alumnosError } =
        await supabase.from('alumnos_clases').select(`
          alumno_id,
          clase_id,
          alumnos ( id, nombre, email, telefono, nivel, activo, foto_url, created_at ),
          clases ( id, nombre, tipo_clase )
        `);
      if (alumnosError) throw alumnosError;

      const alumnosInternos = (alumnosAsignados || []).filter(asignacion => {
        const alumno = asignacion.alumnos;
        const clase = asignacion.clases;
        // Verificar que el alumno esté activo considerando fecha_baja
        if (!alumno || !esAlumnoActivo(alumno, new Date())) return false;
        if (!clase || clase.nombre?.includes('Escuela')) return false;
        return true;
      });

      const alumnosUnicos = {};
      alumnosInternos.forEach(asignacion => {
        const alumno = asignacion.alumnos;
        if (!alumnosUnicos[alumno.id]) {
          alumnosUnicos[alumno.id] = { ...alumno, clasesInternas: [] };
        }
        alumnosUnicos[alumno.id].clasesInternas.push(asignacion.clases);
      });
      setAlumnos(Object.values(alumnosUnicos));
    } catch (e) {
      console.error('Error cargando otros alumnos:', e);
      setError('Error al cargar los otros alumnos');
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarAlumno = useCallback(async alumnoId => {
    // Eliminar en cascada tal y como estaba en la página
    // Lanzar errores hacia arriba para que la página muestre alertas
    const { error: asignacionesError } = await supabase
      .from('alumnos_clases')
      .delete()
      .eq('alumno_id', alumnoId);
    if (asignacionesError) throw asignacionesError;

    const { error: pagosError } = await supabase
      .from('pagos')
      .delete()
      .eq('alumno_id', alumnoId);
    if (pagosError) throw pagosError;

    const { error: asistenciasError } = await supabase
      .from('asistencias')
      .delete()
      .eq('alumno_id', alumnoId);
    if (asistenciasError) throw asistenciasError;

    const { error: alumnoError } = await supabase
      .from('alumnos')
      .delete()
      .eq('id', alumnoId);
    if (alumnoError) throw alumnoError;
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { alumnos, loading, error, cargar, eliminarAlumno };
}
