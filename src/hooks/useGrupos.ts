import { useCallback, useEffect, useState } from 'react';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import {
  grupoService,
  type GrupoConMiembros,
} from '../services/grupoService';
import type { TablesInsert, TablesUpdate } from '../types/supabase';

export function useGrupos() {
  const [grupos, setGrupos] = useState<GrupoConMiembros[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await grupoService.getAll();
    if (queryError) {
      const message =
        queryError.message ||
        (queryError instanceof Error ? queryError.message : 'Error cargando grupos');
      setError(message);
      setGrupos([]);
    } else {
      setError(null);
      setGrupos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargar();
    });
  }, [cargar]);

  const crear = useCallback(
    async (grupo: TablesInsert<'grupos'>) => {
      const { error: createError } = await grupoService.create(grupo);
      if (createError) return createError;
      await cargar();
      return null;
    },
    [cargar]
  );

  const actualizar = useCallback(
    async (id: string, updates: TablesUpdate<'grupos'>) => {
      const { error: updateError } = await grupoService.update(id, updates);
      if (updateError) return updateError;
      await cargar();
      return null;
    },
    [cargar]
  );

  const eliminar = useCallback(
    async (id: string) => {
      const { error: deleteError } = await grupoService.remove(id);
      if (deleteError) return deleteError;
      await cargar();
      return null;
    },
    [cargar]
  );

  const asignarAlumno = useCallback(
    async (grupoId: string, alumnoId: string) => {
      const { error: assignError } = await grupoService.addAlumno(grupoId, alumnoId);
      if (assignError) return assignError;
      await cargar();
      return null;
    },
    [cargar]
  );

  const quitarAlumno = useCallback(
    async (asignacionId: string) => {
      const { error: removeError } = await grupoService.removeAlumno(asignacionId);
      if (removeError) return removeError;
      await cargar();
      return null;
    },
    [cargar]
  );

  return {
    grupos,
    loading,
    error,
    recargar: cargar,
    crear,
    actualizar,
    eliminar,
    asignarAlumno,
    quitarAlumno,
  };
}
