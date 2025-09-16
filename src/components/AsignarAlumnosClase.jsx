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
  const esClaseParticular = claseActual?.clases?.tipo_clase === 'particular';
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
      const [alumnosRes, eventosRes] = await Promise.all([
        supabase.from('alumnos').select('*').eq('activo', true),
        supabase
          .from('eventos_clase')
          .select(`
            *,
            clases (
              id,
              nombre,
              dia_semana,
              nivel_clase,
              profesor,
              tipo_clase,
              observaciones
            )
          `)
          .order('fecha, hora_inicio')
      ]);

      if (alumnosRes.error) throw alumnosRes.error;
      if (eventosRes.error) throw eventosRes.error;

      setAlumnos(alumnosRes.data || []);
      setClases(eventosRes.data || []);
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
          .eq('clase_id', claseActual?.clase_id);

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
  }, [claseSeleccionada, maxAlumnos, claseActual?.clase_id]);

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
          .eq('clase_id', claseActual?.clase_id)
          .eq('alumno_id', alumnoId);
        error = deleteError;
      } else {
        // Asignar - crear registro para toda la serie de eventos
        const { error: insertError } = await supabase
          .from('alumnos_clases')
          .insert([{
            clase_id: claseActual?.clase_id,
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
    <div className="w-full p-6 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-dark-border">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-dark-text">👥 Asignar Alumnos a Clases</h3>
        <div className="flex gap-3">
          <button
            onClick={() => cargarDatos()}
            className="btn-secondary px-4 py-2 flex items-center gap-2"
            disabled={loading}
            title="Recargar datos de alumnos y clases"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Actualizar
          </button>
          <button
            onClick={() => {
              // Si no hay clase seleccionada ni asignaciones, no hay nada que cancelar
              if (!claseSeleccionada && asignados.size === 0) {
                alert('ℹ️ No hay cambios para cancelar.');
                return;
              }

              // Si hay asignaciones, pedir confirmación
              if (asignados.size > 0) {
                const confirmar = window.confirm(
                  `¿Estás seguro de que quieres salir? Se perderán ${asignados.size} asignación${asignados.size > 1 ? 'es' : ''} sin guardar.`
                );
                if (confirmar) onCancel();
              } else {
                // Si solo hay clase seleccionada pero no asignaciones, salir directamente
                onCancel();
              }
            }}
            className="btn-secondary px-4 py-2 flex items-center gap-2"
            title="Volver al calendario sin guardar cambios"
          >
            ✖ Cancelar
          </button>
          <button
            onClick={async () => {
              // Validar que haya una clase seleccionada
              if (!claseSeleccionada) {
                alert('❌ Por favor selecciona una clase antes de guardar.');
                return;
              }

              // Validar que haya asignaciones para guardar
              if (asignados.size === 0) {
                alert('❌ No hay alumnos asignados para guardar. Selecciona al menos un alumno.');
                return;
              }

              const mensaje = `✅ Se han guardado ${asignados.size} asignación${asignados.size > 1 ? 'es' : ''} correctamente.`;
              alert(mensaje);

              // Recargar datos para poder asignar nuevas clases
              await cargarDatos();

              // Limpiar selección para poder seleccionar otra clase
              setClaseSeleccionada('');
              setAsignados(new Set());
              setMaxAlcanzado(false);

              onSuccess();
            }}
            className="btn-primary px-4 py-2 flex items-center gap-2"
            title="Guardar asignaciones y volver al calendario"
          >
            ✅ Guardar
          </button>
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Columna 1: Lista de clases */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-dark-text">📚 Seleccionar Clase</h4>
            <span className="text-sm text-gray-500 dark:text-dark-text2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {clases.length} clases disponibles
            </span>
          </div>

          {clases.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-dark-text2">No hay clases registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabla de clases con scroll horizontal */}
              <div className="border border-gray-300 dark:border-dark-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 w-16">Sel.</th>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 min-w-[140px]">Clase</th>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 w-24">Día</th>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 w-28">Fecha</th>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 w-24">Hora</th>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 w-28">Nivel</th>
                        <th className="border-b border-gray-300 dark:border-dark-border px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-dark-text2 w-24">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clasesPaginadas.map(clase => (
                        <tr
                          key={clase.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${claseSeleccionada === clase.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          onClick={() => setClaseSeleccionada(clase.id)}
                        >
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3">
                            <input
                              type="radio"
                              name="clase"
                              checked={claseSeleccionada === clase.id}
                              onChange={() => setClaseSeleccionada(clase.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600"
                            />
                          </td>
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3 font-medium text-gray-900 dark:text-dark-text text-sm min-w-[140px]">
                            <div className="truncate" title={clase.clases?.nombre}>
                              {clase.clases?.nombre}
                            </div>
                          </td>
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3 text-gray-600 dark:text-dark-text2 text-sm w-24">
                            {clase.clases?.dia_semana}
                          </td>
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3 text-gray-600 dark:text-dark-text2 text-sm w-28">
                            <div className="text-xs">
                              {clase.fecha
                                ? new Date(clase.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit'
                                })
                                : 'Sin fecha'
                              }
                            </div>
                          </td>
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3 text-gray-600 dark:text-dark-text2 text-sm w-24">
                            <div className="text-sm font-medium">
                              {clase.hora_inicio
                                ? clase.hora_inicio
                                : 'Sin hora'
                              }
                            </div>
                          </td>
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3 w-28">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                              {clase.clases?.nivel_clase}
                            </span>
                          </td>
                          <td className="border-b border-gray-200 dark:border-dark-border px-4 py-3 w-24">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${clase.clases?.tipo_clase === 'particular'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                              {clase.clases?.tipo_clase === 'particular' ? '🎯' : '👥'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

        {/* Columna 2: Información de la clase y asignación de alumnos */}
        <div className="space-y-6 min-h-[600px]">
          {claseSeleccionada ? (
            <>
              {/* Información de la clase seleccionada */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-dark-text">
                    👥 {claseActual?.nombre}
                  </h4>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${esClaseParticular
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                    {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📅</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text2">Día:</span>
                    </div>
                    <div className="text-gray-600 dark:text-dark-text2 ml-6">{claseActual?.dia_semana}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🕐</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text2">Horario:</span>
                    </div>
                    <div className="text-gray-600 dark:text-dark-text2 ml-6">
                      {claseActual?.hora_inicio && claseActual?.hora_fin
                        ? `${claseActual.hora_inicio} - ${claseActual.hora_fin}`
                        : 'Sin horario'
                      }
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🎯</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text2">Nivel:</span>
                    </div>
                    <div className="text-gray-600 dark:text-dark-text2 ml-6">{claseActual?.nivel_clase}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">👨‍🏫</span>
                      <span className="font-medium text-gray-700 dark:text-dark-text2">Profesor:</span>
                    </div>
                    <div className="text-gray-600 dark:text-dark-text2 ml-6">{claseActual?.profesor || 'Sin asignar'}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-text2">
                      📊 {asignados.size}/{maxAlumnos} alumnos asignados
                    </span>
                    {maxAlcanzado && (
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Capacidad máxima alcanzada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alumnos asignados */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                <h5 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-3 flex items-center">
                  <span className="mr-2">✅</span>
                  Alumnos Asignados ({asignados.size}/{maxAlumnos})
                </h5>
                {asignados.size > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(asignados).map(alumnoId => {
                      const alumno = alumnos.find(a => a.id === alumnoId);
                      return (
                        <span
                          key={alumnoId}
                          className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-2 rounded-full text-sm flex items-center space-x-2 hover:bg-green-300 dark:hover:bg-green-700 transition-colors"
                        >
                          <span className="font-medium">{alumno?.nombre}</span>
                          <button
                            onClick={() => toggleAlumno(alumnoId)}
                            className="text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-dark-text2 text-sm italic">No hay alumnos asignados a esta clase.</p>
                )}
              </div>

              {/* Búsqueda y lista de alumnos */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-dark-border rounded-lg p-4">
                <h5 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4 flex items-center">
                  <span className="mr-2">👥</span>
                  Asignar Alumnos
                </h5>

                {/* Búsqueda */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o apellidos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="input w-full text-sm"
                  />
                  {busqueda && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-dark-text2 bg-white dark:bg-gray-700 px-2 py-1 rounded">
                      Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
                    </div>
                  )}
                </div>

                {/* Lista de alumnos */}
                <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-gray-700">
                  {alumnosFiltrados.map(alumno => (
                    <div
                      key={alumno.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${asignados.has(alumno.id)
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
                        : maxAlcanzado && !asignados.has(alumno.id)
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-300 dark:border-gray-600'
                          : 'bg-white dark:bg-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-500 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      onClick={() => {
                        if (!maxAlcanzado || asignados.has(alumno.id)) {
                          toggleAlumno(alumno.id);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${asignados.has(alumno.id)
                          ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                          {alumno.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{alumno.nombre}</div>
                          {alumno.apellidos && (
                            <div className="text-xs text-gray-500 dark:text-dark-text2">{alumno.apellidos}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {asignados.has(alumno.id) ? (
                          <span className="text-green-600 dark:text-green-400 text-lg font-bold">✓</span>
                        ) : maxAlcanzado ? (
                          <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">Lleno</span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">+</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-dark-text2">Selecciona una clase para asignar alumnos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}