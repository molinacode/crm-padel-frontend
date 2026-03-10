/**
 * Componente reutilizable para encabezados de página
 * @param {object} props
 * @param {string} props.title - Título principal de la página
 * @param {string} props.subtitle - Subtítulo descriptivo
 * @param {React.ReactNode} props.actions - Botones o acciones adicionales
 * @param {string} props.icon - SVG icono opcional
 */

import PropTypes from 'prop-types';

export default function PageHeader({ title, subtitle, actions, icon, gradient }) {
  const gradientClasses = gradient || 'from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10';
  
  return (
    <div className={`bg-gradient-to-br ${gradientClasses} rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="bg-white/50 dark:bg-dark-surface/50 p-3 rounded-2xl">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-4 sm:gap-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  icon: PropTypes.node,
  gradient: PropTypes.string,
};

