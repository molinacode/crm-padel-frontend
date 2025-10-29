export default function FichaAlumnoTabPagos({ pagos }) {
  if (pagos.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>💸</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          No hay pagos registrados
        </h3>
        <p className='text-gray-500 dark:text-dark-text2'>
          Este alumno no tiene pagos registrados
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {pagos.map(pago => (
        <div
          key={pago.id}
          className='flex justify-between items-center p-4 bg-gray-50 dark:bg-dark-surface2 rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow'
        >
          <div className='flex items-center space-x-4'>
            <div className='w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center'>
              <span className='text-green-600 dark:text-green-400 text-xl'>
                💰
              </span>
            </div>
            <div>
              <p className='font-semibold text-gray-900 dark:text-dark-text text-lg'>
                €{pago.cantidad}
              </p>
              <p className='text-sm text-gray-600 dark:text-dark-text2'>
                Mes: {pago.mes_cubierto}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-500 dark:text-dark-text2'>
              {pago.fecha_pago
                ? new Date(pago.fecha_pago).toLocaleDateString('es-ES')
                : 'Sin fecha'}
            </p>
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
              ✅ Pagado
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
