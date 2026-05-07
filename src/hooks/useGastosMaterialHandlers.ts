import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '../types/supabase';

type GastoMaterial = Tables<'gastos_material'>;

type GastoInput = {
  concepto?: string;
  cantidad?: string | number;
  fecha_gasto?: string;
  categoria?: string;
};

export function useGastosMaterialHandlers(
  setGastosMaterial: Dispatch<SetStateAction<GastoMaterial[]>>,
  setMostrarFormularioGasto?: Dispatch<SetStateAction<boolean>>,
  setGastoEditar?: Dispatch<SetStateAction<GastoMaterial | null>>
) {
  const eliminarGastoMaterial = useCallback(async (gasto: GastoMaterial) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres eliminar el gasto "${gasto.concepto}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmar) return;
    const { error } = await supabase.from('gastos_material').delete().eq('id', gasto.id);
    if (error) {
      console.error('❌ Error eliminando gasto:', error);
      alert('❌ Error al eliminar el gasto');
      return;
    }
    setGastosMaterial(prev => prev.filter(g => g.id !== gasto.id));
    alert('✅ Gasto eliminado correctamente');
  }, [setGastosMaterial]);

  const editarGastoMaterial = useCallback((gasto: GastoMaterial) => {
    setGastoEditar?.(gasto);
    setMostrarFormularioGasto?.(true);
  }, [setGastoEditar, setMostrarFormularioGasto]);

  const actualizarGastoMaterial = useCallback(async (gastoEditar: GastoMaterial, gastoData: GastoInput) => {
    const gastoValidado: TablesUpdate<'gastos_material'> = {
      concepto: gastoData.concepto?.trim() || '',
      cantidad: parseFloat(String(gastoData.cantidad ?? 0)),
      fecha_gasto: gastoData.fecha_gasto || '',
      categoria: gastoData.categoria || 'otros',
    };
    if (!gastoValidado.concepto) throw new Error('El concepto es obligatorio');
    if (!gastoValidado.cantidad || gastoValidado.cantidad <= 0) throw new Error('La cantidad debe ser mayor a 0');
    if (!gastoValidado.fecha_gasto) throw new Error('La fecha del gasto es obligatoria');
    const { data, error } = await supabase
      .from('gastos_material')
      .update(gastoValidado)
      .eq('id', gastoEditar.id)
      .select();
    if (error) throw error;
    setGastosMaterial(prev =>
      prev.map(g => (g.id === gastoEditar.id ? ((data?.[0] as GastoMaterial | undefined) || g) : g))
    );
    setMostrarFormularioGasto?.(false);
    setGastoEditar?.(null);
    alert('✅ Gasto de material actualizado correctamente');
  }, [setGastosMaterial, setGastoEditar, setMostrarFormularioGasto]);

  const agregarGastoMaterial = useCallback(async (gastoData: GastoInput) => {
    const gastoValidado: TablesInsert<'gastos_material'> = {
      concepto: gastoData.concepto?.trim() || '',
      cantidad: parseFloat(String(gastoData.cantidad ?? 0)),
      fecha_gasto: gastoData.fecha_gasto || '',
      categoria: gastoData.categoria || 'otros',
    };
    if (!gastoValidado.concepto) throw new Error('El concepto es obligatorio');
    if (!gastoValidado.cantidad || gastoValidado.cantidad <= 0) throw new Error('La cantidad debe ser mayor a 0');
    if (!gastoValidado.fecha_gasto) throw new Error('La fecha del gasto es obligatoria');
    const { data, error } = await supabase
      .from('gastos_material')
      .insert([gastoValidado])
      .select();
    if (error) throw error;
    setGastosMaterial(prev => [((data?.[0] as GastoMaterial | undefined) || ({} as GastoMaterial)), ...prev]);
    setMostrarFormularioGasto?.(false);
    alert('✅ Gasto de material registrado correctamente');
  }, [setGastosMaterial, setMostrarFormularioGasto]);

  return {
    eliminarGastoMaterial,
    editarGastoMaterial,
    actualizarGastoMaterial,
    agregarGastoMaterial,
  };
}




