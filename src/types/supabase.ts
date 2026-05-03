/**
 * Tipos de la base de datos Supabase (schema `public`).
 *
 * Generar en local (sustituye este archivo entero):
 *   1. `pnpm exec supabase login`  (una vez; abre el navegador)
 *   2. `pnpm run gen:supabase-types`
 *
 * Sin login, `gen:supabase-types` falla con "Access token not provided".
 * Mientras tanto usamos `any` para que las consultas en TS compilen;
 * el archivo generado exporta `Database` con tipos reales y `Json`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hasta ejecutar gen:supabase-types
export type Database = any;
