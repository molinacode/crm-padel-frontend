import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

interface ClaseEvento {
  id: string;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: string | null;
  clases: {
    id: string;
    nombre: string | null;
    nivel_clase: string | null;
    tipo_clase: string | null;
    profesor: string | null;
  };
}

interface AsignacionRow {
  clase_id: string | null;
  alumno_id: string;
  tipo_asignacion: string | null;
  evento_id: string | null;
  alumnos: { nombre: string } | null;
}

interface RecuperacionRow {
  alumno_id: string;
  clase_id: string;
  fecha_recuperacion: string | null;
  fecha_falta: string;
  estado: string;
}

type AlumnosPorClase = Record<
  string,
  Array<{ id: string; nombre: string; tipo: 'permanente' | 'temporal'; evento_id?: string | null }>
>;
type AsistenciasMap = Record<string, Record<string, string>>;
type RecuperacionesMap = Record<string, Record<string, string>>;

export function useAsistenciasData(fecha: string) {
  const [clases, setClases] = useState<ClaseEvento[]>([]);
  const [alumnosPorClase, setAlumnosPorClase] = useState<AlumnosPorClase>({});
  const [asistencias, setAsistencias] = useState<AsistenciasMap>({});
  const [recuperacionesMarcadas, setRecuperacionesMarcadas] =
    useState<RecuperacionesMap>({});
  const [loading, setLoading] = useState(true);
  const [proximaFechaConClases, setProximaFechaConClases] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      setProximaFechaConClases(null);

      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select(
          `
            id, fecha, hora_inicio, hora_fin, estado,
            clases (id, nombre, nivel_clase, tipo_clase, profesor)
          `
        )
        .eq('fecha', fecha)
        .or('estado.is.null,estado.eq.programada');
      if (eventosError) throw eventosError;

      const eventosParaMostrar: ClaseEvento[] = Array.isArray(eventosData)
        ? (eventosData as ClaseEvento[])
        : [];

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
        if (eventosProximosData?.[0]?.fecha) setProximaFechaConClases(eventosProximosData[0].fecha);
      }

      const eventosIdsPorClase: Record<string, string[]> = {};
      eventosParaMostrar.forEach((evento) => {
        if (!eventosIdsPorClase[evento.clases.id]) eventosIdsPorClase[evento.clases.id] = [];
        eventosIdsPorClase[evento.clases.id].push(evento.id);
      });

      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('alumnos_clases')
        .select('clase_id, alumno_id, tipo_asignacion, evento_id, alumnos (nombre)');
      if (asignacionesError) throw asignacionesError;

      const alumnosMap: AlumnosPorClase = {};
      (asignacionesData as AsignacionRow[]).forEach((ac) => {
        if (!ac.clase_id || !ac.alumnos) return;
        const esPermanente = !ac.tipo_asignacion || ac.tipo_asignacion === 'permanente';
        const esTemporal = ac.tipo_asignacion === 'temporal' && ac.evento_id;
        if (esPermanente) {
          if (!alumnosMap[ac.clase_id]) alumnosMap[ac.clase_id] = [];
          alumnosMap[ac.clase_id].push({ id: ac.alumno_id, nombre: ac.alumnos.nombre, tipo: 'permanente' });
        } else if (esTemporal) {
          const eventosDeEstaClase = eventosIdsPorClase[ac.clase_id] || [];
          if (eventosDeEstaClase.includes(ac.evento_id as string)) {
            if (!alumnosMap[ac.clase_id]) alumnosMap[ac.clase_id] = [];
            alumnosMap[ac.clase_id].push({
              id: ac.alumno_id,
              nombre: ac.alumnos.nombre,
              tipo: 'temporal',
              evento_id: ac.evento_id,
            });
          }
        }
      });

      const { data: asistenciasData, error: asistenciasError } = await supabase
        .from('asistencias')
        .select('id, alumno_id, clase_id, estado')
        .eq('fecha', fecha);
      if (asistenciasError) throw asistenciasError;

      const asistenciasMap: AsistenciasMap = {};
      (asistenciasData || []).forEach((a) => {
        if (!a.clase_id || !a.alumno_id) return;
        if (!asistenciasMap[a.clase_id]) asistenciasMap[a.clase_id] = {};
        asistenciasMap[a.clase_id][a.alumno_id] = a.estado || '';
      });

      const { data: recData } = await supabase
        .from('recuperaciones_clase')
        .select('alumno_id, clase_id, fecha_recuperacion, fecha_falta, estado')
        .eq('fecha_recuperacion', fecha)
        .eq('estado', 'recuperada');

      const recMap: RecuperacionesMap = {};
      (recData as RecuperacionRow[] | null | undefined)?.forEach((r) => {
        if (!recMap[r.clase_id]) recMap[r.clase_id] = {};
        recMap[r.clase_id][r.alumno_id] = r.fecha_falta;
      });

      setClases(eventosParaMostrar);
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
    if (!fecha) return undefined;
    return scheduleEffectWork(() => {
      void cargarDatos();
    });
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


