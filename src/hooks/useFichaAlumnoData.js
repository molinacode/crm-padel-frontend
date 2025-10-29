import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSincronizacionAsignaciones } from './useSincronizacionAsignaciones';

export function useFichaAlumnoData(id) {
  const [alumno, setAlumno] = useState(null);
  const [clases, setClases] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [recuperaciones, setRecuperaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const { obtenerRecuperacionesPendientes } = useSincronizacionAsignaciones();

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      const [alumnoRes, pagosRes, asistenciasRes] = await Promise.all([
        supabase.from('alumnos').select('*').eq('id', id).single(),
        supabase.from('pagos').select('*').eq('alumno_id', id),
        supabase
          .from('asistencias')
          .select(
            `
            *,
            clases (id, nombre)
          `
          )
          .eq('alumno_id', id),
      ]);

      if (alumnoRes.error) throw alumnoRes.error;
      if (pagosRes.error) throw pagosRes.error;
      if (asistenciasRes.error) throw asistenciasRes.error;

      // Cargar clases asignadas
      const { data: clasesAsignadas, error: clasesError } = await supabase
        .from('alumnos_clases')
        .select(
          `
            clase_id,
            alumno_id,
            clases (*)
          `
        )
        .eq('alumno_id', id);

      if (clasesError) throw clasesError;

      // Procesar clases asignadas
      const clasesProcesadas =
        clasesAsignadas?.map(ca => ca.clases).filter(clase => Boolean(clase)) ||
        [];

      setAlumno(alumnoRes.data);
      setClases(clasesProcesadas);
      setPagos(pagosRes.data || []);
      setAsistencias(asistenciasRes.data || []);

      // Cargar recuperaciones pendientes
      const recuperacionesResult = await obtenerRecuperacionesPendientes(id);
      if (recuperacionesResult.success) {
        setRecuperaciones(recuperacionesResult.recuperaciones);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, obtenerRecuperacionesPendientes]);

  useEffect(() => {
    if (id) cargarDatos();
  }, [id, cargarDatos]);

  const recargarAlumno = useCallback(async () => {
    try {
      const { data: alumnoRes, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAlumno(alumnoRes);
    } catch (err) {
      console.error('Error recargando datos:', err);
    }
  }, [id]);

  const recargarRecuperaciones = useCallback(async () => {
    const recuperacionesResult = await obtenerRecuperacionesPendientes(id);
    if (recuperacionesResult.success) {
      setRecuperaciones(recuperacionesResult.recuperaciones);
    }
  }, [id, obtenerRecuperacionesPendientes]);

  return {
    alumno,
    clases,
    pagos,
    asistencias,
    recuperaciones,
    loading,
    recargar: cargarDatos,
    recargarAlumno,
    recargarRecuperaciones,
    setClases,
  };
}
