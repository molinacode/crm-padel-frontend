import { formatearMesLegible } from '../../utils/calcularDeudas';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobilePagoCard from '../common/MobilePagoCard';

export default function PagosHistorial({ pagos, onEditar, onEliminar }) {
  const isMobile = useIsMobile(1024);

  if (!pagos || pagos.length === 0) {
    return (
      <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-12'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>💸</div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            No hay pagos registrados
          </h3>
          <p className='text-sm text-gray-500 dark:text-dark-text2'>
            Los pagos registrados aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  // Vista móvil: tarjetas reutilizables
  if (isMobile) {
    return (
      <div className='space-y-3'>
        {pagos.map(pago => (
          <MobilePagoCard
            key={pago.id}
            pago={pago}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        ))}
      </div>
    );
  }

  // Vista desktop: tabla mejorada
  return (
    <>
      <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-100 dark:divide-gray-800'>
            <thead className='bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Alumno
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Cantidad
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Tipo
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Mes/Período
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Fecha
                </th>
                <th className='px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Método
                </th>
                <th className='px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-dark-surface divide-y divide-gray-100 dark:divide-gray-800'>
              {pagos.map(pago => (
                <tr
                  key={pago.id}
                  className='hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0'>
                        <span className='text-green-600 dark:text-green-400 text-lg'>
                          💰
                        </span>
                      </div>
                      <div className='font-medium text-gray-900 dark:text-dark-text'>
                        {pago.alumnos?.nombre || 'Alumno eliminado'}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'>
                      €{pago.cantidad}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'>
                      {pago.tipo_pago === 'mensual' ? '📆 Mensual' : pago.tipo_pago === 'clases' ? '🎯 Clases' : pago.tipo_pago || 'N/A'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                    {pago.mes_cubierto ? (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                        {formatearMesLegible(pago.mes_cubierto)}
                      </span>
                    ) : pago.fecha_inicio && pago.fecha_fin ? (
                      <span className='text-xs'>
                        {new Date(pago.fecha_inicio).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        -{' '}
                        {new Date(pago.fecha_fin).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>-</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                    {pago.fecha_pago
                      ? new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {pago.metodo ? (
                      <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize'>
                        {pago.metodo}
                      </span>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500 text-xs'>-</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='inline-flex gap-2'>
                      <button
                        onClick={() => onEditar?.(pago)}
                        className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors'
                        title='Editar pago'
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => onEliminar?.(pago.id)}
                        className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors'
                        title='Eliminar pago'
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
