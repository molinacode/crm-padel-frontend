import { supabase } from '../lib/supabase';
import { obtenerOrigenMasComun } from './origenUtils';

export async function migrarOrigenesAsignacionesTemporales() {
  try {
    // 1. Obtener todas las asignaciones temporales
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
        mensaje: 'No hay asignaciones temporales para migrar'
      };
    }

    // 2. Obtener información de alumnos
    const alumnosIds = [...new Set(asignacionesTemporales.map(a => a.alumno_id))];
    const { data: alumnos, error: errorAlumnos } = await supabase
      .from('alumnos')
      .select('id, nombre')
      .in('id', alumnosIds);

    if (errorAlumnos) throw errorAlumnos;
    const alumnosMap = new Map(alumnos.map(a => [a.id, a]));

    // 3. Obtener asignaciones permanentes
    const { data: asignacionesPermanentes, error: errorPerm } = await supabase
      .from('alumnos_clases')
      .select('alumno_id, origen')
      .in('alumno_id', alumnosIds)
      .or('tipo_asignacion.is.null,tipo_asignacion.eq.permanente');

    if (errorPerm) throw errorPerm;

    // 4. Crear mapa de origen por alumno
    const origenPorAlumno = {};
    asignacionesPermanentes.forEach(ap => {
      if (!origenPorAlumno[ap.alumno_id]) {
        origenPorAlumno[ap.alumno_id] = [];
      }
      if (ap.origen) {
        origenPorAlumno[ap.alumno_id].push(ap.origen);
      }
    });

    // 5. Usar función de utilidad para obtener origen más común

    // 6. Agrupar asignaciones temporales por alumno (sin permanentes)
    const alumnosSinPermanentes = new Map();
    
    asignacionesTemporales.forEach(at => {
      const origenesAlumno = origenPorAlumno[at.alumno_id] || [];
      const origenPermanente = obtenerOrigenMasComun(origenesAlumno);
      
      if (origenPermanente === null) {
        if (!alumnosSinPermanentes.has(at.alumno_id)) {
          alumnosSinPermanentes.set(at.alumno_id, {
            alumno: alumnosMap.get(at.alumno_id),
            asignaciones: []
          });
        }
        alumnosSinPermanentes.get(at.alumno_id).asignaciones.push(at);
      }
    });

    // 7. Si hay alumnos sin permanentes, preguntar al usuario
    let origenParaSinPermanentes = null;
    
    if (alumnosSinPermanentes.size > 0) {
      const listaAlumnos = Array.from(alumnosSinPermanentes.values())
        .map(item => `  • ${item.alumno?.nombre || 'Desconocido'} (${item.asignaciones.length} asignación temporal)`)
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

    // 8. Actualizar asignaciones temporales
    let actualizadas = 0;
    let sinCambio = 0;
    let conPermanentes = 0;
    let sinPermanentes = 0;

    for (const asignacionTemp of asignacionesTemporales) {
      const origenesAlumno = origenPorAlumno[asignacionTemp.alumno_id] || [];
      const origenPermanente = obtenerOrigenMasComun(origenesAlumno);
      
      let nuevoOrigen;
      
      if (origenPermanente === null) {
        nuevoOrigen = origenParaSinPermanentes || asignacionTemp.origen;
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
          console.error(`❌ Error actualizando asignación ${asignacionTemp.id}:`, updateError);
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
      total: asignacionesTemporales.length
    };
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return { success: false, error: error.message };
  }
}

