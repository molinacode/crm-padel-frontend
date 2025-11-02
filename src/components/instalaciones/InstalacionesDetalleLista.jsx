export function ListaIngresos({ ingresos, formatearFecha, formatearMoneda }) {
  if (!ingresos || ingresos.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500 dark:text-dark-text2'>
        <div className='text-4xl mb-2'>📭</div>
        <p>No hay ingresos registrados</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {ingresos.map(ingreso => (
        <div
          key={ingreso.id}
          className='flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30'
        >
          <div>
            <p className='font-medium text-gray-900 dark:text-dark-text'>
              {ingreso.alumnos?.nombre || 'Pago sin alumno'}
            </p>
            <p className='text-sm text-gray-600 dark:text-dark-text2'>
              {formatearFecha(ingreso.fecha_pago)} • {ingreso.tipo_pago}
            </p>
            {ingreso.mes_cubierto && (
              <p className='text-xs text-gray-500 dark:text-dark-text2'>
                Mes: {ingreso.mes_cubierto}
              </p>
            )}
          </div>
          <div className='text-right'>
            <p className='font-bold text-green-700 dark:text-green-300'>
              +{formatearMoneda(ingreso.cantidad)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListaGastos({ gastos, formatearFecha, formatearMoneda }) {
  if (!gastos || gastos.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500 dark:text-dark-text2'>
        <div className='text-4xl mb-2'>📭</div>
        <p>No hay gastos registrados</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {gastos.map(gasto => (
        <div
          key={gasto.id}
          className='flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30'
        >
          <div>
            <p className='font-medium text-gray-900 dark:text-dark-text'>
              {gasto.concepto || 'Gasto sin concepto'}
            </p>
            <p className='text-sm text-gray-600 dark:text-dark-text2'>
              {formatearFecha(gasto.fecha_gasto)}
            </p>
            {gasto.descripcion && (
              <p className='text-xs text-gray-500 dark:text-dark-text2'>
                {gasto.descripcion}
              </p>
            )}
          </div>
          <div className='text-right'>
            <p className='font-bold text-red-700 dark:text-red-300'>
              -{formatearMoneda(gasto.cantidad)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
