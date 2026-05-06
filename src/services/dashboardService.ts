import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';
import { obtenerRangoSemanaISO } from '../utils/dateUtils';
import type { Tables } from '../types/supabase';

type Alumno = Tables<'alumnos'>;
type Pago = Tables<'pagos'> & { alumnos?: { nombre: string | null } | null };
type Clase = Tables<'clases'>;
type Asignacion = Pick<Tables<'alumnos_clases'>, 'clase_id'>;
type Evento = Tables<'eventos_clase'>;
type Asistencia = Tables<'asistencias'> & {
  alumnos?: { nombre: string | null } | null;
};
type Profesor = Tables<'profesores'>;

interface StatsResult {
  stats: Record<string, unknown> | null;
  error: PostgrestError | Error | null;
}

interface EventosResult {
  data: Evento[] | null;
  error: PostgrestError | Error | null;
}

interface ClaseIncompleta {
  id: string;
  nombre: string | null;
  nivel_clase: string | null;
  dia_semana: string | null;
  tipo_clase: string | null;
  fecha: string | null;
  alumnosAsignados: number;
  alumnosDisponibles: number;
  liberacionesActivas: number;
  eventoId: string;
}

interface HuecoFalta {
  eventoId: string;
  claseId: string | null;
  nombre: string;
  nivel_clase: string | null;
  dia_semana: string | null;
  tipo_clase: string | null;
  fecha: string | null;
  cantidadHuecos: number;
  alumnosConFaltas: Array<{
    id: string | null;
    nombre: string;
    estado: string | null;
    derechoRecuperacion: boolean;
  }>;
  tieneFaltas: boolean;
}

const toDateTime = (value: string | null): number =>
  value ? new Date(value).getTime() : 0;

export const dashboardService = {
  async cargarStats({ periodo = 'mes' }: { periodo?: 'mes' | 'anio' } = {}): Promise<StatsResult> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString().split('T')[0];

      const finAsistencias = new Date();
      finAsistencias.setDate(finAsistencias.getDate() + 30);
      finAsistencias.setHours(23, 59, 59, 999);
      const finAsistenciasISO = finAsistencias.toISOString().split('T')[0];

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
          .in('estado', ['justificada', 'falta', 'lesionado'])
          .gte('fecha', hoyISO)
          .lte('fecha', finAsistenciasISO),
        supabase.from('profesores').select('*'),
      ]);

      const errores = [
        alumnosRes.error,
        pagosRes.error,
        clasesRes.error,
        asignadosRes.error,
        eventosRes.error,
        asistenciasRes.error,
        profesoresRes.error,
      ];
      if (errores.some((error) => Boolean(error))) throw new Error('Error en alguna de las consultas');

      const stats = await dashboardService.procesarStats({
        alumnos: (alumnosRes.data as Alumno[] | null) || [],
        pagos: (pagosRes.data as Pago[] | null) || [],
        clases: (clasesRes.data as Clase[] | null) || [],
        asignaciones: (asignadosRes.data as Asignacion[] | null) || [],
        eventos: eventosRes.data || [],
        asistencias: (asistenciasRes.data as Asistencia[] | null) || [],
        profesores: (profesoresRes.data as Profesor[] | null) || [],
        hoy,
        periodo,
      });

      return { stats, error: null };
    } catch (error) {
      console.error('Error cargando stats del dashboard:', error);
      return { stats: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async getEventosSemanaActual(): Promise<EventosResult> {
    try {
      const { lunes, domingo } = obtenerRangoSemanaISO();
      const { data, error } = await supabase
        .from('eventos_clase')
        .select(
          `
          id, fecha, hora_inicio, estado, clase_id,
          clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
        `
        )
        .or('estado.is.null,estado.neq.eliminado')
        .gte('fecha', lunes)
        .lte('fecha', domingo);
      return { data: (data as Evento[] | null) || [], error };
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Error desconocido') };
    }
  },

  async procesarStats({
    alumnos,
    pagos,
    clases,
    asignaciones,
    eventos,
    asistencias,
    profesores,
    hoy,
    periodo,
  }: {
    alumnos: Alumno[];
    pagos: Pago[];
    clases: Clase[];
    asignaciones: Asignacion[];
    eventos: Evento[];
    asistencias: Asistencia[];
    profesores: Profesor[];
    hoy: Date;
    periodo: 'mes' | 'anio';
  }): Promise<Record<string, unknown>> {
    const year = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;
    const pagosValidos = pagos.filter((p) => Boolean(p.mes_cubierto) && Boolean(p.cantidad));

    const calcularIngresosPeriodo = (anyo: number, tipoPeriodo: 'mes' | 'anio'): number => {
      if (tipoPeriodo === 'anio') {
        const prefijo = `${anyo}-`;
        return pagosValidos
          .filter((p) => String(p.mes_cubierto).startsWith(prefijo))
          .reduce((acc, p) => acc + (p.cantidad || 0), 0);
      }
      const mesClave = `${anyo}-${String(mes).padStart(2, '0')}`;
      return pagosValidos
        .filter((p) => p.mes_cubierto === mesClave)
        .reduce((acc, p) => acc + (p.cantidad || 0), 0);
    };

    const ingresosPeriodoActual = calcularIngresosPeriodo(year, periodo);
    const ingresosPeriodoAnterior = calcularIngresosPeriodo(year - 1, periodo);

    const ultimosPagos = pagos
      .sort((a, b) => toDateTime(b.fecha_pago) - toDateTime(a.fecha_pago))
      .slice(0, 5)
      .map((p) => ({
        alumno: p.alumnos?.nombre || 'Alumno eliminado',
        cantidad: p.cantidad,
        mes: p.mes_cubierto,
        fecha: p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : '',
      }));

    const asignacionesMap: Record<string, number> = {};
    asignaciones.forEach((ac) => {
      if (!ac.clase_id) return;
      asignacionesMap[ac.clase_id] = (asignacionesMap[ac.clase_id] || 0) + 1;
    });

    const { clasesIncompletas, huecosPorFaltas } = await dashboardService.procesarClasesYHuecos({
      eventos,
      clases,
      asignacionesMap,
      asistencias,
      hoy,
    });

    const { count: alumnosConDeuda } = await calcularAlumnosConDeuda(alumnos, pagos, false);
    const profesoresActivos = profesores.filter((p) => p.activo).length;
    const clasesPorProfesor: Record<string, number> = {};
    clases.forEach((clase) => {
      if (!clase.profesor) return;
      clasesPorProfesor[clase.profesor] = (clasesPorProfesor[clase.profesor] || 0) + 1;
    });

    return {
      totalAlumnos: alumnos.length,
      ingresosMes: ingresosPeriodoActual,
      ingresosPeriodoActual,
      ingresosPeriodoAnterior,
      clasesEstaSemana: eventos.length,
      ultimosPagos,
      clasesIncompletas,
      alumnosConDeuda,
      huecosPorFaltas,
      totalHuecosPorFaltas: huecosPorFaltas.reduce((acc, h) => acc + h.cantidadHuecos, 0),
      totalProfesores: profesores.length,
      profesoresActivos,
      clasesPorProfesor,
    };
  },

  async procesarClasesYHuecos({
    eventos,
    clases,
    asignacionesMap,
    asistencias,
    hoy,
  }: {
    eventos: Evento[];
    clases: Clase[];
    asignacionesMap: Record<string, number>;
    asistencias: Asistencia[];
    hoy: Date;
  }): Promise<{ clasesIncompletas: ClaseIncompleta[]; huecosPorFaltas: HuecoFalta[] }> {
    const hoyISO = hoy.toISOString().split('T')[0];
    const { data: liberacionesData } = await supabase
      .from('liberaciones_plaza')
      .select('clase_id, alumno_id, fecha_inicio, fecha_fin')
      .eq('estado', 'activa')
      .lte('fecha_inicio', hoyISO)
      .gte('fecha_fin', hoyISO);

    const liberacionesPorClase: Record<string, number> = {};
    (liberacionesData || []).forEach((l) => {
      liberacionesPorClase[l.clase_id] = (liberacionesPorClase[l.clase_id] || 0) + 1;
    });

    const eventosIncompletos: ClaseIncompleta[] = eventos
      .filter((evento) => {
        const fechaEvento = evento.fecha ? new Date(evento.fecha) : new Date(0);
        fechaEvento.setHours(0, 0, 0, 0);
        if (fechaEvento < hoy) return false;
        if (evento.estado === 'cancelada') return false;
        const clase = clases.find((c) => c.id === evento.clase_id);
        if (!clase) return false;
        const alumnosAsignados = asignacionesMap[clase.id] || 0;
        const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
        const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);
        const esParticular =
          clase.nombre?.toLowerCase().includes('particular') || clase.tipo_clase === 'particular';
        const maxAlumnos = esParticular ? 1 : 4;
        return alumnosDisponibles < maxAlumnos;
      })
      .map((evento) => {
        const clase = clases.find((c) => c.id === evento.clase_id)!;
        const alumnosAsignados = asignacionesMap[clase.id] || 0;
        const liberacionesActivas = liberacionesPorClase[clase.id] || 0;
        const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);
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

    const faltasPorEvento = new Map<string, Asistencia[]>();
    asistencias.forEach((a) => {
      const key = `${a.clase_id}|${a.fecha}`;
      if (!faltasPorEvento.has(key)) faltasPorEvento.set(key, []);
      faltasPorEvento.get(key)?.push(a);
    });

    const huecosPorFaltas: HuecoFalta[] = eventos
      .filter((evento) => {
        const fechaEvento = evento.fecha ? new Date(evento.fecha) : new Date(0);
        const hoy2 = new Date();
        hoy2.setHours(0, 0, 0, 0);
        return fechaEvento >= hoy2 && evento.estado !== 'cancelada';
      })
      .map((evento) => {
        const key = `${evento.clase_id}|${evento.fecha}`;
        const faltas = faltasPorEvento.get(key) || [];
        const clase = clases.find((c) => c.id === evento.clase_id);
        const esParticular = clase?.tipo_clase === 'particular';
        const maxAlumnos = esParticular ? 1 : 4;
        const alumnosAsignados = asignacionesMap[evento.clase_id || ''] || 0;
        const liberacionesActivas = liberacionesPorClase[evento.clase_id || ''] || 0;
        const alumnosDisponibles = Math.max(0, alumnosAsignados - liberacionesActivas);
        const huecosReales = Math.max(0, maxAlumnos - alumnosDisponibles);
        return {
          eventoId: evento.id,
          claseId: evento.clase_id,
          nombre: clase?.nombre || 'Clase',
          nivel_clase: clase?.nivel_clase || null,
          dia_semana: clase?.dia_semana || null,
          tipo_clase: clase?.tipo_clase || null,
          fecha: evento.fecha,
          cantidadHuecos: huecosReales,
          alumnosConFaltas: faltas.map((f) => ({
            id: f.alumno_id,
            nombre: f.alumnos?.nombre || 'Alumno',
            estado: f.estado,
            derechoRecuperacion: f.estado === 'justificada',
          })),
          tieneFaltas: faltas.length > 0,
        };
      })
      .filter((item) => item.cantidadHuecos > 0)
      .sort((a, b) => toDateTime(a.fecha) - toDateTime(b.fecha));

    return { clasesIncompletas: eventosIncompletos, huecosPorFaltas };
  },
};
