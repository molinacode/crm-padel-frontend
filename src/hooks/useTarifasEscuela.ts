import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TarifaEscuela } from '../utils/tarifaEscuela';

export function useTarifasEscuela() {
  const [tarifas, setTarifas] = useState<TarifaEscuela[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const { data, error: consultaError } = await supabase
      .from('tarifas_alquiler_escuela')
      .select('id, importe, vigente_desde')
      .order('vigente_desde', { ascending: true });
    if (consultaError) {
      setError(consultaError.message || 'No se pudieron cargar los precios');
      return;
    }
    setError('');
    setTarifas((data as TarifaEscuela[] | null) || []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = useCallback(
    async (importe: number, vigenteDesde: string) => {
      const hoy = new Date();
      const hoyIso = [
        hoy.getFullYear(),
        String(hoy.getMonth() + 1).padStart(2, '0'),
        String(hoy.getDate()).padStart(2, '0'),
      ].join('-');
      if (!vigenteDesde || vigenteDesde < hoyIso) {
        throw new Error('La fecha de inicio no puede ser anterior a hoy');
      }
      if (!Number.isFinite(importe) || importe < 0) {
        throw new Error('El importe no es válido');
      }
      const existente = tarifas.find(
        tarifa => String(tarifa.vigente_desde).slice(0, 10) === vigenteDesde
      );
      const { error: guardadoError } = existente
        ? await supabase.from('tarifas_alquiler_escuela').update({ importe }).eq('id', existente.id)
        : await supabase.from('tarifas_alquiler_escuela').insert([{ importe, vigente_desde: vigenteDesde }]);
      if (guardadoError) throw new Error(guardadoError.message || 'No se pudo guardar el precio');
      await cargar();
    },
    [cargar, tarifas]
  );

  return { tarifas, error, guardar };
}
