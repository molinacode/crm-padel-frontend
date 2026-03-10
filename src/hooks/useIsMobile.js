import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo es móvil
 * Usa una detección más robusta basada en el ancho de pantalla
 * @param {number} breakpoint - Ancho en píxeles para considerar móvil (default: 768)
 * @returns {boolean} true si es móvil, false si es desktop
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    // Verificación inicial del lado del cliente
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    // Función para verificar el tamaño de pantalla
    const checkIsMobile = () => {
      const isNarrow = window.innerWidth < breakpoint;
      setIsMobile(isNarrow);
    };

    // Verificación inicial
    checkIsMobile();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile);

    // Usar matchMedia para mejor rendimiento
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    
    // Función handler para cambios de media query
    const handleMediaChange = (e) => {
      setIsMobile(e.matches);
    };

    // Agregar listener (usar addEventListener si está disponible, sino addListener para compatibilidad)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
}

