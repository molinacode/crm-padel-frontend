import { Link } from 'react-router-dom';

export default function SeguimientoHeader({ alumno }) {
  if (!alumno) return null;

  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/30'>
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6'>
        <div className='flex items-center gap-4'>
          <Link
            to='/alumnos'
            className='bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
          >
            <svg
              className='w-8 h-8 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
              />
            </svg>
          </Link>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              Seguimiento: {alumno.nombre}
            </h1>
            <p className='text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base'>
              Registro de progreso y observaciones del alumno
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
