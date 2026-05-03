/**
 * Tipos generados de la base de datos Supabase.
 *
 * PENDIENTE: regenerar con la CLI:
 *   pnpm dlx supabase gen types typescript --project-id <ID> > src/types/supabase.ts
 *
 * Mientras tanto, dejamos el alias de Database como `unknown` para que el
 * cliente de Supabase compile sin tipar las tablas. Cuando se ejecute el
 * comando anterior, este placeholder se sobreescribira con los tipos reales.
 */
export type Database = unknown;
