import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getClassColors } from '../utils/getClassColors';

export function useEventosData(refresh) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(true);

  const cargarEventos = useCallback(async () => {
    try {
      console.log('🔄 Cargando eventos...');

      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select(
          `
            *,
            clases (*)
          `
        )
        .order('fecha', { ascending: true });

      if (eventosError) {
        console.error('Error cargando eventos:', eventosError);
        return;
      }

      if (!isMounted) return;

      console.log('📊 Eventos cargados:', eventosData?.length || 0);

      // Cargar alumnos asignados
      let alumnosData = [];
      let alumnosError = null;

      try {
        const alumnosRes = await supabase.from('alumnos_clases').select(`
              clase_id,
              alumno_id,
              origen,
              tipo_asignacion,
              evento_id,
              alumnos (id, nombre)
            `);

        if (alumnosRes.error && alumnosRes.error.code === '42703') {
          console.warn(
            '⚠️ Campo "origen" no existe en alumnos_clases, usando consulta sin origen'
          );
          const fallbackRes = await supabase.from('alumnos_clases').select(`
                clase_id,
                alumno_id,
                alumnos (id, nombre)
              `);
          alumnosData = fallbackRes.data || [];
          alumnosError = fallbackRes.error;
        } else {
          alumnosData = alumnosRes.data || [];
          alumnosError = alumnosRes.error;
        }
      } catch (err) {
        console.error('❌ Error cargando alumnos:', err);
        alumnosData = [];
        alumnosError = err;
      }

      const asistenciasRes = await supabase
        .from('asistencias')
        .select(
          `
            alumno_id,
            clase_id,
            fecha,
            estado,
            alumnos (id, nombre)
          `
        )
        .eq('estado', 'justificada');

      const { data: asistenciasData, error: asistenciasError } = asistenciasRes;

      if (alumnosError) {
        console.error('Error cargando alumnos:', alumnosError);
        return;
      }

      if (asistenciasError) {
        console.error('Error cargando asistencias:', asistenciasError);
      }

      if (!isMounted) return;

      // Crear mapa de alumnos por clase y orígenes por clase
      const alumnosPorClase = {};
      const origenesPorClase = {};
      const asignacionesTemporalesPorEvento = {};

      if (alumnosData) {
        alumnosData.forEach(ac => {
          if (!alumnosPorClase[ac.clase_id]) {
            alumnosPorClase[ac.clase_id] = [];
          }
          alumnosPorClase[ac.clase_id].push({
            ...ac.alumnos,
            _origen: ac.origen || 'interna',
            _tipo_asignacion: ac.tipo_asignacion || 'permanente',
            _evento_id: ac.evento_id || null,
          });

          if (!origenesPorClase[ac.clase_id])
            origenesPorClase[ac.clase_id] = new Set();
          if (ac.origen) {
            origenesPorClase[ac.clase_id].add(ac.origen);
          } else {
            origenesPorClase[ac.clase_id].add('interna');
          }

          if (ac.evento_id && ac.tipo_asignacion === 'temporal') {
            if (!asignacionesTemporalesPorEvento[ac.evento_id]) {
              asignacionesTemporalesPorEvento[ac.evento_id] = [];
            }
            asignacionesTemporalesPorEvento[ac.evento_id].push({
              ...ac.alumnos,
              _origen: ac.origen || 'interna',
            });
          }
        });
      }

      // Crear mapa de asistencias justificadas
      const asistenciasJustificadas = {};
      if (asistenciasData) {
        asistenciasData.forEach(a => {
          const key = `${a.clase_id}|${a.fecha}`;
          if (!asistenciasJustificadas[key]) {
            asistenciasJustificadas[key] = [];
          }
          asistenciasJustificadas[key].push(a.alumnos);
        });
      }

      // Obtener liberaciones de plaza activas
      const { data: liberacionesData, error: liberacionesError } =
        await supabase
          .from('liberaciones_plaza')
          .select('clase_id, alumno_id, fecha_inicio')
          .eq('estado', 'activa');

      if (liberacionesError) {
        console.error('Error obteniendo liberaciones:', liberacionesError);
      }

      // Crear mapa de liberaciones por evento
      const liberacionesPorEvento = {};
      liberacionesData?.forEach(liberacion => {
        const key = `${liberacion.clase_id}|${liberacion.fecha_inicio}`;
        if (!liberacionesPorEvento[key]) {
          liberacionesPorEvento[key] = new Set();
        }
        liberacionesPorEvento[key].add(liberacion.alumno_id);
      });

      // Procesar eventos
      const eventosProcesados = (eventosData || []).map((ev, index) => {
        const start = new Date(ev.fecha + 'T' + ev.hora_inicio);
        const end = new Date(ev.fecha + 'T' + ev.hora_fin);

        // Obtener alumnos asignados permanentemente
        const alumnosPermanentes = (alumnosPorClase[ev.clase_id] || [])
          .filter(a => a._tipo_asignacion !== 'temporal')
          .map(a => ({ id: a.id, nombre: a.nombre, _origen: a._origen }));

        // Obtener alumnos asignados temporalmente a este evento
        const alumnosTemporales = (
          asignacionesTemporalesPorEvento[ev.id] || []
        ).map(a => ({ id: a.id, nombre: a.nombre, _origen: a._origen }));

        // Combinar ambos grupos
        const alumnosAsignados = [...alumnosPermanentes, ...alumnosTemporales];

        // Determinar si es clase mixta
        const origenes = origenesPorClase[ev.clase_id]
          ? Array.from(origenesPorClase[ev.clase_id])
          : [];
        const esMixta =
          origenes.includes('escuela') && origenes.includes('interna');
        const esModificadoIndividualmente =
          ev.modificado_individualmente === true || false;
        const colorClass = getClassColors(
          ev.clases,
          ev.estado === 'cancelada',
          esMixta,
          esModificadoIndividualmente
        );

        // Obtener alumnos con falta justificada
        const fechaEvento = ev.fecha;
        const keyJustificadas = `${ev.clase_id}|${fechaEvento}`;
        const alumnosJustificados =
          asistenciasJustificadas[keyJustificadas] || [];

        // Calcular huecos reales disponibles
        const esParticular = ev.clases.tipo_clase === 'particular';
        const maxAlumnos = esParticular ? 1 : 4;
        const liberadosIds =
          liberacionesPorEvento[keyJustificadas] || new Set();

        const justificadosIds = new Set(alumnosJustificados.map(j => j.id));
        const alumnosPresentes = Math.max(
          0,
          alumnosAsignados.length - liberadosIds.size - justificadosIds.size
        );

        const huecosReales = Math.max(0, maxAlumnos - alumnosPresentes);

        const huecosDisponibles = Math.max(
          Math.min(alumnosJustificados.length, huecosReales),
          huecosReales > 0 ? huecosReales : 0
        );

        const alumnosJustificadosConHuecos = alumnosJustificados;

        // Debug para primeras 5 clases
        if (
          index < 5 &&
          (alumnosJustificados.length > 0 ||
            alumnosPresentes > maxAlumnos ||
            huecosReales > 0)
        ) {
          console.log(
            `🔍 Clase "${ev.clases.nombre}" (${fechaEvento}): ${alumnosAsignados.length} asignados, ${alumnosPresentes} presentes, ${huecosReales} huecos reales, ${alumnosJustificados.length} justificados, ${huecosDisponibles} huecos disponibles`
          );
        }

        const excluirAlquiler = ev.excluir_alquiler === true;

        // Si está marcado como "sin alquiler", añadir una clase destacada
        const extraClass = excluirAlquiler
          ? ' bg-amber-200 !text-gray-900 border border-amber-400'
          : '';

        return {
          id: ev.id,
          title: `${ev.clases.nombre} (${ev.clases.nivel_clase})`,
          subtitle: ev.clases.profesor,
          start,
          end,
          allDay: false,
          resource: ev,
          alumnosAsignados,
          alumnosJustificados: alumnosJustificadosConHuecos,
          huecosReales,
          huecosDisponibles,
          alumnosPresentes,
          className: `${colorClass.className}${extraClass}`.trim(),
          esMixta,
          excluirAlquiler,
        };
      });

      setEventos(eventosProcesados);
      console.log('✅ Eventos cargados:', eventosProcesados.length);
    } catch (error) {
      console.error('💥 Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  }, [isMounted]);

  useEffect(() => {
    setIsMounted(true);
    cargarEventos();

    return () => {
      setIsMounted(false);
    };
  }, [cargarEventos, refresh]);

  return { eventos, loading };
}
