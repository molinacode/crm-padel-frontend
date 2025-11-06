import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Hook que centraliza todos los handlers para las acciones de eventos en Clases.jsx
 */
export function useClasesHandlers({
  setTabActiva,
  setEventoParaAsignar,
  setMostrarAsignarAlumnos,
  setEventoParaOcupar,
  setMostrarOcuparHuecos,
  setEventoParaDesasignar,
  setMostrarDesasignarAlumnos,
  handleEventoClick,
  editarEventoIndividual,
  handleEliminarEvento,
}) {
  const [searchParams] = useSearchParams();

  const handleAsignar = useCallback(
    evento => {
      setTabActiva('asignar');
      // Scroll al evento específico en asignaciones
      setTimeout(() => {
        const elemento = document.getElementById(
          `evento-${evento.resource.clase_id}`
        );
        if (elemento) {
          elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          elemento.classList.add('animate-pulse');
          setTimeout(() => elemento.classList.remove('animate-pulse'), 2000);
        }
      }, 100);
    },
    [setTabActiva]
  );

  const handleRecuperacion = useCallback(
    evento => {
      const alumnoId = searchParams.get('alumno');
      if (!alumnoId) return;

      setEventoParaAsignar({
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases.tipo_clase,
        nivel_clase: evento.resource.clases.nivel_clase,
        dia_semana: evento.resource.clases.dia_semana,
        hora_inicio: evento.resource.clases.hora_inicio,
        hora_fin: evento.resource.clases.hora_fin,
        capacidad_maxima: evento.resource.clases.capacidad_maxima,
        alumnosAsignados: evento.alumnosAsignados.length,
        alumnosJustificados: evento.alumnosJustificados,
        alumnoRecuperacion: alumnoId,
      });
      setMostrarAsignarAlumnos(true);

      setTimeout(() => {
        const modal = document.querySelector('.modal-asignar-alumnos');
        if (modal) {
          modal.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 100);
    },
    [searchParams, setEventoParaAsignar, setMostrarAsignarAlumnos]
  );

  const handleOcuparHuecos = useCallback(
    evento => {
      console.log(
        `🔍 Abriendo popup: ${evento.huecosDisponibles} huecos, ${evento.alumnosJustificados.length} justificados`
      );
      setEventoParaOcupar({
        id: evento.id,
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases.tipo_clase,
        cantidadHuecos: evento.huecosDisponibles,
        alumnosJustificados: evento.alumnosJustificados,
      });
      setMostrarOcuparHuecos(true);
    },
    [setEventoParaOcupar, setMostrarOcuparHuecos]
  );

  const handleOcuparHuecosRecuperacion = useCallback(
    evento => {
      console.log(
        `🔄 Abriendo popup de recuperaciones: ${evento.huecosDisponibles} huecos disponibles`
      );
      setEventoParaOcupar({
        id: evento.id,
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases.tipo_clase,
        cantidadHuecos: evento.huecosDisponibles,
        alumnosJustificados: evento.alumnosJustificados,
        esRecuperacion: true,
      });
      setMostrarOcuparHuecos(true);
    },
    [setEventoParaOcupar, setMostrarOcuparHuecos]
  );

  const handleDesasignar = useCallback(
    evento => {
      setEventoParaDesasignar({
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases.tipo_clase,
        alumnosAsignados: evento.alumnosAsignados,
        alumnosPresentes: evento.alumnosPresentes,
        maxAlumnos: evento.resource.clases.tipo_clase === 'particular' ? 1 : 4,
      });
      setMostrarDesasignarAlumnos(true);
    },
    [setEventoParaDesasignar, setMostrarDesasignarAlumnos]
  );

  const handleCancelar = useCallback(
    evento => {
      handleEventoClick(evento);
    },
    [handleEventoClick]
  );

  const handleEditar = useCallback(
    evento => {
      editarEventoIndividual(evento);
    },
    [editarEventoIndividual]
  );

  const handleEliminar = useCallback(
    evento => {
      handleEliminarEvento(evento);
    },
    [handleEliminarEvento]
  );

  const handleToggleExcluirAlquiler = useCallback(async evento => {
    try {
      const current = !!evento.excluirAlquiler || !!evento.resource?.excluir_alquiler;
      console.log('🔄 Actualizando excluir_alquiler:', {
        eventoId: evento.id,
        current,
        nuevoValor: !current,
      });
      
      const { data, error } = await supabase
        .from('eventos_clase')
        .update({ excluir_alquiler: !current })
        .eq('id', evento.id)
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      console.log('✅ Actualización exitosa:', data);
      alert(!current ? '✅ Evento excluido del alquiler' : '✅ Evento incluido en el alquiler');
      window.location.reload();
    } catch (e) {
      console.error('❌ Error al actualizar excluir_alquiler:', e);
      alert(`❌ No se pudo actualizar el estado de alquiler: ${e.message || e}`);
    }
  }, []);

  return {
    handleAsignar,
    handleRecuperacion,
    handleOcuparHuecos,
    handleOcuparHuecosRecuperacion,
    handleDesasignar,
    handleCancelar,
    handleEditar,
    handleEliminar,
    handleToggleExcluirAlquiler,
  };
}
