import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import { supabase } from '../lib/supabase';
import FormularioClase from '../components/FormularioClase';
import AsignarAlumnosClase from '../components/AsignarAlumnosClase';
import OcuparHuecos from '../components/OcuparHuecos';
import DesasignarAlumnos from '../components/DesasignarAlumnos';
import Paginacion from '../components/Paginacion';
import { useSearchParams } from 'react-router-dom';

const localizer = dateFnsLocalizer({
  format: (date, formatStr) => format(date, formatStr, { locale: es }),
  parse: (dateStr, formatStr) => parse(dateStr, formatStr, new Date(), { locale: es }),
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay: (date) => getDay(date),
  locales: { es }
});

const { MONTH, WEEK, DAY } = Views;

export default function Clases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [eventos, setEventos] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'table'
  const [claseParaEditar, setClaseParaEditar] = useState(null);
  const [showModalCancelar, setShowModalCancelar] = useState(false);
  const [eventoACancelar, setEventoACancelar] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  // Estados para ocupar huecos
  const [mostrarOcuparHuecos, setMostrarOcuparHuecos] = useState(false);
  const [eventoParaOcupar, setEventoParaOcupar] = useState(null);

  // Estados para desasignar alumnos
  const [mostrarDesasignarAlumnos, setMostrarDesasignarAlumnos] = useState(false);
  const [eventoParaDesasignar, setEventoParaDesasignar] = useState(null);

  // Estados para pestañas
  const [tabActiva, setTabActiva] = useState('proximas');

  // Estados para filtros
  const [filtroNivel, setFiltroNivel] = useState('');

  // Estados para paginación del historial
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Manejar parámetros URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');
    const highlight = searchParams.get('highlight');

    if (tab) {
      setTabActiva(tab);
    }

    if (view === 'table') {
      setViewMode('table');
    }

    // Si hay highlight, hacer scroll al elemento después de cargar los datos
    if (highlight && eventos.length > 0) {
      setTimeout(() => {
        const elemento = document.getElementById(`evento-${highlight}`);
        if (elemento) {
          elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          // Agregar efecto visual de resaltado permanente
          elemento.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75');
        }
      }, 100);
    }
  }, [searchParams, eventos]);

  // Función helper para determinar colores de clases
  const getClassColors = (clase, isCanceled = false, esMixta = false, esModificadoIndividualmente = false) => {
    if (isCanceled) {
      return {
        className: 'line-through opacity-50 text-gray-400 bg-gray-100',
        badgeClass: 'bg-gray-100 text-gray-800',
        label: '❌ Cancelada'
      };
    }

    if (esMixta) {
      return {
        className: 'border-l-4 border-cyan-500 bg-cyan-50 text-cyan-900',
        badgeClass: 'bg-cyan-100 text-cyan-800',
        label: '🔀 Mixta'
      };
    }

    // Eventos modificados individualmente tienen un estilo especial
    if (esModificadoIndividualmente) {
      return {
        className: 'border-l-4 border-indigo-500 bg-indigo-50 text-indigo-900',
        badgeClass: 'bg-indigo-100 text-indigo-800',
        label: '📅 Modificado'
      };
    }

    const esParticular = clase.tipo_clase === 'particular';
    const esInterna = clase.tipo_clase === 'interna' || clase.nombre?.toLowerCase().includes('interna');
    const esEscuela = clase.tipo_clase === 'escuela' || clase.nombre?.toLowerCase().includes('escuela');

    if (esParticular) {
      return {
        className: 'border-l-4 border-purple-500 bg-purple-50 text-purple-900',
        badgeClass: 'bg-purple-100 text-purple-800',
        label: '🎯 Particular'
      };
    } else if (esInterna) {
      return {
        className: 'border-l-4 border-green-500 bg-green-50 text-green-900',
        badgeClass: 'bg-green-100 text-green-800',
        label: '🏠 Interna'
      };
    } else if (esEscuela) {
      return {
        className: 'border-l-4 border-orange-500 bg-orange-50 text-orange-900',
        badgeClass: 'bg-orange-100 text-orange-800',
        label: '🏫 Escuela'
      };
    } else {
      return {
        className: 'border-l-4 border-blue-500 bg-blue-50 text-blue-900',
        badgeClass: 'bg-blue-100 text-blue-800',
        label: '👥 Grupal'
      };
    }
  };

  // Función para cargar eventos y clases
  const cargarEventos = useCallback(async () => {
    try {
      console.log('🔄 Cargando eventos...');

      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos_clase')
        .select(`
            *,
            clases (*)
          `)
        .order('fecha', { ascending: true });

      if (eventosError) {
        console.error('Error cargando eventos:', eventosError);
        return;
      }

      if (!isMounted) return;

      // Filtrar eventos eliminados en el lado del cliente para mayor control
      const eventosFiltrados = eventosData?.filter(evento =>
        evento.estado !== 'eliminado'
      ) || [];

      console.log('📊 Eventos cargados:', eventosData?.length || 0);
      console.log('📊 Eventos filtrados (sin eliminados):', eventosFiltrados.length);

      // Cargar alumnos asignados y asistencias por separado
      const [alumnosRes, asistenciasRes] = await Promise.all([
        supabase
          .from('alumnos_clases')
          .select(`
              clase_id,
              alumno_id,
              origen,
              alumnos (id, nombre)
            `),
        supabase
          .from('asistencias')
          .select(`
              alumno_id,
              clase_id,
              fecha,
              estado,
              alumnos (id, nombre)
            `)
          .eq('estado', 'justificada')
      ]);

      const { data: alumnosData, error: alumnosError } = alumnosRes;
      const { data: asistenciasData, error: asistenciasError } = asistenciasRes;

      if (alumnosError) {
        console.error('Error cargando alumnos:', alumnosError);
        return;
      }

      if (asistenciasError) {
        console.error('Error cargando asistencias:', asistenciasError);
        // Continuar sin asistencias si hay error
      }

      if (!isMounted) return;

      // Crear mapa de alumnos por clase y orígenes por clase
      const alumnosPorClase = {};
      const origenesPorClase = {};
      if (alumnosData) {
        alumnosData.forEach(ac => {
          if (!alumnosPorClase[ac.clase_id]) {
            alumnosPorClase[ac.clase_id] = [];
          }
          alumnosPorClase[ac.clase_id].push({ ...ac.alumnos, _origen: ac.origen || null });

          if (!origenesPorClase[ac.clase_id]) origenesPorClase[ac.clase_id] = new Set();
          if (ac.origen) origenesPorClase[ac.clase_id].add(ac.origen);
        });
      }

      // Crear mapa de asistencias justificadas por clase y fecha
      const asistenciasJustificadas = {};
      if (asistenciasData) {
        asistenciasData.forEach(a => {
          const key = `${a.clase_id}|${a.fecha}`;
          if (!asistenciasJustificadas[key]) {
            asistenciasJustificadas[key] = [];
          }
          asistenciasJustificadas[key].push(a.alumnos);
        });
      }

      // Obtener liberaciones de plaza activas para calcular huecos reales
      const { data: liberacionesData, error: liberacionesError } = await supabase
        .from('liberaciones_plaza')
        .select('clase_id, alumno_id, fecha_inicio')
        .eq('estado', 'activa');

      if (liberacionesError) {
        console.error('Error obteniendo liberaciones:', liberacionesError);
      }

      // console.log('🔍 DEBUG - Liberaciones obtenidas:', liberacionesData?.length || 0);
      // console.log('🔍 DEBUG - Liberaciones data:', liberacionesData);

      // Crear mapa de liberaciones por clase y fecha
      const liberacionesPorEvento = {};
      liberacionesData?.forEach(liberacion => {
        const key = `${liberacion.clase_id}|${liberacion.fecha_inicio}`;
        if (!liberacionesPorEvento[key]) {
          liberacionesPorEvento[key] = new Set();
        }
        liberacionesPorEvento[key].add(liberacion.alumno_id);
      });

      // console.log('🔍 DEBUG - Liberaciones por evento:', liberacionesPorEvento);

      // Procesar eventos
      const eventosProcesados = eventosFiltrados.map((ev, index) => {
        const start = new Date(ev.fecha + 'T' + ev.hora_inicio);
        const end = new Date(ev.fecha + 'T' + ev.hora_fin);
        const alumnosAsignados = (alumnosPorClase[ev.clase_id] || []).map(a => ({ id: a.id, nombre: a.nombre, _origen: a._origen }));

        // Determinar si es clase mixta (hay escuela e interna a la vez)
        const origenes = origenesPorClase[ev.clase_id] ? Array.from(origenesPorClase[ev.clase_id]) : [];
        const esMixta = origenes.includes('escuela') && origenes.includes('interna');
        const esModificadoIndividualmente = ev.modificado_individualmente === true;
        const colorClass = getClassColors(ev.clases, ev.estado === 'cancelada', esMixta, esModificadoIndividualmente);

        // Obtener alumnos con falta justificada para este evento específico
        const fechaEvento = ev.fecha;
        const keyJustificadas = `${ev.clase_id}|${fechaEvento}`;
        const alumnosJustificados = asistenciasJustificadas[keyJustificadas] || [];

        // 🆕 Calcular huecos reales disponibles
        const esParticular = ev.clases.tipo_clase === 'particular';
        const maxAlumnos = esParticular ? 1 : 4;
        const liberadosIds = liberacionesPorEvento[keyJustificadas] || new Set();

        // Alumnos realmente presentes (asignados - liberados - justificados)
        const justificadosIds = new Set(alumnosJustificados.map(j => j.id));
        const alumnosPresentes = Math.max(0, alumnosAsignados.length - liberadosIds.size - justificadosIds.size);

        // Huecos reales disponibles (máximo - presentes)
        const huecosReales = Math.max(0, maxAlumnos - alumnosPresentes);

        // Los huecos disponibles son los alumnos justificados, pero limitados por los huecos reales
        const huecosDisponibles = Math.min(alumnosJustificados.length, huecosReales);

        // 🆕 Mostrar todos los alumnos justificados (independientemente de liberaciones)
        const alumnosJustificadosConHuecos = alumnosJustificados;

        // 🔍 DEBUG - Solo para clases con problemas reales (máximo 5)
        if (index < 5 && (alumnosJustificados.length > 0 || alumnosPresentes > maxAlumnos)) {
          console.log(`🔍 Clase "${ev.clases.nombre}" (${fechaEvento}): ${alumnosJustificados.length} justificados, ${huecosDisponibles} huecos`);
        }

        return {
          id: ev.id,
          title: `${ev.clases.nombre} (${ev.clases.nivel_clase})`,
          subtitle: ev.clases.profesor,
          start,
          end,
          allDay: false,
          resource: ev,
          alumnosAsignados,
          alumnosJustificados: alumnosJustificadosConHuecos, // 🆕 Solo los que realmente tienen huecos
          huecosReales, // 🆕 Número real de huecos disponibles
          huecosDisponibles, // 🆕 Huecos disponibles por alumnos justificados
          alumnosPresentes, // 🆕 Alumnos realmente presentes
          className: colorClass.className,
          esMixta
        };
      });

      setEventos(eventosProcesados);
      console.log('✅ Eventos cargados:', eventosProcesados.length);
    } catch (error) {
      console.error('💥 Error cargando eventos:', error);
    }
  }, [refresh]);

  //Cargar eventos y clases
  useEffect(() => {
    setIsMounted(true);
    cargarEventos();

    return () => {
      setIsMounted(false);
    };
  }, [cargarEventos]);

  // Handlers para el calendario (optimizados con useCallback)
  const handleNavigate = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // Filtrar eventos por estado
  const eventosProximos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.start);
        fechaEvento.setHours(0, 0, 0, 0);
        const esFuturo = fechaEvento >= hoy && evento.resource.estado !== 'cancelada';
        const coincideNivel = !filtroNivel || evento.resource.clases.nivel_clase === filtroNivel;
        return esFuturo && coincideNivel;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [eventos, filtroNivel]);

  const eventosImpartidos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.start);
        fechaEvento.setHours(0, 0, 0, 0);
        const esPasado = fechaEvento < hoy && evento.resource.estado !== 'cancelada';
        const coincideNivel = !filtroNivel || evento.resource.clases.nivel_clase === filtroNivel;
        return esPasado && coincideNivel;
      })
      .sort((a, b) => {
        // Ordenar por fecha completa (más reciente primero)
        const fechaA = new Date(a.start);
        const fechaB = new Date(b.start);
        return fechaB - fechaA;
      });
  }, [eventos, filtroNivel]);

  const eventosCancelados = useMemo(() => {
    return eventos
      .filter(evento => {
        const esCancelada = evento.resource.estado === 'cancelada';
        const coincideNivel = !filtroNivel || evento.resource.clases.nivel_clase === filtroNivel;
        return esCancelada && coincideNivel;
      })
      .sort((a, b) => {
        // Ordenar por fecha completa (más reciente primero)
        const fechaA = new Date(a.start);
        const fechaB = new Date(b.start);
        return fechaB - fechaA;
      });
  }, [eventos, filtroNivel]);

  // Memoizar eventos ordenados para la tabla (mantener compatibilidad)
  const eventosOrdenados = useMemo(() => {
    return eventos.sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [eventos]);

  // Lógica de paginación según el tab activo
  const eventosParaMostrar = tabActiva === 'proximas' ? eventosProximos :
    tabActiva === 'impartidas' ? eventosImpartidos :
      tabActiva === 'canceladas' ? eventosCancelados :
        eventosOrdenados;

  const totalPaginas = Math.ceil(eventosParaMostrar.length / elementosPorPagina);
  const inicioIndice = (paginaActual - 1) * elementosPorPagina;
  const finIndice = inicioIndice + elementosPorPagina;
  const eventosPaginados = eventosParaMostrar.slice(inicioIndice, finIndice);

  // Función para cambiar página
  const handleCambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  // Resetear página cuando cambie el tab
  useEffect(() => {
    setPaginaActual(1);
  }, [tabActiva]);

  // Manejadores para el calendario
  const handleSelectSlot = () => {
    // Al hacer clic en una franja horaria vacía, abrir formulario de crear clase
    setTabActiva('nueva');
  };

  const handleSelectEvent = () => {
    // Al hacer clic en un evento, mostrar opciones
    setTabActiva('asignar');
  };

  const handleDoubleClickEvent = (evento) => {
    // Al hacer doble click en una clase, abrir formulario de edición
    setClaseParaEditar(evento.resource.clases);
    setTabActiva('nueva');
  };

  // Al hacer clic en un evento (para cancelar o reactivar)
  const handleEventoClick = async (evento) => {
    const { resource: ev } = evento;

    if (ev.estado === 'cancelada') {
      // Si está cancelada, reactivar directamente
      await actualizarEstadoEvento(evento, 'programada');
    } else {
      // Si está programada, mostrar modal de opciones
      setEventoACancelar(evento);
      setShowModalCancelar(true);
    }
  };

  const actualizarEstadoEvento = async (evento, nuevoEstado) => {
    const { resource: ev } = evento;

    try {
      const { error } = await supabase
        .from('eventos_clase')
        .update({ estado: nuevoEstado })
        .eq('id', ev.id);

      if (error) {
        alert('Error al actualizar el evento');
        return;
      }

      // Actualizar estado local de forma optimizada
      setEventos(prev => prev.map(e =>
        e.id === evento.id
          ? {
            ...e,
            resource: { ...e.resource, estado: nuevoEstado },
            className: getClassColors(e.resource.clases, nuevoEstado === 'cancelada').className
          }
          : e
      ));
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al actualizar el evento');
    }
  };

  const cancelarEventoIndividual = async () => {
    if (eventoACancelar) {
      await actualizarEstadoEvento(eventoACancelar, 'cancelada');
      setShowModalCancelar(false);
      setEventoACancelar(null);
      alert('✅ Evento cancelado. No contará en los gastos de instalaciones.');
    }
  };

  const cancelarTodaLaSerie = async () => {
    if (eventoACancelar) {
      const { resource: ev } = eventoACancelar;

      try {
        // Cancelar todos los eventos de la misma clase
        const { error } = await supabase
          .from('eventos_clase')
          .update({ estado: 'cancelada' })
          .eq('clase_id', ev.clases.id);

        if (error) {
          alert('Error al cancelar la serie de eventos');
          return;
        }

        // Actualizar estado local de todos los eventos de la clase
        setEventos(prev => prev.map(e =>
          e.resource.clases.id === ev.clases.id
            ? {
              ...e,
              resource: { ...e.resource, estado: 'cancelada' },
              className: getClassColors(e.resource.clases, true).className
            }
            : e
        ));

        alert('✅ Toda la serie de eventos ha sido cancelada. No contarán en los gastos de instalaciones.');
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al cancelar la serie');
      }

      setShowModalCancelar(false);
      setEventoACancelar(null);
    }
  };

  // Eliminar toda la serie de eventos (para clases canceladas)
  const eliminarSerieCompleta = async (evento) => {
    const { resource: ev } = evento;
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar PERMANENTEMENTE toda la serie de eventos de la clase "${ev.clases.nombre}"?\n\nEsta acción eliminará TODOS los eventos de esta clase y NO se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      // Eliminar todos los eventos de la misma clase
      const { error } = await supabase
        .from('eventos_clase')
        .delete()
        .eq('clase_id', ev.clases.id);

      if (error) {
        alert('Error al eliminar la serie de eventos');
        return;
      }

      // Remover del estado local todos los eventos de la clase
      setEventos(prev => prev.filter(e => e.resource.clases.id !== ev.clases.id));

      alert('✅ Toda la serie de eventos ha sido eliminada permanentemente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al eliminar la serie');
    }
  };

  // Eliminar evento completamente (marcar como eliminado para que no cuente en gastos)
  const handleEliminarEvento = async (evento) => {
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
        // Continuar con la eliminación del evento aunque falle la eliminación de asistencias
      }

      // Marcar el evento como eliminado en lugar de borrarlo completamente
      const { error: eventoError } = await supabase
        .from('eventos_clase')
        .update({ estado: 'eliminado' })
        .eq('id', evento.id);

      if (eventoError) {
        alert('Error al eliminar el evento');
        return;
      }

      // Remover del estado local
      setEventos(prev => prev.filter(e => e.id !== evento.id));

      alert('✅ Evento eliminado correctamente. No contará en los gastos de instalaciones.');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al eliminar el evento');
    }
  };

  // Función para editar un evento individual (cambiar fecha/hora)
  const editarEventoIndividual = async (evento) => {
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

    // Validar que la fecha sea válida
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

    const confirmacion = window.confirm(
      `¿Confirmar cambios?\n\n📅 Fecha: ${ev.fecha} → ${nuevaFecha}\n🕐 Inicio: ${ev.hora_inicio} → ${nuevaHoraInicio}\n🕐 Fin: ${ev.hora_fin} → ${nuevaHoraFin}\n\nEste evento se separará de la serie original.`
    );

    if (!confirmacion) return;

    try {
      // Marcar el evento como modificado individualmente
      const { error } = await supabase
        .from('eventos_clase')
        .update({
          fecha: nuevaFecha,
          hora_inicio: nuevaHoraInicio,
          hora_fin: nuevaHoraFin,
          modificado_individualmente: true,
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ev.id);

      if (error) {
        console.error('Error actualizando evento:', error);
        alert('❌ Error al actualizar el evento');
        return;
      }

      // Actualizar estado local
      setEventos(prev => prev.map(e =>
        e.id === evento.id
          ? {
            ...e,
            start: new Date(nuevaFecha + 'T' + nuevaHoraInicio),
            end: new Date(nuevaFecha + 'T' + nuevaHoraFin),
            resource: {
              ...e.resource,
              fecha: nuevaFecha,
              hora_inicio: nuevaHoraInicio,
              hora_fin: nuevaHoraFin,
              modificado_individualmente: true
            }
          }
          : e
      ));

      alert('✅ Evento modificado correctamente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('❌ Error inesperado al modificar el evento');
    }
  };

  // Función para restaurar un evento eliminado (solo para administradores)
  const restaurarEventoEliminado = async (eventoId) => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que quieres restaurar este evento?\n\nEl evento volverá a contar en los gastos de instalaciones.'
    );

    if (!confirmacion) return;

    try {
      const { error } = await supabase
        .from('eventos_clase')
        .update({ estado: 'activo' })
        .eq('id', eventoId);

      if (error) {
        alert('Error al restaurar el evento');
        return;
      }

      alert('✅ Evento restaurado correctamente');
      // Recargar eventos para mostrar el cambio
      cargarEventos();
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al restaurar el evento');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header estandarizado */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-green-100 dark:border-green-800/30">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Gestión de Clases
              </h1>
              <p className="text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base">
                Programa y gestiona las clases de tu academia
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/30 rounded"></div>
                  <span className="text-gray-700 dark:text-dark-text2">🎯 Particular</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/30 rounded"></div>
                  <span className="text-gray-700 dark:text-dark-text2">🏠 Interna</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/30 rounded"></div>
                  <span className="text-gray-700 dark:text-dark-text2">🏫 Escuela</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded"></div>
                  <span className="text-gray-700 dark:text-dark-text2">👥 Grupal</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setRefresh(prev => prev + 1)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      {tabActiva !== 'nueva' && (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔍</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-dark-text">Filtros</h3>
                <p className="text-sm text-gray-600 dark:text-dark-text2">
                  Filtra las clases por nivel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Filtro por nivel */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text2">
                  🎯 Nivel:
                </label>
                <select
                  value={filtroNivel}
                  onChange={e => setFiltroNivel(e.target.value)}
                  className="border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text min-w-[150px]"
                >
                  <option value="">Todos los niveles</option>
                  <option value="Iniciación (1)">Iniciación (1)</option>
                  <option value="Iniciación (2)">Iniciación (2)</option>
                  <option value="Medio (3)">Medio (3)</option>
                  <option value="Medio (4)">Medio (4)</option>
                  <option value="Avanzado (5)">Avanzado (5)</option>
                  <option value="Infantil (1)">Infantil (1)</option>
                  <option value="Infantil (2)">Infantil (2)</option>
                  <option value="Infantil (3)">Infantil (3)</option>
                </select>
              </div>

              {/* Botón para limpiar filtros */}
              {filtroNivel && (
                <button
                  onClick={() => setFiltroNivel('')}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-dark-text2 hover:text-gray-800 dark:hover:text-dark-text bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Pestañas */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        {/* Navegación de pestañas */}
        <div className="border-b border-gray-200 dark:border-dark-border">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setTabActiva('proximas')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'proximas'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📅 Próximas Clases ({eventosProximos.length})
            </button>
            <button
              onClick={() => setTabActiva('impartidas')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'impartidas'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              ✅ Clases Impartidas ({eventosImpartidos.length})
            </button>
            <button
              onClick={() => setTabActiva('canceladas')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'canceladas'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              ❌ Clases Canceladas ({eventosCancelados.length})
            </button>
            <button
              onClick={() => setTabActiva('asignar')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'asignar'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              👥 Asignar Alumnos
            </button>
            <button
              onClick={() => setTabActiva('nueva')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'nueva'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              ➕ Nueva Clase
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-4 sm:p-6">
          {/* Pestaña Próximas Clases */}
          {tabActiva === 'proximas' && (
            <div>
              {/* Toggle de vista */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${viewMode === 'calendar'
                      ? 'bg-green-600 dark:bg-green-600 text-white shadow-md transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                  >
                    📅 Calendario
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${viewMode === 'table'
                      ? 'bg-green-600 dark:bg-green-600 text-white shadow-md transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                  >
                    📋 Tabla
                  </button>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[600px] h-[400px] sm:h-[500px]">
                    <Calendar
                      localizer={localizer}
                      events={eventos}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%', minHeight: '400px' }}
                      views={[WEEK, DAY]}
                      view={currentView}
                      date={currentDate}
                      onNavigate={handleNavigate}
                      onView={handleViewChange}
                      messages={{
                        today: 'Hoy',
                        previous: 'Anterior',
                        next: 'Siguiente',
                        week: 'Semana',
                        day: 'Día'
                      }}
                      culture="es"
                      onSelectEvent={handleSelectEvent}
                      onSelectSlot={handleSelectSlot}
                      onDoubleClickEvent={handleDoubleClickEvent}
                      selectable
                      eventPropGetter={(event) => ({
                        className: event.className,
                        style: {
                          ...event.style,
                          fontSize: '12px',
                          fontWeight: '500'
                        }
                      })}
                      showMultiDayTimes={false}
                      popup={false}
                      doShowMoreDrillDown={false}
                      min={new Date(2024, 0, 1, 9, 0, 0)}
                      max={new Date(2024, 0, 1, 23, 0, 0)}
                      step={30}
                      timeslots={2}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border">
                    <table className="w-full text-sm table-hover-custom min-w-[600px] sm:min-w-[800px]">
                      <thead className="bg-gray-50 dark:bg-dark-surface2">
                        <tr>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Fecha</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Hora</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Clase</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Tipo</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Profesor</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Alumnos</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Estado</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventosPaginados.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-12 text-gray-500 dark:text-dark-text2">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="text-4xl">📅</div>
                                <div className="text-lg font-medium">No hay eventos registrados</div>
                                <div className="text-sm">Crea tu primera clase para comenzar</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          eventosPaginados.map(evento => (
                            <tr
                              key={evento.id}
                              id={`evento-${evento.id}`}
                              className="border-b border-gray-100 dark:border-dark-border transition-colors duration-150"
                            >
                              <td className="py-4 px-4">
                                <div className="font-semibold text-gray-900 dark:text-dark-text">
                                  {evento.start.toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-600 dark:text-dark-text2 font-medium">
                                  {evento.start.toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} - {evento.end.toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-gray-900 dark:text-dark-text">{evento.resource.clases.nombre}</div>
                                <div className="text-sm text-gray-500 dark:text-dark-text2 mt-1">{evento.resource.clases.nivel_clase}</div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getClassColors(evento.resource.clases, evento.resource.estado === 'cancelada').badgeClass
                                  }`}>
                                  {getClassColors(evento.resource.clases, evento.resource.estado === 'cancelada').label}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-700 dark:text-dark-text font-medium">{evento.resource.clases.profesor || 'Sin asignar'}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="space-y-2">
                                  {/* Alumnos asignados */}
                                  <div className="flex flex-wrap gap-1">
                                    {evento.alumnosAsignados.length === 0 ? (
                                      <span className="text-sm text-gray-400 dark:text-dark-text2 italic">Sin alumnos</span>
                                    ) : (
                                      evento.alumnosAsignados.map(alumno => {
                                        const esJustificado = evento.alumnosJustificados.some(j => j.id === alumno.id);
                                        return (
                                          <span
                                            key={alumno.id}
                                            className={`px-2 py-1 rounded-full text-sm font-medium ${esJustificado
                                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 line-through'
                                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                              }`}
                                            title={esJustificado ? 'Falta justificada' : 'Asignado'}
                                          >
                                            {alumno.nombre} {esJustificado && '⚠️'}
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* Información de huecos */}
                                  {evento.huecosDisponibles > 0 && (
                                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">⚠️ Huecos disponibles:</span>
                                        <span className="text-orange-700 dark:text-orange-300 font-semibold">{evento.huecosDisponibles}</span>
                                      </div>
                                      <div className="text-xs text-orange-600 dark:text-orange-400">
                                        {evento.alumnosJustificados.map(j => j.nombre).join(', ')}
                                      </div>
                                    </div>
                                  )}

                                  <div className="text-xs text-gray-500 dark:text-dark-text2">
                                    {evento.alumnosPresentes}/{evento.resource.clases.tipo_clase === 'particular' ? '1' : '4'} alumno{evento.resource.clases.tipo_clase === 'particular' ? '' : 's'}
                                    {evento.huecosDisponibles > 0 && (
                                      <span className="ml-2 text-orange-600 dark:text-orange-400">
                                        ({evento.huecosDisponibles} hueco{evento.huecosDisponibles !== 1 ? 's' : ''})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${evento.resource.estado === 'cancelada'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  }`}>
                                  {evento.resource.estado === 'cancelada' ? '❌ Cancelada' : '✅ Programada'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setTabActiva('asignar');
                                      // Scroll al evento específico en asignaciones
                                      setTimeout(() => {
                                        const elemento = document.getElementById(`evento-${evento.resource.clase_id}`);
                                        if (elemento) {
                                          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          elemento.classList.add('animate-pulse');
                                          setTimeout(() => elemento.classList.remove('animate-pulse'), 2000);
                                        }
                                      }, 100);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    Asignar
                                  </button>
                                  {(() => {
                                    console.log(`🔍 Tabla - Clase "${evento.resource.clases.nombre}": huecos=${evento.huecosDisponibles}, justificados=${evento.alumnosJustificados.length}`);
                                    return evento.huecosDisponibles > 0;
                                  })() && (
                                      <button
                                        onClick={() => {
                                          console.log(`🔍 Abriendo popup: ${evento.huecosDisponibles} huecos, ${evento.alumnosJustificados.length} justificados`);
                                          setEventoParaOcupar({
                                            clase_id: evento.resource.clase_id,
                                            nombre: evento.resource.clases.nombre,
                                            fecha: evento.resource.fecha,
                                            tipo_clase: evento.resource.clases.tipo_clase,
                                            cantidadHuecos: evento.huecosDisponibles,
                                            alumnosJustificados: evento.alumnosJustificados
                                          });
                                          setMostrarOcuparHuecos(true);
                                        }}
                                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                                        title={`Asignar alumnos a huecos disponibles (${evento.alumnosJustificados.length} alumno${evento.alumnosJustificados.length !== 1 ? 's' : ''} con falta justificada)`}
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Ocupar huecos ({evento.huecosDisponibles})
                                      </button>
                                    )}
                                  <button
                                    onClick={() => {
                                      setEventoParaDesasignar({
                                        clase_id: evento.resource.clase_id,
                                        nombre: evento.resource.clases.nombre,
                                        fecha: evento.resource.fecha,
                                        tipo_clase: evento.resource.clases.tipo_clase,
                                        alumnosAsignados: evento.alumnosAsignados,
                                        alumnosPresentes: evento.alumnosPresentes,
                                        maxAlumnos: evento.resource.clases.tipo_clase === 'particular' ? 1 : 4
                                      });
                                      setMostrarDesasignarAlumnos(true);
                                    }}
                                    className="text-fuchsia-700 hover:text-fuchsia-900 dark:text-fuchsia-400 dark:hover:text-fuchsia-300 text-sm font-medium flex items-center gap-1"
                                    title={`Desasignar alumnos (${evento.alumnosPresentes}/${evento.resource.clases.tipo_clase === 'particular' ? 1 : 4})`}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Desasignar
                                  </button>
                                  <button
                                    onClick={() => handleEventoClick(evento)}
                                    className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium"
                                  >
                                    {evento.resource.estado === 'cancelada' ? 'Reactivar' : 'Cancelar'}
                                  </button>
                                  <button
                                    onClick={() => editarEventoIndividual(evento)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                  >
                                    📅 Cambiar día/hora
                                  </button>
                                  <button
                                    onClick={() => handleEliminarEvento(evento)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPaginas > 1 && (
                    <Paginacion
                      paginaActual={paginaActual}
                      totalPaginas={totalPaginas}
                      onCambiarPagina={handleCambiarPagina}
                      elementosPorPagina={elementosPorPagina}
                      totalElementos={eventosOrdenados.length}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Pestaña Clases Impartidas */}
          {tabActiva === 'impartidas' && (
            <div>
              {/* Header informativo */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📚</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-dark-text">Clases Impartidas</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">
                      Clases que ya han sido impartidas o canceladas ({eventosImpartidos.length} clases)
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de clases impartidas */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border">
                <table className="w-full text-sm table-hover-custom min-w-[800px]">
                  <thead className="bg-gray-50 dark:bg-dark-surface2">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Fecha</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Hora</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Clase</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Tipo</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Profesor</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Alumnos</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Estado</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-gray-500 dark:text-dark-text2">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="text-4xl">📚</div>
                            <div className="text-lg font-medium">No hay clases impartidas</div>
                            <div className="text-sm">Las clases aparecerán aquí una vez que hayan pasado</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      eventosPaginados.map(evento => (
                        <tr
                          key={evento.id}
                          id={`evento-${evento.resource.clase_id}`}
                          className="border-b border-gray-100 dark:border-dark-border transition-colors duration-150"
                        >
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-900 dark:text-dark-text">
                              {evento.start.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 dark:text-dark-text2 font-medium">
                              {evento.start.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {evento.end.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-900 dark:text-dark-text">{evento.resource.clases.nombre}</div>
                            <div className="text-sm text-gray-500 dark:text-dark-text2 mt-1">{evento.resource.clases.nivel_clase}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getClassColors(evento.resource.clases, evento.resource.estado === 'cancelada').badgeClass
                              }`}>
                              {getClassColors(evento.resource.clases, evento.resource.estado === 'cancelada').label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-700 dark:text-dark-text font-medium">{evento.resource.clases.profesor || 'Sin asignar'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-2">
                              {/* Alumnos asignados */}
                              <div className="flex flex-wrap gap-1">
                                {evento.alumnosAsignados.length === 0 ? (
                                  <span className="text-sm text-gray-400 dark:text-dark-text2 italic">Sin alumnos</span>
                                ) : (
                                  evento.alumnosAsignados.map(alumno => {
                                    const esJustificado = evento.alumnosJustificados.some(j => j.id === alumno.id);
                                    return (
                                      <span
                                        key={alumno.id}
                                        className={`px-2 py-1 rounded-full text-sm font-medium ${esJustificado
                                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 line-through'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                          }`}
                                        title={esJustificado ? 'Falta justificada' : 'Asignado'}
                                      >
                                        {alumno.nombre} {esJustificado && '⚠️'}
                                      </span>
                                    );
                                  })
                                )}
                              </div>

                              {/* Información de huecos */}
                              {evento.huecosDisponibles > 0 && (
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">⚠️ Huecos disponibles:</span>
                                    <span className="text-orange-700 dark:text-orange-300 font-semibold">{evento.huecosDisponibles}</span>
                                  </div>
                                  <div className="text-xs text-orange-600 dark:text-orange-400">
                                    {evento.alumnosJustificados.map(j => j.nombre).join(', ')}
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 dark:text-dark-text2">
                                {evento.alumnosPresentes}/{evento.resource.clases.tipo_clase === 'particular' ? '1' : '4'} alumno{evento.resource.clases.tipo_clase === 'particular' ? '' : 's'}
                                {evento.huecosDisponibles > 0 && (
                                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                                    ({evento.huecosDisponibles} hueco{evento.huecosDisponibles !== 1 ? 's' : ''})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${evento.resource.estado === 'cancelada'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                              {evento.resource.estado === 'cancelada' ? '❌ Cancelada' : '✅ Impartida'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setTabActiva('asignar');
                                  // Scroll al evento específico en asignaciones
                                  setTimeout(() => {
                                    const elemento = document.getElementById(`evento-${evento.resource.clase_id}`);
                                    if (elemento) {
                                      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      elemento.classList.add('animate-pulse');
                                      setTimeout(() => elemento.classList.remove('animate-pulse'), 2000);
                                    }
                                  }, 100);
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Asignar
                              </button>
                              {evento.huecosDisponibles > 0 && (
                                <button
                                  onClick={() => {
                                    setTabActiva('asignar');
                                    // Scroll al evento específico en asignaciones
                                    setTimeout(() => {
                                      const elemento = document.getElementById(`evento-${evento.resource.clase_id}`);
                                      if (elemento) {
                                        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        elemento.classList.add('ring-4', 'ring-orange-400', 'ring-opacity-75');
                                        setTimeout(() => elemento.classList.remove('ring-4', 'ring-orange-400', 'ring-opacity-75'), 3000);
                                      }
                                    }, 100);
                                  }}
                                  className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                                  title={`Asignar alumnos a ${evento.alumnosJustificados.length} hueco${evento.alumnosJustificados.length !== 1 ? 's' : ''} disponible${evento.alumnosJustificados.length !== 1 ? 's' : ''}`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Ocupar huecos ({evento.huecosDisponibles})
                                </button>
                              )}
                              {evento.resource.estado === 'cancelada' && (
                                <button
                                  onClick={() => handleEventoClick(evento)}
                                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                                >
                                  Reactivar
                                </button>
                              )}
                              <button
                                onClick={() => editarEventoIndividual(evento)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                              >
                                📅 Cambiar día/hora
                              </button>
                              <button
                                onClick={() => handleEliminarEvento(evento)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <Paginacion
                  paginaActual={paginaActual}
                  totalPaginas={totalPaginas}
                  onCambiarPagina={handleCambiarPagina}
                  elementosPorPagina={elementosPorPagina}
                  totalElementos={eventosImpartidos.length}
                />
              )}
            </div>
          )}

          {/* Pestaña Clases Canceladas */}
          {tabActiva === 'canceladas' && (
            <div>
              {/* Header informativo */}
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">❌</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-dark-text">Clases Canceladas</h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">
                      Clases que han sido canceladas ({eventosCancelados.length} clases)
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de clases canceladas */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border">
                <table className="w-full text-sm table-hover-custom min-w-[800px]">
                  <thead className="bg-gray-50 dark:bg-dark-surface2">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Fecha</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Hora</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Clase</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Tipo</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Profesor</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Alumnos</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-gray-500 dark:text-dark-text2">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="text-4xl">✅</div>
                            <div className="text-lg font-medium">No hay clases canceladas</div>
                            <div className="text-sm">¡Excelente! Todas las clases están activas</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      eventosPaginados.map(evento => (
                        <tr
                          key={evento.id}
                          id={`evento-${evento.resource.clase_id}`}
                          className="border-b border-gray-100 dark:border-dark-border transition-colors duration-150"
                        >
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-900 dark:text-dark-text">
                              {evento.start.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 dark:text-dark-text2 font-medium">
                              {evento.start.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {evento.end.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-900 dark:text-dark-text">{evento.resource.clases.nombre}</div>
                            <div className="text-sm text-gray-500 dark:text-dark-text2 mt-1">{evento.resource.clases.nivel_clase}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getClassColors(evento.resource.clases, true).badgeClass
                              }`}>
                              {getClassColors(evento.resource.clases, true).label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-700 dark:text-dark-text font-medium">{evento.resource.clases.profesor || 'Sin asignar'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-2">
                              {/* Alumnos asignados */}
                              <div className="flex flex-wrap gap-1">
                                {evento.alumnosAsignados.length === 0 ? (
                                  <span className="text-sm text-gray-400 dark:text-dark-text2 italic">Sin alumnos</span>
                                ) : (
                                  evento.alumnosAsignados.map(alumno => {
                                    const esJustificado = evento.alumnosJustificados.some(j => j.id === alumno.id);
                                    return (
                                      <span
                                        key={alumno.id}
                                        className={`px-2 py-1 rounded-full text-sm font-medium ${esJustificado
                                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 line-through'
                                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                          }`}
                                        title={esJustificado ? 'Falta justificada' : 'Asignado'}
                                      >
                                        {alumno.nombre} {esJustificado && '⚠️'}
                                      </span>
                                    );
                                  })
                                )}
                              </div>

                              {/* Información de huecos */}
                              {evento.huecosDisponibles > 0 && (
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">⚠️ Huecos disponibles:</span>
                                    <span className="text-orange-700 dark:text-orange-300 font-semibold">{evento.huecosDisponibles}</span>
                                  </div>
                                  <div className="text-xs text-orange-600 dark:text-orange-400">
                                    {evento.alumnosJustificados.map(j => j.nombre).join(', ')}
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 dark:text-dark-text2">
                                {evento.alumnosPresentes}/{evento.resource.clases.tipo_clase === 'particular' ? '1' : '4'} alumno{evento.resource.clases.tipo_clase === 'particular' ? '' : 's'}
                                {evento.huecosDisponibles > 0 && (
                                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                                    ({evento.huecosDisponibles} hueco{evento.huecosDisponibles !== 1 ? 's' : ''})
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEventoClick(evento)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                              >
                                Reactivar
                              </button>
                              <button
                                onClick={() => eliminarSerieCompleta(evento)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                title="Eliminar toda la serie de eventos"
                              >
                                Eliminar Serie
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <Paginacion
                  paginaActual={paginaActual}
                  totalPaginas={totalPaginas}
                  onCambiarPagina={handleCambiarPagina}
                  elementosPorPagina={elementosPorPagina}
                  totalElementos={eventosCancelados.length}
                />
              )}
            </div>
          )}

          {/* Pestaña Nueva Clase */}
          {tabActiva === 'nueva' && (
            <div>
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <FormularioClase
                    onCancel={() => setTabActiva('proximas')}
                    onSuccess={() => {
                      setRefresh(prev => prev + 1);
                      setTabActiva('proximas');
                    }}
                    claseParaEditar={claseParaEditar}
                    setClaseParaEditar={setClaseParaEditar}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pestaña Asignar Alumnos */}
          {tabActiva === 'asignar' && (
            <div>
              <AsignarAlumnosClase
                onCancel={() => setTabActiva('proximas')}
                onSuccess={() => {
                  setRefresh(prev => prev + 1);
                  setTabActiva('proximas');
                }}
                refreshTrigger={refresh}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para cancelar evento */}
      {showModalCancelar && eventoACancelar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
              Cancelar Evento
            </h3>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-dark-text2 mb-2">
                ¿Cómo quieres cancelar el evento <strong>"{eventoACancelar.title}"</strong>?
              </p>
              <p className="text-sm text-gray-500 dark:text-dark-text2">
                Fecha: {eventoACancelar.start.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={cancelarEventoIndividual}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Solo este evento
              </button>
              <button
                onClick={cancelarTodaLaSerie}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Toda la serie
              </button>
              <button
                onClick={() => setShowModalCancelar(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ocupar huecos */}
      {mostrarOcuparHuecos && eventoParaOcupar && (
        <OcuparHuecos
          evento={eventoParaOcupar}
          onClose={() => {
            setMostrarOcuparHuecos(false);
            setEventoParaOcupar(null);
          }}
          onSuccess={() => {
            setMostrarOcuparHuecos(false);
            setEventoParaOcupar(null);
            setRefresh(prev => prev + 1); // Recargar datos para reflejar los cambios
          }}
        />
      )}

      {/* Modal para desasignar alumnos */}
      {mostrarDesasignarAlumnos && eventoParaDesasignar && (
        <DesasignarAlumnos
          evento={eventoParaDesasignar}
          onClose={() => {
            setMostrarDesasignarAlumnos(false);
            setEventoParaDesasignar(null);
          }}
          onSuccess={() => {
            setMostrarDesasignarAlumnos(false);
            setEventoParaDesasignar(null);
            setRefresh(prev => prev + 1); // Recargar datos para reflejar los cambios
          }}
        />
      )}
    </div>
  );
}