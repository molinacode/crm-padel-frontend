import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey: string | undefined =
  import.meta.env.VITE_SUPABASE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// El tipo Database es `unknown` mientras no se generen los tipos reales
// (ver src/types/supabase.ts). Se mantiene la firma generica para que el
// dia que se genere, todo el codigo cliente herede los tipos sin cambios.
let supabase: SupabaseClient<Database>;

try {
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
} catch (error) {
  console.error('💥 ERROR al crear cliente de Supabase:', error);
  supabase = createClient<Database>(
    'https://placeholder.supabase.co',
    'placeholder-key'
  );
}

export { supabase };
