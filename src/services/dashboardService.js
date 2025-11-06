import { supabase } from '../lib/supabase';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';
import { obtenerRangoSemanaISO, obtenerMesActual } from '../utils/dateUtils';
import { correspondeMesActual } from '../utils/calcularDeudas';

/**
 * Servicio para datos del Dashboard
 * Centraliza toda la lógica de negocio relacionada con el dashboard
 */

export const dashboardService = {
  /**
   * Cargar todas las estadísticas del dashboard
   * @returns {Promise<{stats, error}>}
   */
  async cargarStats() {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString().split('T')[0];

      // Rango para asistencias: desde hoy hasta 30 días adelante
      const finAsistencias = new Date();
      finAsistencias.setDate(finAsistencias.getDate() + 30);
      finAsistencias.setHours(23, 59, 59, 999);
      const finAsistenciasISO = finAsistencias.toISOString().split('T')[0];

      // Cargar todos los datos en paralelo
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
        dashboardService.getEventosSemanaActual(),
        supabase
          .from('asistencias')
          .select(`id, alumno_id, clase_id, fecha, estado, alumnos (nombre)`)
          .in('estado', ['justificada', 'falta'])
          .gte('fecha', hoyISO)
          .lte('fecha', finAsistenciasISO),
        supabase.from('profesores').select('*'),
      ]);

      // Verificar errores
      const errores = [
        alumnosRes.error,
        pagosRes.error,
        clasesRes.error,
        asignadosRes.error,
        eventosRes.error,
        asistenciasRes.error,
        profesoresRes.error,
      ];

      if (errores.some(error => error)) {
        throw new Error('Error en alguna de las consultas');
      }

      // Procesar datos
      const stats = await dashboardService.procesarStats({
        alumnos: alumnosRes.data || [],
        pagos: pagosRes.data || [],
        clases: clasesRes.data || [],
        asignaciones: asignadosRes.data || [],
        eventos: eventosRes.data || [],
        asistencias: asistenciasRes.data || [],
        profesores: profesoresRes.data || [],
        hoy,
      });

      return { stats, error: null };
    } catch (error) {
      console.error('Error cargando stats del dashboard:', error);
      return { stats: null, error };
    }
  },

  /**
   * Obtener eventos de la semana actual
   * @returns {Promise<{data, error}>}
   */
  async getEventosSemanaActual() {
    try {
      const { lunes, domingo } = obtenerRangoSemanaISO();

      const { data, error } = await supabase
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

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
      return { data: null, error };
    }
  },

  /**
   * Procesar estadísticas desde datos raw
   * @param {object} data - Datos raw de Supabase
   * @returns {Promise<object>} - Estadísticas procesadas
   */
  async procesarStats({
    alumnos,
    pagos,
    clases,
    asignaciones,
    eventos,
    asistencias,
    profesores,
    hoy,
  }) {
    const mesActual = obtenerMesActual();

    // Calcular ingresos del mes
    const ingresosMes =
      pagos
        .filter(
          p => p.mes_cubierto && correspondeMesActual(p.mes_cubierto, mesActual)
        )
        .reduce((acc, p) => acc + p.cantidad, 0) || 0;

    // Últimos pagos
    const ultimosPagos = pagos
      .sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
      .slice(0, 5)
      .map(p => ({
        alumno: p.alumnos?.nombre || 'Alumno eliminado',
        cantidad: p.cantidad,
        mes: p.mes_cubierto,
        fecha: new Date(p.fecha_pago).toLocaleDateString(),
      }));

    // Contar asignaciones por clase
    const asignacionesMap = {};
    asignaciones?.forEach(ac => {
      asignacionesMap[ac.clase_id] = (asignacionesMap[ac.clase_id] || 0) + 1;
    });

    // Calcular clases incompletas y huecos por faltas
    const { clasesIncompletas, huecosPorFaltas } =
      await dashboardService.procesarClasesYHuecos({
        eventos,
        clases,
        asignacionesMap,
        asistencias,
        hoy,
      });

    // Calcular alumnos con deuda
    const { count: alumnosConDeuda } = await calcularAlumnosConDeuda(
      alumnos,
      pagos,
      false
    );

    // Estadísticas de profesores
    const profesoresActivos = profesores.filter(p => p.activo).length;
    const clasesPorProfesor = {};
    clases.forEach(clase => {
      if (clase.profesor) {
        clasesPorProfesor[clase.profesor] =
          (clasesPorProfesor[clase.profesor] || 0) + 1;
      }
    });

    return {
      totalAlumnos: alumnos.length,
      ingresosMes,
      clasesEstaSemana: eventos.length,
      ultimosPagos,
      clasesIncompletas,
      alumnosConDeuda,
      huecosPorFaltas,
      totalHuecosPorFaltas:
        huecosPorFaltas.reduce((acc, h) => acc + h.cantidadHuecos, 0) || 0,
      totalProfesores: profesores.length,
      profesoresActivos,
      clasesPorProfesor,
    };
  },

  /**
   * Procesar clases incompletas y huecos por faltas
   */
  async procesarClasesYHuecos({
    eventos,
    clases,
    asignacionesMap,
    asistencias,
    hoy,
  }) {
    const hoyISO = hoy.toISOString().split('T')[0];

    // Cargar liberaciones activas
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

    // Procesar clases incompletas
    const eventosIncompletos = eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        fechaEvento.setHours(0, 0, 0, 0);
        if (fechaEvento < hoy) return false;
        if (evento.estado === 'cancelada') return false;
        const clase = clases.find(c => c.id === evento.clase_id);
        if (!clase) return false;
        const alumnosAsignados = asignacionesMap[clase.id] || 0;
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
        const clase = clases.find(c => c.id === evento.clase_id);
        const alumnosAsignados = asignacionesMap[clase.id] || 0;
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

    let clasesIncompletas = [...eventosIncompletos];
    if (eventosIncompletos.length === 0) {
      const clasesIncompletasGenerales = clases.filter(clase => {
        const alumnosAsignados = asignacionesMap[clase.id] || 0;
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
      clasesIncompletas = clasesIncompletasGenerales
        .map(clase => {
          const alumnosAsignados = asignacionesMap[clase.id] || 0;
          const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
          const alumnosDisponibles = Math.max(
            0,
            alumnosAsignados - liberacionesActivas
          );
          const proximosEventos = (eventos || [])
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

    // Procesar huecos por faltas
    const faltasPorEvento = new Map();
    asistencias?.forEach(a => {
      const key = `${a.clase_id}|${a.fecha}`;
      if (!faltasPorEvento.has(key)) faltasPorEvento.set(key, []);
      faltasPorEvento.get(key).push(a);
    });

    let huecosPorFaltas = eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.fecha);
        const hoy2 = new Date();
        hoy2.setHours(0, 0, 0, 0);
        return fechaEvento >= hoy2 && evento.estado !== 'cancelada';
      })
      .map(evento => {
        const key = `${evento.clase_id}|${evento.fecha}`;
        const faltas = faltasPorEvento.get(key) || [];
        const clase = clases.find(c => c.id === evento.clase_id);
        const esParticular = clase?.tipo_clase === 'particular';
        const maxAlumnos = esParticular ? 1 : 4;
        const alumnosAsignados = asignacionesMap[evento.clase_id] || 0;
        const liberacionesActivas = liberacionesPorClase[evento.clase_id] || 0;
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
      huecosPorFaltas = clases
        .filter(clase => {
          const alumnosAsignados = asignacionesMap[clase.id] || 0;
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
          const alumnosAsignados = asignacionesMap[clase.id] || 0;
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
          const proximosEventos = (eventos || [])
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

    return {
      clasesIncompletas,
      huecosPorFaltas,
    };
  },
};
