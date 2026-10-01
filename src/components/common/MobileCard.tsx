import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { ReactNode } from 'react';
import ActionBottomSheet from './ActionBottomSheet';

interface BadgeItem {
  label: string;
  icon?: ReactNode;
  colorClass?: string;
}

interface ActionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: 'blue' | 'orange' | 'purple' | 'green' | 'gray' | 'red' | 'fuchsia';
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface ActionGroup {
  category?: string;
  items: ActionItem[];
}

interface MobileCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  badges?: BadgeItem[];
  onActionClick?: () => void;
  actions?: ActionGroup[];
  children?: ReactNode;
  className?: string;
}

export default function MobileCard({
  title,
  subtitle,
  icon,
  iconBg = 'bg-neutral-100 dark:bg-dark-surface2',
  iconColor = 'text-neutral-700 dark:text-dark-text',
  badges = [],
  onActionClick,
  actions = [],
  children,
  className = '',
}: MobileCardProps) {
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  const handleActionClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onActionClick) onActionClick();
    else if (actions.length > 0) setMostrarModalAcciones(true);
  };

  return (
    <>
      <div
        className={`border-b border-neutral-200 bg-transparent py-3 dark:border-dark-border ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {icon && (
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${iconBg}`}
                >
                  <span className={`${iconColor} text-lg`}>{icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  {title && (
                    <h4 className="truncate font-medium text-neutral-900 dark:text-dark-text">
                      {title}
                    </h4>
                  )}
                  {subtitle && (
                    <p className="text-xs text-neutral-600 dark:text-dark-text2">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!icon && title && (
              <h4 className="mb-1 font-medium text-neutral-900 dark:text-dark-text">
                {title}
              </h4>
            )}
            {!icon && subtitle && (
              <p className="mb-2 text-xs text-neutral-600 dark:text-dark-text2">
                {subtitle}
              </p>
            )}
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {badges.map((badge, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                      badge.colorClass ||
                      'bg-neutral-100 text-neutral-700 dark:bg-dark-surface2 dark:text-dark-text2'
                    }`}
                  >
                    {badge.icon && <span className="mr-1">{badge.icon}</span>}
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
            {children && <div className="mt-2">{children}</div>}
          </div>
          {(actions.length > 0 || onActionClick) && (
            <button
              type="button"
              onClick={handleActionClick}
              className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-dark-text2 dark:hover:bg-dark-surface2"
              aria-label="Ver acciones"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {actions.length > 0 && (
        <ActionBottomSheet
          isOpen={mostrarModalAcciones}
          onClose={() => setMostrarModalAcciones(false)}
          title={title}
          subtitle={subtitle}
          badges={badges}
          actions={actions}
        />
      )}
    </>
  );
}
