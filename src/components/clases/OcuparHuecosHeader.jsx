/**
 * Header del modal de ocupar huecos
 */
export default function OcuparHuecosHeader({
  esRecuperacion,
  evento,
  huecosDisponibles,
  onClose,
}) {
  return (
    <div className='bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 p-6 border-b border-gray-200 dark:border-dark-border'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl'>
            <svg
              className='w-6 h-6 text-orange-600 dark:text-orange-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
          </div>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
              {esRecuperacion
                ? '🔄 Ocupar Huecos para Recuperaciones'
                : 'Ocupar Huecos Disponibles'}
            </h2>
            <p className='text-gray-600 dark:text-dark-text2'>
              {evento.nombre} - {huecosDisponibles} hueco
              {huecosDisponibles !== 1 ? 's' : ''} disponible
              {huecosDisponibles !== 1 ? 's' : ''}
              {esRecuperacion && (
                <span className='ml-2 text-purple-600 dark:text-purple-400 font-medium'>
                  (Incluye alumnos con recuperaciones pendientes)
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

