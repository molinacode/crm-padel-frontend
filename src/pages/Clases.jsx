import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import { supabase } from '../lib/supabase';
import FormularioClase from '../components/FormularioClase';
import AsignarAlumnosClase from '../components/AsignarAlumnosClase';

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
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'table'
  const [showFormularioClase, setShowFormularioClase] = useState(false);
  const [showAsignarAlumnos, setShowAsignarAlumnos] = useState(false);
  const [claseParaAsignar, setClaseParaAsignar] = useState(null);

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
        // Cargar eventos básicos
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_clase')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            estado,
            clases (id,nombre, nivel_clase,dia_semana,profesor,tipo_clase)
          `);

        if (eventosError) {
          console.error('Error cargando eventos:', eventosError);
          alert('Error al cargar los eventos: ' + eventosError.message);
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
          console.error('Error cargando alumnos asignados:', alumnosError);
          // Continuamos sin los alumnos asignados
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

        const eventosFormateados = eventosData.map(ev => {
          const start = new Date(ev.fecha);
          start.setHours(...ev.hora_inicio.split(':'));
          const end = new Date(ev.fecha);
          end.setHours(...ev.hora_fin.split(':'));

          // Obtener alumnos asignados para esta clase
          const alumnosAsignados = alumnosPorClase[ev.clases.id] || [];

          // Determinar colores según tipo de clase
          const colors = getClassColors(ev.clases, ev.estado === 'cancelada');
          const colorClass = colors.className;

          return {
            id: ev.id,
            title: `${ev.clases.nombre} (${ev.clases.nivel_clase})`,
            subtitle: ev.clases.profesor,
            start,
            end,
            allDay: false,
            resource: ev,
            alumnosAsignados,
            className: colorClass
          };
        });

        if (isMounted) {
          setEventos(eventosFormateados);
        }
      } catch (error) {
        console.error('Error inesperado cargando eventos:', error);
        if (isMounted) {
          alert('Error inesperado al cargar los eventos');
        }
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

  // Manejadores para el calendario
  const handleSelectSlot = (slotInfo) => {
    // Al hacer clic en una franja horaria vacía, abrir formulario de crear clase
    setShowFormularioClase(true);
    setShowAsignarAlumnos(false);
  };

  const handleSelectEvent = (evento) => {
    // Al hacer clic en una clase existente, abrir formulario de asignar alumnos
    setClaseParaAsignar(evento);
    setShowAsignarAlumnos(true);
    setShowFormularioClase(false);
  };

  // Al hacer clic en un evento (para cancelar o reactivar)
  const handleEventoClick = async (evento) => {
    const { resource: ev } = evento;
    const nuevoEstado = ev.estado === 'cancelada' ? 'programada' : 'cancelada';

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

  // Eliminar evento completamente
  const handleEliminarEvento = async (evento) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar completamente el evento "${evento.title}"?\n\nEsta acción no se puede deshacer y eliminará:\n- El evento del calendario\n- Todas las asistencias registradas\n- Las asignaciones de alumnos`
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
        // Continuamos aunque falle, ya que puede que no haya asistencias
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800/30">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Gestión de Clases
              </h1>
              <p className="text-gray-600 dark:text-dark-text2 mb-4">
                Programa y gestiona las clases de tu academia
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
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
            {/* Toggle de vista con mejor diseño */}
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

      <div className={`grid gap-8 ${viewMode === 'calendar' ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Vista Calendario o Tabla */}
        <div className={viewMode === 'calendar' ? 'col-span-1' : 'lg:col-span-2'}>
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                {viewMode === 'calendar' ? 'Calendario Semanal' : 'Historial de Eventos'}
              </h3>
            </div>

            {viewMode === 'calendar' ? (
              <div style={{ height: 500 }}>
                <Calendar
                  localizer={localizer}
                  events={eventos}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
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
                  onDoubleClickEvent={handleEliminarEvento}
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
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Fecha</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Hora</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Clase</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Profesor</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Alumnos</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Estado</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="text-4xl">📅</div>
                            <div className="text-lg font-medium">No hay eventos registrados</div>
                            <div className="text-sm">Crea tu primera clase para comenzar</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      eventosOrdenados.map(evento => (
                        <tr key={evento.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-900">
                              {evento.start.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 font-medium">
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
                            <div className="font-semibold text-gray-900">{evento.resource.clases.nombre}</div>
                            <div className="text-sm text-gray-500 mt-1">{evento.resource.clases.nivel_clase}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getClassColors(evento.resource.clases, evento.resource.estado === 'cancelada').badgeClass
                              }`}>
                              {getClassColors(evento.resource.clases, evento.resource.estado === 'cancelada').label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-700 font-medium">{evento.resource.clases.profesor || 'Sin asignar'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {evento.alumnosAsignados.length === 0 ? (
                                  <span className="text-sm text-gray-400 italic">Sin alumnos</span>
                                ) : (
                                  evento.alumnosAsignados.map(alumno => (
                                    <span
                                      key={alumno.id}
                                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium"
                                    >
                                      {alumno.nombre}
                                    </span>
                                  ))
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {evento.alumnosAsignados.length}/{evento.resource.clases.tipo_clase === 'particular' ? '1' : '4'} alumno{evento.resource.clases.tipo_clase === 'particular' ? '' : 's'}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${evento.resource.estado === 'cancelada'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                              }`}>
                              {evento.resource.estado === 'cancelada' ? '❌ Cancelada' : '✅ Programada'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleEventoClick(evento)}
                                className={`text-sm px-3 py-1 rounded-md font-medium transition-colors duration-150 ${evento.resource.estado === 'cancelada'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}
                              >
                                {evento.resource.estado === 'cancelada' ? 'Reactivar' : 'Cancelar'}
                              </button>

                              {evento.resource.estado === 'cancelada' && (
                                <button
                                  onClick={() => handleEliminarEvento(evento)}
                                  className="text-sm px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 font-medium transition-colors duration-150"
                                  title="Eliminar evento permanentemente"
                                >
                                  🗑️ Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral - Solo visible en vista tabla */}
        {viewMode === 'table' && (
          <div className="lg:col-span-1 space-y-6">
            {/* Nuevo/Editar Clase */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-2">
              <h3 className="text-base font-semibold text-gray-900 mb-2">📝 Nueva Clase</h3>
              <FormularioClase onSuccess={() => setRefresh(prev => prev + 1)} />
            </div>

            {/* Selector de clase para asignar */}
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Asignar Alumnos</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Clase
                  </label>
                  <select
                    value={claseSeleccionada}
                    onChange={(e) => setClaseSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una clase</option>
                    {eventos.map(ev => (
                      <option key={ev.id} value={ev.resource.clases.id}>
                        {ev.title} - {ev.start.toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Asignar Alumnos */}
            {claseSeleccionada && (
              <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4">
                <AsignarAlumnosClase
                  claseId={claseSeleccionada}
                  tipoClase={eventos.find(ev => ev.resource.clases.id === claseSeleccionada)?.resource.clases.tipo_clase || 'grupal'}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales superpuestos para vista calendario */}
      {viewMode === 'calendar' && (
        <>
          {/* Modal Formulario Clase */}
          {showFormularioClase && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[75vh] overflow-y-auto">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">📝 Nueva Clase</h3>
                    <button
                      onClick={() => setShowFormularioClase(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <FormularioClase
                    onSuccess={() => {
                      setRefresh(prev => prev + 1);
                      setShowFormularioClase(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Asignar Alumnos */}
          {showAsignarAlumnos && claseParaAsignar && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                      👥 Asignar Alumnos - {claseParaAsignar.title}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAsignarAlumnos(false);
                        setClaseParaAsignar(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <AsignarAlumnosClase
                    claseId={claseParaAsignar.resource.clases.id}
                    tipoClase={claseParaAsignar.resource.clases.tipo_clase}
                    onSuccess={() => {
                      setRefresh(prev => prev + 1);
                      setShowAsignarAlumnos(false);
                      setClaseParaAsignar(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}