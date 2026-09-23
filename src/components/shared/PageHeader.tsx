import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  gradient?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  gradient,
}: PageHeaderProps) {
  void gradient;

  return (
    <div className="border-b border-[#2a332c] pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
        <div className="flex items-center gap-4">
          {icon && <div className="text-[#c9a658]">{icon}</div>}
          <div>
            <h1 className="mb-1 text-3xl font-semibold tracking-tight text-[#0e1410] dark:text-[#f5f1e8]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base text-[#8c8678]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-4 sm:gap-6">{actions}</div>}
      </div>
    </div>
  );
}
