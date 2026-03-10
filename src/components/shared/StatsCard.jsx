/**
 * Componente reutilizable para mostrar una tarjeta de estadística
 * @param {object} props
 * @param {string} props.title - Título de la tarjeta
 * @param {number|string} props.value - Valor a mostrar
 * @param {React.ReactNode} props.icon - Icono SVG
 * @param {string} props.color - Color del tema ('blue', 'green', 'purple', 'yellow', 'red', 'orange', 'indigo')
 * @param {string} props.subtitle - Subtítulo descriptivo
 * @param {function} props.onClick - Función a ejecutar al hacer clic
 * @param {React.ReactNode} props.action - Botón o elemento de acción adicional
 */

import PropTypes from 'prop-types';

export default function StatsCard({
  title,
  value,
  icon,
  color = 'blue',
  subtitle,
  onClick,
  action,
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50',
      ring: 'focus-within:ring-blue-500',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      text: 'text-green-600 dark:text-green-400',
      hover: 'group-hover:bg-green-100 dark:group-hover:bg-green-950/50',
      ring: 'focus-within:ring-green-500',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      text: 'text-purple-600 dark:text-purple-400',
      hover: 'group-hover:bg-purple-100 dark:group-hover:bg-purple-950/50',
      ring: 'focus-within:ring-purple-500',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      hover: 'group-hover:bg-yellow-100 dark:group-hover:bg-yellow-950/50',
      ring: 'focus-within:ring-yellow-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      hover: 'group-hover:bg-red-100 dark:group-hover:bg-red-950/50',
      ring: 'focus-within:ring-red-500',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
      hover: 'group-hover:bg-orange-100 dark:group-hover:bg-orange-950/50',
      ring: 'focus-within:ring-orange-500',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      hover: 'group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50',
      ring: 'focus-within:ring-indigo-500',
    },
  };

  const classes = colorClasses[color] || colorClasses.blue;

  const baseClasses = `
    bg-white dark:bg-dark-surface
    p-6 
    rounded-2xl 
    border border-gray-100 dark:border-dark-border
    shadow-sm 
    hover:shadow-md 
    transition-all duration-200 
    ${onClick ? 'cursor-pointer' : ''}
    focus-within:ring-2 focus-within:ring-offset-2 ${classes.ring}
    group
    ${onClick ? 'min-h-[120px]' : 'min-h-[100px]'}
  `;

  return (
    <div className={baseClasses} onClick={onClick} tabIndex={onClick ? 0 : -1}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 tracking-wide uppercase">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`${classes.bg} p-3 rounded-xl ${classes.hover} transition-colors`}
          >
            <div className={`w-7 h-7 ${classes.text}`}>{icon}</div>
          </div>
        )}
      </div>
      {subtitle && (
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {subtitle}
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.node,
  color: PropTypes.oneOf([
    'blue',
    'green',
    'purple',
    'yellow',
    'red',
    'orange',
    'indigo',
  ]),
  subtitle: PropTypes.string,
  onClick: PropTypes.func,
  action: PropTypes.node,
};

