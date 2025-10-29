export default function AsistenciasEmptyState({
  fecha,
  proximaFechaConClases,
  setFecha,
}) {
  return (
    <div className='bg-white dark:bg-dark-surface p-12 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border text-center'>
      <div className='bg-gray-100 dark:bg-gray-800/30 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center'>
        <svg
          className='w-12 h-12 text-gray-400 dark:text-gray-500'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </div>
      <h3 className='text-xl font-semibold text-gray-900 dark:text-dark-text mb-2'>
        No hay clases programadas
      </h3>
      <p className='text-gray-500 dark:text-dark-text2 text-lg mb-2'>
        Para la fecha seleccionada: <strong>{fecha}</strong>
      </p>
      {proximaFechaConClases ? (
        <div className='mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg inline-block'>
          <p className='text-blue-700 dark:text-blue-300 text-sm'>
            💡 <strong>Sugerencia:</strong> La próxima fecha con clases es{' '}
            <button
              onClick={() => setFecha(proximaFechaConClases)}
              className='underline font-semibold'
            >
              {new Date(proximaFechaConClases).toLocaleDateString('es-ES')}
            </button>
            .
          </p>
        </div>
      ) : (
        <p className='text-gray-400 dark:text-dark-text2 text-sm mb-4'>
          Selecciona otra fecha para ver las asistencias
        </p>
      )}
      <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4'>
        <p className='text-blue-700 dark:text-blue-300 text-sm'>
          💡 <strong>Tip:</strong> Puedes cambiar la fecha usando el selector
          de arriba para ver clases de otros días.
        </p>
      </div>
    </div>
  );
}

