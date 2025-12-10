export default function InstalacionesStatsCard({
  titulo,
  color,
  estadisticas,
  onClick,
}) {
  // Valores por defecto si estadisticas no está definido
  const stats = estadisticas || {
    ingresos: 0,
    gastos: 0,
    balance: 0,
  };

  const ingresos = stats.ingresos || 0;
  const gastos = stats.gastos || 0;
  const balance = stats.balance || 0;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-300 dark:hover:border-blue-600',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'hover:border-purple-300 dark:hover:border-purple-600',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'hover:border-orange-300 dark:hover:border-orange-600',
    },
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-600',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200 ${colors.border}`}
      onClick={onClick}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className={`p-3 ${colors.bg} rounded-xl`}>
          <svg
            className={`w-6 h-6 ${colors.text}`}
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
        <span className='text-sm font-medium text-gray-500 dark:text-dark-text2'>
          {titulo}
        </span>
        <svg
          className='w-4 h-4 text-gray-400 dark:text-dark-text2'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9 5l7 7-7 7'
          />
        </svg>
      </div>
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-600 dark:text-dark-text2'>
            Ingresos:
          </span>
          <span className='font-semibold text-green-600 dark:text-green-400'>
            +{ingresos.toFixed(2)}€
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-sm text-gray-600 dark:text-dark-text2'>
            Gastos:
          </span>
          <span className='font-semibold text-red-600 dark:text-red-400'>
            -{gastos.toFixed(2)}€
          </span>
        </div>
        <div className='border-t border-gray-200 dark:border-dark-border pt-2'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-700 dark:text-dark-text'>
              Balance:
            </span>
            <span
              className={`font-bold ${
                balance >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {balance >= 0 ? '+' : ''}
              {balance.toFixed(2)}€
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
