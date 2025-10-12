// Utilidad para verificar y diagnosticar problemas con la tabla gastos_material
import { supabase } from '../lib/supabase.js';

export const verificarTablaGastos = async () => {
  try {
    console.log('🔍 Verificando tabla gastos_material...');

    // Intentar hacer una consulta simple
    const { data, error } = await supabase
      .from('gastos_material')
      .select('id, concepto, cantidad, fecha_gasto')
      .limit(5);

    if (error) {
      console.error('❌ Error al acceder a gastos_material:', error);

      // Si el error es que la tabla no existe, intentar crearla
      if (
        error.message.includes('relation "gastos_material" does not exist') ||
        error.code === 'PGRST116'
      ) {
        console.log('📝 La tabla gastos_material no existe. Creando...');
        return await crearTablaGastos();
      }

      return { success: false, error };
    }

    console.log('✅ Tabla gastos_material accesible');
    console.log('📊 Gastos encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 Primeros gastos:', data.slice(0, 3));
    }
    return { success: true, data };
  } catch (err) {
    console.error('💥 Error inesperado:', err);
    return { success: false, error: err };
  }
};

const crearTablaGastos = async () => {
  try {
    console.log('🔨 Ejecutando migración de gastos_material...');

    // SQL para crear la tabla
    const sql = `
      CREATE TABLE IF NOT EXISTS public.gastos_material (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        concepto text NOT NULL,
        descripcion text,
        cantidad decimal(10,2) NOT NULL CHECK (cantidad > 0),
        fecha_gasto date NOT NULL DEFAULT CURRENT_DATE,
        fecha_gasto_mes date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
        categoria text NOT NULL CHECK (categoria IN ('material_deportivo', 'mantenimiento', 'limpieza', 'seguridad', 'otros')),
        proveedor text,
        factura_url text,
        observaciones text,
        fecha_creacion timestamp with time zone DEFAULT now(),
        fecha_actualizacion timestamp with time zone DEFAULT now(),
        
        CONSTRAINT valid_concepto CHECK (length(trim(concepto)) > 0),
        CONSTRAINT valid_cantidad CHECK (cantidad > 0)
      );
    `;

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error creando tabla:', error);
      return { success: false, error };
    }

    console.log('✅ Tabla gastos_material creada exitosamente');
    return { success: true };
  } catch (err) {
    console.error('💥 Error inesperado creando tabla:', err);
    return { success: false, error: err };
  }
};

export const diagnosticarEsquema = async () => {
  try {
    console.log('🔍 Diagnosticando esquema de gastos_material...');

    // Intentar consultar información del esquema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'gastos_material')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Error consultando esquema:', error);
      return { success: false, error };
    }

    console.log('📋 Columnas encontradas en gastos_material:', data);
    return { success: true, columns: data };
  } catch (err) {
    console.error('💥 Error inesperado:', err);
    return { success: false, error: err };
  }
};
