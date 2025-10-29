export default function ProfesorHeader() {
  return (
    <div className='bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-purple-100 dark:border-purple-800/30'>
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6'>
        <div className='flex items-center gap-4'>
          <div className='bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl'>
            <svg
              className='w-8 h-8 text-purple-600 dark:text-purple-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              Vista del Profesor
            </h1>
            <p className='text-gray-600 dark:text-dark-text2 mb-0.5 text-sm sm:text-base'>
              Consulta las clases semanales y alumnos asignados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
