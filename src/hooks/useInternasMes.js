import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useInternasMes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = hoy.getMonth();
      const finMes = new Date(año, mes + 1, 0);
      const inicioISO = `${año}-${String(mes + 1).padStart(2, '0')}-01`;
      const finISO = `${año}-${String(mes + 1).padStart(2, '0')}-${String(
        finMes.getDate()
      ).padStart(2, '0')}`;

      console.log('🔍 [useInternasMes] Rango del mes:', {
        inicioISO,
        finISO,
        mesActual: mes + 1,
      });

      const { data: evs, error: eventosError } = await supabase
        .from('eventos_clase')
        .select('id, fecha, hora_inicio, hora_fin, estado, clase_id')
        .gte('fecha', inicioISO)
        .lte('fecha', finISO)
        .or('estado.is.null,estado.neq.eliminado')
        .neq('estado', 'cancelada')
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true, nullsFirst: true });
      if (eventosError) throw eventosError;
      const eventos = evs || [];
      console.log('📅 [useInternasMes] Eventos encontrados:', eventos.length);
      if (eventos.length > 0) {
        console.log(
          '📅 [useInternasMes] Primeros eventos:',
          eventos.slice(0, 3)
        );
      }

      const claseIds = Array.from(new Set(eventos.map(e => e.clase_id))).filter(
        Boolean
      );
      console.log(
        '📚 [useInternasMes] IDs únicos de clases:',
        claseIds.length,
        claseIds.slice(0, 5)
      );

      let clasesInternas = [];
      if (claseIds.length > 0) {
        const { data: clasesData, error: clasesError } = await supabase
          .from('clases')
          .select('id, nombre, tipo_clase')
          .in('id', claseIds);
        if (clasesError) throw clasesError;
        console.log(
          '🏫 [useInternasMes] Clases encontradas:',
          clasesData?.length
        );
        if (clasesData && clasesData.length > 0) {
          console.log(
            '🏫 [useInternasMes] Tipos de clase:',
            clasesData.map(c => ({
              id: c.id,
              nombre: c.nombre,
              tipo: c.tipo_clase,
            }))
          );
        }
        clasesInternas = (clasesData || []).filter(c =>
          (c.tipo_clase || '').toLowerCase().includes('interna')
        );
        console.log(
          '🏠 [useInternasMes] Clases internas filtradas:',
          clasesInternas.length
        );
        if (clasesInternas.length > 0) {
          console.log(
            '🏠 [useInternasMes] Detalles internas:',
            clasesInternas.map(c => ({
              id: c.id,
              nombre: c.nombre,
              tipo: c.tipo_clase,
            }))
          );
        }
      }

      let pagosMapa = new Map();
      if (claseIds.length > 0) {
        const { data: pagosInternas, error: pagosInternasError } =
          await supabase
            .from('pagos_clases_internas')
            .select('*')
            .in('clase_id', claseIds)
            .gte('fecha', inicioISO)
            .lte('fecha', finISO);
        if (pagosInternasError) throw pagosInternasError;
        pagosMapa = new Map(
          (pagosInternas || []).map(p => [`${p.clase_id}|${p.fecha}`, p])
        );
        console.log('💰 [useInternasMes] Pagos mapeados:', pagosMapa.size);
      }

      const internasIdSet = new Set((clasesInternas || []).map(c => c.id));
      const nombrePorClase = new Map(
        (clasesInternas || []).map(c => [c.id, c.nombre])
      );
      console.log(
        '🔑 [useInternasMes] IDs de internas para filtrar:',
        Array.from(internasIdSet)
      );

      const resultados = (eventos || [])
        .filter(ev => internasIdSet.has(ev.clase_id))
        .sort(
          (a, b) =>
            a.fecha.localeCompare(b.fecha) ||
            (a.hora_inicio || '').localeCompare(b.hora_inicio || '')
        )
        .map(ev => {
          const key = `${ev.clase_id}|${ev.fecha}`;
          const pago = pagosMapa.get(key);
          return {
            id: ev.id,
            eventoId: ev.id,
            claseId: ev.clase_id,
            nombre: nombrePorClase.get(ev.clase_id) || 'Clase interna',
            fecha: ev.fecha,
            hora_inicio: ev.hora_inicio,
            hora_fin: ev.hora_fin,
            estado: pago?.estado || 'pendiente',
            estado_pago: pago?.estado || 'pendiente',
            pagoId: pago?.id || null,
          };
        });

      console.log('✅ [useInternasMes] Resultados finales:', resultados.length);
      if (resultados.length > 0) {
        console.log(
          '✅ [useInternasMes] Primeros resultados:',
          resultados.slice(0, 3)
        );
      }
      setItems(resultados);
      setError(null);
    } catch (err) {
      console.error('useInternasMes error:', err);
      setItems([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { items, loading, error, reload: cargar };
}
