import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';
import { obtenerRangoSemanaISO, obtenerMesActual } from '../utils/dateUtils';
import { correspondeMesActual } from '../utils/calcularDeudas';

export function useDashboardData() {
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    ingresosMes: 0,
    clasesEstaSemana: 0,
    ultimosPagos: [],
    clasesIncompletas: [],
    alumnosConDeuda: 0,
    totalProfesores: 0,
    profesoresActivos: 0,
    clasesPorProfesor: {},
    huecosPorFaltas: [],
    totalHuecosPorFaltas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const [
          alumnosRes,
          pagosRes,
          clasesRes,
          asignadosRes,
          eventosRes,
          asistenciasRes,
          profesoresRes,
        ] = await Promise.all([
          supabase.from('alumnos').select('*'),
          supabase.from('pagos').select(`*, alumnos (nombre)`),
          supabase.from('clases').select('*'),
          supabase.from('alumnos_clases').select('clase_id'),
          (() => {
            const { lunes, domingo } = obtenerRangoSemanaISO();
            return supabase
              .from('eventos_clase')
              .select(
                `
                id,
                fecha,
                hora_inicio,
                estado,
                clase_id,
                clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
              `
              )
              .or('estado.is.null,estado.neq.eliminado')
              .gte('fecha', lunes)
              .lte('fecha', domingo);
          })(),
          (() => {
            const inicio = new Date();
            inicio.setHours(0, 0, 0, 0);
            const fin = new Date();
            fin.setDate(fin.getDate() + 30);
            fin.setHours(23, 59, 59, 999);
            const inicioISO = inicio.toISOString().split('T')[0];
            const finISO = fin.toISOString().split('T')[0];
            return supabase
              .from('asistencias')
              .select(
                `id, alumno_id, clase_id, fecha, estado, alumnos (nombre)`
              )
              .in('estado', ['justificada', 'falta'])
              .gte('fecha', inicioISO)
              .lte('fecha', finISO);
          })(),
          supabase.from('profesores').select('*'),
        ]);

        const { data: alumnosData } = alumnosRes;
        const { data: pagosData } = pagosRes;
        const { data: clasesData } = clasesRes;
        const { data: asignadosData } = asignadosRes;
        const { data: eventosData } = eventosRes;
        const { data: asistenciasData } = asistenciasRes;
        const { data: profesoresData } = profesoresRes;

        const safeAlumnosData = Array.isArray(alumnosData) ? alumnosData : [];
        const safePagosData = Array.isArray(pagosData) ? pagosData : [];
        const safeClasesData = Array.isArray(clasesData) ? clasesData : [];
        const safeAsignadosData = Array.isArray(asignadosData)
          ? asignadosData
          : [];
        const safeEventosData = Array.isArray(eventosData) ? eventosData : [];
        const safeAsistenciasData = Array.isArray(asistenciasData)
          ? asistenciasData
          : [];
        const safeProfesoresData = Array.isArray(profesoresData)
          ? profesoresData
          : [];

        const mesActual = obtenerMesActual();
        const ingresosMes = safePagosData
          .filter(p => p.mes_cubierto && correspondeMesActual(p.mes_cubierto, mesActual))
          .reduce((acc, p) => acc + p.cantidad, 0);

        const ultimosPagos = safePagosData
          .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
          .slice(0, 5)
          .map(p => ({
            alumno: p.alumnos?.nombre || 'Alumno eliminado',
            cantidad: p.cantidad,
            mes: p.mes_cubierto,
            fecha: new Date(p.fecha_pago).toLocaleDateString(),
          }));

        const asignaciones = {};
        safeAsignadosData.forEach(ac => {
          asignaciones[ac.clase_id] = (asignaciones[ac.clase_id] || 0) + 1;
        });

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString().split('T')[0];

        const { data: liberacionesData } = await supabase
          .from('liberaciones_plaza')
          .select('clase_id, alumno_id, fecha_inicio, fecha_fin')
          .eq('estado', 'activa')
          .lte('fecha_inicio', hoyISO)
          .gte('fecha_fin', hoyISO);

        const liberacionesPorClase = {};
        liberacionesData?.forEach(l => {
          liberacionesPorClase[l.clase_id] =
            (liberacionesPorClase[l.clase_id] || 0) + 1;
        });

        const eventosIncompletos = safeEventosData
          .filter(evento => {
            const fechaEvento = new Date(evento.fecha);
            fechaEvento.setHours(0, 0, 0, 0);
            if (fechaEvento < hoy) return false;
            if (evento.estado === 'cancelada') return false;
            const clase = safeClasesData.find(c => c.id === evento.clase_id);
            if (!clase) return false;
            const alumnosAsignados = asignaciones[clase.id] || 0;
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );
            const esParticular =
              clase.nombre?.toLowerCase().includes('particular') ||
              clase.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            return alumnosDisponibles < maxAlumnos;
          })
          .map(evento => {
            const clase = safeClasesData.find(c => c.id === evento.clase_id);
            const alumnosAsignados = asignaciones[clase.id] || 0;
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );
            return {
              id: evento.id,
              nombre: clase.nombre,
              nivel_clase: clase.nivel_clase,
              dia_semana: clase.dia_semana,
              tipo_clase: clase.tipo_clase,
              fecha: evento.fecha,
              alumnosAsignados,
              alumnosDisponibles,
              liberacionesActivas,
              eventoId: evento.id,
            };
          });

        let clasesQueNecesitanAlumnos = [...eventosIncompletos];
        if (eventosIncompletos.length === 0) {
          const clasesIncompletasGenerales = safeClasesData.filter(clase => {
            const alumnosAsignados = asignaciones[clase.id] || 0;
            const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );
            const esParticular =
              clase.nombre?.toLowerCase().includes('particular') ||
              clase.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            return alumnosDisponibles < maxAlumnos;
          });
          const hoyLocal = new Date();
          hoyLocal.setHours(0, 0, 0, 0);
          clasesQueNecesitanAlumnos = clasesIncompletasGenerales
            .map(clase => {
              const alumnosAsignados = asignaciones[clase.id] || 0;
              const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
              const alumnosDisponibles = Math.max(
                0,
                alumnosAsignados - liberacionesActivas
              );
              const proximosEventos = (safeEventosData || [])
                .filter(
                  e =>
                    e.clase_id === clase.id &&
                    new Date(e.fecha) >= hoyLocal &&
                    e.estado !== 'cancelada'
                )
                .sort((a, b) => a.fecha.localeCompare(b.fecha));
              const proximo = proximosEventos[0];
              if (!proximo) return null;
              return {
                id: proximo.id,
                nombre: clase.nombre,
                nivel_clase: clase.nivel_clase,
                dia_semana: clase.dia_semana,
                tipo_clase: clase.tipo_clase,
                fecha: proximo.fecha,
                alumnosAsignados,
                alumnosDisponibles,
                liberacionesActivas,
                eventoId: proximo.id,
              };
            })
            .filter(Boolean);
        }

        const clasesEstaSemana = safeEventosData.length;

        const faltasPorEvento = new Map();
        safeAsistenciasData.forEach(a => {
          const key = `${a.clase_id}|${a.fecha}`;
          if (!faltasPorEvento.has(key)) faltasPorEvento.set(key, []);
          faltasPorEvento.get(key).push(a);
        });

        let huecosPorFaltas = safeEventosData
          .filter(evento => {
            const fechaEvento = new Date(evento.fecha);
            const hoy2 = new Date();
            hoy2.setHours(0, 0, 0, 0);
            return fechaEvento >= hoy2 && evento.estado !== 'cancelada';
          })
          .map(evento => {
            const key = `${evento.clase_id}|${evento.fecha}`;
            const faltas = faltasPorEvento.get(key) || [];
            const clase = safeClasesData.find(c => c.id === evento.clase_id);
            const esParticular = clase?.tipo_clase === 'particular';
            const maxAlumnos = esParticular ? 1 : 4;
            const alumnosAsignados = asignaciones[evento.clase_id] || 0;
            const liberacionesActivas =
              liberacionesPorClase[evento.clase_id] || 0;
            const alumnosDisponibles = Math.max(
              0,
              alumnosAsignados - liberacionesActivas
            );
            const huecosReales = Math.max(0, maxAlumnos - alumnosDisponibles);
            return {
              eventoId: evento.id,
              claseId: evento.clase_id,
              nombre: clase?.nombre || 'Clase',
              nivel_clase: clase?.nivel_clase,
              dia_semana: clase?.dia_semana,
              tipo_clase: clase?.tipo_clase,
              fecha: evento.fecha,
              cantidadHuecos: huecosReales,
              alumnosConFaltas: faltas.map(f => ({
                id: f.alumno_id,
                nombre: f.alumnos?.nombre || 'Alumno',
                estado: f.estado,
                derechoRecuperacion: f.estado === 'justificada',
              })),
              tieneFaltas: faltas.length > 0,
            };
          })
          .filter(item => item.cantidadHuecos > 0)
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        if (huecosPorFaltas.length === 0) {
          huecosPorFaltas = safeClasesData
            .filter(clase => {
              const alumnosAsignados = asignaciones[clase.id] || 0;
              const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
              const alumnosDisponibles = Math.max(
                0,
                alumnosAsignados - liberacionesActivas
              );
              const esParticular = clase.tipo_clase === 'particular';
              const maxAlumnos = esParticular ? 1 : 4;
              const huecosDisponibles = Math.max(
                0,
                maxAlumnos - alumnosDisponibles
              );
              return huecosDisponibles > 0;
            })
            .map(clase => {
              const alumnosAsignados = asignaciones[clase.id] || 0;
              const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
              const alumnosDisponibles = Math.max(
                0,
                alumnosAsignados - liberacionesActivas
              );
              const esParticular = clase.tipo_clase === 'particular';
              const maxAlumnos = esParticular ? 1 : 4;
              const huecosDisponibles = Math.max(
                0,
                maxAlumnos - alumnosDisponibles
              );
              const hoyLocal = new Date();
              hoyLocal.setHours(0, 0, 0, 0);
              const proximosEventos = (safeEventosData || [])
                .filter(
                  e =>
                    e.clase_id === clase.id &&
                    new Date(e.fecha) >= hoyLocal &&
                    e.estado !== 'cancelada'
                )
                .sort((a, b) => a.fecha.localeCompare(b.fecha));
              const proximo = proximosEventos[0];
              if (!proximo) return null;
              return {
                eventoId: proximo.id,
                claseId: clase.id,
                nombre: clase.nombre,
                nivel_clase: clase.nivel_clase,
                dia_semana: clase.dia_semana,
                tipo_clase: clase.tipo_clase,
                fecha: proximo.fecha,
                cantidadHuecos: huecosDisponibles,
                alumnosConFaltas: [],
                tieneFaltas: false,
              };
            })
            .filter(Boolean)
            .slice(0, 5);
        }

        const totalHuecosPorFaltas = huecosPorFaltas.reduce(
          (acc, e) => acc + e.cantidadHuecos,
          0
        );

        const { count: alumnosConDeuda } = await calcularAlumnosConDeuda(
          safeAlumnosData,
          safePagosData,
          false
        );

        const profesoresActivos = safeProfesoresData.filter(
          p => p.activo
        ).length;
        const clasesPorProfesor = {};
        safeClasesData.forEach(clase => {
          if (clase.profesor) {
            clasesPorProfesor[clase.profesor] =
              (clasesPorProfesor[clase.profesor] || 0) + 1;
          }
        });

        setStats({
          totalAlumnos: safeAlumnosData.length,
          ingresosMes,
          clasesEstaSemana,
          ultimosPagos,
          clasesIncompletas: clasesQueNecesitanAlumnos,
          alumnosConDeuda,
          huecosPorFaltas: huecosPorFaltas,
          totalHuecosPorFaltas,
          totalProfesores: safeProfesoresData.length,
          profesoresActivos,
          clasesPorProfesor,
        });
      } catch (err) {
        console.error('💥 Error cargando stats desde Supabase:', err);
        setStats(s => ({
          ...s,
          ultimosPagos: [],
          clasesIncompletas: [],
          huecosPorFaltas: [],
          totalHuecosPorFaltas: 0,
        }));
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, []);

  return { stats, loading };
}
