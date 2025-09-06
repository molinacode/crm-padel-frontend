import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

console.log('🔧 Configuración Supabase:');
console.log('📍 URL:', supabaseUrl ? '✅ Definida' : '❌ No definida');
console.log('🔑 Key:', supabaseKey ? '✅ Definida' : '❌ No definida');

if (!supabaseUrl || !supabaseKey) {
  console.error('💥 ERROR: Variables de entorno de Supabase no están definidas');
  console.error('📝 Crea un archivo .env con:');
  console.error('VITE_SUPABASE_URL=tu_url_aqui');
  console.error('VITE_SUPABASE_KEY=tu_key_aqui');
}

let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Cliente de Supabase creado exitosamente');
  
  // Verificar que las credenciales sean válidas
  if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    console.warn('⚠️ ADVERTENCIA: Estás usando credenciales de placeholder');
  }
  
  if (!supabaseUrl.includes('.supabase.co')) {
    console.warn('⚠️ ADVERTENCIA: La URL no parece ser de Supabase válida');
  }
  
} catch (error) {
  console.error('💥 ERROR al crear cliente de Supabase:', error);
  // Crear cliente con valores por defecto para evitar crash
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
