import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { TablesInsert } from '../types/supabase';

interface AsistenciaMinima {
  id?: string;
  alumno_id: string;
  clase_id: string;
  fecha: string;
  estado: 'justificada' | 'lesionado' | 'falta' | string;
}

interface EventoMinimo {
  clase_id: string;
  fecha: string;
}

interface ResultadoLiberaciones {
  success: boolean;
  liberaciones: number;
  error?: string;
}

type LiberacionInsert = TablesInsert<'liberaciones_plaza'> & {
  derecho_recuperacion?: boolean;
};

interface SupabaseUntyped {
  from: (table: string) => {
    upsert: (
      values: unknown[],
      options: { onConflict: string; ignoreDuplicates: boolean }
    ) => Promise<{ error: PostgrestError | null }>;
  };
}

export const liberacionesService = {
  async crearLiberacionesPorFaltas(
    asistenciasData: AsistenciaMinima[],
    eventosData: EventoMinimo[]
  ): Promise<ResultadoLiberaciones> {
    try {
      const liberaciones: LiberacionInsert[] = [];

      asistenciasData.forEach((asistencia) => {
        const eventosFuturos = eventosData.filter(
          (e) => e.clase_id === asistencia.clase_id
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

      let creadas = 0;
      for (const liberacion of liberaciones) {
        try {
          const { data: existente, error: selectError } = await supabase
            .from('liberaciones_plaza')
            .select('id')
            .eq('alumno_id', liberacion.alumno_id)
            .eq('clase_id', liberacion.clase_id)
            .eq('fecha_inicio', liberacion.fecha_inicio)
            .eq('estado', 'activa')
            .maybeSingle();

          if (selectError) {
            console.error('Error verificando liberación existente:', selectError);
            continue;
          }

          if (!existente) {
            const { error: insertError } = await (supabase as unknown as SupabaseUntyped)
              .from('liberaciones_plaza')
              .upsert([liberacion], {
                onConflict: 'alumno_id,clase_id,fecha_inicio',
                ignoreDuplicates: true,
              });

            if (insertError) {
              const status = (insertError as { status?: number }).status;
              if (insertError.code !== '23505' && status !== 409) {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        liberaciones: 0,
      };
    }
  },

  async cancelarLiberacion(
    liberacionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('liberaciones_plaza')
        .update({ estado: 'cancelada' })
        .eq('id', liberacionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelando liberación:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
};
