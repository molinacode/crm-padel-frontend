import { useNavigate } from 'react-router-dom';

/**
 * Componente para las tarjetas de estadísticas del Dashboard
 */

export default function DashboardStatsCards({ stats, navigate }) {
  const iconUsers = (
    <svg
      className='w-7 h-7 text-blue-600 dark:text-blue-400'
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
  );

  const iconMoney = (
    <svg
      className='w-7 h-7 text-green-600 dark:text-green-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
      />
    </svg>
  );

  const iconCalendar = (
    <svg
      className='w-7 h-7 text-purple-600 dark:text-purple-400'
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
  );

  const iconWarning = (
    <svg
      className='w-7 h-7 text-yellow-600 dark:text-yellow-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      />
    </svg>
  );

  const iconDollar = (
    <svg
      className='w-7 h-7 text-red-600 dark:text-red-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
      />
    </svg>
  );

  const iconUsers2 = (
    <svg
      className='w-7 h-7 text-indigo-600 dark:text-indigo-400'
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
  );

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6'>
      {/* Alumnos */}
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 group'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
              Alumnos
            </p>
            <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
              {stats.totalAlumnos}
            </p>
          </div>
          <div className='bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors'>
            {iconUsers}
          </div>
        </div>
        <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
          Total registrados
        </div>
      </div>

      {/* Ingresos */}
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 group'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
              Ingresos
            </p>
            <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
              €{stats.ingresosMes.toLocaleString('es-ES')}
            </p>
          </div>
          <div className='bg-green-50 dark:bg-green-950/30 p-3 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-950/50 transition-colors'>
            {iconMoney}
          </div>
        </div>
        <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
          Este mes
        </div>
      </div>

      {/* Clases */}
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 group'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
              Clases
            </p>
            <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
              {stats.clasesEstaSemana}
            </p>
          </div>
          <div className='bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-950/50 transition-colors'>
            {iconCalendar}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
            Esta semana
          </div>
          <button
            onClick={() => navigate('/clases?tab=proximas&view=table')}
            className='px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 min-h-[32px]'
            title='Ver clases'
          >
            Ver →
          </button>
        </div>
      </div>

      {/* Clases incompletas */}
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:ring-offset-2 group'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
              Incompletas
            </p>
            <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
              {stats.clasesIncompletas.length}
            </p>
          </div>
          <div className='bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-xl group-hover:bg-yellow-100 dark:group-hover:bg-yellow-950/50 transition-colors'>
            {iconWarning}
          </div>
        </div>
        <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
          Necesitan alumnos
        </div>
      </div>

      {/* Alumnos con deuda */}
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2 group'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
              Pendientes
            </p>
            <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
              {stats.alumnosConDeuda}
            </p>
          </div>
          <div className='bg-red-50 dark:bg-red-950/30 p-3 rounded-xl group-hover:bg-red-100 dark:group-hover:bg-red-950/50 transition-colors'>
            {iconDollar}
          </div>
        </div>
        <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
          Pagos pendientes
        </div>
      </div>

      {/* Profesores */}
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 group'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase'>
              Profesores
            </p>
            <p className='text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums'>
              {stats.totalProfesores}
            </p>
          </div>
          <div className='bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50 transition-colors'>
            {iconUsers2}
          </div>
        </div>
        <div className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
          {stats.profesoresActivos} activos
        </div>
      </div>
    </div>
  );
}
