/**
 * Componente genérico reutilizable para mostrar acciones en un bottom sheet móvil
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {string|ReactNode} props.subtitle - Subtítulo o información adicional
 * @param {Array} props.badges - Array de badges a mostrar (ej: [{label: 'Nivel', value: 'Iniciación'}])
 * @param {Array} props.actions - Array de acciones agrupadas por categoría
 *   Ejemplo:
 *   [
 *     {
 *       category: 'Acciones principales',
 *       items: [
 *         {
 *           id: 'editar',
 *           label: 'Editar',
 *           icon: '✏️',
 *           color: 'blue', // blue, orange, purple, gray, red, green, fuchsia
 *           badge: 'Opcional', // Texto adicional debajo del label
 *           onClick: () => {},
 *           disabled: false,
 *         }
 *       ]
 *     }
 *   ]
 */
import { useMemo } from 'react';

const colorClasses = {
  blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
  orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
  purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
  green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
  gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
  red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
  fuchsia: 'border-fuchsia-200 dark:border-fuchsia-800 bg-fuchsia-50 dark:bg-fuchsia-900/20 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30',
};

const textColorClasses = {
  blue: 'text-blue-700 dark:text-blue-300',
  orange: 'text-orange-700 dark:text-orange-300',
  purple: 'text-purple-700 dark:text-purple-300',
  green: 'text-green-700 dark:text-green-300',
  gray: 'text-gray-900 dark:text-dark-text',
  red: 'text-red-700 dark:text-red-300',
  fuchsia: 'text-fuchsia-700 dark:text-fuchsia-300',
};

export default function ActionBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  badges = [],
  actions = [],
}) {
  // Filtrar acciones vacías y agrupar por categoría
  const accionesAgrupadas = useMemo(() => {
    return actions.filter(group => group.items && group.items.length > 0);
  }, [actions]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300'
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* Bottom Sheet */}
      <div
        className='fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface rounded-t-3xl shadow-2xl z-[9999] max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out'
        style={{
          zIndex: 9999,
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className='flex justify-center pt-3 pb-2'>
          <div className='w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full' />
        </div>

        {/* Header */}
        <div className='px-6 pb-4 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex items-start justify-between mb-2'>
            <div className='flex-1'>
              {title && (
                <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className='text-sm text-gray-600 dark:text-dark-text2 mt-1'>
                  {subtitle}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className='ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
              aria-label='Cerrar'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-3'>
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    badge.colorClass ||
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {badge.icon && <span className='mr-1'>{badge.icon}</span>}
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Acciones agrupadas */}
        {accionesAgrupadas.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={`px-6 py-4 ${
              groupIndex > 0
                ? 'border-t border-gray-200 dark:border-dark-border'
                : ''
            }`}
          >
            {group.category && (
              <h4 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>
                {group.category}
              </h4>
            )}
            <div className='space-y-2'>
              {group.items.map(accion => {
                const colorClass =
                  colorClasses[accion.color] || colorClasses.gray;
                const textColorClass =
                  textColorClasses[accion.color] || textColorClasses.gray;

                return (
                  <button
                    key={accion.id}
                    onClick={() => {
                      if (!accion.disabled && accion.onClick) {
                        accion.onClick();
                        onClose();
                      }
                    }}
                    disabled={accion.disabled}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      accion.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    } ${colorClass}`}
                  >
                    <div className='flex items-center gap-3'>
                      {accion.icon && (
                        <span className='text-2xl'>{accion.icon}</span>
                      )}
                      <div className='text-left'>
                        <div
                          className={`font-semibold ${textColorClass}`}
                        >
                          {accion.label}
                        </div>
                        {accion.badge && (
                          <div className='text-xs text-gray-600 dark:text-gray-400 mt-0.5'>
                            {accion.badge}
                          </div>
                        )}
                      </div>
                    </div>
                    {!accion.disabled && (
                      <svg
                        className='w-5 h-5 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Espacio inferior */}
        <div className='h-4' />
      </div>
    </>
  );
}

