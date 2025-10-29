import { supabase } from '../lib/supabase';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';
import { obtenerRangoSemanaISO, obtenerMesActual } from '../utils/dateUtils';

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
          .gte('fecha', hoyISO),
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
      const stats = dashboardService.procesarStats({
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
   * @returns {object} - Estadísticas procesadas
   */
  procesarStats({
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
        .filter(p => p.mes_cubierto === mesActual)
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

    // Calcular clases incompletas
    const { clasesIncompletas, huecosPorFaltas } =
      dashboardService.procesarClasesYHuecos({
        eventos,
        clases,
        asignacionesMap,
        asistencias,
        hoy,
      });

    // Calcular alumnos con deuda (async, se maneja por separado)
    const alumnosConDeuda = 0; // Se calcula después con calcularAlumnosConDeuda

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
  procesarClasesYHuecos({
    eventos,
    clases,
    asignacionesMap,
    asistencias,
    hoy,
  }) {
    // Esta lógica compleja se mantiene aquí centralizada
    // Para simplificar, retornamos arrays vacíos por ahora
    // La implementación completa estará en el componente

    return {
      clasesIncompletas: [],
      huecosPorFaltas: [],
    };
  },
};
