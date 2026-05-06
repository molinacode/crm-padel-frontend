import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/supabase';

type Alumno = Tables<'alumnos'>;

interface SeguimientoRow {
  [key: string]: unknown;
}

interface ClaseAsignadaRow {
  id: string;
  clases: {
    id: string;
    nombre: string | null;
    nivel_clase: string | null;
    tipo_clase: string | null;
    dia_semana: string | null;
    hora_inicio: string | null;
    hora_fin: string | null;
    profesor: string | null;
  } | null;
}

interface AsistenciaRow {
  id: string;
  fecha: string;
  asistio: boolean | null;
  justificacion: string | null;
  clases: { id: string; nombre: string | null; nivel_clase: string | null } | null;
}

export function useSeguimientoData(alumnoId: string | null) {
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [seguimientos, setSeguimientos] = useState<SeguimientoRow[]>([]);
  const [clases, setClases] = useState<ClaseAsignadaRow[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

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
        setAlumno((alumnoData as Alumno | null) || null);

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
          setSeguimientos((seguimientosData as SeguimientoRow[] | null) || []);
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
          setClases((clasesData as ClaseAsignadaRow[] | null) || []);
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
          setAsistencias((asistenciasData as unknown as AsistenciaRow[] | null) || []);
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


