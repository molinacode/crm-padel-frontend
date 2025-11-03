export default function SeguimientoStatsCards({ stats, seguimientosLength }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
              <span className='text-green-600 text-lg'>📊</span>
            </div>
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>Asistencia</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {stats.porcentajeAsistencia}%
            </p>
          </div>
        </div>
      </div>
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 text-lg'>📅</span>
            </div>
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>Clases Totales</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {stats.totalAsistencias}
            </p>
          </div>
        </div>
      </div>
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
              <span className='text-purple-600 text-lg'>📝</span>
            </div>
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>Seguimientos</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {seguimientosLength}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


