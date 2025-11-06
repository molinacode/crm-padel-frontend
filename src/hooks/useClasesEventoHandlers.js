import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para manejar acciones sobre eventos individuales (cancelar, eliminar, editar)
 */
export function useClasesEventoHandlers(setRefresh) {
  const actualizarEstadoEvento = useCallback(
    async (evento, nuevoEstado) => {
      const { resource: ev } = evento;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .update({ estado: nuevoEstado })
          .eq('id', ev.id);

        if (error) {
          console.error('Error actualizando estado del evento:', error);
          alert(`Error al actualizar el evento: ${error.message}`);
          return;
        }

        setRefresh(prev => prev + 1);
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al actualizar el evento');
      }
    },
    [setRefresh]
  );

  const cancelarEventoIndividual = useCallback(
    async evento => {
      await actualizarEstadoEvento(evento, 'cancelada');
      alert('✅ Evento cancelado. No contará en los gastos de instalaciones.');
    },
    [actualizarEstadoEvento]
  );

  const cancelarTodaLaSerie = useCallback(
    async evento => {
      const { resource: ev } = evento;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .update({ estado: 'cancelada' })
          .eq('clase_id', ev.clases.id);

        if (error) {
          alert('Error al cancelar la serie de eventos');
          return;
        }

        setRefresh(prev => prev + 1);
        alert(
          '✅ Toda la serie de eventos ha sido cancelada. No contarán en los gastos de instalaciones.'
        );
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al cancelar la serie');
      }
    },
    [setRefresh]
  );

  const eliminarSerieCompleta = useCallback(
    async evento => {
      const { resource: ev } = evento;
      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar PERMANENTEMENTE toda la serie de eventos de la clase "${ev.clases.nombre}"?\n\nEsta acción eliminará TODOS los eventos de esta clase y NO se puede deshacer.`
      );

      if (!confirmacion) return;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .delete()
          .eq('clase_id', ev.clases.id);

        if (error) {
          alert('Error al eliminar la serie de eventos');
          return;
        }

        setRefresh(prev => prev + 1);
        alert('✅ Toda la serie de eventos ha sido eliminada permanentemente');
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al eliminar la serie');
      }
    },
    [setRefresh]
  );

  const handleEliminarEvento = useCallback(
    async evento => {
      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar permanentemente el evento "${evento.title}"?\n\nEsta acción:\n- Eliminará el evento de la vista\n- NO contará en los gastos de instalaciones\n- Eliminará las asistencias relacionadas\n\nEsta acción no se puede deshacer.`
      );

      if (!confirmacion) return;

      try {
        // Eliminar asistencias relacionadas primero
        const { error: asistenciasError } = await supabase
          .from('asistencias')
          .delete()
          .eq('clase_id', evento.resource.clases.id)
          .eq('fecha', evento.start.toISOString().split('T')[0]);

        if (asistenciasError) {
          console.error('Error eliminando asistencias:', asistenciasError);
        }

        // Marcar el evento como eliminado
        const { error: eventoError } = await supabase
          .from('eventos_clase')
          .update({ estado: 'eliminado' })
          .eq('id', evento.id);

        if (eventoError) {
          alert('Error al eliminar el evento');
          return;
        }

        setRefresh(prev => prev + 1);
        alert(
          '✅ Evento eliminado correctamente. No contará en los gastos de instalaciones.'
        );
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al eliminar el evento');
      }
    },
    [setRefresh]
  );

  const editarTodaLaSerie = useCallback(
    async evento => {
      const { resource: ev } = evento;

      // Solicitar nueva hora de inicio y fin (la fecha se mantiene por evento)
      const nuevaHoraInicio = prompt(
        `🕐 Cambiar hora de inicio para TODA la serie de eventos\n\nClase: "${ev.clases.nombre}"\nHora actual: ${ev.hora_inicio}\nIngresa nueva hora (HH:MM):`,
        ev.hora_inicio
      );

      if (!nuevaHoraInicio) return;

      const nuevaHoraFin = prompt(
        `🕐 Cambiar hora de fin para TODA la serie de eventos\n\nHora actual: ${ev.hora_fin}\nIngresa nueva hora (HH:MM):`,
        ev.hora_fin
      );

      if (!nuevaHoraFin) return;

      // Validar formato de hora
      const horaRegex = /^\d{2}:\d{2}$/;
      if (!horaRegex.test(nuevaHoraInicio) || !horaRegex.test(nuevaHoraFin)) {
        alert('❌ Formato de hora inválido. Usa HH:MM');
        return;
      }

      // Validar que la hora de fin sea posterior a la de inicio
      const horaInicioObj = new Date(`2000-01-01T${nuevaHoraInicio}`);
      const horaFinObj = new Date(`2000-01-01T${nuevaHoraFin}`);
      if (horaFinObj <= horaInicioObj) {
        alert('❌ La hora de fin debe ser posterior a la hora de inicio');
        return;
      }

      // Obtener cantidad de eventos que se van a modificar
      const { count, error: countError } = await supabase
        .from('eventos_clase')
        .select('*', { count: 'exact', head: true })
        .eq('clase_id', ev.clases.id)
        .neq('estado', 'eliminado');

      if (countError) {
        alert('❌ Error al contar eventos de la serie');
        return;
      }

      const cantidadEventos = count || 0;

      const confirmacion = window.confirm(
        `¿Confirmar cambios para TODA la serie?\n\n🕐 Inicio: ${ev.hora_inicio} → ${nuevaHoraInicio}\n🕐 Fin: ${ev.hora_fin} → ${nuevaHoraFin}\n\nSe modificarán ${cantidadEventos} eventos de la clase "${ev.clases.nombre}"\n\n⚠️ Esta acción afectará a TODOS los eventos de esta serie.`
      );

      if (!confirmacion) return;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .update({
            hora_inicio: nuevaHoraInicio,
            hora_fin: nuevaHoraFin,
          })
          .eq('clase_id', ev.clases.id)
          .neq('estado', 'eliminado');

        if (error) {
          console.error('Error actualizando serie:', error);
          alert('❌ Error al actualizar la serie de eventos');
          return;
        }

        setRefresh(prev => prev + 1);
        alert(`✅ Serie modificada correctamente. Se actualizaron ${cantidadEventos} eventos.`);
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('❌ Error inesperado al modificar la serie');
      }
    },
    [setRefresh]
  );

  const editarEventoIndividual = useCallback(
    async evento => {
      const { resource: ev } = evento;

      // Solicitar nueva fecha y hora
      const nuevaFecha = prompt(
        `📅 Cambiar fecha del evento "${ev.clases.nombre}"\n\nFecha actual: ${ev.fecha}\nIngresa nueva fecha (YYYY-MM-DD):`,
        ev.fecha
      );

      if (!nuevaFecha) return;

      // Validar formato de fecha
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(nuevaFecha)) {
        alert('❌ Formato de fecha inválido. Usa YYYY-MM-DD');
        return;
      }

      const fechaObj = new Date(nuevaFecha);
      if (isNaN(fechaObj.getTime())) {
        alert('❌ Fecha inválida');
        return;
      }

      const nuevaHoraInicio = prompt(
        `🕐 Cambiar hora de inicio\n\nHora actual: ${ev.hora_inicio}\nIngresa nueva hora (HH:MM):`,
        ev.hora_inicio
      );

      if (!nuevaHoraInicio) return;

      const nuevaHoraFin = prompt(
        `🕐 Cambiar hora de fin\n\nHora actual: ${ev.hora_fin}\nIngresa nueva hora (HH:MM):`,
        ev.hora_fin
      );

      if (!nuevaHoraFin) return;

      // Validar formato de hora
      const horaRegex = /^\d{2}:\d{2}$/;
      if (!horaRegex.test(nuevaHoraInicio) || !horaRegex.test(nuevaHoraFin)) {
        alert('❌ Formato de hora inválido. Usa HH:MM');
        return;
      }

      // Validar que la hora de fin sea posterior a la de inicio
      const horaInicioObj = new Date(`2000-01-01T${nuevaHoraInicio}`);
      const horaFinObj = new Date(`2000-01-01T${nuevaHoraFin}`);
      if (horaFinObj <= horaInicioObj) {
        alert('❌ La hora de fin debe ser posterior a la hora de inicio');
        return;
      }

      const confirmacion = window.confirm(
        `¿Confirmar cambios?\n\n📅 Fecha: ${ev.fecha} → ${nuevaFecha}\n🕐 Inicio: ${ev.hora_inicio} → ${nuevaHoraInicio}\n🕐 Fin: ${ev.hora_fin} → ${nuevaHoraFin}\n\nEste evento se separará de la serie original.`
      );

      if (!confirmacion) return;

      try {
        const updateData = {
          fecha: nuevaFecha,
          hora_inicio: nuevaHoraInicio,
          hora_fin: nuevaHoraFin,
        };

        try {
          updateData.modificado_individualmente = true;
          updateData.fecha_modificacion = new Date().toISOString();
        } catch (err) {
          console.warn(
            '⚠️ Campos de modificación individual no disponibles:',
            err
          );
        }

        const { error } = await supabase
          .from('eventos_clase')
          .update(updateData)
          .eq('id', ev.id);

        if (error) {
          console.error('Error actualizando evento:', error);
          alert('❌ Error al actualizar el evento');
          return;
        }

        setRefresh(prev => prev + 1);
        alert('✅ Evento modificado correctamente');
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('❌ Error inesperado al modificar el evento');
      }
    },
    [setRefresh]
  );

  const handleEventoClick = useCallback(
    async (evento, setEventoACancelar, setShowModalCancelar) => {
      const { resource: ev } = evento;

      if (ev.estado === 'cancelada') {
        await actualizarEstadoEvento(evento, 'programada');
      } else {
        setEventoACancelar(evento);
        setShowModalCancelar(true);
      }
    },
    [actualizarEstadoEvento]
  );

  return {
    actualizarEstadoEvento,
    cancelarEventoIndividual,
    cancelarTodaLaSerie,
    eliminarSerieCompleta,
    handleEliminarEvento,
    editarEventoIndividual,
    editarTodaLaSerie,
    handleEventoClick,
  };
}
