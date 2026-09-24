import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVistaProfesorData } from './useVistaProfesorData';

export function useMiProfesor() {
  const { userData } = useAuth();
  const { eventos, profesores, loading } = useVistaProfesorData();

  const propio = useMemo(
    () =>
      profesores.find(
        profesor =>
          String(profesor.email || '').toLowerCase() === String(userData?.email || '').toLowerCase()
      ) || null,
    [profesores, userData?.email]
  );

  const nombres = useMemo(() => {
    if (!propio) return [];
    const completo = [propio.nombre, propio.apellidos].filter(Boolean).join(' ');
    return [...new Set([propio.nombre, completo].filter(Boolean))];
  }, [propio]);

  return { propio, nombres, eventos, loading };
}
