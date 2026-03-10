/**
 * Componente reutilizable para secciones con contenido (cards grandes)
 * @param {object} props
 * @param {string} props.title - Título de la sección
 * @param {React.ReactNode} props.icon - Icono de la sección
 * @param {React.ReactNode} props.children - Contenido de la sección
 * @param {React.ReactNode} props.badge - Badge/tag opcional
 * @param {string} props.iconColor - Color del icono
 */

import PropTypes from 'prop-types';

export default function SectionCard({ title, icon, children, badge, iconColor = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/30',
    green: 'bg-green-50 dark:bg-green-950/30',
    purple: 'bg-purple-50 dark:bg-purple-950/30',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30',
    red: 'bg-red-50 dark:bg-red-950/30',
    orange: 'bg-orange-50 dark:bg-orange-950/30',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30',
  };

  const iconBg = colorClasses[iconColor] || colorClasses.blue;

  return (
    <div className="bg-white dark:bg-dark-surface p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4 mb-6">
        {icon && (
          <div className={`${iconBg} p-3.5 rounded-2xl`}>
            {icon}
          </div>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  badge: PropTypes.node,
  iconColor: PropTypes.oneOf(['blue', 'green', 'purple', 'yellow', 'red', 'orange', 'indigo']),
};

