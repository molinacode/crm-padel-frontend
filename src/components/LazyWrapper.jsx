import { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Componente wrapper para lazy loading con fallback optimizado para móviles
export default function LazyWrapper({ children, fallback }) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>{children}</Suspense>
  );
}

// Lazy loading de componentes pesados
export const LazyChart = lazy(() => import('react-chartjs-2'));
export const LazyCalendar = lazy(() => import('react-big-calendar'));
