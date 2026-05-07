import { Suspense, lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>{children}</Suspense>
  );
}

type GenericLazyComponent = ComponentType<Record<string, unknown>>;

export const LazyChart = lazy(async () => {
  const mod = await import('react-chartjs-2');
  return { default: mod.Chart as unknown as GenericLazyComponent };
});

export const LazyCalendar = lazy(async () => {
  const mod = await import('react-big-calendar');
  const CalendarComponent =
    (mod as { Calendar?: GenericLazyComponent; default?: GenericLazyComponent })
      .Calendar ||
    (mod as { default?: GenericLazyComponent }).default;
  return { default: CalendarComponent as GenericLazyComponent };
});
