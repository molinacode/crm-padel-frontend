/**
 * Componente reutilizable para tarjetas móviles con acciones
 * Útil para listas de pagos, gastos, eventos, etc.
 */

import { useState } from 'react';
import ActionBottomSheet from './ActionBottomSheet';

export default function MobileCard({
  title,
  subtitle,
  icon,
  iconBg = 'bg-blue-100 dark:bg-blue-900/30',
  iconColor = 'text-blue-600 dark:text-blue-400',
  badges = [],
  onActionClick,
  actions = [],
  children,
  className = '',
}) {
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  const handleActionClick = e => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick();
    } else if (actions.length > 0) {
      setMostrarModalAcciones(true);
    }
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            {icon && (
              <div className='flex items-center gap-3 mb-2'>
                <div
                  className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <span className={`${iconColor} text-xl`}>{icon}</span>
                </div>
                <div className='flex-1 min-w-0'>
                  {title && (
                    <h4 className='font-semibold text-gray-900 dark:text-dark-text truncate'>
                      {title}
                    </h4>
                  )}
                  {subtitle && (
                    <p className='text-xs text-gray-500 dark:text-dark-text2'>{subtitle}</p>
                  )}
                </div>
              </div>
            )}
            {!icon && title && (
              <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                {title}
              </h4>
            )}
            {!icon && subtitle && (
              <p className='text-xs text-gray-500 dark:text-dark-text2 mb-2'>{subtitle}</p>
            )}
            {badges.length > 0 && (
              <div className='flex flex-wrap items-center gap-2 mt-3'>
                {badges.map((badge, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.colorClass || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    {badge.icon && <span className='mr-1'>{badge.icon}</span>}
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
            {children && <div className='mt-2'>{children}</div>}
          </div>
          {(actions.length > 0 || onActionClick) && (
            <button
              onClick={handleActionClick}
              className='p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 flex-shrink-0'
              aria-label='Ver acciones'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      {actions.length > 0 && (
        <ActionBottomSheet
          isOpen={mostrarModalAcciones}
          onClose={() => {
            setMostrarModalAcciones(false);
          }}
          title={title}
          subtitle={subtitle}
          badges={badges}
          actions={actions}
        />
      )}
    </>
  );
}

