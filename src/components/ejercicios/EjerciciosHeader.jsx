import { Link } from 'react-router-dom';

export default function EjerciciosHeader({ onAsignarTematica }) {
  return (
    <div className='bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-amber-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
        <div className='flex items-center gap-5'>
          <div className='bg-orange-50 dark:bg-orange-950/30 p-4 rounded-2xl'>
            <svg
              className='w-9 h-9 text-orange-600 dark:text-orange-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 10V3L4 14h7v7l9-11h-7z'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight'>
              Ejercicios
            </h1>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
              Gestiona ejercicios y rutinas
            </p>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row gap-3'>
          <Link
            to='/ejercicios/nuevo'
            className='bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 px-7 rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-sm hover:shadow-md min-h-[48px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
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
            Nuevo Ejercicio
          </Link>
          <button
            onClick={onAsignarTematica}
            className='bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 px-7 rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-sm hover:shadow-md min-h-[48px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
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
            Asignar temática a clase
          </button>
        </div>
      </div>
    </div>
  );
}
