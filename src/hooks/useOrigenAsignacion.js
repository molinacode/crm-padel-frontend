import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { determinarOrigenAutomatico, obtenerOrigenMasComun } from '../utils/origenUtils';

/**
 * Hook para manejar el origen de asignaciones de una clase
 * @param {string} claseId - ID de la clase
 * @param {object} claseActual - Objeto de la clase actual
 * @param {number} asignadosCount - Número de alumnos asignados
 * @returns {object} - Estado y funciones para manejar el origen
 */
export function useOrigenAsignacion(claseId, claseActual, asignadosCount = 0) {
  const [origenAsignacion, setOrigenAsignacion] = useState('escuela');
  const [loading, setLoading] = useState(false);

  // Cargar origen existente cuando cambia la clase
  useEffect(() => {
    const cargarOrigenExistente = async () => {
      if (!claseId) {
        // Si no hay clase seleccionada, usar el origen automático
        if (claseActual) {
          const origenAutomatico = determinarOrigenAutomatico(claseActual);
          setOrigenAsignacion(origenAutomatico);
        }
        return;
      }

      try {
        setLoading(true);
        // Buscar asignaciones existentes para esta clase
        const { data: asignadosRes, error } = await supabase
          .from('alumnos_clases')
          .select('origen')
          .eq('clase_id', claseId);

        if (error) throw error;

        // Si hay asignaciones existentes, verificar el origen
        if (asignadosRes && asignadosRes.length > 0) {
          // Obtener el origen más común
          const origenes = asignadosRes
            .map(a => a.origen)
            .filter(o => o !== null && o !== undefined);

          if (origenes.length > 0) {
            const origenMasComun = obtenerOrigenMasComun(origenes);
            setOrigenAsignacion(origenMasComun);
          } else {
            // Si no hay origen definido, usar el automático
            const origenAutomatico = determinarOrigenAutomatico(claseActual);
            setOrigenAsignacion(origenAutomatico);
          }
        } else {
          // Si no hay asignaciones, usar el origen automático
          const origenAutomatico = determinarOrigenAutomatico(claseActual);
          setOrigenAsignacion(origenAutomatico);
        }
      } catch (err) {
        console.error('Error cargando origen:', err);
        // En caso de error, usar el origen automático
        if (claseActual) {
          const origenAutomatico = determinarOrigenAutomatico(claseActual);
          setOrigenAsignacion(origenAutomatico);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarOrigenExistente();
  }, [claseId, claseActual]);

  // Función para actualizar el origen
  const actualizarOrigen = useCallback(
    async (nuevoOrigen) => {
      if (!claseId) {
        setOrigenAsignacion(nuevoOrigen);
        return { success: true };
      }

      const origenAnterior = origenAsignacion;
      setOrigenAsignacion(nuevoOrigen);

      // Si hay asignaciones existentes, actualizar su origen
      if (asignadosCount > 0) {
        try {
          setLoading(true);
          const { error } = await supabase
            .from('alumnos_clases')
            .update({ origen: nuevoOrigen })
            .eq('clase_id', claseId);

          if (error) throw error;

          console.log(
            `✅ Origen actualizado a "${nuevoOrigen}" para ${asignadosCount} asignación(es) existente(s)`
          );
          return { success: true };
        } catch (err) {
          console.error('Error actualizando origen:', err);
          // Revertir el cambio
          setOrigenAsignacion(origenAnterior);
          return { success: false, error: err.message };
        } finally {
          setLoading(false);
        }
      }

      return { success: true };
    },
    [claseId, asignadosCount, origenAsignacion]
  );

  return {
    origenAsignacion,
    setOrigenAsignacion: actualizarOrigen,
    loading,
  };
}

