import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSeguimientoData(alumnoId) {
  const [alumno, setAlumno] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [clases, setClases] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!alumnoId) return;

    const cargarDatos = async () => {
      try {
        setLoading(true);

        const { data: alumnoData, error: alumnoError } = await supabase
          .from('alumnos')
          .select('*')
          .eq('id', alumnoId)
          .single();

        if (alumnoError) throw alumnoError;
        setAlumno(alumnoData);

        const { data: seguimientosData, error: seguimientosError } =
          await supabase
            .from('seguimiento_alumnos')
            .select('*')
            .eq('alumno_id', alumnoId)
            .order('fecha', { ascending: false });

        if (seguimientosError) {
          console.error('Error cargando seguimientos:', seguimientosError);
          setSeguimientos([]);
        } else {
          setSeguimientos(seguimientosData || []);
        }

        const { data: clasesData, error: clasesError } = await supabase
          .from('alumnos_clases')
          .select(
            `
          id,
          clases (
            id,
            nombre,
            nivel_clase,
            tipo_clase,
            dia_semana,
            hora_inicio,
            hora_fin,
            profesor
          )
        `
          )
          .eq('alumno_id', alumnoId);

        if (clasesError) {
          console.error('Error cargando clases:', clasesError);
          setClases([]);
        } else {
          setClases(clasesData || []);
        }

        const { data: asistenciasData, error: asistenciasError } =
          await supabase
            .from('asistencias')
            .select(
              `
          id,
          fecha,
          asistio,
          justificacion,
          clases (
            id,
            nombre,
            nivel_clase
          )
        `
            )
            .eq('alumno_id', alumnoId)
            .order('fecha', { ascending: false });

        if (asistenciasError) {
          console.error('Error cargando asistencias:', asistenciasError);
          setAsistencias([]);
        } else {
          setAsistencias(asistenciasData || []);
        }

        setError(null);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [alumnoId]);

  return {
    alumno,
    seguimientos,
    clases,
    asistencias,
    loading,
    error,
  };
}
