import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const TIPOS_NOTIFICACION = {
  PAGO_PENDIENTE: 'PAGO_PENDIENTE',
  CLASE_PROXIMA: 'CLASE_PROXIMA',
} as const;

type TipoNotificacion =
  (typeof TIPOS_NOTIFICACION)[keyof typeof TIPOS_NOTIFICACION];

interface NotificacionPayload {
  tipo: TipoNotificacion;
  alumno_id: string;
  clase_id?: string;
  datos: Record<string, unknown>;
}

interface NotificacionResult {
  data: unknown;
  error: PostgrestError | Error | null;
}

interface SupabaseUntyped {
  from: (table: string) => {
    insert: (payload: unknown) => {
      select: () => {
        single: () => Promise<{ data: unknown; error: PostgrestError | null }>;
      };
    };
  };
}

async function insertarNotificacion(
  payload: NotificacionPayload
): Promise<NotificacionResult> {
  try {
    const { data, error } = await (supabase as unknown as SupabaseUntyped)
      .from('notificaciones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
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
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Error desconocido'),
    };
  }
}

export async function crearNotificacionPagoPendiente({
  alumnoId,
  importe,
  mes,
}: {
  alumnoId: string;
  importe: number;
  mes: string;
}): Promise<NotificacionResult> {
  if (!alumnoId) return { data: null, error: null };

  const payload: NotificacionPayload = {
    tipo: TIPOS_NOTIFICACION.PAGO_PENDIENTE,
    alumno_id: alumnoId,
    datos: { importe, mes },
  };
  return insertarNotificacion(payload);
}

export async function crearNotificacionClaseProxima({
  alumnoId,
  claseId,
  fecha,
}: {
  alumnoId: string;
  claseId: string;
  fecha: string;
}): Promise<NotificacionResult> {
  if (!alumnoId || !claseId || !fecha) return { data: null, error: null };

  const payload: NotificacionPayload = {
    tipo: TIPOS_NOTIFICACION.CLASE_PROXIMA,
    alumno_id: alumnoId,
    clase_id: claseId,
    datos: { fecha },
  };
  return insertarNotificacion(payload);
}
