/**
 * Componente para mostrar información de huecos disponibles
 */
export default function HuecosInfo({
  huecosDisponibles,
  alumnosSeleccionados,
}) {
  return (
    <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4'>
      <div className='flex justify-between items-center gap-4 flex-wrap'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>🕳️</span>
          <span className='font-medium text-gray-700 dark:text-dark-text2'>
            {huecosDisponibles} hueco{huecosDisponibles !== 1 ? 's' : ''} disponible{huecosDisponibles !== 1 ? 's' : ''}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            {alumnosSeleccionados.size}/{huecosDisponibles} seleccionados
          </span>
        </div>
        {huecosDisponibles === 0 && (
          <span className='text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1'>
            <span>⚠️</span>
            No hay huecos disponibles
          </span>
        )}
      </div>
    </div>
  );
}

