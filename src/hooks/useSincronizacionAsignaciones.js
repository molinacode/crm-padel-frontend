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
  const sincronizarAsignacionesDelDia = async fecha => {
    try {
      setSincronizando(true);
      console.log(
        '🔄 Sincronizando asignaciones con asistencias del día:',
        fecha
      );

      // Obtener asistencias del día con faltas (justificadas y no justificadas)
      const { data: asistenciasData, error: asistenciasError } = await supabase
        .from('asistencias')
        .select(
          `
          alumno_id,
          clase_id,
          fecha,
          estado,
          alumnos (nombre),
          clases (nombre, tipo_clase)
        `
        )
        .eq('fecha', fecha)
        .in('estado', ['justificada', 'falta']);

      if (asistenciasError) throw asistenciasError;

      if (!asistenciasData || asistenciasData.length === 0) {
        console.log('✅ No hay faltas para sincronizar');
        return { success: true, liberaciones: 0 };
      }

      // Obtener eventos futuros para las clases afectadas (excluyendo eliminados y cancelados)
      const claseIds = [...new Set(asistenciasData.map(a => a.clase_id))];
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select('id, clase_id, fecha')
        .in('clase_id', claseIds)
        .gte('fecha', fecha)
        .neq('estado', 'eliminado')
        .neq('estado', 'cancelada')
        .order('fecha');

      if (eventosError) throw eventosError;

      // Crear liberaciones de plaza para cada falta
      const liberaciones = [];
      const recuperaciones = []; // Para faltas justificadas

      asistenciasData.forEach(asistencia => {
        const eventosFuturos = eventosData.filter(
          e => e.clase_id === asistencia.clase_id
        );
        if (eventosFuturos.length > 0) {
          liberaciones.push({
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            fecha_inicio: fecha,
            fecha_fin: eventosFuturos[eventosFuturos.length - 1].fecha,
            motivo:
              asistencia.estado === 'justificada'
                ? 'falta_justificada'
                : 'falta_no_justificada',
            estado: 'activa',
            derecho_recuperacion: asistencia.estado === 'justificada', // Solo las justificadas tienen derecho a recuperación
          });
        }

        // Si es falta justificada, crear registro de recuperación
        if (asistencia.estado === 'justificada') {
          recuperaciones.push({
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            falta_justificada_id: asistencia.id,
            fecha_falta: fecha,
            estado: 'pendiente',
            observaciones: 'Falta justificada - derecho a recuperación',
            tipo_recuperacion: 'automatica', // Restaurado - la columna existe
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
              console.error(
                'Error verificando liberación existente:',
                selectError
              );
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

      // Insertar recuperaciones para faltas justificadas
      console.log(`🔄 Procesando ${recuperaciones.length} recuperaciones...`);
      if (recuperaciones.length > 0) {
        let recuperacionesCreadas = 0;
        for (const recuperacion of recuperaciones) {
          try {
            // Verificar si ya existe
            let query = supabase
              .from('recuperaciones_clase')
              .select('id')
              .eq('alumno_id', recuperacion.alumno_id)
              .eq('clase_id', recuperacion.clase_id)
              .eq('estado', 'pendiente');

            // Solo agregar el filtro de falta_justificada_id si no es undefined
            if (recuperacion.falta_justificada_id !== undefined) {
              query = query.eq(
                'falta_justificada_id',
                recuperacion.falta_justificada_id
              );
            }

            const { data: existente, error: selectError } =
              await query.maybeSingle();

            if (selectError) {
              console.error(
                'Error verificando recuperación existente:',
                selectError
              );
              continue;
            }

            if (!existente) {
              // Crear nueva recuperación
              console.log('🔄 Insertando recuperación:', recuperacion);
              const { error: insertError } = await supabase
                .from('recuperaciones_clase')
                .insert([recuperacion]);

              if (insertError) {
                console.error('❌ Error creando recuperación:', insertError);
                console.error('❌ Datos que causaron el error:', recuperacion);
              } else {
                console.log('✅ Recuperación creada exitosamente');
                recuperacionesCreadas++;
              }
            } else {
              console.log('ℹ️ Recuperación ya existe, omitiendo');
            }
          } catch (error) {
            console.error('Error procesando recuperación:', error);
          }
        }

        console.log(`✅ ${recuperacionesCreadas} recuperaciones creadas`);
      }

      return {
        success: true,
        liberaciones: liberaciones.length,
        recuperaciones: recuperaciones.length,
      };
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
        alumnosLiberados: liberacionesData?.map(l => l.alumno_id) || [],
      };
    } catch (error) {
      console.error('Error obteniendo estado de sincronización:', error);
      return { liberacionesActivas: 0, alumnosLiberados: [] };
    }
  };

  /**
   * Obtiene las recuperaciones pendientes de un alumno
   */
  const obtenerRecuperacionesPendientes = async alumnoId => {
    try {
      const { data: recuperacionesData, error } = await supabase
        .from('recuperaciones_clase')
        .select(
          `
          id,
          clase_id,
          fecha_falta,
          estado,
          observaciones,
          clases (nombre, nivel_clase, tipo_clase)
        `
        )
        .eq('alumno_id', alumnoId)
        .eq('estado', 'pendiente')
        .order('fecha_falta', { ascending: true });

      if (error) throw error;

      // También considerar faltas justificadas sin recuperación creada aún
      const { data: asistenciasJust, error: asistErr } = await supabase
        .from('asistencias')
        .select(
          `
          clase_id,
          fecha,
          estado,
          clases (nombre, nivel_clase, tipo_clase)
        `
        )
        .eq('alumno_id', alumnoId)
        .eq('estado', 'justificada');
      if (asistErr) throw asistErr;

      const pendientes = recuperacionesData || [];
      const existentesKeys = new Set(
        pendientes.map(r => `${r.clase_id}|${r.fecha_falta}`)
      );

      const virtuales = (asistenciasJust || [])
        .filter(a => !existentesKeys.has(`${a.clase_id}|${a.fecha}`))
        .map(a => ({
          id: null, // virtual, aún no creada
          clase_id: a.clase_id,
          fecha_falta: a.fecha,
          estado: 'pendiente',
          observaciones: 'Falta justificada - pendiente de crear recuperación',
          clases: a.clases,
        }));

      return {
        success: true,
        recuperaciones: [...pendientes, ...virtuales],
      };
    } catch (error) {
      console.error('Error obteniendo recuperaciones pendientes:', error);
      return { success: false, error: error.message, recuperaciones: [] };
    }
  };

  /**
   * Marca una recuperación como completada
   */
  const marcarRecuperacionCompletada = async (
    recuperacionId,
    fechaRecuperacion,
    observaciones = ''
  ) => {
    try {
      const { error } = await supabase
        .from('recuperaciones_clase')
        .update({
          estado: 'recuperada',
          fecha_recuperacion: fechaRecuperacion,
          observaciones: observaciones || 'Clase recuperada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', recuperacionId);

      if (error) throw error;

      console.log('✅ Recuperación marcada como completada');
      return { success: true };
    } catch (error) {
      console.error('Error marcando recuperación como completada:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Cancela una recuperación
   */
  const cancelarRecuperacion = async (recuperacionId, motivo = '') => {
    try {
      const { error } = await supabase
        .from('recuperaciones_clase')
        .update({
          estado: 'cancelada',
          observaciones: motivo || 'Recuperación cancelada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', recuperacionId);

      if (error) throw error;

      console.log('✅ Recuperación cancelada');
      return { success: true };
    } catch (error) {
      console.error('Error cancelando recuperación:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Crea una recuperación manual para un alumno
   */
  const crearRecuperacionManual = async (alumnoId, claseId, fechaFalta, observaciones = '') => {
    try {
      const { error } = await supabase
        .from('recuperaciones_clase')
        .insert([
          {
            alumno_id: alumnoId,
            clase_id: claseId,
            falta_justificada_id: null, // Manual, no tiene falta justificada asociada
            fecha_falta: fechaFalta,
            estado: 'pendiente',
            observaciones: observaciones || 'Recuperación manual asignada',
            tipo_recuperacion: 'manual', // Marcar como manual
          },
        ]);

      if (error) throw error;

      console.log('✅ Recuperación manual creada');
      return { success: true };
    } catch (error) {
      console.error('Error creando recuperación manual:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    sincronizando,
    sincronizarAsignacionesDelDia,
    restaurarAsignacion,
    limpiarLiberacionesExpiradas,
    obtenerEstadoSincronizacion,
    obtenerRecuperacionesPendientes,
    marcarRecuperacionCompletada,
    cancelarRecuperacion,
    crearRecuperacionManual,
  };
};
