import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey: string | undefined =
  import.meta.env.VITE_SUPABASE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Decodifica el claim `role` del JWT de Supabase (anon / service_role / …). */
function decodeSupabaseJwtRole(apiKey: string): string | null {
  const segments = apiKey.split('.');
  if (segments.length !== 3) return null;
  let b64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  try {
    const json = atob(b64);
    const payload = JSON.parse(json) as { role?: string };
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

const isPlaceholderEnv =
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl.includes('placeholder') ||
  supabaseKey.includes('placeholder');

const jwtRole = supabaseKey ? decodeSupabaseJwtRole(supabaseKey) : null;
const isServiceRoleKey =
  Boolean(supabaseKey && !isPlaceholderEnv) && jwtRole === 'service_role';

console.log('🔧 Configuración Supabase:');
console.log('📍 URL:', supabaseUrl ? '✅ Definida' : '❌ No definida');
console.log('🔑 Key:', supabaseKey ? '✅ Definida' : '❌ No definida');

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '💥 ERROR: Variables de entorno de Supabase no están definidas'
  );
  console.error(
    '📝 En la raíz de crm-padel-frontend crea un archivo .env (puedes copiar .env.example) con:'
  );
  console.error('VITE_SUPABASE_URL=https://xxxx.supabase.co');
  console.error(
    'VITE_SUPABASE_KEY=tu_clave_anon (Settings → API → anon public)'
  );
  console.error(
    '(alternativa: VITE_SUPABASE_ANON_KEY — mismo valor que la anon public)'
  );
}

if (isServiceRoleKey) {
  console.error(
    '💥 ERROR: La clave de Supabase del frontend es `service_role`. Eso NO puede usarse en el navegador (salta RLS y expone toda la base de datos).'
  );
  console.error(
    '📝 Usa la clave anon public (Settings → API → Project API keys → anon public). Si esta clave service_role ya estuvo en el repo o en .env del cliente, rota la service_role en Supabase (Settings → API → Reset service_role secret).'
  );
}

if (
  supabaseKey &&
  !isPlaceholderEnv &&
  jwtRole &&
  jwtRole !== 'anon' &&
  jwtRole !== 'service_role'
) {
  console.warn(
    `⚠️ ADVERTENCIA: La clave JWT tiene role "${jwtRole}". En el cliente debe ser la clave anon public (role "anon").`
  );
}

let supabase: SupabaseClient<Database>;

try {
  if (isServiceRoleKey) {
    supabase = createClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  } else {
    supabase = createClient<Database>(supabaseUrl ?? '', supabaseKey ?? '');
    console.log('✅ Cliente de Supabase creado exitosamente');

    if (supabaseUrl && supabaseUrl.includes('placeholder')) {
      console.warn('⚠️ ADVERTENCIA: Estás usando credenciales de placeholder');
    }
    if (supabaseKey && supabaseKey.includes('placeholder')) {
      console.warn('⚠️ ADVERTENCIA: Estás usando credenciales de placeholder');
    }

    if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
      console.warn('⚠️ ADVERTENCIA: La URL no parece ser de Supabase válida');
    }
  }
} catch (error) {
  console.error('💥 ERROR al crear cliente de Supabase:', error);
  supabase = createClient<Database>(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
}

export { supabase };
