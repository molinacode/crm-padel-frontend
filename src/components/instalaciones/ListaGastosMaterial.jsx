export default function ListaGastosMaterial({ gastos = [], onEditar, onEliminar }) {
  if (!Array.isArray(gastos) || gastos.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>📦</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          No hay gastos de material
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-4'>
          Registra el primer gasto de material para comenzar el seguimiento
        </p>
      </div>
    );
  }

  const primeros = gastos.slice(0, 10);

  return (
    <div className='space-y-3'>
      {primeros.map(gasto => (
        <div
          key={gasto.id}
          className='p-4 border border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface hover:shadow-sm transition-shadow'
        >
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <span className='inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'>
                  🧾
                </span>
                <div>
                  <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                    {gasto.concepto || 'Gasto'}
                  </h4>
                  <div className='text-xs text-gray-500 dark:text-dark-text2'>
                    {gasto.categoria || 'otros'}
                  </div>
                </div>
              </div>
              {gasto.descripcion && gasto.descripcion.trim() && (
                <p className='text-sm text-gray-600 dark:text-dark-text2 mb-1 mt-2'>
                  {gasto.descripcion}
                </p>
              )}
              <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-dark-text2'>
                <span>
                  📅{' '}
                  {gasto.fecha_gasto
                    ? new Date(gasto.fecha_gasto).toLocaleDateString('es-ES')
                    : 'Sin fecha'}
                </span>
                {gasto.proveedor && <span>🏪 {gasto.proveedor}</span>}
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='text-right'>
                <div className='text-lg font-bold text-red-600 dark:text-red-400'>
                  -{gasto.cantidad}€
                </div>
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() => onEditar?.(gasto)}
                  className='p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
                  title='Editar gasto'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                  </svg>
                </button>
                <button
                  onClick={() => onEliminar?.(gasto)}
                  className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                  title='Eliminar gasto'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {gastos.length > 10 && (
        <p className='text-center text-sm text-gray-500 dark:text-dark-text2'>
          Y {gastos.length - 10} gastos más...
        </p>
      )}
    </div>
  );
}


