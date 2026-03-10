import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAsistenciasData(fecha) {
  const [clases, setClases] = useState([]);
  const [alumnosPorClase, setAlumnosPorClase] = useState({});
  const [asistencias, setAsistencias] = useState({});
  const [recuperacionesMarcadas, setRecuperacionesMarcadas] = useState({});
  const [loading, setLoading] = useState(true);
  const [proximaFechaConClases, setProximaFechaConClases] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      setProximaFechaConClases(null);

      // Cargar eventos del día
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select(
          `
            id,
            fecha,
            hora_inicio,
            hora_fin,
            estado,
            clases (id, nombre, nivel_clase, tipo_clase, profesor)
          `
        )
        .eq('fecha', fecha)
        .or('estado.is.null,estado.eq.programada');

      if (eventosError) throw eventosError;

      let eventosParaMostrar = Array.isArray(eventosData) ? eventosData : [];

      // Si no hay eventos, buscar próximos
      if (eventosParaMostrar.length === 0) {
        const hoy = new Date();
        const proximosNDias = new Date();
        proximosNDias.setDate(hoy.getDate() + 30);

        const { data: eventosProximosData } = await supabase
          .from('eventos_clase')
          .select('id, fecha')
          .gte('fecha', hoy.toISOString().split('T')[0])
          .lte('fecha', proximosNDias.toISOString().split('T')[0])
          .or('estado.is.null,estado.eq.programada')
          .order('fecha', { ascending: true })
          .limit(1);

        if (eventosProximosData?.[0]?.fecha) {
          setProximaFechaConClases(eventosProximosData[0].fecha);
        }
      }

      // Crear mapa de eventos por clase
      const eventosIdsPorClase = {};
      eventosParaMostrar.forEach(evento => {
        if (!eventosIdsPorClase[evento.clases.id]) {
          eventosIdsPorClase[evento.clases.id] = [];
        }
        eventosIdsPorClase[evento.clases.id].push(evento.id);
      });

      // Cargar asignaciones
      const { data: asignacionesData, error: asignacionesError } =
        await supabase
          .from('alumnos_clases')
          .select(
            'clase_id, alumno_id, tipo_asignacion, evento_id, alumnos (nombre)'
          );

      if (asignacionesError) throw asignacionesError;

      // Crear mapa de alumnos por clase
      const alumnosMap = {};
      asignacionesData.forEach(ac => {
        const esPermanente =
          !ac.tipo_asignacion || ac.tipo_asignacion === 'permanente';
        const esTemporal = ac.tipo_asignacion === 'temporal' && ac.evento_id;

        if (esPermanente) {
          if (!alumnosMap[ac.clase_id]) {
            alumnosMap[ac.clase_id] = [];
          }
          alumnosMap[ac.clase_id].push({
            id: ac.alumno_id,
            nombre: ac.alumnos.nombre,
            tipo: 'permanente',
          });
        } else if (esTemporal) {
          const eventosDeEstaClase = eventosIdsPorClase[ac.clase_id] || [];
          if (eventosDeEstaClase.includes(ac.evento_id)) {
            if (!alumnosMap[ac.clase_id]) {
              alumnosMap[ac.clase_id] = [];
            }
            alumnosMap[ac.clase_id].push({
              id: ac.alumno_id,
              nombre: ac.alumnos.nombre,
              tipo: 'temporal',
              evento_id: ac.evento_id,
            });
          }
        }
      });

      // Cargar asistencias del día
      const { data: asistenciasData, error: asistenciasError } = await supabase
        .from('asistencias')
        .select('id, alumno_id, clase_id, estado')
        .eq('fecha', fecha);

      if (asistenciasError) throw asistenciasError;

      const asistenciasMap = {};
      asistenciasData.forEach(a => {
        if (!asistenciasMap[a.clase_id]) {
          asistenciasMap[a.clase_id] = {};
        }
        asistenciasMap[a.clase_id][a.alumno_id] = a.estado;
      });

      // Cargar recuperaciones
      const { data: recData } = await supabase
        .from('recuperaciones_clase')
        .select('alumno_id, clase_id, fecha_recuperacion, fecha_falta, estado')
        .eq('fecha_recuperacion', fecha)
        .eq('estado', 'recuperada');

      const recMap = {};
      (recData || []).forEach(r => {
        if (!recMap[r.clase_id]) recMap[r.clase_id] = {};
        recMap[r.clase_id][r.alumno_id] = r.fecha_falta;
      });

      setClases(eventosParaMostrar || []);
      setAlumnosPorClase(alumnosMap);
      setAsistencias(asistenciasMap);
      setRecuperacionesMarcadas(recMap);
    } catch (err) {
      console.error('Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    if (fecha) cargarDatos();
  }, [fecha, cargarDatos]);

  return {
    clases,
    alumnosPorClase,
    asistencias,
    recuperacionesMarcadas,
    loading,
    proximaFechaConClases,
    recargar: cargarDatos,
    setAsistencias,
  };
}
