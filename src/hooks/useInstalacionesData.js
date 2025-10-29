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

        const { data: eventosData, error: eventosError } = await supabase
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

        if (eventosError) throw eventosError;

        console.log('📅 Eventos cargados:', eventosData?.length || 0);

        const { data: pagosData, error: pagosError } = await supabase
          .from('pagos')
          .select('id, cantidad, fecha_pago, tipo_pago, mes_cubierto')
          .order('fecha_pago', { ascending: true });

        if (pagosError) throw pagosError;

        let asignacionesData = [];
        try {
          const { data, error: asignError } = await supabase
            .from('alumnos_clases')
            .select('clase_id, origen');

          if (asignError && asignError.code === '42703') {
            console.warn('⚠️ Campo "origen" no existe, usando solo clase_id');
            const { data: fallbackData } = await supabase
              .from('alumnos_clases')
              .select('clase_id');
            asignacionesData = fallbackData || [];
          } else if (asignError) {
            throw asignError;
          } else {
            asignacionesData = data || [];
          }
        } catch (err) {
          console.error('❌ Error cargando asignaciones:', err);
          asignacionesData = [];
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
