import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import Paginacion from './Paginacion';

export default function AsignarAlumnosClase({ onCancel, onSuccess, refreshTrigger }) {
  const [alumnos, setAlumnos] = useState([]);
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [asignados, setAsignados] = useState(new Set());
  const [maxAlcanzado, setMaxAlcanzado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Estados para paginación de clases
  const [paginaClases, setPaginaClases] = useState(1);
  const elementosPorPaginaClases = 10;

  const claseActual = clases.find(c => c.id === claseSeleccionada);
  const esClaseParticular = claseActual?.tipo_clase === 'particular';
  const maxAlumnos = esClaseParticular ? 1 : 4;

  // Filtrar alumnos según la búsqueda
  const alumnosFiltrados = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (alumno.apellidos && alumno.apellidos.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Lógica de paginación para clases
  const totalPaginasClases = Math.ceil(clases.length / elementosPorPaginaClases);
  const inicioIndiceClases = (paginaClases - 1) * elementosPorPaginaClases;
  const finIndiceClases = inicioIndiceClases + elementosPorPaginaClases;
  const clasesPaginadas = clases.slice(inicioIndiceClases, finIndiceClases);

  // Función para cambiar página de clases
  const handleCambiarPaginaClases = (nuevaPagina) => {
    setPaginaClases(nuevaPagina);
  };

  // Función para cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [alumnosRes, clasesRes] = await Promise.all([
        supabase.from('alumnos').select('*').eq('activo', true),
        supabase
          .from('clases')
          .select(`
            *,
            eventos_clase (
              id,
              fecha,
              hora_inicio,
              hora_fin,
              estado
            )
          `)
          .order('nombre')
      ]);

      if (alumnosRes.error) throw alumnosRes.error;
      if (clasesRes.error) throw clasesRes.error;

      // Filtrar solo eventos futuros y activos para cada clase
      const clasesConEventos = (clasesRes.data || []).map(clase => ({
        ...clase,
        eventos_proximos: clase.eventos_clase
          ?.filter(evento =>
            new Date(evento.fecha) >= new Date() &&
            evento.estado !== 'cancelada'
          )
          ?.sort((a, b) => {
            // Ordenar por fecha primero, luego por hora
            const fechaA = new Date(a.fecha);
            const fechaB = new Date(b.fecha);
            if (fechaA.getTime() !== fechaB.getTime()) {
              return fechaA - fechaB;
            }
            // Si la fecha es igual, ordenar por hora de inicio
            return a.hora_inicio.localeCompare(b.hora_inicio);
          }) || []
      }));

      // Ordenar las clases por su próximo evento (fecha y hora)
      clasesConEventos.sort((a, b) => {
        const proximoA = a.eventos_proximos[0];
        const proximoB = b.eventos_proximos[0];

        // Si una clase no tiene eventos próximos, va al final
        if (!proximoA && !proximoB) return 0;
        if (!proximoA) return 1;
        if (!proximoB) return -1;

        // Comparar por fecha
        const fechaA = new Date(proximoA.fecha);
        const fechaB = new Date(proximoB.fecha);
        if (fechaA.getTime() !== fechaB.getTime()) {
          return fechaA - fechaB;
        }

        // Si la fecha es igual, comparar por hora
        return proximoA.hora_inicio.localeCompare(proximoB.hora_inicio);
      });

      setAlumnos(alumnosRes.data || []);
      setClases(clasesConEventos);
    } catch (err) {
      console.error('Error cargando datos:', err);
      alert('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar datos cuando cambie el refreshTrigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      cargarDatos();
    }
  }, [refreshTrigger]);

  // Cargar asignaciones cuando se selecciona una clase
  useEffect(() => {
    const cargarAsignaciones = async () => {
      if (!claseSeleccionada) {
        setAsignados(new Set());
        setMaxAlcanzado(false);
        return;
      }

      try {
        // Buscar asignaciones para toda la serie de eventos de esta clase
        const { data: asignadosRes, error } = await supabase
          .from('alumnos_clases')
          .select('*')
          .eq('clase_id', claseActual?.id);

        if (error) throw error;

        const asignadosSet = new Set(asignadosRes.map(a => a.alumno_id));
        setAsignados(asignadosSet);
        setMaxAlcanzado(asignadosSet.size >= maxAlumnos);
      } catch (err) {
        console.error('Error cargando asignaciones:', err);
        alert('No se pudieron cargar las asignaciones');
      }
    };

    cargarAsignaciones();
  }, [claseSeleccionada, maxAlumnos, claseActual?.id]);

  const toggleAlumno = async (alumnoId) => {
    if (!claseSeleccionada) {
      alert('❌ Por favor selecciona una clase primero');
      return;
    }

    const estaAsignado = asignados.has(alumnoId);
    const nuevaCantidad = estaAsignado ? asignados.size - 1 : asignados.size + 1;

    if (!estaAsignado && nuevaCantidad > maxAlumnos) {
      alert(`❌ Máximo ${maxAlumnos} alumno${maxAlumnos > 1 ? 's' : ''} por clase ${esClaseParticular ? 'particular' : 'grupal'}`);
      return;
    }

    try {
      let error;
      if (estaAsignado) {
        // Desasignar - eliminar de toda la serie de eventos
        const { error: deleteError } = await supabase
          .from('alumnos_clases')
          .delete()
          .eq('clase_id', claseActual?.id)
          .eq('alumno_id', alumnoId);
        error = deleteError;
      } else {
        // Asignar - crear registro para toda la serie de eventos
        const { error: insertError } = await supabase
          .from('alumnos_clases')
          .insert([{
            clase_id: claseActual?.id,
            alumno_id: alumnoId
          }]);
        error = insertError;
      }

      if (error) throw error;

      // Actualizar estado local
      const nuevoAsignados = new Set(asignados);
      if (estaAsignado) {
        nuevoAsignados.delete(alumnoId);
      } else {
        nuevoAsignados.add(alumnoId);
      }
      setAsignados(nuevoAsignados);
      setMaxAlcanzado(nuevoAsignados.size >= maxAlumnos);
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error al asignar/desasignar alumno');
    }
  };

  if (loading) return <LoadingSpinner size="medium" text="Cargando alumnos..." />;

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
              👥 Asignar Alumnos a Clases
            </h2>
            <p className="text-gray-600 dark:text-dark-text2">
              Selecciona una clase y asigna alumnos de forma intuitiva
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => cargarDatos()}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              disabled={loading}
              title="Recargar datos"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={() => {
                if (!claseSeleccionada && asignados.size === 0) {
                  onCancel();
                  return;
                }
                if (asignados.size > 0) {
                  const confirmar = window.confirm(
                    `¿Estás seguro de que quieres salir? Se perderán ${asignados.size} asignación${asignados.size > 1 ? 'es' : ''} sin guardar.`
                  );
                  if (confirmar) onCancel();
                } else {
                  onCancel();
                }
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
            <button
              onClick={async () => {
                if (!claseSeleccionada) {
                  alert('❌ Por favor selecciona una clase antes de guardar.');
                  return;
                }
                if (asignados.size === 0) {
                  alert('❌ No hay alumnos asignados para guardar. Selecciona al menos un alumno.');
                  return;
                }

                alert(`✅ Se han guardado ${asignados.size} asignación${asignados.size > 1 ? 'es' : ''} correctamente.`);
                await cargarDatos();
                setClaseSeleccionada('');
                setAsignados(new Set());
                setMaxAlcanzado(false);
                onSuccess();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Layout mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna 1: Selección de Clase */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Seleccionar Clase</h3>
                <p className="text-sm text-gray-500 dark:text-dark-text2">{clases.length} clases disponibles</p>
              </div>
            </div>

            {clases.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No hay clases registradas</h3>
                <p className="text-gray-500 dark:text-dark-text2">Crea algunas clases primero para poder asignar alumnos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lista de clases mejorada */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {clasesPaginadas.map(clase => (
                    <div
                      key={clase.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${claseSeleccionada === clase.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                        }`}
                      onClick={() => setClaseSeleccionada(clase.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="radio"
                              name="clase"
                              checked={claseSeleccionada === clase.id}
                              onChange={() => setClaseSeleccionada(clase.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600"
                            />
                            <h4 className="font-semibold text-gray-900 dark:text-dark-text">
                              {clase.nombre}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${clase.tipo_clase === 'particular'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                              {clase.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-dark-text2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📅</span>
                              <span>{clase.dia_semana}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎯</span>
                              <span>{clase.nivel_clase}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👨‍🏫</span>
                              <span>{clase.profesor || 'Sin asignar'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📝</span>
                              <span>{clase.observaciones ? 'Con notas' : 'Sin notas'}</span>
                            </div>
                          </div>

                          {/* Mostrar próxima clase */}
                          {clase.eventos_proximos && clase.eventos_proximos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">⏰</span>
                                <span className="text-gray-500 dark:text-dark-text2">
                                  {new Date(clase.eventos_proximos[0].fecha).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 dark:text-dark-text2">
                                  {clase.eventos_proximos[0].hora_inicio} - {clase.eventos_proximos[0].hora_fin}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación de clases */}
                {totalPaginasClases > 1 && (
                  <Paginacion
                    paginaActual={paginaClases}
                    totalPaginas={totalPaginasClases}
                    onCambiarPagina={handleCambiarPaginaClases}
                    elementosPorPagina={elementosPorPaginaClases}
                    totalElementos={clases.length}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna 2: Asignación de Alumnos */}
        <div className="space-y-6">
          {claseSeleccionada ? (
            <>
              {/* Información de la clase seleccionada */}
              <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">{claseActual?.nombre}</h3>
                    <p className="text-sm text-gray-500 dark:text-dark-text2">
                      {esClaseParticular ? 'Clase particular' : 'Clase grupal'} • {claseActual?.nivel_clase}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${esClaseParticular
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                    {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-dark-text2">Día</p>
                      <p className="text-gray-900 dark:text-dark-text">{claseActual?.dia_semana}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-dark-text2">Nivel</p>
                      <p className="text-gray-900 dark:text-dark-text">{claseActual?.nivel_clase}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍🏫</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-dark-text2">Profesor</p>
                      <p className="text-gray-900 dark:text-dark-text">{claseActual?.profesor || 'Sin asignar'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-dark-text2">Observaciones</p>
                      <p className="text-gray-900 dark:text-dark-text">{claseActual?.observaciones || 'Sin observaciones'}</p>
                    </div>
                  </div>
                </div>

                {/* Mostrar próximo evento */}
                {claseActual?.eventos_proximos && claseActual.eventos_proximos.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">⏰</span>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Próxima clase</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700 dark:text-blue-300 font-medium">Fecha:</p>
                        <p className="text-blue-900 dark:text-blue-100">
                          {new Date(claseActual.eventos_proximos[0].fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700 dark:text-blue-300 font-medium">Horario:</p>
                        <p className="text-blue-900 dark:text-blue-100">
                          {claseActual.eventos_proximos[0].hora_inicio} - {claseActual.eventos_proximos[0].hora_fin}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text2">
                        {asignados.size}/{maxAlumnos} alumnos asignados
                      </span>
                    </div>
                    {maxAlcanzado && (
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                        <span>⚠️</span>
                        Capacidad máxima
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alumnos asignados */}
              <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-dark-text">
                    Alumnos Asignados ({asignados.size}/{maxAlumnos})
                  </h4>
                </div>

                {asignados.size > 0 ? (
                  <div className="space-y-3">
                    {Array.from(asignados).map(alumnoId => {
                      const alumno = alumnos.find(a => a.id === alumnoId);
                      return (
                        <div
                          key={alumnoId}
                          className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center text-sm font-medium text-green-800 dark:text-green-200">
                              {alumno?.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-dark-text">{alumno?.nombre}</p>
                              {alumno?.apellidos && (
                                <p className="text-sm text-gray-500 dark:text-dark-text2">{alumno.apellidos}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleAlumno(alumnoId)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            title="Quitar alumno"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="text-gray-500 dark:text-dark-text2">No hay alumnos asignados</p>
                    <p className="text-sm text-gray-400 dark:text-dark-text2">Selecciona alumnos de la lista de abajo</p>
                  </div>
                )}
              </div>

              {/* Lista de alumnos disponibles */}
              <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-dark-text">Alumnos Disponibles</h4>
                    <p className="text-sm text-gray-500 dark:text-dark-text2">
                      {busqueda ? `${alumnosFiltrados.length} de ${alumnos.length} alumnos` : `${alumnos.length} alumnos`}
                    </p>
                  </div>
                </div>

                {/* Búsqueda */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Buscar por nombre o apellidos..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Lista de alumnos */}
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {alumnosFiltrados.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-gray-500 dark:text-dark-text2">No se encontraron alumnos</p>
                      <p className="text-sm text-gray-400 dark:text-dark-text2">Intenta con otros términos de búsqueda</p>
                    </div>
                  ) : (
                    alumnosFiltrados.map(alumno => (
                      <div
                        key={alumno.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${asignados.has(alumno.id)
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : maxAlcanzado && !asignados.has(alumno.id)
                            ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                            : 'border-gray-200 dark:border-dark-border hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm'
                          }`}
                        onClick={() => {
                          if (!maxAlcanzado || asignados.has(alumno.id)) {
                            toggleAlumno(alumno.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${asignados.has(alumno.id)
                            ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                            {alumno.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-dark-text">{alumno.nombre}</p>
                            {alumno.apellidos && (
                              <p className="text-sm text-gray-500 dark:text-dark-text2">{alumno.apellidos}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {asignados.has(alumno.id) ? (
                            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                          ) : maxAlcanzado ? (
                            <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">Lleno</span>
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 text-xl">+</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-dark-surface p-12 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">Selecciona una clase</h3>
              <p className="text-gray-500 dark:text-dark-text2 mb-4">
                Elige una clase de la lista de la izquierda para comenzar a asignar alumnos
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Las asignaciones se aplicarán a toda la serie de clases</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}