import { useState } from 'react';
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
      // Sincronizando asignaciones...

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
        .in('estado', ['justificada', 'falta', 'lesionado']);

      if (asistenciasError) throw asistenciasError;

      if (!asistenciasData || asistenciasData.length === 0) {
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
                : asistencia.estado === 'lesionado'
                  ? 'lesion'
                  : 'falta_no_justificada',
            estado: 'activa',
            derecho_recuperacion: asistencia.estado === 'justificada', // Solo las justificadas tienen derecho a recuperación
          });
        }

        // Si es falta justificada, crear registro de recuperación
        if (asistencia.estado === 'justificada') {
          const recuperacionData = {
            alumno_id: asistencia.alumno_id,
            clase_id: asistencia.clase_id,
            fecha_falta: fecha,
            estado: 'pendiente',
            observaciones: 'Falta justificada - derecho a recuperación',
            tipo_recuperacion: 'automatica',
          };
          
          // Solo agregar falta_justificada_id si el campo existe en la tabla
          // (puede que no exista en todas las versiones del esquema)
          if (asistencia.id) {
            recuperacionData.falta_justificada_id = asistencia.id;
          }
          
          recuperaciones.push(recuperacionData);
        }
      });

      // Insertar liberaciones si no existen
      if (liberaciones.length > 0) {
        // Procesar cada liberación individualmente para mejor manejo de errores
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
                }
            }
          } catch (error) {
            console.error('Error procesando liberación:', error);
          }
        }

        // Liberaciones procesadas
      }

      // Insertar recuperaciones para faltas justificadas
      if (recuperaciones.length > 0) {
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
              // Crear nueva recuperación usando upsert para evitar conflictos
              // Solo incluir campos que existen en la tabla
              const recuperacionToInsert = {
                alumno_id: recuperacion.alumno_id,
                clase_id: recuperacion.clase_id,
                fecha_falta: recuperacion.fecha_falta,
                estado: recuperacion.estado || 'pendiente',
                observaciones: recuperacion.observaciones || 'Falta justificada - derecho a recuperación',
                tipo_recuperacion: recuperacion.tipo_recuperacion || 'automatica',
              };
              
              // Solo agregar falta_justificada_id si existe y no es undefined
              if (recuperacion.falta_justificada_id !== undefined && recuperacion.falta_justificada_id !== null) {
                recuperacionToInsert.falta_justificada_id = recuperacion.falta_justificada_id;
              }

              const { error: insertError } = await supabase
                .from('recuperaciones_clase')
                .upsert([recuperacionToInsert], {
                  onConflict: 'alumno_id,clase_id,fecha_falta',
                  ignoreDuplicates: true,
                });

              if (insertError) {
                // Si es un error 400 o 409 (conflicto), ignorarlo silenciosamente si es por duplicado
                if (insertError.code !== '23505' && insertError.status !== 409 && insertError.status !== 400) {
                  console.error('Error creando recuperación:', insertError);
                } else if (insertError.status === 400) {
                  // Error 400 podría ser por campos incorrectos, loguear para debug
                  console.warn('Error 400 al crear recuperación (posible problema de campos):', insertError.message);
                }
              }
            }
          } catch (error) {
            console.error('Error procesando recuperación:', error);
          }
        }

        // Recuperaciones procesadas
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
      // Restaurando asignación...

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
      // Limpiando liberaciones...

      const { error } = await supabase
        .from('liberaciones_plaza')
        .update({ estado: 'expirada' })
        .eq('estado', 'activa')
        .lt('fecha_fin', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error limpiando liberaciones expiradas:', error);
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
      // Primero obtener todas las recuperaciones (pendientes y recuperadas)
      const { data: recuperacionesData, error } = await supabase
        .from('recuperaciones_clase')
        .select(
          `
          id,
          clase_id,
          fecha_falta,
          fecha_recuperacion,
          estado,
          observaciones,
          clases (nombre, nivel_clase, tipo_clase)
        `
        )
        .eq('alumno_id', alumnoId)
        .in('estado', ['pendiente', 'recuperada'])
        .order('fecha_falta', { ascending: true });

      if (error) throw error;

      // Obtener todas las asistencias del alumno para verificar si ya están recuperadas
      const { data: asistenciasData, error: asistErr } = await supabase
        .from('asistencias')
        .select('id, clase_id, fecha, estado')
        .eq('alumno_id', alumnoId)
        .eq('estado', 'asistio')
        .order('fecha', { ascending: false });

      if (asistErr) throw asistErr;

      // Crear un mapa de recuperaciones ya completadas
      // Una recuperación está completada si:
      // 1. Tiene estado 'recuperada' Y tiene fecha_recuperacion Y hay una asistencia en esa fecha
      // 2. O si hay una recuperación pendiente que tiene una asistencia asociada (caso donde se marcó recuperación pero no se actualizó el estado)
      const recuperacionesCompletadas = new Set();
      const asistenciasMap = new Map();
      
      (asistenciasData || []).forEach(a => {
        const fechaAsist = a.fecha.split('T')[0]; // Solo la fecha, sin hora
        const key = `${a.clase_id}|${fechaAsist}`;
        asistenciasMap.set(key, a);
      });

      // Verificar recuperaciones recuperadas que tienen asistencia
      (recuperacionesData || []).forEach(rec => {
        if (rec.estado === 'recuperada' && rec.fecha_recuperacion) {
          // Verificar si existe una asistencia en la fecha de recuperación
          const fechaRec = rec.fecha_recuperacion.split('T')[0]; // Solo la fecha, sin hora
          const key = `${rec.clase_id}|${fechaRec}`;
          if (asistenciasMap.has(key)) {
            recuperacionesCompletadas.add(rec.id);
          }
        }
      });

      // Verificar recuperaciones pendientes que ya tienen una asistencia asociada
      // Esto puede pasar si se marcó la asistencia como recuperación pero no se actualizó el estado de la recuperación
      (recuperacionesData || []).forEach(rec => {
        if (rec.estado === 'pendiente') {
          // Buscar si hay alguna asistencia que pueda corresponder a esta recuperación
          // Verificamos asistencias recientes (después de la fecha de falta)
          const fechaFalta = rec.fecha_falta ? new Date(rec.fecha_falta) : null;
          if (fechaFalta) {
            for (const [key] of asistenciasMap.entries()) {
              const [claseId, fechaAsist] = key.split('|');
              const fechaAsistDate = new Date(fechaAsist);
              
              // Si la asistencia es de la misma clase y después de la fecha de falta
              // y no hay otra recuperación recuperada que use esta asistencia
              if (claseId === rec.clase_id && fechaAsistDate >= fechaFalta) {
                // Verificar que esta asistencia no esté ya asociada a otra recuperación recuperada
                const yaAsociada = Array.from(recuperacionesCompletadas).some(recId => {
                  const recCompletada = recuperacionesData.find(r => r.id === recId);
                  if (recCompletada && recCompletada.fecha_recuperacion) {
                    const fechaRecCompletada = recCompletada.fecha_recuperacion.split('T')[0];
                    return fechaRecCompletada === fechaAsist && recCompletada.clase_id === claseId;
                  }
                  return false;
                });
                
                if (!yaAsociada) {
                  recuperacionesCompletadas.add(rec.id);
                  break; // Solo asociar a una recuperación
                }
              }
            }
          }
        }
      });

      // Filtrar solo las recuperaciones pendientes que NO están completadas
      const pendientes = (recuperacionesData || []).filter(
        r => r.estado === 'pendiente' && !recuperacionesCompletadas.has(r.id)
      );

      // También considerar faltas justificadas sin recuperación creada aún
      const { data: asistenciasJust, error: asistJustErr } = await supabase
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
      if (asistJustErr) throw asistJustErr;

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

      // Recuperación completada
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

      // Recuperación cancelada
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

      // Recuperación manual creada
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
