export default function InstalacionesDetalleResumen({ totalIngresos, totalGastos, balance, formatearMoneda }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30'>
        <div className='flex items-center gap-3'>
          <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-lg'>
            <svg className='w-6 h-6 text-green-600 dark:text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium text-green-600 dark:text-green-400'>Total Ingresos</p>
            <p className='text-2xl font-bold text-green-700 dark:text-green-300'>{formatearMoneda(totalIngresos)}</p>
          </div>
        </div>
      </div>

      <div className='bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30'>
        <div className='flex items-center gap-3'>
          <div className='bg-red-100 dark:bg-red-900/30 p-3 rounded-lg'>
            <svg className='w-6 h-6 text-red-600 dark:text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium text-red-600 dark:text-red-400'>Total Gastos</p>
            <p className='text-2xl font-bold text-red-700 dark:text-red-300'>{formatearMoneda(totalGastos)}</p>
          </div>
        </div>
      </div>

      <div className={`rounded-xl p-4 border ${balance >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'}`}>
        <div className='flex items-center gap-3'>
          <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
            <svg className={`w-6 h-6 ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatearMoneda(balance)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


