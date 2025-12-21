/**
 * Header del componente de asignar alumnos con botones de acción
 */
export default function AsignarAlumnosHeader({
  loading,
  onRecargar,
  onCancelar,
  onGuardar,
}) {
  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text mb-2'>
            👥 Asignar Alumnos a Clases
          </h2>
          <p className='text-gray-600 dark:text-dark-text2'>
            Selecciona una clase y asigna alumnos de forma intuitiva
          </p>
        </div>
        <div className='flex flex-wrap gap-3'>
          <button
            onClick={onRecargar}
            className='bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
            disabled={loading}
            title='Recargar datos'
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Actualizar
          </button>
          <button
            onClick={onCancelar}
            className='bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
          >
            <svg
              className='w-4 h-4'
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
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M5 13l4 4L19 7'
              />
            </svg>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

