import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Dispatch, SetStateAction } from 'react';

interface EventoUI {
  id?: string;
  title?: string;
  start?: Date;
  resource: {
    id?: string;
    fecha?: string;
    estado?: string | null;
    clase_id?: string | null;
    excluir_alquiler?: boolean | null;
    clases: {
      id?: string;
      nombre?: string | null;
      tipo_clase?: string | null;
      nivel_clase?: string | null;
      dia_semana?: string | null;
      hora_inicio?: string | null;
      hora_fin?: string | null;
      capacidad_maxima?: number | null;
    };
  };
  excluirAlquiler?: boolean;
  alumnosAsignados?: Array<unknown>;
  alumnosJustificados?: Array<unknown>;
  alumnosPresentes?: Array<unknown>;
  huecosDisponibles?: number;
}

interface UseClasesHandlersParams {
  setTabActiva: Dispatch<SetStateAction<string>>;
  setEventoParaAsignar: Dispatch<SetStateAction<Record<string, unknown> | null>>;
  setMostrarAsignarAlumnos: Dispatch<SetStateAction<boolean>>;
  setEventoParaOcupar: Dispatch<SetStateAction<Record<string, unknown> | null>>;
  setMostrarOcuparHuecos: Dispatch<SetStateAction<boolean>>;
  setEventoParaDesasignar: Dispatch<SetStateAction<Record<string, unknown> | null>>;
  setMostrarDesasignarAlumnos: Dispatch<SetStateAction<boolean>>;
  handleEventoClick: (evento: EventoUI) => void;
  editarEventoIndividual: (evento: EventoUI) => void;
  editarTodaLaSerie: (evento: EventoUI) => void;
  editarProfesorClase?: (evento: EventoUI) => void;
  handleEliminarEvento: (evento: EventoUI) => void;
  onRefresh?: () => void;
}

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
  editarTodaLaSerie,
  editarProfesorClase,
  handleEliminarEvento,
  onRefresh,
}: UseClasesHandlersParams) {
  const [searchParams] = useSearchParams();

  const handleAsignar = useCallback(
    (evento: EventoUI) => {
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
    (evento: EventoUI) => {
      const alumnoId = searchParams.get('alumno');
      if (!alumnoId) return;

      setEventoParaAsignar({
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases?.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases?.tipo_clase,
        nivel_clase: evento.resource.clases?.nivel_clase,
        dia_semana: evento.resource.clases?.dia_semana,
        hora_inicio: evento.resource.clases?.hora_inicio,
        hora_fin: evento.resource.clases?.hora_fin,
        capacidad_maxima: evento.resource.clases?.capacidad_maxima,
        alumnosAsignados: evento.alumnosAsignados?.length || 0,
        alumnosJustificados: evento.alumnosJustificados || [],
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
    (evento: EventoUI) => {
      console.log('🔍 handleOcuparHuecos - Página 1 DEBUG:', {
        eventoId: evento?.id,
        tieneSetEventoParaOcupar: typeof setEventoParaOcupar === 'function',
        tieneSetMostrarOcuparHuecos: typeof setMostrarOcuparHuecos === 'function',
      });
      
      // Validar que el evento tenga las propiedades necesarias
      if (!evento || !evento.resource || !evento.resource.clases) {
        console.error('❌ Evento inválido:', evento);
        alert('❌ Error: El evento no tiene la información necesaria');
        return;
      }

      const huecosDisponibles = evento.huecosDisponibles ?? 0;
      const alumnosJustificados = evento.alumnosJustificados || [];
      
      const eventoData = {
        id: evento.id,
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases?.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases?.tipo_clase,
        cantidadHuecos: huecosDisponibles,
        alumnosJustificados: alumnosJustificados,
      };
      
      console.log('📝 Estableciendo estados - Página 1:', eventoData);
      
      // Usar setTimeout para asegurar que el estado se establezca después del render
      setTimeout(() => {
        setEventoParaOcupar(eventoData);
        setMostrarOcuparHuecos(true);
        console.log('✅ Estados establecidos después de timeout');
      }, 0);
    },
    [setEventoParaOcupar, setMostrarOcuparHuecos]
  );

  const handleOcuparHuecosRecuperacion = useCallback(
    (evento: EventoUI) => {
      console.log('🔄 handleOcuparHuecosRecuperacion - Página 1 DEBUG:', {
        eventoId: evento?.id,
        tieneSetEventoParaOcupar: typeof setEventoParaOcupar === 'function',
        tieneSetMostrarOcuparHuecos: typeof setMostrarOcuparHuecos === 'function',
      });
      
      // Validar que el evento tenga las propiedades necesarias
      if (!evento || !evento.resource || !evento.resource.clases) {
        console.error('❌ Evento inválido:', evento);
        alert('❌ Error: El evento no tiene la información necesaria');
        return;
      }

      const huecosDisponibles = evento.huecosDisponibles ?? 0;
      const alumnosJustificados = evento.alumnosJustificados || [];
      
      const eventoData = {
        id: evento.id,
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases?.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases?.tipo_clase,
        cantidadHuecos: huecosDisponibles,
        alumnosJustificados: alumnosJustificados,
        esRecuperacion: true,
      };
      
      console.log('📝 Estableciendo estados (recuperación) - Página 1:', eventoData);
      
      // Usar setTimeout para asegurar que el estado se establezca después del render
      setTimeout(() => {
        setEventoParaOcupar(eventoData);
        setMostrarOcuparHuecos(true);
        console.log('✅ Estados establecidos después de timeout (recuperación)');
      }, 0);
    },
    [setEventoParaOcupar, setMostrarOcuparHuecos]
  );

  const handleDesasignar = useCallback(
    (evento: EventoUI) => {
      setEventoParaDesasignar({
        clase_id: evento.resource.clase_id,
        nombre: evento.resource.clases.nombre,
        fecha: evento.resource.fecha,
        tipo_clase: evento.resource.clases.tipo_clase,
        alumnosAsignados: evento.alumnosAsignados,
        alumnosPresentes: evento.alumnosPresentes,
        maxAlumnos: evento.resource.clases?.tipo_clase === 'particular' ? 1 : 4,
      });
      setMostrarDesasignarAlumnos(true);
    },
    [setEventoParaDesasignar, setMostrarDesasignarAlumnos]
  );

  const handleCancelar = useCallback(
    (evento: EventoUI) => {
      handleEventoClick(evento);
    },
    [handleEventoClick]
  );

  const handleEditar = useCallback(
    (evento: EventoUI) => {
      editarEventoIndividual(evento);
    },
    [editarEventoIndividual]
  );

  const handleEditarSerie = useCallback(
    (evento: EventoUI) => {
      editarTodaLaSerie(evento);
    },
    [editarTodaLaSerie]
  );

  const handleEliminar = useCallback(
    (evento: EventoUI) => {
      handleEliminarEvento(evento);
    },
    [handleEliminarEvento]
  );

  const handleToggleExcluirAlquiler = useCallback(async (evento: EventoUI) => {
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
        .eq('id', evento.id || '')
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      console.log('✅ Actualización exitosa:', data);
      alert(!current ? '✅ Evento excluido del alquiler' : '✅ Evento incluido en el alquiler');
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (e) {
      console.error('❌ Error al actualizar excluir_alquiler:', e);
      alert(`❌ No se pudo actualizar el estado de alquiler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [onRefresh]);

  const handleEditarProfesor = useCallback(
    (evento: EventoUI) => {
      if (editarProfesorClase) {
        editarProfesorClase(evento);
      }
    },
    [editarProfesorClase]
  );

  return {
    handleAsignar,
    handleRecuperacion,
    handleOcuparHuecos,
    handleOcuparHuecosRecuperacion,
    handleDesasignar,
    handleCancelar,
    handleEditar,
    handleEditarSerie,
    handleEditarProfesor,
    handleEliminar,
    handleToggleExcluirAlquiler,
  };
}


