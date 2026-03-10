export default function InstalacionesInfoBox() {
  return (
    <div className='bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/30'>
      <div className='flex items-center gap-3 mb-4'>
        <div className='text-2xl'>ℹ️</div>
        <div>
          <h3 className='font-semibold text-blue-900 dark:text-blue-100'>Información</h3>
          <p className='text-sm text-blue-700 dark:text-blue-300'>
            Los ingresos incluyen pagos reales + clases internas (15€), los gastos son alquileres de escuela (-21€)
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
        <div className='bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-lg'>💰</span>
            <span className='font-medium text-gray-700 dark:text-dark-text2'>Ingresos:</span>
          </div>
          <ul className='text-gray-600 dark:text-dark-text2 space-y-1'>
            <li>• Pagos reales de alumnos</li>
            <li>• Clases internas: +15€</li>
          </ul>
        </div>
        <div className='bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-lg'>💸</span>
            <span className='font-medium text-gray-700 dark:text-dark-text2'>Gastos:</span>
          </div>
          <ul className='text-gray-600 dark:text-dark-text2 space-y-1'>
            <li>• Alquileres de escuela: -21€</li>
            <li>• Gastos de material deportivo</li>
          </ul>
        </div>
        <div className='bg-white dark:bg-dark-surface rounded-lg p-3 border border-orange-200 dark:border-orange-800/30 md:col-span-2'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-lg'>🗑️</span>
            <span className='font-medium text-gray-700 dark:text-dark-text2'>Eventos eliminados:</span>
          </div>
          <p className='text-sm text-gray-600 dark:text-dark-text2'>
            Los eventos eliminados o cancelados NO cuentan en los gastos de instalaciones.
          </p>
        </div>
      </div>
    </div>
  );
}


