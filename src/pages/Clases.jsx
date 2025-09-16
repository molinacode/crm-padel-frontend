import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import { supabase } from '../lib/supabase';
import FormularioClase from '../components/FormularioClase';
import AsignarAlumnosClase from '../components/AsignarAlumnosClase';
import Paginacion from '../components/Paginacion';

const localizer = dateFnsLocalizer({
  format: (date, formatStr) => format(date, formatStr, { locale: es }),
  parse: (dateStr, formatStr) => parse(dateStr, formatStr, new Date(), { locale: es }),
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay: (date) => getDay(date),
  locales: { es }
});

const { MONTH, WEEK, DAY } = Views;

export default function Clases() {
  const [eventos, setEventos] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'table'
  const [claseParaEditar, setClaseParaEditar] = useState(null);
  const [showModalCancelar, setShowModalCancelar] = useState(false);
  const [eventoACancelar, setEventoACancelar] = useState(null);

  // Estados para pestañas
  const [tabActiva, setTabActiva] = useState('historial');

  // Estados para paginación del historial
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Función helper para determinar colores de clases
  const getClassColors = (clase, isCanceled = false) => {
    if (isCanceled) {
      return {
        className: 'line-through opacity-50 text-gray-400 bg-gray-100',
        badgeClass: 'bg-gray-100 text-gray-800',
        label: '❌ Cancelada'
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

  //Cargar eventos y clases
  useEffect(() => {
    let isMounted = true;

    const cargarEventos = async () => {
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

        // Cargar alumnos asignados por separado
        const { data: alumnosData, error: alumnosError } = await supabase
          .from('alumnos_clases')
          .select(`
            clase_id,
            alumno_id,
            alumnos (id, nombre)
          `);

        if (alumnosError) {
          console.error('Error cargando alumnos:', alumnosError);
          return;
        }

        if (!isMounted) return;

        // Crear mapa de alumnos por clase
        const alumnosPorClase = {};
        if (alumnosData) {
          alumnosData.forEach(ac => {
            if (!alumnosPorClase[ac.clase_id]) {
              alumnosPorClase[ac.clase_id] = [];
            }
            alumnosPorClase[ac.clase_id].push(ac.alumnos);
          });
        }

        // Procesar eventos
        const eventosProcesados = eventosData.map(ev => {
          const start = new Date(ev.fecha + 'T' + ev.hora_inicio);
          const end = new Date(ev.fecha + 'T' + ev.hora_fin);
          const colorClass = getClassColors(ev.clases, ev.estado === 'cancelada');
          const alumnosAsignados = alumnosPorClase[ev.clase_id] || [];

          return {
            id: ev.id,
            title: `${ev.clases.nombre} (${ev.clases.nivel_clase})`,
            subtitle: ev.clases.profesor,
            start,
            end,
            allDay: false,
            resource: ev,
            alumnosAsignados,
            className: colorClass.className
          };
        });

        setEventos(eventosProcesados);
        console.log('✅ Eventos cargados:', eventosProcesados.length);
      } catch (error) {
        console.error('💥 Error cargando eventos:', error);
      }
    };

    cargarEventos();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  // Handlers para el calendario (optimizados con useCallback)
  const handleNavigate = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // Memoizar eventos ordenados para la tabla
  const eventosOrdenados = useMemo(() => {
    return eventos.sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [eventos]);

  // Lógica de paginación para el historial
  const totalPaginas = Math.ceil(eventosOrdenados.length / elementosPorPagina);
  const inicioIndice = (paginaActual - 1) * elementosPorPagina;
  const finIndice = inicioIndice + elementosPorPagina;
  const eventosPaginados = eventosOrdenados.slice(inicioIndice, finIndice);

  // Función para cambiar página
  const handleCambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

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

        alert('✅ Toda la serie de eventos ha sido cancelada');
      } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error inesperado al cancelar la serie');
      }

      setShowModalCancelar(false);
      setEventoACancelar(null);
    }
  };

  // Eliminar evento completamente
  const handleEliminarEvento = async (evento) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar permanentemente el evento "${evento.title}"?\n\nEsta acción no se puede deshacer.`
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

      // Eliminar el evento
      const { error: eventoError } = await supabase
        .from('eventos_clase')
        .delete()
        .eq('id', evento.id);

      if (eventoError) {
        alert('Error al eliminar el evento');
        return;
      }

      // Remover del estado local
      setEventos(prev => prev.filter(e => e.id !== evento.id));

      alert('✅ Evento eliminado correctamente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al eliminar el evento');
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

      {/* Sistema de Pestañas */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        {/* Navegación de pestañas */}
        <div className="border-b border-gray-200 dark:border-dark-border">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => setTabActiva('historial')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'historial'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📋 Historial ({eventos.length})
            </button>
            <button
              onClick={() => setTabActiva('nueva')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'nueva'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              ➕ Nueva Clase
            </button>
            <button
              onClick={() => setTabActiva('asignar')}
              className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'asignar'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              👥 Asignar
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-4 sm:p-6">
          {/* Pestaña Historial */}
          {tabActiva === 'historial' && (
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
                                <div className="text-4xl">📅</div>
                                <div className="text-lg font-medium">No hay eventos registrados</div>
                                <div className="text-sm">Crea tu primera clase para comenzar</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          eventosPaginados.map(evento => (
                            <tr key={evento.id} className="border-b border-gray-100 dark:border-dark-border transition-colors duration-150">
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
                                  <div className="flex flex-wrap gap-1">
                                    {evento.alumnosAsignados.length === 0 ? (
                                      <span className="text-sm text-gray-400 dark:text-dark-text2 italic">Sin alumnos</span>
                                    ) : (
                                      evento.alumnosAsignados.map(alumno => (
                                        <span
                                          key={alumno.id}
                                          className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium"
                                        >
                                          {alumno.nombre}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-dark-text2">
                                    {evento.alumnosAsignados.length}/{evento.resource.clases.tipo_clase === 'particular' ? '1' : '4'} alumno{evento.resource.clases.tipo_clase === 'particular' ? '' : 's'}
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
                                    onClick={() => handleEventoClick(evento)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                  >
                                    {evento.resource.estado === 'cancelada' ? 'Reactivar' : 'Cancelar'}
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

          {/* Pestaña Nueva Clase */}
          {tabActiva === 'nueva' && (
            <div>
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <FormularioClase
                    onCancel={() => setTabActiva('historial')}
                    onSuccess={() => {
                      setRefresh(prev => prev + 1);
                      setTabActiva('historial');
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
                onCancel={() => setTabActiva('calendar')}
                onSuccess={() => {
                  setRefresh(prev => prev + 1);
                  setTabActiva('calendar');
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
    </div>
  );
}