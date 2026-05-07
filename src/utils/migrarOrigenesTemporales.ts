import { supabase } from '../lib/supabase';
import { obtenerOrigenMasComun } from './origenUtils';

export interface MigracionOrigenesResultadoOk {
  success: true;
  actualizadas: number;
  sinCambio: number;
  conPermanentes: number;
  sinPermanentes: number;
  total: number;
  mensaje?: string;
}

export interface MigracionOrigenesResultadoError {
  success: false;
  error: string;
}

export type MigracionOrigenesResultado =
  | MigracionOrigenesResultadoOk
  | MigracionOrigenesResultadoError;

interface AsignacionTemporalRow {
  id: string;
  alumno_id: string;
  origen?: string | null;
  clases: { nombre?: string | null } | null;
}

interface AlumnoMin {
  id: string;
  nombre?: string | null;
}

interface AsignacionPermRow {
  alumno_id: string;
  origen?: string | null;
}

export async function migrarOrigenesAsignacionesTemporales(): Promise<MigracionOrigenesResultado> {
  try {
    const { data: asignacionesTemporales, error: errorTemp } = await supabase
      .from('alumnos_clases')
      .select('id, alumno_id, origen, clases!inner(nombre)')
      .eq('tipo_asignacion', 'temporal');

    if (errorTemp) throw errorTemp;

    if (!asignacionesTemporales || asignacionesTemporales.length === 0) {
      return {
        success: true,
        actualizadas: 0,
        sinCambio: 0,
        conPermanentes: 0,
        sinPermanentes: 0,
        total: 0,
        mensaje: 'No hay asignaciones temporales para migrar',
      };
    }

    const rows = asignacionesTemporales as AsignacionTemporalRow[];

    const alumnosIds = [...new Set(rows.map(a => a.alumno_id))];
    const { data: alumnos, error: errorAlumnos } = await supabase
      .from('alumnos')
      .select('id, nombre')
      .in('id', alumnosIds);

    if (errorAlumnos) throw errorAlumnos;
    const alumnosMap = new Map(
      (alumnos as AlumnoMin[] | null)?.map(a => [a.id, a]) ?? []
    );

    const { data: asignacionesPermanentes, error: errorPerm } = await supabase
      .from('alumnos_clases')
      .select('alumno_id, origen')
      .in('alumno_id', alumnosIds)
      .or('tipo_asignacion.is.null,tipo_asignacion.eq.permanente');

    if (errorPerm) throw errorPerm;

    const origenPorAlumno: Record<string, string[]> = {};
    (asignacionesPermanentes as AsignacionPermRow[] | null)?.forEach(ap => {
      if (!origenPorAlumno[ap.alumno_id]) {
        origenPorAlumno[ap.alumno_id] = [];
      }
      if (ap.origen) {
        origenPorAlumno[ap.alumno_id].push(ap.origen);
      }
    });

    const alumnosSinPermanentes = new Map<
      string,
      { alumno: AlumnoMin | undefined; asignaciones: AsignacionTemporalRow[] }
    >();

    rows.forEach(at => {
      const origenesAlumno = origenPorAlumno[at.alumno_id] ?? [];
      const origenPermanente = obtenerOrigenMasComun(origenesAlumno);

      if (origenPermanente === null) {
        if (!alumnosSinPermanentes.has(at.alumno_id)) {
          alumnosSinPermanentes.set(at.alumno_id, {
            alumno: alumnosMap.get(at.alumno_id),
            asignaciones: [],
          });
        }
        alumnosSinPermanentes.get(at.alumno_id)!.asignaciones.push(at);
      }
    });

    let origenParaSinPermanentes: 'escuela' | 'interna' | null = null;

    if (alumnosSinPermanentes.size > 0) {
      const listaAlumnos = Array.from(alumnosSinPermanentes.values())
        .map(
          item =>
            `  • ${item.alumno?.nombre ?? 'Desconocido'} (${item.asignaciones.length} asignación temporal)`
        )
        .join('\n');

      const respuesta = window.confirm(
        `⚠️ Se encontraron ${alumnosSinPermanentes.size} alumno(s) que solo tienen asignaciones temporales:\n\n` +
          `${listaAlumnos}\n\n` +
          `¿Estos alumnos deben generar pago pendiente?\n\n` +
          `• SÍ = Origen "Escuela" (requiere pago)\n` +
          `• NO = Origen "Interna" (sin pago)`
      );

      origenParaSinPermanentes = respuesta ? 'escuela' : 'interna';
    }

    let actualizadas = 0;
    let sinCambio = 0;
    let conPermanentes = 0;
    let sinPermanentes = 0;

    for (const asignacionTemp of rows) {
      const origenesAlumno = origenPorAlumno[asignacionTemp.alumno_id] ?? [];
      const origenPermanente = obtenerOrigenMasComun(origenesAlumno);

      let nuevoOrigen: string;

      if (origenPermanente === null) {
        nuevoOrigen =
          origenParaSinPermanentes ?? asignacionTemp.origen ?? 'escuela';
        sinPermanentes++;
      } else {
        nuevoOrigen = origenPermanente;
        conPermanentes++;
      }

      if (asignacionTemp.origen !== nuevoOrigen) {
        const { error: updateError } = await supabase
          .from('alumnos_clases')
          .update({ origen: nuevoOrigen })
          .eq('id', asignacionTemp.id);

        if (updateError) {
          console.error(
            `❌ Error actualizando asignación ${asignacionTemp.id}:`,
            updateError
          );
        } else {
          actualizadas++;
        }
      } else {
        sinCambio++;
      }
    }

    return {
      success: true,
      actualizadas,
      sinCambio,
      conPermanentes,
      sinPermanentes,
      total: rows.length,
    };
  } catch (error: unknown) {
    console.error('❌ Error en migración:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}
