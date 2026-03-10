export default function AsistenciasHeader({
  fecha,
  setFecha,
  sincronizando,
}) {
  return (
    <div className='bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-cyan-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
        <div className='flex items-center gap-5'>
          <div className='bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl'>
            <svg
              className='w-9 h-9 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight'>
              Asistencia Diaria
            </h1>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
              Control de asistencia por clase
            </p>
          </div>
        </div>
        <div className='bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border'>
          <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
            Fecha:
          </label>
          <input
            type='date'
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className='px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
          />
          {sincronizando && (
            <div className='mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400'>
              <svg
                className='w-4 h-4 animate-spin'
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
              Sincronizando asignaciones...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

