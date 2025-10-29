import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../shared';
import { formatearFecha } from '../../utils/dateUtils';

/**
 * Componente para mostrar huecos por faltas en el Dashboard
 */
export default function DashboardHuecos({ huecosPorFaltas, totalHuecos }) {
  const navigate = useNavigate();

  const icon = (
    <svg
      className='w-7 h-7 text-orange-600 dark:text-orange-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );

  const badge = (
    <span className='ml-auto inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800'>
      {totalHuecos || 0} huecos
    </span>
  );

  return (
    <SectionCard
      title='Huecos por faltas'
      icon={icon}
      iconColor='orange'
      badge={badge}
    >
      {huecosPorFaltas?.length === 0 ? (
        <p className='text-gray-500 dark:text-dark-text2 text-sm'>
          No hay faltas próximas.
        </p>
      ) : (
        <div className='space-y-3'>
          {huecosPorFaltas.slice(0, 6).map(item => (
            <div
              key={`${item.claseId}-${item.fecha}`}
              className='flex items-center justify-between p-5 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-200 cursor-pointer group min-h-[52px] focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2'
              onClick={() =>
                navigate(
                  `/clases?tab=proximas&view=table&highlight=${item.eventoId}`
                )
              }
              title='Ir a la clase para asignar huecos'
            >
              <div className='min-w-0 mr-4 flex-1'>
                <p className='font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors mb-1'>
                  {item.nombre}
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-400 truncate'>
                  {item.nivel_clase} • {item.dia_semana}
                </p>
                <p className='text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1'>
                  📅{' '}
                  {item.fecha === 'Próximamente'
                    ? 'Próximamente'
                    : formatearFecha(item.fecha)}
                </p>
                {item.alumnosConFaltas?.length > 0 && (
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate font-medium'>
                    Libres:{' '}
                    {item.alumnosConFaltas
                      .map(
                        a =>
                          `${a.nombre}${a.derechoRecuperacion ? ' (recuperación)' : ''}`
                      )
                      .join(', ')}
                  </p>
                )}
              </div>
              <div className='text-right flex-shrink-0'>
                <span className='inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-white text-orange-700 border-2 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700/50 shadow-sm'>
                  {item.cantidadHuecos} hueco
                  {item.cantidadHuecos !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    navigate(
                      `/clases?tab=proximas&view=table&highlight=${item.eventoId}`
                    );
                  }}
                  className='mt-2 w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 min-h-[32px] opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  Asignar →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
