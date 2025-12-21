import { supabase } from '../lib/supabase';

/**
 * Servicio para gestionar liberaciones de plaza
 */
export const liberacionesService = {
  /**
   * Crear liberaciones de plaza para alumnos con faltas
   * @param {Array} asistenciasData - Array de asistencias con faltas
   * @param {Array} eventosData - Array de eventos futuros
   * @returns {Promise<{success: boolean, liberaciones: number, error?: string}>}
   */
  async crearLiberacionesPorFaltas(asistenciasData, eventosData) {
    try {
      const liberaciones = [];

      asistenciasData.forEach(asistencia => {
        const eventosFuturos = eventosData.filter(
          e => e.clase_id === asistencia.clase_id
        );
        if (eventosFuturos.length > 0) {
          liberaciones.push({
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            fecha_inicio: asistencia.fecha,
            fecha_fin: eventosFuturos[eventosFuturos.length - 1].fecha,
            motivo:
              asistencia.estado === 'justificada'
                ? 'falta_justificada'
                : asistencia.estado === 'lesionado'
                  ? 'lesion'
                  : 'falta_no_justificada',
            estado: 'activa',
            derecho_recuperacion: asistencia.estado === 'justificada',
          });
        }
      });

      if (liberaciones.length === 0) {
        return { success: true, liberaciones: 0 };
      }

      // Procesar cada liberación individualmente para mejor manejo de errores
      let creadas = 0;
      for (const liberacion of liberaciones) {
        try {
          // Verificar si ya existe
          const { data: existente, error: selectError } = await supabase
            .from('liberaciones_plaza')
            .select('id')
            .eq('alumno_id', liberacion.alumno_id)
            .eq('clase_id', liberacion.clase_id)
            .eq('fecha_inicio', liberacion.fecha_inicio)
            .eq('estado', 'activa')
            .maybeSingle();

          if (selectError) {
            console.error(
              'Error verificando liberación existente:',
              selectError
            );
            continue;
          }

          if (!existente) {
            // Crear nueva liberación usando upsert para evitar conflictos
            const { error: insertError } = await supabase
              .from('liberaciones_plaza')
              .upsert([liberacion], {
                onConflict: 'alumno_id,clase_id,fecha_inicio',
                ignoreDuplicates: true,
              });

            if (insertError) {
              // Si es un error 409 (conflicto), ignorarlo silenciosamente
              if (insertError.code !== '23505' && insertError.status !== 409) {
                console.error('Error creando liberación:', insertError);
              }
            } else {
              creadas++;
            }
          }
        } catch (error) {
          console.error('Error procesando liberación:', error);
        }
      }

      return { success: true, liberaciones: creadas };
    } catch (error) {
      console.error('Error en crearLiberacionesPorFaltas:', error);
      return { success: false, error: error.message, liberaciones: 0 };
    }
  },

  /**
   * Cancelar una liberación de plaza
   * @param {string} liberacionId - ID de la liberación
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async cancelarLiberacion(liberacionId) {
    try {
      const { error } = await supabase
        .from('liberaciones_plaza')
        .update({ estado: 'cancelada' })
        .eq('id', liberacionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelando liberación:', error);
      return { success: false, error: error.message };
    }
  },
};

