import { supabase } from '../lib/supabase';

/**
 * Servicio de notificaciones internas.
 * Registra eventos de negocio en la tabla `notificaciones` (si existe).
 */

export const TIPOS_NOTIFICACION = {
  PAGO_PENDIENTE: 'PAGO_PENDIENTE',
  CLASE_PROXIMA: 'CLASE_PROXIMA',
};

async function insertarNotificacion(payload) {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Si la tabla no existe aún, solo logueamos y seguimos
      if (
        error.message?.includes('does not exist') ||
        error.code === 'PGRST116'
      ) {
        console.warn(
          '[notificacionesService] Tabla notificaciones no existe todavía'
        );
        return { data: null, error: null };
      }
      console.error('[notificacionesService] Error insertando notificación', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('[notificacionesService] Error inesperado', error);
    return { data: null, error };
  }
}

export async function crearNotificacionPagoPendiente({
  alumnoId,
  importe,
  mes,
}) {
  if (!alumnoId) return { data: null, error: null };
  const payload = {
    tipo: TIPOS_NOTIFICACION.PAGO_PENDIENTE,
    alumno_id: alumnoId,
    datos: {
      importe,
      mes,
    },
  };
  return insertarNotificacion(payload);
}

export async function crearNotificacionClaseProxima({
  alumnoId,
  claseId,
  fecha,
}) {
  if (!alumnoId || !claseId || !fecha) return { data: null, error: null };
  const payload = {
    tipo: TIPOS_NOTIFICACION.CLASE_PROXIMA,
    alumno_id: alumnoId,
    clase_id: claseId,
    datos: {
      fecha,
    },
  };
  return insertarNotificacion(payload);
}

