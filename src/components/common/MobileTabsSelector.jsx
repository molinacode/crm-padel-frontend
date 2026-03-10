/**
 * Componente reutilizable para tabs que se adapta a móvil
 * En móvil: muestra un selector dropdown o bottom sheet
 * En desktop: muestra las tabs normales
 */

import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import ActionBottomSheet from './ActionBottomSheet';

export default function MobileTabsSelector({
  tabs = [],
  activeTab,
  onTabChange,
  breakpoint = 1024,
  className = '',
}) {
  const isMobile = useIsMobile(breakpoint);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  if (!tabs || tabs.length === 0) return null;

  const tabActiva = tabs.find(t => t.key === activeTab) || tabs[0];

  // Vista móvil: selector con bottom sheet
  if (isMobile) {
    const acciones = tabs.map(tab => ({
      id: tab.key,
      label: tab.key === activeTab ? `✓ ${tab.label}` : tab.label,
      icon: tab.icon || '📋',
      color: tab.key === activeTab ? 'blue' : 'gray',
      onClick: () => {
        onTabChange(tab.key);
        setMostrarSelector(false);
      },
    }));

    return (
      <>
        <div className={`border-b border-gray-200 dark:border-dark-border ${className}`}>
          <button
            onClick={() => setMostrarSelector(true)}
            className='w-full py-4 px-4 flex items-center justify-between bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
          >
            <div className='flex items-center gap-3'>
              {tabActiva.icon && (
                <span className='text-xl'>{tabActiva.icon}</span>
              )}
              <span className='font-semibold text-gray-900 dark:text-dark-text'>
                {tabActiva.label}
              </span>
            </div>
            <svg
              className='w-5 h-5 text-gray-500 dark:text-dark-text2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
        </div>

        <ActionBottomSheet
          isOpen={mostrarSelector}
          onClose={() => setMostrarSelector(false)}
          title='Seleccionar sección'
          subtitle={`Actualmente: ${tabActiva.label}`}
          actions={[
            {
              category: 'Secciones',
              items: acciones,
            },
          ]}
        />
      </>
    );
  }

  // Vista desktop: tabs normales
  return (
    <div className={`border-b border-gray-200 dark:border-dark-border ${className}`}>
      <nav className='flex space-x-8 px-6 overflow-x-auto scrollbar-hide'>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
            }`}
          >
            {tab.icon && <span className='mr-2'>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

