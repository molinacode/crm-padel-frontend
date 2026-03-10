/**
 * Componente para el encabezado del Dashboard
 */

export default function DashboardHeader() {
  return (
    <div className='bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
        <div>
          <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight'>
            Dashboard
          </h1>
          <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
            Visión general de tu academia de pádel
          </p>
        </div>
        <div className='flex items-center gap-4 sm:gap-6'>
          <div className='text-right'>
            <p className='text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
              Hoy
            </p>
            <p className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white'>
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
