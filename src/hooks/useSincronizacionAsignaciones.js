import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook personalizado para sincronizar asignaciones con asistencias en tiempo real
 * Gestiona la liberación y restauración automática de plazas
 */
export const useSincronizacionAsignaciones = () => {
  const [sincronizando, setSincronizando] = useState(false);

  /**
   * Sincroniza las asignaciones con las asistencias del día
   * Libera plazas de alumnos con faltas justificadas
   */
  const sincronizarAsignacionesDelDia = async (fecha) => {
    try {
      setSincronizando(true);
      console.log('🔄 Sincronizando asignaciones con asistencias del día:', fecha);

      // Obtener asistencias del día con faltas justificadas
      const { data: asistenciasData, error: asistenciasError } = await supabase
        .from('asistencias')
        .select(`
          alumno_id,
          clase_id,
          fecha,
          estado,
          alumnos (nombre),
          clases (nombre, tipo_clase)
        `)
        .eq('fecha', fecha)
        .eq('estado', 'justificada');

      if (asistenciasError) throw asistenciasError;

      if (!asistenciasData || asistenciasData.length === 0) {
        console.log('✅ No hay faltas justificadas para sincronizar');
        return { success: true, liberaciones: 0 };
      }

      // Obtener eventos futuros para las clases afectadas
      const claseIds = [...new Set(asistenciasData.map(a => a.clase_id))];
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select('id, clase_id, fecha')
        .in('clase_id', claseIds)
        .gte('fecha', fecha)
        .neq('estado', 'cancelada')
        .order('fecha');

      if (eventosError) throw eventosError;

      // Crear liberaciones de plaza para cada falta justificada
      const liberaciones = [];
      asistenciasData.forEach(asistencia => {
        const eventosFuturos = eventosData.filter(e => e.clase_id === asistencia.clase_id);
        if (eventosFuturos.length > 0) {
          liberaciones.push({
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            fecha_inicio: fecha,
            fecha_fin: eventosFuturos[eventosFuturos.length - 1].fecha,
            motivo: 'falta_justificada',
            estado: 'activa'
          });
        }
      });

      // Insertar liberaciones si no existen
      if (liberaciones.length > 0) {
        // Procesar cada liberación individualmente para mejor manejo de errores
        let liberacionesCreadas = 0;
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
              console.error('Error verificando liberación existente:', selectError);
              continue;
            }

            if (!existente) {
              // Crear nueva liberación
              const { error: insertError } = await supabase
                .from('liberaciones_plaza')
                .insert([liberacion]);

              if (insertError) {
                console.error('Error creando liberación:', insertError);
              } else {
                liberacionesCreadas++;
              }
            }
          } catch (error) {
            console.error('Error procesando liberación:', error);
          }
        }

        console.log(`✅ ${liberacionesCreadas} liberaciones de plaza creadas`);
      }

      return { success: true, liberaciones: liberaciones.length };
    } catch (error) {
      console.error('Error sincronizando asignaciones:', error);
      return { success: false, error: error.message };
    } finally {
      setSincronizando(false);
    }
  };

  /**
   * Restaura asignaciones cuando un alumno vuelve a asistir
   */
  const restaurarAsignacion = async (alumnoId, claseId, fecha) => {
    try {
      console.log('🔄 Restaurando asignación para alumno:', alumnoId);

      // Cancelar liberaciones activas
      const { error: cancelarError } = await supabase
        .from('liberaciones_plaza')
        .update({ estado: 'cancelada' })
        .eq('alumno_id', alumnoId)
        .eq('clase_id', claseId)
        .eq('estado', 'activa')
        .gte('fecha_inicio', fecha);

      if (cancelarError) {
        console.error('Error cancelando liberaciones:', cancelarError);
      } else {
        console.log('✅ Liberaciones canceladas, asignación restaurada');
      }

      return { success: true };
    } catch (error) {
      console.error('Error restaurando asignación:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Limpia liberaciones expiradas
   */
  const limpiarLiberacionesExpiradas = async () => {
    try {
      console.log('🔄 Limpiando liberaciones expiradas...');

      const { error } = await supabase
        .from('liberaciones_plaza')
        .update({ estado: 'expirada' })
        .eq('estado', 'activa')
        .lt('fecha_fin', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error limpiando liberaciones expiradas:', error);
      } else {
        console.log('✅ Liberaciones expiradas marcadas');
      }

      return { success: true };
    } catch (error) {
      console.error('Error limpiando liberaciones:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Obtiene el estado de sincronización para una clase específica
   */
  const obtenerEstadoSincronizacion = async (claseId, fecha) => {
    try {
      const { data: liberacionesData, error } = await supabase
        .from('liberaciones_plaza')
        .select('alumno_id, motivo, estado')
        .eq('clase_id', claseId)
        .eq('estado', 'activa')
        .lte('fecha_inicio', fecha)
        .gte('fecha_fin', fecha);

      if (error) throw error;

      return {
        liberacionesActivas: liberacionesData?.length || 0,
        alumnosLiberados: liberacionesData?.map(l => l.alumno_id) || []
      };
    } catch (error) {
      console.error('Error obteniendo estado de sincronización:', error);
      return { liberacionesActivas: 0, alumnosLiberados: [] };
    }
  };

  return {
    sincronizando,
    sincronizarAsignacionesDelDia,
    restaurarAsignacion,
    limpiarLiberacionesExpiradas,
    obtenerEstadoSincronizacion
  };
};
