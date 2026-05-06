import type { Tables } from '../../types/supabase';

interface FichaEjercicioTabInstruccionesProps {
  ejercicio: Tables<'ejercicios'> & { variaciones?: string | null };
}

export default function FichaEjercicioTabInstrucciones({
  ejercicio,
}: FichaEjercicioTabInstruccionesProps) {
  const textoVariaciones =
    ejercicio.variaciones ?? ejercicio.variantes ?? null;

  return (
    <div className='space-y-6'>
      <div className='bg-gray-50 rounded-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          📋 Instrucciones Paso a Paso
        </h3>
        <div className='prose max-w-none'>
          <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
            {ejercicio.instrucciones ||
              'No hay instrucciones detalladas disponibles.'}
          </p>
        </div>
      </div>

      {textoVariaciones ? (
        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            🔄 Variaciones
          </h3>
          <div className='prose max-w-none'>
            <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
              {textoVariaciones}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
