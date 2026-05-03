import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo es movil.
 * Usa una deteccion robusta basada en ancho de pantalla + matchMedia.
 *
 * @param breakpoint Ancho en pixeles para considerar movil (default: 768)
 * @returns true si es movil, false si es desktop
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const checkIsMobile = (): void => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleMediaChange = (e: MediaQueryListEvent): void => {
      setIsMobile(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Compatibilidad con Safari < 14: addListener queda como fallback.
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
}
