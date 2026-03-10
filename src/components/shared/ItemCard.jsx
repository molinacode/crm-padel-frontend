/**
 * Componente reutilizable para items en listas (huecos, clases, etc.)
 * @param {object} props
 */

import PropTypes from 'prop-types';

export default function ItemCard({
  title,
  subtitle,
  date,
  value,
  color = 'blue',
  onClick,
  onButtonClick,
  buttonText,
  children,
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-950/30',
    green:
      'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-950/30',
    purple:
      'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-950/30',
    yellow:
      'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-950/30',
    red: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/30',
    orange:
      'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/30',
    indigo:
      'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/30',
  };

  const buttonColors = {
    blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
  };

  const classes = colorClasses[color] || colorClasses.blue;
  const buttonClass = buttonColors[color] || buttonColors.blue;

  return (
    <div
      className={`flex items-center justify-between p-5 ${classes} rounded-2xl border transition-all duration-200 cursor-pointer group min-h-[52px] focus-within:ring-2 focus-within:ring-offset-2`}
      onClick={onClick}
      title={onClick ? 'Hacer clic para ver detalles' : undefined}
    >
      <div className='min-w-0 mr-4 flex-1'>
        <p className='font-semibold text-gray-900 dark:text-white truncate mb-1'>
          {title}
        </p>
        {subtitle && (
          <p className='text-sm text-gray-600 dark:text-gray-400 truncate'>
            {subtitle}
          </p>
        )}
        {date && (
          <p className='text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1'>
            📅 {date}
          </p>
        )}
        {children}
      </div>
      <div className='text-right flex-shrink-0'>
        {value && (
          <span className='inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-white border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 shadow-sm'>
            {value}
          </span>
        )}
        {buttonText && onButtonClick && (
          <button
            onClick={e => {
              e.stopPropagation();
              onButtonClick();
            }}
            className={`mt-2 w-full px-4 py-2 ${buttonClass} text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[32px] opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            {buttonText} →
          </button>
        )}
      </div>
    </div>
  );
}

ItemCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  date: PropTypes.string,
  value: PropTypes.string,
  color: PropTypes.oneOf([
    'blue',
    'green',
    'purple',
    'yellow',
    'red',
    'orange',
    'indigo',
  ]),
  onClick: PropTypes.func,
  onButtonClick: PropTypes.func,
  buttonText: PropTypes.string,
  children: PropTypes.node,
};
