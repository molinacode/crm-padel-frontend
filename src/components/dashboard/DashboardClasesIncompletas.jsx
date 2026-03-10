import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../shared';
import { formatearFecha } from '../../utils/dateUtils';

/**
 * Componente para mostrar clases incompletas en el Dashboard
 */
export default function DashboardClasesIncompletas({ clasesIncompletas }) {
  const navigate = useNavigate();

  const icon = (
    <svg
      className='w-7 h-7 text-yellow-600 dark:text-yellow-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      />
    </svg>
  );

  return (
    <SectionCard title='Clases incompletas' icon={icon} iconColor='yellow'>
      {clasesIncompletas.length === 0 ? (
        <p className='text-gray-500 dark:text-dark-text2 text-sm'>
          ¡Excelente! Todas las clases tienen alumnos asignados.
        </p>
      ) : (
        <>
          <div className='space-y-3'>
            {clasesIncompletas.slice(0, 5).map(clase => (
              <div
                key={clase.id}
                className='flex items-center justify-between p-5 bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 hover:border-yellow-200 dark:hover:border-yellow-700 transition-all duration-200 cursor-pointer group min-h-[52px] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
                onClick={() => {
                  if (!clase.eventoId) {
                    alert(
                      '⚠️ No hay un evento programado para esta clase aún.'
                    );
                    return;
                  }
                  navigate(
                    `/clases?tab=proximas&view=table&highlight=${clase.eventoId}`
                  );
                }}
                title='Hacer clic para ver este evento específico en la tabla'
              >
                <div className='flex-1'>
                  <p className='font-semibold text-gray-900 dark:text-white group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition-colors mb-1'>
                    {clase.nombre}
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {clase.nivel_clase} • {clase.dia_semana}
                  </p>
                  <p className='text-xs text-yellow-600 dark:text-yellow-400 font-semibold mt-1'>
                    📅{' '}
                    {clase.fecha === 'Próximamente'
                      ? 'Próximamente'
                      : formatearFecha(clase.fecha)}
                  </p>
                </div>
                <div className='text-right ml-4 flex-shrink-0'>
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm ${
                      clase.tipo_clase === 'particular'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700/50'
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700/50'
                    }`}
                  >
                    {clase.tipo_clase === 'particular'
                      ? '🎯 Particular'
                      : '👥 Grupal'}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (!clase.eventoId) {
                        alert(
                          '⚠️ No hay un evento programado para esta clase aún.'
                        );
                        return;
                      }
                      navigate(
                        `/clases?tab=proximas&view=table&highlight=${clase.eventoId}`
                      );
                    }}
                    className='mt-2 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 min-h-[32px] opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    Ver →
                  </button>
                </div>
              </div>
            ))}
          </div>
          {clasesIncompletas.length > 5 && (
            <p className='text-sm text-gray-500 dark:text-dark-text2 text-center mt-4'>
              Y {clasesIncompletas.length - 5} clases más...
            </p>
          )}
          <div className='pt-4 border-t border-yellow-100 dark:border-yellow-800/50'>
            <button
              onClick={() => navigate('/clases?tab=proximas&view=table')}
              className='w-full px-5 py-3.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2'
            >
              Ver todas las clases →
            </button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
