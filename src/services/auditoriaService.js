import { supabase } from '../lib/supabase';

/**
 * Servicio simple para registrar acciones en logs_auditoria.
 */

export async function registrarAccion({
  usuarioId,
  accion,
  entidad,
  entidadId,
  detalle,
}) {
  if (!accion || !entidad) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('logs_auditoria')
      .insert({
        usuario_id: usuarioId || null,
        accion,
        entidad,
        entidad_id: entidadId || null,
        detalle: detalle || null,
      })
      .select()
      .single();

    if (error) {
      if (
        error.message?.includes('does not exist') ||
        error.code === 'PGRST116'
      ) {
        console.warn(
          '[auditoriaService] Tabla logs_auditoria no existe todavía'
        );
        return { data: null, error: null };
      }
      console.error('[auditoriaService] Error registrando acción', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('[auditoriaService] Error inesperado', error);
    return { data: null, error };
  }
}

