import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface RegistrarAccionParams {
  usuarioId?: string | null;
  accion?: string | null;
  entidad?: string | null;
  entidadId?: string | null;
  detalle?: Record<string, unknown> | null;
}

interface RegistroAuditoria {
  usuario_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown> | null;
}

interface AuditoriaResult {
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

export async function registrarAccion({
  usuarioId,
  accion,
  entidad,
  entidadId,
  detalle,
}: RegistrarAccionParams): Promise<AuditoriaResult> {
  if (!accion || !entidad) return { data: null, error: null };

  try {
    const payload: RegistroAuditoria = {
      usuario_id: usuarioId || null,
      accion,
      entidad,
      entidad_id: entidadId || null,
      detalle: detalle || null,
    };

    const { data, error } = await (supabase as unknown as SupabaseUntyped)
      .from('logs_auditoria')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
        console.warn('[auditoriaService] Tabla logs_auditoria no existe todavía');
        return { data: null, error: null };
      }
      console.error('[auditoriaService] Error registrando acción', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[auditoriaService] Error inesperado', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Error desconocido'),
    };
  }
}
