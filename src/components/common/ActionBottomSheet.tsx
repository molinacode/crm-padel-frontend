import { useMemo, useRef, useState } from 'react';
import type { ReactNode, TouchEvent as ReactTouchEvent } from 'react';

type ActionColor =
  | 'blue'
  | 'orange'
  | 'purple'
  | 'green'
  | 'gray'
  | 'red'
  | 'fuchsia';

interface BadgeItem {
  label: string;
  icon?: ReactNode;
  colorClass?: string;
}

interface ActionItem {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: ActionColor;
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface ActionGroup {
  category?: string;
  items?: ActionItem[];
}

interface ActionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string | ReactNode;
  badges?: BadgeItem[];
  actions?: ActionGroup[];
}

const colorClasses: Record<ActionColor, string> = {
  blue: 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-dark-border dark:bg-dark-surface2 dark:hover:bg-dark-surface',
  orange:
    'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30',
  purple:
    'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-dark-border dark:bg-dark-surface2 dark:hover:bg-dark-surface',
  green:
    'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30',
  gray: 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-dark-border dark:bg-dark-surface2 dark:hover:bg-dark-surface',
  red: 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30',
  fuchsia:
    'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-dark-border dark:bg-dark-surface2 dark:hover:bg-dark-surface',
};

const textColorClasses: Record<ActionColor, string> = {
  blue: 'text-neutral-900 dark:text-dark-text',
  orange: 'text-orange-800 dark:text-orange-300',
  purple: 'text-neutral-900 dark:text-dark-text',
  green: 'text-green-800 dark:text-green-300',
  gray: 'text-neutral-900 dark:text-dark-text',
  red: 'text-red-800 dark:text-red-300',
  fuchsia: 'text-neutral-900 dark:text-dark-text',
};

export default function ActionBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  badges = [],
  actions = [],
}: ActionBottomSheetProps) {
  const accionesAgrupadas = useMemo(
    () => actions.filter(group => group.items && group.items.length > 0),
    [actions]
  );

  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const onHandleTouchStart = (e: ReactTouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? null;
  };

  const onHandleTouchMove = (e: ReactTouchEvent) => {
    if (startY.current == null) return;
    const y = e.touches[0]?.clientY ?? startY.current;
    const delta = Math.max(0, y - startY.current);
    setDragY(delta);
  };

  const onHandleTouchEnd = () => {
    if (dragY > 80) onClose();
    setDragY(0);
    startY.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      <div
        className="fixed right-0 bottom-0 left-0 z-[9999] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-neutral-200 bg-white dark:border-dark-border dark:bg-dark-surface"
        style={{
          zIndex: 9999,
          transform: `translateY(${dragY}px)`,
          transition: dragY ? 'none' : 'transform 0.2s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>

        <div className="border-b border-neutral-200 px-5 pb-4 dark:border-dark-border">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-medium text-neutral-900 dark:text-dark-text">
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className="mt-1 text-sm text-neutral-600 dark:text-dark-text2">
                  {subtitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 flex min-h-11 min-w-11 items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              aria-label="Cerrar"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
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
        </div>

        {accionesAgrupadas.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className={`px-5 py-4 ${
              groupIndex > 0 ? 'border-t border-neutral-200 dark:border-dark-border' : ''
            }`}
          >
            {group.category && (
              <h4 className="mb-3 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-dark-text2">
                {group.category}
              </h4>
            )}
            <div className="space-y-2">
              {group.items?.map(accion => {
                const colorClass = colorClasses[accion.color || 'gray'];
                const textColorClass = textColorClasses[accion.color || 'gray'];

                return (
                  <button
                    key={accion.id}
                    type="button"
                    onClick={() => {
                      if (!accion.disabled && accion.onClick) {
                        accion.onClick();
                        onClose();
                      }
                    }}
                    disabled={accion.disabled}
                    className={`flex min-h-12 w-full items-center justify-between rounded-md border p-3 transition-colors ${
                      accion.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${colorClass}`}
                  >
                    <div className="flex items-center gap-3">
                      {accion.icon && <span className="text-xl">{accion.icon}</span>}
                      <div className="text-left">
                        <div className={`font-medium ${textColorClass}`}>{accion.label}</div>
                        {accion.badge && (
                          <div className="mt-0.5 text-xs text-neutral-600 dark:text-dark-text2">
                            {accion.badge}
                          </div>
                        )}
                      </div>
                    </div>
                    {!accion.disabled && (
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
