import { formatearMesLegible } from '../../utils/calcularDeudas';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobilePagoCard from '../common/MobilePagoCard';
import { generarReciboPagoPdf } from '../../utils/generarReciboPdf';

interface PagoHistorialRow {
  id: string;
  cantidad: number | null;
  tipo_pago?: string | null;
  mes_cubierto?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_pago?: string | null;
  metodo?: string | null;
  alumnos?: { nombre?: string | null } | null;
}

interface PagosHistorialProps {
  pagos: PagoHistorialRow[];
  onEditar?: (pago: PagoHistorialRow) => void;
  onEliminar?: (id: string) => void;
}

export default function PagosHistorial({
  pagos,
  onEditar,
  onEliminar,
}: PagosHistorialProps) {
  const isMobile = useIsMobile(1024);

  if (!pagos || pagos.length === 0) {
    return (
      <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-12'>
        <div className='text-center'>
          
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

  if (isMobile) {
    return (
      <div className='space-y-3'>
        {pagos.map(pago => (
          <MobilePagoCard
            key={pago.id}
            pago={{
              id: pago.id,
              cantidad: pago.cantidad ?? 0,
              fecha_pago: pago.fecha_pago,
              mes_cubierto: pago.mes_cubierto,
              tipo_pago: pago.tipo_pago,
              metodo: pago.metodo,
              alumnos: pago.alumnos,
            }}
            onEditar={
              onEditar
                ? cardPago => onEditar(cardPago as PagoHistorialRow)
                : undefined
            }
            onEliminar={onEliminar}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-100 dark:divide-gray-800'>
            <thead className=''>
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
                      <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#c9a658] text-sm font-semibold text-[#c9a658]'>
                        €
                      </div>
                      <div className='font-medium text-gray-900 dark:text-dark-text'>
                        {pago.alumnos?.nombre || 'Alumno eliminado'}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm font-semibold text-[#c9a658]'>
                      €{pago.cantidad}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-[#f5f1e8]'>
                      {pago.tipo_pago === 'mensual'
                        ? 'Mensual'
                        : pago.tipo_pago === 'clases'
                          ? 'Clases'
                          : pago.tipo_pago || 'N/A'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300'>
                    {pago.mes_cubierto ? (
                      <span className='text-sm text-[#d8d2c4]'>
                        {formatearMesLegible(pago.mes_cubierto)}
                      </span>
                    ) : pago.fecha_inicio && pago.fecha_fin ? (
                      <span className='text-xs'>
                        {new Date(pago.fecha_inicio).toLocaleDateString(
                          'es-ES',
                          {
                            day: '2-digit',
                            month: 'short',
                          }
                        )}{' '}
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
                      <span className='text-gray-400 dark:text-gray-500 text-xs'>
                        -
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='inline-flex gap-3'>
                      <button
                        type='button'
                        onClick={() => onEditar?.(pago)}
                        className='font-medium text-[#c9a658]'
                        title='Editar pago'
                      >
                        Editar
                      </button>
                      <button
                        type='button'
                        onClick={() => generarReciboPagoPdf(pago)}
                        className='font-medium text-[#d8d2c4]'
                        title='Descargar recibo PDF'
                      >
                        Recibo
                      </button>
                      <button
                        type='button'
                        onClick={() => onEliminar?.(pago.id)}
                        className='font-medium text-red-300'
                        title='Eliminar pago'
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
      </div>
    </>
  );
}
