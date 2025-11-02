export default function FichaEjercicioTabInstrucciones({ ejercicio }) {
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

      {ejercicio.variaciones && (
        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            🔄 Variaciones
          </h3>
          <div className='prose max-w-none'>
            <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
              {ejercicio.variaciones}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
