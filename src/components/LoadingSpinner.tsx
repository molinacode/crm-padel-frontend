import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SpinnerSize = 'small' | 'medium' | 'large' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'medium',
  text = 'Cargando...',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses: Record<SpinnerSize, string> = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className='relative inline-block'>
        <div
          className={`animate-spin rounded-full border-t-2 border-l-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`}
        ></div>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div
            className={`bg-blue-600 dark:bg-blue-400 rounded-full opacity-20 ${
              size === 'xl'
                ? 'w-8 h-8'
                : size === 'large'
                  ? 'w-6 h-6'
                  : size === 'medium'
                    ? 'w-4 h-4'
                    : 'w-3 h-3'
            }`}
          ></div>
        </div>
      </div>
      {text && (
        <p className='text-gray-700 dark:text-gray-300 text-base font-semibold tracking-tight'>
          {text}
        </p>
      )}
    </div>
  );
}

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  className?: string;
  showSpinner?: boolean;
}

export function LoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  showSpinner = true,
  ...props
}: LoadingButtonProps) {
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

interface SubtleLoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export function SubtleLoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}: SubtleLoadingButtonProps) {
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

interface InlineLoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export function InlineLoadingButton({
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}: InlineLoadingButtonProps) {
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

interface LoadingCardProps {
  text?: string;
}

export function LoadingCard({ text = 'Cargando datos...' }: LoadingCardProps) {
  return (
    <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
      <LoadingSpinner size='large' text={text} />
    </div>
  );
}

interface LoadingTableProps {
  columns?: number;
}

export function LoadingTable({ columns = 4 }: LoadingTableProps) {
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
