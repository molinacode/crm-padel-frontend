import { useCallback, useRef, type TouchEvent } from 'react';

type SwipeAxis = 'horizontal' | 'vertical' | 'both';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Umbral en px. Default 48 */
  threshold?: number;
  axis?: SwipeAxis;
  /** Si true, no dispara si el gesto parece scroll vertical en axis horizontal */
  preventScrollConflict?: boolean;
}

/**
 * Gestos táctiles simples para tablet/móvil.
 * Devuelve handlers para poner en el contenedor.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 48,
  axis = 'both',
  preventScrollConflict = true,
}: UseSwipeGestureOptions) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    start.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      if (!t) {
        start.current = null;
        return;
      }
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      start.current = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (axis === 'horizontal') {
        if (preventScrollConflict && absY > absX) return;
        if (absX < threshold) return;
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
        return;
      }

      if (axis === 'vertical') {
        if (preventScrollConflict && absX > absY) return;
        if (absY < threshold) return;
        if (dy < 0) onSwipeUp?.();
        else onSwipeDown?.();
        return;
      }

      if (absX < threshold && absY < threshold) return;
      if (absX >= absY) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      } else {
        if (dy < 0) onSwipeUp?.();
        else onSwipeDown?.();
      }
    },
    [
      axis,
      onSwipeDown,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      preventScrollConflict,
      threshold,
    ]
  );

  return { onTouchStart, onTouchEnd };
}
