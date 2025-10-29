import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSincronizacionAsignaciones } from './useSincronizacionAsignaciones';

export function useAsistenciasHandlers(fecha, setAsistencias) {
  const { sincronizarAsignacionesDelDia, restaurarAsignacion } =
    useSincronizacionAsignaciones();

  const handleCambioEstado = useCallback(
    async (claseId, alumnoId, nuevoEstado) => {
      try {
        // Actualizar estado local
        setAsistencias(prev => ({
          ...prev,
          [claseId]: {
            ...prev[claseId],
            [alumnoId]: nuevoEstado,
          },
        }));

        // Verificar si ya existe
        const { data: existente } = await supabase
          .from('asistencias')
          .select('id')
          .eq('alumno_id', alumnoId)
          .eq('clase_id', claseId)
          .eq('fecha', fecha)
          .maybeSingle();

        const estadoFinal =
          nuevoEstado === 'recuperacion' ? 'asistio' : nuevoEstado;

        if (existente) {
          await supabase
            .from('asistencias')
            .update({ estado: estadoFinal })
            .eq('id', existente.id);
        } else {
          await supabase.from('asistencias').insert([
            {
              alumno_id: alumnoId,
              clase_id: claseId,
              fecha,
              estado: estadoFinal,
            },
          ]);
        }

        // Manejar recuperación
        if (nuevoEstado === 'recuperacion') {
          const { data: recPendiente } = await supabase
            .from('recuperaciones_clase')
            .select('id')
            .eq('alumno_id', alumnoId)
            .eq('estado', 'pendiente')
            .order('fecha_falta', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (recPendiente?.id) {
            await supabase
              .from('recuperaciones_clase')
              .update({
                estado: 'recuperada',
                fecha_recuperacion: fecha,
                observaciones: 'Marcada como recuperación desde asistencias',
                updated_at: new Date().toISOString(),
              })
              .eq('id', recPendiente.id);
            alert(
              '✅ Recuperación registrada y asistencia marcada como asistió'
            );
          } else {
            alert(
              'ℹ️ No hay recuperaciones pendientes. Se registró como asistió.'
            );
          }
        }

        // Sincronización automática
        if (nuevoEstado === 'justificada' || nuevoEstado === 'falta') {
          const resultado = await sincronizarAsignacionesDelDia(fecha);
          if (resultado.success) {
            const mensaje =
              nuevoEstado === 'justificada'
                ? '✅ Falta justificada registrada. El alumno tiene derecho a recuperación.'
                : '✅ Falta registrada. Se ha liberado la plaza.';
            alert(mensaje);
          } else {
            alert(
              '⚠️ Falta registrada, pero hubo un problema con la sincronización.'
            );
          }
        } else if (
          nuevoEstado === 'asistio' ||
          nuevoEstado === 'recuperacion'
        ) {
          await restaurarAsignacion(alumnoId, claseId, fecha);
        }

        console.log('✅ Asistencia actualizada correctamente');
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al actualizar la asistencia');
      }
    },
    [fecha, setAsistencias, sincronizarAsignacionesDelDia, restaurarAsignacion]
  );

  return { handleCambioEstado };
}
