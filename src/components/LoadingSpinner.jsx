import React from 'react';

export default function LoadingSpinner({
  size = 'medium',
  text = 'Cargando...',
  className = '',
}) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {text && (
        <p className='text-gray-600 dark:text-dark-text2 text-sm font-medium'>
          {text}
        </p>
      )}
    </div>
  );
}

// Componente para loading en botones - Versión mejorada
export function LoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  showSpinner = true,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <div className='flex items-center justify-center space-x-2'>
        {loading && showSpinner && (
          <div className='w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
        )}
        <span>{children}</span>
      </div>
    </button>
  );
}

// Componente para botones con indicador sutil
export function SubtleLoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''} relative`}
    >
      {children}
      {loading && (
        <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse'></div>
      )}
    </button>
  );
}

// Componente para botones con spinner al lado del texto
export function InlineLoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className} ${disabled || loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <div className='flex items-center justify-center space-x-2'>
        <span>{children}</span>
        {loading && (
          <div className='w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
        )}
      </div>
    </button>
  );
}

// Componente para loading en tarjetas
export function LoadingCard({ text = 'Cargando datos...' }) {
  return (
    <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
      <LoadingSpinner size='large' text={text} />
    </div>
  );
}

// Componente para loading en tablas
export function LoadingTable({ columns = 4 }) {
  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th
                  key={index}
                  className='text-left py-4 px-6 font-semibold text-gray-700'
                >
                  <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200'>
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className='py-4 px-6'>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse'></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
