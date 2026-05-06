import { useEffect, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { verificarTablaGastos } from '../utils/verificarTablaGastos';

type EventosData = Array<Record<string, unknown>>;
type PagosData = Array<Record<string, unknown>>;
type GastosData = Array<Record<string, unknown>>;

export function useInstalacionesData() {
  const [eventos, setEventos] = useState<EventosData>([]);
  const [pagos, setPagos] = useState<PagosData>([]);
  const [gastosMaterial, setGastosMaterial] = useState<GastosData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | Error | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const verificacion = await verificarTablaGastos();
        if (!verificacion.success) {
          console.warn('Problema con tabla gastos_material:', verificacion.error);
        }

        let eventosData: EventosData = [];
        let eventosError: PostgrestError | null = null;

        const eventosRes = await supabase
          .from('eventos_clase')
          .select(
            `
            id, fecha, estado, excluir_alquiler,
            clases (id, nombre, tipo_clase)
          `
          )
          .order('fecha', { ascending: true });

        if (eventosRes.error && eventosRes.error.code === '42703') {
          const fallbackRes = await supabase
            .from('eventos_clase')
            .select(
              `
              id, fecha, estado,
              clases (id, nombre, tipo_clase)
            `
            )
            .order('fecha', { ascending: true });
          eventosData = (fallbackRes.data as EventosData | null) || [];
          eventosError = fallbackRes.error;
          eventosData = eventosData.map((ev) => ({ ...ev, excluir_alquiler: false }));
        } else {
          eventosData = (eventosRes.data as EventosData | null) || [];
          eventosError = eventosRes.error;
        }
        if (eventosError) throw eventosError;

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
            await supabase.from('alumnos_clases').select('clase_id');
          } else if (asignError) {
            throw asignError;
          }
        } catch (err) {
          console.error('Error cargando asignaciones:', err);
        }

        let gastosMaterialData: GastosData = [];
        try {
          const { data, error: gastosError } = await supabase
            .from('gastos_material')
            .select('*')
            .order('fecha_gasto', { ascending: false });
          if (gastosError) {
            console.error('Error cargando gastos de material:', gastosError);
          } else {
            gastosMaterialData = (data as GastosData | null) || [];
          }
        } catch (err) {
          console.error('Error cargando gastos:', err);
        }

        setEventos(eventosData);
        setPagos((pagosData as PagosData | null) || []);
        setGastosMaterial(gastosMaterialData);
        setError(null);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setLoading(false);
      }
    };
    void cargarDatos();
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


