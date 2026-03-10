export default function InstalacionesDetalleHeader({ titulo, onBack }) {
  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/30'>
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>
        <div className='flex items-center gap-4'>
          <button
            onClick={onBack}
            className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
          >
            <svg className='w-6 h-6 text-blue-600 dark:text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
            </svg>
          </button>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              {titulo}
            </h1>
            <p className='text-gray-600 dark:text-dark-text2'>Ingresos y gastos detallados</p>
          </div>
        </div>
      </div>
    </div>
  );
}


