export default function ClasesHeader() {
  return (
    <div className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-green-100 dark:border-green-800/30'>
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6'>
        <div className='flex items-center gap-4'>
          <div className='bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl'>
            <svg
              className='w-8 h-8 text-green-600 dark:text-green-400'
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
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              Gestión de Clases
            </h1>
            <p className='text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base'>
              Programa y gestiona las clases de tu academia
            </p>
            <div className='flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm'>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/30 rounded'></div>
                <span className='text-gray-700 dark:text-dark-text2'>
                  🎯 Particular
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/30 rounded'></div>
                <span className='text-gray-700 dark:text-dark-text2'>
                  🏠 Interna
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/30 rounded'></div>
                <span className='text-gray-700 dark:text-dark-text2'>
                  🏫 Escuela
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded'></div>
                <span className='text-gray-700 dark:text-dark-text2'>
                  👥 Grupal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
