import { SectionCard } from '../shared';

/**
 * Componente para mostrar últimos pagos en el Dashboard
 */
export default function DashboardUltimosPagos({ ultimosPagos }) {
  const icon = (
    <svg
      className='w-7 h-7 text-green-600 dark:text-green-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
      />
    </svg>
  );

  return (
    <SectionCard title='Últimos pagos' icon={icon} iconColor='green'>
      {ultimosPagos.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-gray-500 dark:text-gray-400 text-base mb-2'>
            No hay pagos registrados
          </p>
          <p className='text-sm text-gray-400 dark:text-gray-500'>
            Los pagos aparecerán aquí cuando se registren
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          {ultimosPagos.map((pago, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:border-green-700 transition-all duration-200'
            >
              <div className='flex-1'>
                <p className='font-semibold text-gray-900 dark:text-white mb-1'>
                  {pago.alumno}
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                  {pago.mes}
                </p>
              </div>
              <div className='text-right ml-4'>
                <p className='font-bold text-lg text-green-700 dark:text-green-400 tabular-nums'>
                  €{pago.cantidad.toLocaleString('es-ES')}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                  {pago.fecha}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
