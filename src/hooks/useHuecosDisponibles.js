import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calcularHuecosDesdeSupabase } from '../utils/calcularHuecos';

/**
 * Hook para calcular huecos disponibles de un evento
 * @param {object} evento - Objeto del evento
 * @param {object} clase - Objeto de la clase (opcional)
 * @returns {object} - Información de huecos disponibles
 */
export function useHuecosDisponibles(evento, clase = null) {
  const [huecosInfo, setHuecosInfo] = useState({
    huecosReales: 0,
    alumnosPresentes: 0,
    alumnosAsignados: 0,
    alumnosLiberados: 0,
    alumnosJustificados: 0,
    maxAlumnos: 4,
    loading: true,
  });

  const calcularHuecos = useCallback(async () => {
    if (!evento || !evento.clase_id) {
      setHuecosInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setHuecosInfo(prev => ({ ...prev, loading: true }));

      // Obtener información de la clase si no se proporciona
      let claseData = clase;
      if (!claseData) {
        const { data, error } = await supabase
          .from('clases')
          .select('tipo_clase, nombre')
          .eq('id', evento.clase_id)
          .single();

        if (error) throw error;
        claseData = data;
      }

      const esParticular = claseData.tipo_clase === 'particular';
      const maxAlumnos = esParticular ? 1 : 4;

      const eventoId = evento.id || evento.eventoId;

      // Obtener asignaciones y liberaciones
      const [asignadosRes, liberacionesRes] = await Promise.all([
        supabase
          .from('alumnos_clases')
          .select('alumno_id, tipo_asignacion, evento_id')
          .eq('clase_id', evento.clase_id),
        supabase
          .from('liberaciones_plaza')
          .select('alumno_id')
          .eq('clase_id', evento.clase_id)
          .eq('fecha_inicio', evento.fecha)
          .eq('estado', 'activa'),
      ]);

      if (asignadosRes.error) throw asignadosRes.error;
      if (liberacionesRes.error) throw liberacionesRes.error;

      // Calcular huecos usando la utilidad
      const resultado = calcularHuecosDesdeSupabase({
        asignacionesData: asignadosRes.data,
        liberacionesData: liberacionesRes.data,
        justificadosData: evento.alumnosJustificados || [],
        faltasData: [],
        eventoId: eventoId,
        maxAlumnos: 4,
        esParticular: esParticular,
      });

      // Usar el valor que viene del evento como referencia, pero validar contra huecos reales
      const huecosDisponibles = Math.min(
        typeof evento.cantidadHuecos === 'number'
          ? evento.cantidadHuecos
          : resultado.huecosReales,
        resultado.huecosReales
      );

      setHuecosInfo({
        huecosReales: resultado.huecosReales,
        huecosDisponibles,
        alumnosPresentes: resultado.alumnosPresentes,
        alumnosAsignados: resultado.alumnosAsignados,
        alumnosLiberados: resultado.alumnosLiberados,
        alumnosJustificados: resultado.alumnosJustificados,
        maxAlumnos,
        loading: false,
      });
    } catch (error) {
      console.error('Error calculando huecos:', error);
      setHuecosInfo(prev => ({ ...prev, loading: false }));
    }
  }, [evento, clase]);

  useEffect(() => {
    calcularHuecos();
  }, [calcularHuecos]);

  return {
    ...huecosInfo,
    recargar: calcularHuecos,
  };
}

