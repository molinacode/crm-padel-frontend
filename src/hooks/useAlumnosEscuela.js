import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { esAlumnoActivo } from '../utils/alumnoUtils';

export function useAlumnosEscuela() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarAlumnosEscuela = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Cargando alumnos de escuela...');

      // Obtener alumnos que están asignados a clases de escuela
      const { data: alumnosAsignados, error: alumnosError } =
        await supabase.from('alumnos_clases').select(`
          alumno_id,
          clase_id,
          alumnos (
            id,
            nombre,
            email,
            telefono,
            nivel,
            activo,
            foto_url,
            created_at
          ),
          clases (
            id,
            nombre,
            tipo_clase
          )
        `);

      if (alumnosError) throw alumnosError;

      console.log(
        '📋 Alumnos asignados encontrados:',
        alumnosAsignados?.length || 0
      );

      // Filtrar solo alumnos activos asignados a clases de escuela
      const alumnosEscuela =
        alumnosAsignados?.filter(asignacion => {
          const alumno = asignacion.alumnos;
          const clase = asignacion.clases;

          // Solo alumnos activos (considerando fecha_baja)
          if (!alumno || !esAlumnoActivo(alumno, new Date())) return false;

          // Solo clases que contienen "Escuela" en el nombre
          if (!clase || !clase.nombre?.includes('Escuela')) return false;

          return true;
        }) || [];

      console.log(
        '📋 Alumnos asignados a clases de escuela encontrados:',
        alumnosEscuela.length
      );

      // Agrupar alumnos únicos (un alumno puede estar en múltiples clases de escuela)
      const alumnosUnicos = {};
      alumnosEscuela.forEach(asignacion => {
        const alumno = asignacion.alumnos;
        if (!alumnosUnicos[alumno.id]) {
          alumnosUnicos[alumno.id] = {
            ...alumno,
            clasesEscuela: [],
          };
        }
        alumnosUnicos[alumno.id].clasesEscuela.push(asignacion.clases);
      });

      const listaAlumnos = Object.values(alumnosUnicos);
      console.log('👥 Alumnos únicos de escuela:', listaAlumnos.length);

      setAlumnos(listaAlumnos);
    } catch (err) {
      console.error('Error cargando alumnos de escuela:', err);
      setError('Error al cargar los alumnos de escuela');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAlumnosEscuela();
  }, [cargarAlumnosEscuela]);

  return {
    alumnos,
    loading,
    error,
    recargar: cargarAlumnosEscuela,
  };
}
