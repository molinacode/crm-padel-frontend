import type { ReactNode } from 'react';

type CardColor = 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange' | 'indigo';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  badge?: ReactNode;
  iconColor?: CardColor;
}

export default function SectionCard({
  title,
  icon,
  children,
  badge,
  iconColor = 'blue',
}: SectionCardProps) {
  const colorClasses: Record<CardColor, string> = {
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
        {icon && <div className={`${iconBg} p-3.5 rounded-2xl`}>{icon}</div>}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      {children}
    </div>
  );
}
