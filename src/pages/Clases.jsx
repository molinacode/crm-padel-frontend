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

          return {
            id: ev.id,
            title: `${ev.clases.nombre} (${ev.clases.nivel_clase})`,
            subtitle: ev.clases.profesor,
            start,
            end,
            allDay: false,
            resource: ev,
            alumnosAsignados,
            className: ev.estado === 'cancelada'
              ? 'line-through opacity-50 text-gray-400'
              : 'border-l-4 border-blue-500 bg-blue-50'
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
              className: nuevoEstado === 'cancelada' 
                ? 'line-through opacity-50 text-gray-400' 
                : 'border-l-4 border-blue-500 bg-blue-50'
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">📅 Gestión de Clases</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click para cancelar/reactivar • Doble click para eliminar permanentemente
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Toggle de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📅 Calendario
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Tabla
            </button>
          </div>
          <button 
            onClick={() => setRefresh(prev => prev + 1)}
            className="btn-secondary text-sm"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Vista Calendario o Tabla */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
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
                  next:'Siguiente',
                  week: 'Semana',
                  day: 'Día'
                }}
                culture="es"
                onSelectEvent={handleEventoClick}
                onDoubleClickEvent={handleEliminarEvento}
                selectable
                eventPropGetter={(event) => ({
                  className: event.className
                })}
                popup={false}
                doShowMoreDrillDown={false}
                min={new Date(2024, 0, 1, 9, 0, 0)}
                max={new Date(2024, 0, 1, 23, 0, 0)}
                step={30}
                timeslots={2}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Hora</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Clase</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Profesor</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Alumnos</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-500">
                        No hay eventos registrados
                      </td>
                    </tr>
                  ) : (
                    eventosOrdenados.map(evento => (
                        <tr key={evento.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="font-medium">
                              {evento.start.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-gray-600">
                              {evento.start.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {evento.end.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-medium">{evento.resource.clases.nombre}</div>
                            <div className="text-xs text-gray-500">{evento.resource.clases.nivel_clase}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              evento.resource.clases.tipo_clase === 'particular'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {evento.resource.clases.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-gray-600">{evento.resource.clases.profesor || 'Sin asignar'}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex flex-wrap gap-1">
                              {evento.alumnosAsignados.length === 0 ? (
                                <span className="text-xs text-gray-400">Sin alumnos</span>
                              ) : (
                                evento.alumnosAsignados.map(alumno => (
                                  <span
                                    key={alumno.id}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                  >
                                    {alumno.nombre}
                                  </span>
                                ))
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {evento.alumnosAsignados.length}/{evento.resource.clases.tipo_clase === 'particular' ? '1' : '4'} alumno{evento.resource.clases.tipo_clase === 'particular' ? '' : 's'}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              evento.resource.estado === 'cancelada'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {evento.resource.estado === 'cancelada' ? 'Cancelada' : 'Programada'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEventoClick(evento)}
                                className={`text-xs px-2 py-1 rounded ${
                                  evento.resource.estado === 'cancelada'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {evento.resource.estado === 'cancelada' ? 'Reactivar' : 'Cancelar'}
                              </button>
                              
                              {evento.resource.estado === 'cancelada' && (
                                <button
                                  onClick={() => handleEliminarEvento(evento)}
                                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
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

        {/* Formulario */}
        <div className="space-y-6">
          {/* Nuevo/Editar Clase */}
          <FormularioClase onSuccess={() => setRefresh(prev => prev + 1)} />

          {/* Selector de clase para asignar */}
          <div className="card">
            <label className="block text-sm font-medium mb-2">Seleccionar Clase para Asignar Alumnos</label>
            <select
              value={claseSeleccionada}
              onChange={(e) => setClaseSeleccionada(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecciona una clase</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.resource.clases.id}>
                  {ev.title} - {ev.start.toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Asignar Alumnos */}
          {claseSeleccionada && (
            <AsignarAlumnosClase 
              claseId={claseSeleccionada} 
              tipoClase={eventos.find(ev => ev.resource.clases.id === claseSeleccionada)?.resource.clases.tipo_clase || 'grupal'}
            />
          )}
        </div>
      </div>
    </div>
  );
}