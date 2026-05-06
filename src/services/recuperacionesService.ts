import { supabase } from '../lib/supabase';
import type { TablesInsert } from '../types/supabase';

interface AsistenciaJustificada {
  id?: string;
  alumno_id: string;
  clase_id: string;
  fecha: string;
  estado: 'justificada' | string;
}

interface ResultadoRecuperaciones {
  success: boolean;
  recuperaciones: number;
  error?: string;
}

type RecuperacionInsert = Partial<TablesInsert<'recuperaciones_clase'>> & {
  alumno_id: string;
  clase_id: string;
  fecha_falta: string;
  estado: string;
  observaciones: string;
  tipo_recuperacion: string;
};

export const recuperacionesService = {
  async crearRecuperacionesPorFaltasJustificadas(
    asistenciasData: AsistenciaJustificada[]
  ): Promise<ResultadoRecuperaciones> {
    try {
      const recuperaciones: RecuperacionInsert[] = [];

      asistenciasData
        .filter((a) => a.estado === 'justificada')
        .forEach((asistencia) => {
          const recuperacionData: RecuperacionInsert = {
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            fecha_falta: asistencia.fecha,
            estado: 'pendiente',
            observaciones: 'Falta justificada - derecho a recuperación',
            tipo_recuperacion: 'automatica',
          };

          if (asistencia.id) {
            recuperacionData.falta_justificada_id = asistencia.id;
          }

          recuperaciones.push(recuperacionData);
        });

      if (recuperaciones.length === 0) {
        return { success: true, recuperaciones: 0 };
      }

      let creadas = 0;
      for (const recuperacion of recuperaciones) {
        try {
          const { data: existente, error: selectError } = await supabase
            .from('recuperaciones_clase')
            .select('id')
            .eq('alumno_id', recuperacion.alumno_id)
            .eq('clase_id', recuperacion.clase_id)
            .eq('fecha_falta', recuperacion.fecha_falta)
            .eq('estado', 'pendiente')
            .maybeSingle();

          if (selectError) {
            console.error('Error verificando recuperación existente:', selectError);
            continue;
          }

          if (!existente) {
            const { error: insertError } = await supabase
              .from('recuperaciones_clase')
              .insert([recuperacion as TablesInsert<'recuperaciones_clase'>]);

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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        recuperaciones: 0,
      };
    }
  },

  async completarRecuperacion(
    recuperacionId: string,
    fechaRecuperacion: string,
    observaciones = ''
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('recuperaciones_clase')
        .update({
          estado: 'recuperada',
          fecha_recuperacion: fechaRecuperacion,
          observaciones:
            observaciones ||
            `Clase recuperada el ${new Date(fechaRecuperacion).toLocaleDateString('es-ES')}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recuperacionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error completando recuperación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
};
