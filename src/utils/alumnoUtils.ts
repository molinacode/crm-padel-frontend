/**
 * Utilidades para trabajar con alumnos
 */
import { supabase } from '../lib/supabase';

export interface AlumnoActivoFields {
  activo?: boolean | null;
  fecha_baja?: string | Date | null;
}

export function esAlumnoActivo(
  alumno: AlumnoActivoFields | null | undefined,
  fechaConsulta: Date | string = new Date()
): boolean {
  if (!alumno) return false;

  if (alumno.activo === false) {
    return false;
  }

  if (!alumno.fecha_baja) {
    return (
      alumno.activo === true ||
      alumno.activo === null ||
      alumno.activo === undefined
    );
  }

  const fechaBaja =
    alumno.fecha_baja instanceof Date
      ? alumno.fecha_baja
      : new Date(alumno.fecha_baja);

  const fecha =
    fechaConsulta instanceof Date
      ? fechaConsulta
      : new Date(fechaConsulta);

  fechaBaja.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);

  return fecha < fechaBaja;
}

export function filtrarAlumnosActivos<T extends AlumnoActivoFields>(
  alumnos: T[] | null | undefined,
  fechaConsulta: Date | string = new Date()
): T[] {
  if (!Array.isArray(alumnos)) return [];
  return alumnos.filter(alumno => esAlumnoActivo(alumno, fechaConsulta));
}

/** @deprecated Usar filtrarAlumnosActivos en el cliente después de obtener los datos */
export function getQueryAlumnosActivos(
  _fechaConsulta: Date | string = new Date()
): (query: { or: (s: string) => unknown }) => unknown {
  return query => query.or('activo.eq.true,activo.is.null');
}

export function formatearFechaBaja(
  fechaBaja: string | Date | null | undefined
): string | null {
  if (!fechaBaja) return null;

  const fecha =
    fechaBaja instanceof Date ? fechaBaja : new Date(fechaBaja);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface DisponibilidadHorario {
  hora_inicio?: string;
  hora_fin?: string;
}

export interface DisponibilidadAlumno {
  dias?: string[];
  horarios?: DisponibilidadHorario[];
}

export interface AlumnoConDisponibilidad extends AlumnoActivoFields {
  id: string;
  nombre?: string | null;
  nivel?: string | null;
  disponibilidad?: DisponibilidadAlumno | null;
}

export interface SugerenciaHorario {
  dia: string;
  hora_inicio?: string;
  hora_fin?: string;
  alumnos_compatibles: number;
}

export async function obtenerSugerenciasHorarios(
  nivel: string | null | undefined
): Promise<SugerenciaHorario[]> {
  if (!nivel) return [];

  try {
    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select('id, nombre, nivel, disponibilidad, activo, fecha_baja')
      .or('activo.eq.true,activo.is.null')
      .eq('nivel', nivel);

    if (error) {
      console.error('Error obteniendo alumnos:', error);
      return [];
    }

    const alumnosActivos = filtrarAlumnosActivos(
      (alumnos ?? []) as AlumnoConDisponibilidad[],
      new Date()
    );

    if (alumnosActivos.length === 0) return [];

    const horariosComunes: Record<string, SugerenciaHorario> = {};

    alumnosActivos.forEach(alumno => {
      const disponibilidad = alumno.disponibilidad ?? {};
      const dias = disponibilidad.dias ?? [];
      const horarios = disponibilidad.horarios ?? [];

      dias.forEach(dia => {
        horarios.forEach(horario => {
          const key = `${dia}_${horario.hora_inicio}_${horario.hora_fin}`;

          if (!horariosComunes[key]) {
            horariosComunes[key] = {
              dia,
              hora_inicio: horario.hora_inicio,
              hora_fin: horario.hora_fin,
              alumnos_compatibles: 0,
            };
          }

          horariosComunes[key].alumnos_compatibles++;
        });
      });
    });

    return Object.values(horariosComunes).sort(
      (a, b) => b.alumnos_compatibles - a.alumnos_compatibles
    );
  } catch (error) {
    console.error('Error obteniendo sugerencias de horarios:', error);
    return [];
  }
}
