import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getClassColors } from '../utils/getClassColors';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

type EventoVista = Record<string, unknown>;

export function useEventosData(refresh: unknown) {
  const [eventos, setEventos] = useState<EventoVista[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);

  const cargarEventos = useCallback(async () => {
    try {
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select(`*, clases (*)`)
        .order('fecha', { ascending: true });
      if (eventosError) return;
      if (!isMountedRef.current) return;

      let alumnosData: Array<Record<string, unknown>> = [];
      let alumnosError: unknown = null;
      try {
        const alumnosRes = await supabase.from('alumnos_clases').select(`
              clase_id, alumno_id, origen, tipo_asignacion, evento_id, alumnos (id, nombre)
            `);
        if (alumnosRes.error && alumnosRes.error.code === '42703') {
          const fallbackRes = await supabase.from('alumnos_clases').select(`
                clase_id, alumno_id, alumnos (id, nombre)
              `);
          alumnosData = (fallbackRes.data as Array<Record<string, unknown>> | null) || [];
          alumnosError = fallbackRes.error;
        } else {
          alumnosData = (alumnosRes.data as Array<Record<string, unknown>> | null) || [];
          alumnosError = alumnosRes.error;
        }
      } catch (err) {
        alumnosData = [];
        alumnosError = err;
      }

      const asistenciasRes = await supabase
        .from('asistencias')
        .select(`alumno_id, clase_id, fecha, estado, alumnos (id, nombre)`)
        .in('estado', ['justificada', 'falta', 'lesionado']);
      const { data: asistenciasData, error: asistenciasError } = asistenciasRes;
      if (alumnosError) return;
      if (asistenciasError) console.error('Error cargando asistencias:', asistenciasError);
      if (!isMountedRef.current) return;

      const alumnosPorClase: Record<string, Array<Record<string, unknown>>> = {};
      const origenesPorClase: Record<string, Set<string>> = {};
      const asignacionesTemporalesPorEvento: Record<string, Array<Record<string, unknown>>> = {};

      alumnosData.forEach((ac) => {
        const claseId = String(ac.clase_id || '');
        if (!alumnosPorClase[claseId]) alumnosPorClase[claseId] = [];
        alumnosPorClase[claseId].push({
          ...(ac.alumnos as Record<string, unknown>),
          _origen: ac.origen || 'interna',
          _tipo_asignacion: ac.tipo_asignacion || 'permanente',
          _evento_id: ac.evento_id || null,
        });
        if (!origenesPorClase[claseId]) origenesPorClase[claseId] = new Set();
        origenesPorClase[claseId].add((ac.origen as string) || 'interna');
        if (ac.evento_id && ac.tipo_asignacion === 'temporal') {
          const eventoId = String(ac.evento_id);
          if (!asignacionesTemporalesPorEvento[eventoId]) asignacionesTemporalesPorEvento[eventoId] = [];
          asignacionesTemporalesPorEvento[eventoId].push({
            ...(ac.alumnos as Record<string, unknown>),
            _origen: ac.origen || 'interna',
          });
        }
      });

      const asistenciasJustificadas: Record<string, Array<Record<string, unknown>>> = {};
      const asistenciasFaltas: Record<string, Array<Record<string, unknown>>> = {};
      (asistenciasData as Array<Record<string, unknown>> | null | undefined)?.forEach((a) => {
        const key = `${a.clase_id}|${a.fecha}`;
        if (a.estado === 'justificada' || a.estado === 'lesionado') {
          if (!asistenciasJustificadas[key]) asistenciasJustificadas[key] = [];
          asistenciasJustificadas[key].push(a.alumnos as Record<string, unknown>);
        } else if (a.estado === 'falta') {
          if (!asistenciasFaltas[key]) asistenciasFaltas[key] = [];
          asistenciasFaltas[key].push(a.alumnos as Record<string, unknown>);
        }
      });

      const { data: liberacionesData } = await supabase
        .from('liberaciones_plaza')
        .select('clase_id, alumno_id, fecha_inicio')
        .eq('estado', 'activa');
      const liberacionesPorEvento: Record<string, Set<string>> = {};
      liberacionesData?.forEach((l) => {
        const key = `${l.clase_id}|${l.fecha_inicio}`;
        if (!liberacionesPorEvento[key]) liberacionesPorEvento[key] = new Set();
        liberacionesPorEvento[key].add(l.alumno_id);
      });

      const eventosProcesados = ((eventosData as Array<Record<string, unknown>> | null) || []).map(
        (ev, index) => {
          const clases = (ev.clases || {}) as Record<string, unknown>;
          const start = new Date(`${ev.fecha}T${ev.hora_inicio}`);
          const end = new Date(`${ev.fecha}T${ev.hora_fin}`);
          const claseId = String(ev.clase_id || '');
          const eventoId = String(ev.id || '');
          const alumnosPermanentes = (alumnosPorClase[claseId] || [])
            .filter((a) => a._tipo_asignacion !== 'temporal')
            .map((a) => ({ id: a.id, nombre: a.nombre, _origen: a._origen }));
          const alumnosTemporales = (asignacionesTemporalesPorEvento[eventoId] || []).map((a) => ({
            id: a.id,
            nombre: a.nombre,
            _origen: a._origen,
          }));
          const alumnosAsignados = [...alumnosPermanentes, ...alumnosTemporales];
          const origenes = origenesPorClase[claseId] ? Array.from(origenesPorClase[claseId]) : [];
          const esMixta = origenes.includes('escuela') && origenes.includes('interna');
          const esModificadoIndividualmente = ev.modificado_individualmente === true;
          const colorClass = getClassColors(
            clases,
            ev.estado === 'cancelada',
            esMixta,
            esModificadoIndividualmente
          );
          const keyAsistencia = `${claseId}|${ev.fecha}`;
          const alumnosJustificados = asistenciasJustificadas[keyAsistencia] || [];
          const alumnosConFalta = asistenciasFaltas[keyAsistencia] || [];
          const esParticular = clases.tipo_clase === 'particular';
          const maxAlumnos = esParticular ? 1 : 4;
          const liberadosIds = liberacionesPorEvento[keyAsistencia] || new Set<string>();
          const justificadosIds = new Set(alumnosJustificados.map((j) => String(j.id)));
          const faltasIds = new Set(alumnosConFalta.map((f) => String(f.id)));
          const alumnosPresentes = Math.max(
            0,
            alumnosAsignados.length - liberadosIds.size - justificadosIds.size - faltasIds.size
          );
          const huecosReales = Math.max(0, maxAlumnos - alumnosPresentes);
          const extraClass = ev.excluir_alquiler === true ? ' bg-amber-200 !text-gray-900 border border-amber-400' : '';

          if (
            index < 5 &&
            (alumnosJustificados.length > 0 || alumnosConFalta.length > 0 || alumnosPresentes > maxAlumnos || huecosReales > 0)
          ) {
            // conserva trazas útiles de depuración
          }

          return {
            id: ev.id,
            title: `${clases.nombre} (${clases.nivel_clase})`,
            subtitle: clases.profesor,
            start,
            end,
            allDay: false,
            resource: ev,
            alumnosAsignados,
            alumnosJustificados,
            huecosReales,
            huecosDisponibles: huecosReales,
            alumnosPresentes,
            className: `${String(colorClass.className)}${extraClass}`.trim(),
            esMixta,
            excluirAlquiler: ev.excluir_alquiler === true,
          };
        }
      );

      setEventos(eventosProcesados);
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const cancelFrame = scheduleEffectWork(() => {
      void cargarEventos();
    });
    return () => {
      cancelFrame();
      isMountedRef.current = false;
    };
  }, [cargarEventos, refresh]);

  return { eventos, loading };
}


