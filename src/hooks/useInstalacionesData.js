import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { verificarTablaGastos } from '../utils/verificarTablaGastos';

export function useInstalacionesData() {
  const [eventos, setEventos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [gastosMaterial, setGastosMaterial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Cargando datos para Instalaciones...');

        const verificacion = await verificarTablaGastos();
        if (!verificacion.success) {
          console.warn(
            '⚠️ Problema con tabla gastos_material:',
            verificacion.error
          );
        }

        let eventosData = [];
        let eventosError = null;
        
        // Intentar cargar eventos con excluir_alquiler
        const eventosRes = await supabase
          .from('eventos_clase')
          .select(
            `
            id,
            fecha,
            estado,
            excluir_alquiler,
            clases (
              id,
              nombre,
              tipo_clase
            )
          `
          )
          .order('fecha', { ascending: true });

        if (eventosRes.error && eventosRes.error.code === '42703') {
          // Si la columna excluir_alquiler no existe, cargar sin ella
          console.warn('⚠️ Campo "excluir_alquiler" no existe, cargando sin él');
          const fallbackRes = await supabase
            .from('eventos_clase')
            .select(
              `
              id,
              fecha,
              estado,
              clases (
                id,
                nombre,
                tipo_clase
              )
            `
            )
            .order('fecha', { ascending: true });
          eventosData = fallbackRes.data || [];
          eventosError = fallbackRes.error;
          // Añadir excluir_alquiler: false por defecto
          eventosData = eventosData.map(ev => ({ ...ev, excluir_alquiler: false }));
        } else {
          eventosData = eventosRes.data || [];
          eventosError = eventosRes.error;
        }

        if (eventosError) throw eventosError;

        console.log('📅 Eventos cargados:', eventosData?.length || 0);

        const { data: pagosData, error: pagosError } = await supabase
          .from('pagos')
          .select('id, cantidad, fecha_pago, tipo_pago, mes_cubierto')
          .order('fecha_pago', { ascending: true });

        if (pagosError) throw pagosError;

        try {
          const { error: asignError } = await supabase
            .from('alumnos_clases')
            .select('clase_id, origen');

          if (asignError && asignError.code === '42703') {
            console.warn('⚠️ Campo "origen" no existe, usando solo clase_id');
            await supabase
              .from('alumnos_clases')
              .select('clase_id');
          } else if (asignError) {
            throw asignError;
          }
        } catch (err) {
          console.error('❌ Error cargando asignaciones:', err);
        }

        let gastosMaterialData = [];
        try {
          const { data, error: gastosError } = await supabase
            .from('gastos_material')
            .select('*')
            .order('fecha_gasto', { ascending: false });

          if (gastosError) {
            console.error('❌ Error cargando gastos de material:', gastosError);
            gastosMaterialData = [];
          } else {
            gastosMaterialData = data || [];
            console.log('💰 Gastos de material:', gastosMaterialData.length);
          }
        } catch (err) {
          console.error('❌ Error cargando gastos:', err);
          gastosMaterialData = [];
        }

        setEventos(eventosData || []);
        setPagos(pagosData || []);
        setGastosMaterial(gastosMaterialData);
        setError(null);
      } catch (err) {
        console.error('❌ Error cargando datos:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return {
    eventos,
    pagos,
    gastosMaterial,
    loading,
    error,
    reload: () => window.location.reload(),
  };
}
