import { supabase } from '../../lib/supabase';

type OrigenAsignacion = 'escuela' | 'interna';

interface OrigenAsignacionSelectorProps {
  origenAsignacion: OrigenAsignacion;
  setOrigenAsignacion: (origen: OrigenAsignacion) => void;
  claseId?: string | null;
  asignadosCount?: number;
}

interface SupabaseUntyped {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: unknown }>;
    };
  };
}

export default function OrigenAsignacionSelector({
  origenAsignacion,
  setOrigenAsignacion,
  claseId,
  asignadosCount = 0,
}: OrigenAsignacionSelectorProps) {
  const handleOrigenChange = async (nuevoOrigen: OrigenAsignacion) => {
    const origenAnterior = origenAsignacion;
    setOrigenAsignacion(nuevoOrigen);

    if (asignadosCount > 0 && claseId) {
      try {
        const supabaseUntyped = supabase as unknown as SupabaseUntyped;
        const { error } = await supabaseUntyped
          .from('alumnos_clases')
          .update({ origen: nuevoOrigen })
          .eq('clase_id', claseId);

        if (error) throw error;

        console.log(
          `✅ Origen actualizado a "${nuevoOrigen}" para ${asignadosCount} asignación(es) existente(s)`
        );
      } catch (err) {
        console.error('Error actualizando origen:', err);
        alert('❌ Error al actualizar el origen de las asignaciones existentes');
        setOrigenAsignacion(origenAnterior);
      }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">🏷️</span>
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
          Origen de Asignación
        </h4>
      </div>
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="origen"
            value="escuela"
            checked={origenAsignacion === 'escuela'}
            onChange={e => handleOrigenChange(e.target.value as OrigenAsignacion)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🏫 Escuela (Requiere pago)
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="origen"
            value="interna"
            checked={origenAsignacion === 'interna'}
            onChange={e => handleOrigenChange(e.target.value as OrigenAsignacion)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🏠 Interna (Sin pago)
          </span>
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {origenAsignacion === 'escuela'
          ? 'Los alumnos asignados con origen "Escuela" requieren pago mensual o por clases.'
          : 'Los alumnos asignados con origen "Interna" no requieren pago directo.'}
        {asignadosCount > 0 && (
          <span className="block mt-1 text-blue-600 dark:text-blue-400">
            💡 Al cambiar el origen, se actualizarán todas las asignaciones existentes (
            {asignadosCount} alumno{asignadosCount !== 1 ? 's' : ''})
          </span>
        )}
      </p>
    </div>
  );
}
