import { Link } from 'react-router-dom';

export default function ProfesoresHeader() {
  return (
    <div className='bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-rose-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
        <div className='flex items-center gap-5'>
          <div className='bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl'>
            <svg
              className='w-9 h-9 text-purple-600 dark:text-purple-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight'>
              Profesores
            </h1>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
              Gestiona el personal docente
            </p>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row gap-3'>
          <Link
            to='/profesores/nuevo'
            className='bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2'
          >
            <svg
              className='w-5 h-5'
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
            Nuevo Profesor
          </Link>
        </div>
      </div>
    </div>
  );
}
