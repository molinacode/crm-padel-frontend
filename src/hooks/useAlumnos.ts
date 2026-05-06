import { useState, useEffect, useCallback, useMemo } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { filtrarAlumnosActivos } from '../utils/alumnoUtils';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables } from '../types/supabase';

/**
 * Hook para cargar y gestionar alumnos
 * @param {object} options - Opciones de filtrado
 * @returns {{ alumnos: array, loading: boolean, error: object, refetch: function }}
 */
type Alumno = Tables<'alumnos'>;
interface UseAlumnosOptions {
  activo?: boolean;
  orderBy?: { column?: keyof Alumno | 'nombre'; ascending?: boolean };
  fechaConsulta?: Date;
}

export const useAlumnos = (options: UseAlumnosOptions = {}) => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  // Memoizar opciones para evitar cambios innecesarios
  const optionsMemo = useMemo(() => ({
    activo: options.activo,
    orderBy: options.orderBy,
    fechaConsulta: options.fechaConsulta || new Date(),
  }), [options.activo, options.orderBy, options.fechaConsulta]);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('alumnos').select('*');

      // Si se filtra por activo, aplicar filtro básico en BD
      // Luego filtraremos por fecha_baja en el cliente
      if (optionsMemo.activo === true) {
        // Solo excluir explícitamente inactivos, luego filtraremos por fecha_baja
        query = query.or('activo.eq.true,activo.is.null');
      } else if (optionsMemo.activo === false) {
        query = query.eq('activo', false);
      }

      if (optionsMemo.orderBy) {
        query = query.order(optionsMemo.orderBy.column || 'nombre', {
          ascending: optionsMemo.orderBy.ascending !== false,
        });
      } else {
        query = query.order('nombre', { ascending: true });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      let alumnosFiltrados = Array.isArray(data) ? data : [];

      // Si se filtra por activo=true, aplicar filtro por fecha_baja en el cliente
      if (optionsMemo.activo === true) {
        alumnosFiltrados = filtrarAlumnosActivos(alumnosFiltrados, optionsMemo.fechaConsulta);
      } else if (optionsMemo.activo === false) {
        // Para inactivos, incluir todos los que tienen activo=false
        // (pueden tener o no fecha_baja)
        alumnosFiltrados = alumnosFiltrados.filter((a: Alumno) => a.activo === false);
      }

      setAlumnos(alumnosFiltrados);
      setError(null);
    } catch (err) {
      console.error('Error cargando alumnos:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido'));
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  }, [optionsMemo]);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void fetchAlumnos();
    });
  }, [fetchAlumnos]);

  return {
    alumnos,
    loading,
    error,
    refetch: fetchAlumnos,
  };
};


