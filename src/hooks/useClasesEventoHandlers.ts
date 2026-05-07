import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Dispatch, SetStateAction } from 'react';

type EventoClaseUI = {
  id?: string;
  title?: string;
  start?: Date;
  resource: {
    [key: string]: unknown;
    id?: string;
    estado?: string | null;
    fecha?: string;
    hora_inicio?: string;
    hora_fin?: string;
    clase_id?: string | null;
    clases?: {
      [key: string]: unknown;
      id?: string;
      nombre?: string | null;
      profesor?: string | null;
    };
  };
};

interface SupabaseUntyped {
  from: (table: string) => {
    update: (payload: unknown) => {
      eq: (col: string, value: string) => {
        select: (columns?: string) => Promise<{ data?: Array<{ id: string }>; error: unknown }>;
      };
    };
    delete: () => {
      eq: (col: string, value: string) => {
        eq: (col2: string, value2: string) => Promise<{ error: unknown }>;
      };
    };
    select: (columns: string) => {
      eq: (col: string, value: string) => Promise<{ data?: Array<{ id: string; estado?: string | null }>; error: unknown }>;
    };
  };
}

/**
 * Hook para manejar acciones sobre eventos individuales (cancelar, eliminar, editar)
 */
export function useClasesEventoHandlers(
  setRefresh: Dispatch<SetStateAction<number>>
) {
  const actualizarEstadoEvento = useCallback(
    async (evento: EventoClaseUI, nuevoEstado: string) => {
      const { resource: ev } = evento;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .update({ estado: nuevoEstado })
          .eq('id', ev.id || '');

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
    async (evento: EventoClaseUI) => {
      await actualizarEstadoEvento(evento, 'cancelada');
      alert('✅ Evento cancelado. No contará en los gastos de instalaciones.');
    },
    [actualizarEstadoEvento]
  );

  const cancelarTodaLaSerie = useCallback(
    async (evento: EventoClaseUI) => {
      const { resource: ev } = evento;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .update({ estado: 'cancelada' })
          .eq('clase_id', ev.clases?.id || '');

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
    async (evento: EventoClaseUI) => {
      const { resource: ev } = evento;
      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar PERMANENTEMENTE toda la serie de eventos de la clase "${ev.clases?.nombre || 'Sin nombre'}"?\n\nEsta acción eliminará TODOS los eventos de esta clase y NO se puede deshacer.`
      );

      if (!confirmacion) return;

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .delete()
          .eq('clase_id', ev.clases?.id || '');

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
    async (evento: EventoClaseUI) => {
      const confirmacion = window.confirm(
        `¿Estás seguro de que quieres eliminar permanentemente el evento "${evento.title}"?\n\nEsta acción:\n- Eliminará el evento de la vista\n- NO contará en los gastos de instalaciones\n- Eliminará las asistencias relacionadas\n\nEsta acción no se puede deshacer.`
      );

      if (!confirmacion) return;

      try {
        // Eliminar asistencias relacionadas primero
        const { error: asistenciasError } = await supabase
          .from('asistencias')
          .delete()
          .eq('clase_id', evento.resource.clases?.id || '')
          .eq('fecha', (evento.start || new Date()).toISOString().split('T')[0]);

        if (asistenciasError) {
          console.error('Error eliminando asistencias:', asistenciasError);
        }

        // Marcar el evento como eliminado
        const { error: eventoError } = await supabase
          .from('eventos_clase')
          .update({ estado: 'eliminado' })
          .eq('id', evento.id || '');

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
    async (evento: EventoClaseUI) => {
      const { resource: ev } = evento;

      // Obtener el clase_id correctamente (puede estar en ev.clase_id o ev.clases.id)
      const claseId = ev.clase_id || ev.clases?.id;
      
      if (!claseId) {
        console.error('No se pudo obtener el ID de la clase:', ev);
        alert('❌ Error: No se pudo identificar la clase del evento');
        return;
      }

      // Solicitar nueva hora de inicio y fin (la fecha se mantiene por evento)
      const nuevaHoraInicio = prompt(
        `🕐 Cambiar hora de inicio para TODA la serie de eventos\n\nClase: "${ev.clases?.nombre || 'Sin nombre'}"\nHora actual: ${ev.hora_inicio}\nIngresa nueva hora (HH:MM):`,
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
      // Excluir eventos eliminados y cancelados
      // Primero obtener todos los eventos y filtrar en JavaScript para manejar null correctamente
      const { data: todosEventos, error: selectError } = await supabase
        .from('eventos_clase')
        .select('id, estado')
        .eq('clase_id', claseId);

      if (selectError) {
        console.error('Error al obtener eventos:', selectError);
        alert('❌ Error al obtener eventos de la serie');
        return;
      }

      // Filtrar eventos válidos (no eliminados ni cancelados)
      const eventosValidos = (todosEventos || []).filter(
        e => e.estado !== 'eliminado' && e.estado !== 'cancelada'
      );

      const cantidadEventos = eventosValidos.length;


      if (cantidadEventos === 0) {
        alert('⚠️ No se encontraron eventos válidos para modificar en esta serie');
        return;
      }

      const confirmacion = window.confirm(
        `¿Confirmar cambios para TODA la serie?\n\n🕐 Inicio: ${ev.hora_inicio} → ${nuevaHoraInicio}\n🕐 Fin: ${ev.hora_fin} → ${nuevaHoraFin}\n\nSe modificarán ${cantidadEventos} eventos de la clase "${ev.clases?.nombre || 'Sin nombre'}"\n\n⚠️ Esta acción afectará a TODOS los eventos de esta serie (excepto cancelados y eliminados).`
      );

      if (!confirmacion) return;

      try {
        // Construir la consulta de actualización
        // Actualizar solo los eventos válidos usando sus IDs
        const idsValidos = eventosValidos.map(e => e.id);

        if (idsValidos.length === 0) {
          alert('⚠️ No se encontraron eventos válidos para modificar en esta serie');
          return;
        }

        const { data, error } = await supabase
          .from('eventos_clase')
          .update({
            hora_inicio: nuevaHoraInicio,
            hora_fin: nuevaHoraFin,
          })
          .in('id', idsValidos.filter(Boolean))
          .select('id');

        if (error) {
          console.error('Error actualizando serie:', error);
          console.error('Detalles del error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            claseId,
            nuevaHoraInicio,
            nuevaHoraFin,
          });
          alert(`❌ Error al actualizar la serie de eventos: ${error.message}`);
          return;
        }

        const eventosActualizados = data?.length || 0;

        if (eventosActualizados === 0) {
          alert('⚠️ No se actualizó ningún evento. Verifica que haya eventos válidos en la serie.');
          return;
        }

        console.log(`✅ Serie actualizada: ${eventosActualizados} eventos modificados`);
        setRefresh(prev => prev + 1);
        alert(`✅ Serie modificada correctamente. Se actualizaron ${eventosActualizados} eventos.`);
      } catch (error) {
        console.error('Error inesperado:', error);
        alert(
          `❌ Error inesperado al modificar la serie: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    },
    [setRefresh]
  );

  const editarEventoIndividual = useCallback(
    async (evento: EventoClaseUI) => {
      const { resource: ev } = evento;

      // Solicitar nueva fecha y hora
      const nuevaFecha = prompt(
        `📅 Cambiar fecha del evento "${ev.clases?.nombre || 'Sin nombre'}"\n\nFecha actual: ${ev.fecha}\nIngresa nueva fecha (YYYY-MM-DD):`,
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
        const updateData: Record<string, unknown> = {
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

        const { error } = await (supabase as unknown as {
          from: (table: string) => {
            update: (payload: unknown) => { eq: (col: string, value: string) => Promise<{ error: unknown }> };
          };
        })
          .from('eventos_clase')
          .update(updateData)
          .eq('id', ev.id || '');

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
    async (
      evento: EventoClaseUI,
      setEventoACancelar: (evento: EventoClaseUI) => void,
      setShowModalCancelar: (open: boolean) => void
    ) => {
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

  const editarProfesorClase = useCallback(
    async (evento: EventoClaseUI) => {
      const { resource: ev } = evento;
      const claseId = ev.clase_id || ev.clases?.id;

      if (!claseId) {
        alert('❌ Error: No se pudo identificar la clase del evento');
        return;
      }

      // Cargar lista de profesores
      const { data: profesoresData, error: profesoresError } = await supabase
        .from('profesores')
        .select('id, nombre, apellidos, activo')
        .eq('activo', true)
        .order('nombre');

      if (profesoresError) {
        console.error('Error cargando profesores:', profesoresError);
        alert('❌ Error al cargar la lista de profesores');
        return;
      }

      const profesoresActivos = profesoresData || [];
      const profesorActual = ev.clases?.profesor || 'Sin asignar';

      // Crear opciones para el prompt
      const opciones = profesoresActivos
        .map((p, index) => `${index + 1}. ${p.nombre}${p.apellidos ? ' ' + p.apellidos : ''}`)
        .join('\n');

      const mensaje = `👨‍🏫 Cambiar profesor de la clase "${ev.clases?.nombre || 'Sin nombre'}"\n\nProfesor actual: ${profesorActual}\n\nProfesores disponibles:\n${opciones}\n\nIngresa el número del profesor (o 0 para quitar el profesor):`;

      const respuesta = prompt(mensaje, '0');

      if (respuesta === null) return; // Usuario canceló

      const indice = parseInt(respuesta);

      if (isNaN(indice) || indice < 0 || indice > profesoresActivos.length) {
        alert('❌ Número inválido');
        return;
      }

      let nuevoProfesor = '';
      if (indice === 0) {
        nuevoProfesor = '';
      } else {
        const profesorSeleccionado = profesoresActivos[indice - 1];
        nuevoProfesor = profesorSeleccionado.nombre + (profesorSeleccionado.apellidos ? ' ' + profesorSeleccionado.apellidos : '');
      }

      const confirmacion = window.confirm(
        `¿Confirmar cambio de profesor?\n\nClase: "${ev.clases?.nombre || 'Sin nombre'}"\nProfesor actual: ${profesorActual}\nNuevo profesor: ${nuevoProfesor || 'Sin asignar'}\n\nEsta acción actualizará el profesor para TODA la serie de eventos de esta clase.`
      );

      if (!confirmacion) return;

      try {
        const { error } = await supabase
          .from('clases')
          .update({ profesor: nuevoProfesor })
          .eq('id', claseId || '');

        if (error) {
          console.error('Error actualizando profesor:', error);
          alert('❌ Error al actualizar el profesor');
          return;
        }

        setRefresh(prev => prev + 1);
        alert(`✅ Profesor actualizado correctamente a "${nuevoProfesor || 'Sin asignar'}"`);
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('❌ Error inesperado al actualizar el profesor');
      }
    },
    [setRefresh]
  );

  return {
    actualizarEstadoEvento,
    cancelarEventoIndividual,
    cancelarTodaLaSerie,
    eliminarSerieCompleta,
    handleEliminarEvento,
    editarEventoIndividual,
    editarTodaLaSerie,
    editarProfesorClase,
    handleEventoClick,
  };
}


