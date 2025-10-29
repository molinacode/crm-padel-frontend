export default function PagosHistorial({ pagos, onEditar, onEliminar }) {
  if (!pagos || pagos.length === 0) {
    return (
      <div className='p-6 text-sm text-gray-500 dark:text-dark-text2'>
        Sin pagos registrados.
      </div>
    );
  }
  return (
    <div className='overflow-auto rounded-2xl border border-gray-100 dark:border-dark-border'>
      <table className='min-w-full divide-y divide-gray-100 dark:divide-gray-800'>
        <thead className='bg-gray-50 dark:bg-gray-900'>
          <tr>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Alumno
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Cantidad
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Mes
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Fecha
            </th>
            <th className='px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className='bg-white dark:bg-dark-surface divide-y divide-gray-100 dark:divide-gray-800'>
          {pagos.map(pago => (
            <tr key={pago.id}>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200'>
                {pago.alumnos?.nombre || 'Alumno eliminado'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                €{pago.cantidad}
              </td>
              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                {pago.mes_cubierto || '-'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                {pago.fecha_pago
                  ? new Date(pago.fecha_pago).toLocaleDateString('es-ES')
                  : '-'}
              </td>
              <td className='px-4 py-3 text-sm text-right'>
                <div className='inline-flex gap-2'>
                  <button
                    className='text-blue-600 text-xs'
                    onClick={() => onEditar?.(pago)}
                  >
                    Editar
                  </button>
                  <button
                    className='text-red-600 text-xs'
                    onClick={() => onEliminar?.(pago.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
