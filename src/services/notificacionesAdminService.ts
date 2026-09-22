import { supabase } from '../lib/supabase';

interface SupabaseUntyped {
  from: (table: string) => {
    insert: (payload: unknown) => Promise<{ error: { message?: string } | null }>;
    select: (
      columns: string,
      opts?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }
    ) => {
      eq: (column: string, value: unknown) => Promise<{
        count: number | null;
        error: { message?: string } | null;
      }>;
    };
  };
}

export async function crearNotificacionAdminConciliacion(
  pendientes: number,
  conflictos: number
): Promise<void> {
  if (pendientes <= 0 && conflictos <= 0) return;
  const titulo = 'Conciliacion bancaria pendiente';
  const mensaje = `Hay ${pendientes} pendientes y ${conflictos} conflictos por validar.`;

  try {
    const { error } = await (supabase as unknown as SupabaseUntyped)
      .from('notificaciones_admin')
      .insert({
        tipo: 'CONCILIACION_PENDIENTE',
        titulo,
        mensaje,
        datos: { pendientes, conflictos },
        leida: false,
      });

    if (error?.message?.includes('does not exist')) {
      // Tabla opcional: fallback silencioso hasta crear migracion.
      return;
    }
  } catch {
    // Fallback silencioso para no romper el flujo de importacion.
  }
}

export async function obtenerNotificacionesAdminNoLeidas(): Promise<number> {
  try {
    const { count, error } = await (supabase as unknown as SupabaseUntyped)
      .from('notificaciones_admin')
      .select('id', { head: true, count: 'exact' })
      .eq('leida', false);

    if (error?.message?.includes('does not exist')) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}
