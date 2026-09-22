import { supabase } from '../lib/supabase';

export interface GastoMaterialRow {
  id: string | number;
  concepto: string;
  cantidad: number | string;
  fecha_gasto: string;
}

export type VerificarTablaGastosResult =
  | { success: true; data?: GastoMaterialRow[] }
  | { success: false; error: unknown };

// El esquema lo crean las migraciones SQL del despliegue, aquí solo se comprueba
// que la tabla responde.
export const verificarTablaGastos =
  async (): Promise<VerificarTablaGastosResult> => {
    try {
      console.log('🔍 Verificando tabla gastos_material...');

      const { data, error } = await supabase
        .from('gastos_material')
        .select('id, concepto, cantidad, fecha_gasto')
        .limit(5);

      if (error) {
        console.error('❌ Error al acceder a gastos_material:', error);
        return { success: false, error };
      }

      console.log('✅ Tabla gastos_material accesible');
      console.log('📊 Gastos encontrados:', data?.length ?? 0);
      return { success: true, data: data as GastoMaterialRow[] };
    } catch (err) {
      console.error('💥 Error inesperado:', err);
      return { success: false, error: err };
    }
  };
