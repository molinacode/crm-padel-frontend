import { supabase } from '../lib/supabase';

/**
 * Servicio para gestionar recuperaciones de clase
 */
export const recuperacionesService = {
  /**
   * Crear recuperaciones para faltas justificadas
   * @param {Array} asistenciasData - Array de asistencias con faltas justificadas
   * @returns {Promise<{success: boolean, recuperaciones: number, error?: string}>}
   */
  async crearRecuperacionesPorFaltasJustificadas(asistenciasData) {
    try {
      const recuperaciones = [];

      asistenciasData
        .filter(a => a.estado === 'justificada')
        .forEach(asistencia => {
          const recuperacionData = {
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            fecha_falta: asistencia.fecha,
            estado: 'pendiente',
            observaciones: 'Falta justificada - derecho a recuperación',
            tipo_recuperacion: 'automatica',
          };

          // Solo agregar falta_justificada_id si el campo existe en la tabla
          if (asistencia.id) {
            recuperacionData.falta_justificada_id = asistencia.id;
          }

          recuperaciones.push(recuperacionData);
        });

      if (recuperaciones.length === 0) {
        return { success: true, recuperaciones: 0 };
      }

      // Procesar cada recuperación individualmente
      let creadas = 0;
      for (const recuperacion of recuperaciones) {
        try {
          // Verificar si ya existe
          const { data: existente, error: selectError } = await supabase
            .from('recuperaciones_clase')
            .select('id')
            .eq('alumno_id', recuperacion.alumno_id)
            .eq('clase_id', recuperacion.clase_id)
            .eq('fecha_falta', recuperacion.fecha_falta)
            .eq('estado', 'pendiente')
            .maybeSingle();

          if (selectError) {
            console.error(
              'Error verificando recuperación existente:',
              selectError
            );
            continue;
          }

          if (!existente) {
            const { error: insertError } = await supabase
              .from('recuperaciones_clase')
              .insert([recuperacion]);

            if (insertError) {
              console.error('Error creando recuperación:', insertError);
            } else {
              creadas++;
            }
          }
        } catch (error) {
          console.error('Error procesando recuperación:', error);
        }
      }

      return { success: true, recuperaciones: creadas };
    } catch (error) {
      console.error('Error en crearRecuperacionesPorFaltasJustificadas:', error);
      return { success: false, error: error.message, recuperaciones: 0 };
    }
  },

  /**
   * Marcar una recuperación como completada
   * @param {string} recuperacionId - ID de la recuperación
   * @param {string} fechaRecuperacion - Fecha de la recuperación
   * @param {string} observaciones - Observaciones adicionales
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async completarRecuperacion(recuperacionId, fechaRecuperacion, observaciones = '') {
    try {
      const { error } = await supabase
        .from('recuperaciones_clase')
        .update({
          estado: 'recuperada',
          fecha_recuperacion: fechaRecuperacion,
          observaciones: observaciones || `Clase recuperada el ${new Date(fechaRecuperacion).toLocaleDateString('es-ES')}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recuperacionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error completando recuperación:', error);
      return { success: false, error: error.message };
    }
  },
};

