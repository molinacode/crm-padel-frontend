import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSincronizacionAsignaciones } from './useSincronizacionAsignaciones';

// Función helper para detectar errores de red
const isNetworkError = error => {
  if (!error) return false;
  const message = error.message || error.details || String(error);
  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Network request failed')
  );
};

export function useFichaAlumnoData(id) {
  const [alumno, setAlumno] = useState(null);
  const [clases, setClases] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [recuperaciones, setRecuperaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cargandoRef = useRef(false);

  const { obtenerRecuperacionesPendientes } = useSincronizacionAsignaciones();

  const cargarDatos = useCallback(async () => {
    // Evitar múltiples ejecuciones simultáneas
    if (cargandoRef.current) {
      return;
    }

    try {
      cargandoRef.current = true;
      setLoading(true);
      setError(null);

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

      // Manejar errores de red de forma diferente
      if (alumnoRes.error) {
        if (isNetworkError(alumnoRes.error)) {
          console.error('Error de red cargando alumno:', alumnoRes.error);
          setError(
            'Error de conexión. Por favor, verifica tu conexión a internet.'
          );
        } else {
          console.error('Error cargando alumno:', alumnoRes.error);
        }
        setAlumno(null);
      } else {
        setAlumno(alumnoRes.data);
      }

      if (pagosRes.error) {
        if (!isNetworkError(pagosRes.error)) {
          console.error('Error cargando pagos:', pagosRes.error);
        }
        setPagos([]);
      } else {
        setPagos(pagosRes.data || []);
      }

      if (asistenciasRes.error) {
        if (!isNetworkError(asistenciasRes.error)) {
          console.error('Error cargando asistencias:', asistenciasRes.error);
        }
        setAsistencias([]);
      } else {
        setAsistencias(asistenciasRes.data || []);
      }

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

      if (clasesError) {
        if (!isNetworkError(clasesError)) {
          console.error('Error cargando clases:', clasesError);
        }
        setClases([]);
      } else {
        // Procesar clases asignadas
        const clasesProcesadas =
          clasesAsignadas
            ?.map(ca => ca.clases)
            .filter(clase => Boolean(clase)) || [];
        setClases(clasesProcesadas);
      }

      // Cargar recuperaciones pendientes (solo si no hay error de red)
      if (!isNetworkError(alumnoRes.error)) {
        try {
          const recuperacionesResult =
            await obtenerRecuperacionesPendientes(id);
          if (recuperacionesResult.success) {
            setRecuperaciones(recuperacionesResult.recuperaciones || []);
          } else {
            // Si hay error de red en recuperaciones, no lo registramos si ya hay uno principal
            if (!isNetworkError(recuperacionesResult.error)) {
              console.error(
                'Error obteniendo recuperaciones:',
                recuperacionesResult.error
              );
            }
            setRecuperaciones([]);
          }
        } catch (recupError) {
          if (!isNetworkError(recupError)) {
            console.error('Error cargando recuperaciones:', recupError);
          }
          setRecuperaciones([]);
        }
      } else {
        setRecuperaciones([]);
      }
    } catch (err) {
      if (isNetworkError(err)) {
        console.error('Error de red cargando datos:', err);
        setError(
          'Error de conexión. Por favor, verifica tu conexión a internet.'
        );
      } else {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos del alumno.');
      }
      // No resetear todo si hay error de red, mantener lo que se pudo cargar
      if (!alumno) setAlumno(null);
    } finally {
      setLoading(false);
      cargandoRef.current = false;
    }
  }, [id, obtenerRecuperacionesPendientes]);

  useEffect(() => {
    if (id && !cargandoRef.current) {
      cargarDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    error,
    recargar: cargarDatos,
    recargarAlumno,
    recargarRecuperaciones,
    setClases,
  };
}
