import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

export default function AsignarAlumnosClase({ onCancel, onSuccess }) {
  const [alumnos, setAlumnos] = useState([]);
  const [clases, setClases] = useState([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState('');
  const [asignados, setAsignados] = useState(new Set());
  const [maxAlcanzado, setMaxAlcanzado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const claseActual = clases.find(c => c.id === claseSeleccionada);
  const esClaseParticular = claseActual?.tipo_clase === 'particular';
  const maxAlumnos = esClaseParticular ? 1 : 4;

  // Filtrar alumnos según la búsqueda
  const alumnosFiltrados = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (alumno.apellidos && alumno.apellidos.toLowerCase().includes(busqueda.toLowerCase()))
  );

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [alumnosRes, clasesRes] = await Promise.all([
          supabase.from('alumnos').select('*').eq('activo', true),
          supabase.from('clases').select('*').order('dia_semana, hora_inicio')
        ]);

        if (alumnosRes.error) throw alumnosRes.error;
        if (clasesRes.error) throw clasesRes.error;

        setAlumnos(alumnosRes.data || []);
        setClases(clasesRes.data || []);
      } catch (err) {
        console.error('Error cargando datos:', err);
        alert('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Cargar asignaciones cuando se selecciona una clase
  useEffect(() => {
    const cargarAsignaciones = async () => {
      if (!claseSeleccionada) {
        setAsignados(new Set());
        setMaxAlcanzado(false);
        return;
      }

      try {
        const { data: asignadosRes, error } = await supabase
          .from('alumnos_clases')
          .select('*')
          .eq('clase_id', claseSeleccionada);

        if (error) throw error;

        const asignadosSet = new Set(
          asignadosRes?.map(ac => ac.alumno_id) || []
        );

        setAsignados(asignadosSet);
        setMaxAlcanzado(asignadosSet.size >= maxAlumnos);
      } catch (err) {
        console.error('Error cargando asignaciones:', err);
        alert('No se pudieron cargar las asignaciones');
      }
    };

    cargarAsignaciones();
  }, [claseSeleccionada, maxAlumnos]);

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
        // Desasignar
        const { error: deleteError } = await supabase
          .from('alumnos_clases')
          .delete()
          .eq('alumno_id', alumnoId)
          .eq('clase_id', claseSeleccionada);
        error = deleteError;
      } else {
        // Asignar
        const { error: insertError } = await supabase
          .from('alumnos_clases')
          .insert([{ alumno_id: alumnoId, clase_id: claseSeleccionada }]);
        error = insertError;
      }

      if (error) {
        console.error('Error en asignación:', error);
        alert('❌ Error al actualizar asignación');
        return;
      }

      // Actualiza estado local
      const nuevosAsignados = new Set(asignados);
      estaAsignado ? nuevosAsignados.delete(alumnoId) : nuevosAsignados.add(alumnoId);
      setAsignados(nuevosAsignados);
      setMaxAlcanzado(nuevosAsignados.size >= maxAlumnos);
    } catch (err) {
      console.error('Error inesperado:', err);
      alert('❌ Error de conexión');
    }
  };

  if (loading) return <LoadingSpinner size="medium" text="Cargando alumnos..." />;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text">👥 Asignar Alumnos a Clases</h3>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary px-4 py-2"
          >
            ✖ Cancelar
          </button>
          <button
            onClick={onSuccess}
            className="btn-primary px-4 py-2"
          >
            ✅ Guardar
          </button>
        </div>
      </div>

      {/* Tabla de clases */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4">📚 Seleccionar Clase</h4>

        {clases.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-dark-text2">No hay clases registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-dark-border">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Seleccionar</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Nombre</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Día</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Horario</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Nivel</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Tipo</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Profesor</th>
                  <th className="border border-gray-300 dark:border-dark-border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-dark-text2">Período</th>
                </tr>
              </thead>
              <tbody>
                {clases.map(clase => (
                  <tr
                    key={clase.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${claseSeleccionada === clase.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    onClick={() => setClaseSeleccionada(clase.id)}
                  >
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2">
                      <input
                        type="radio"
                        name="clase"
                        checked={claseSeleccionada === clase.id}
                        onChange={() => setClaseSeleccionada(clase.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2 font-medium text-gray-900 dark:text-dark-text">
                      {clase.nombre}
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2 text-gray-600 dark:text-dark-text2">
                      {clase.dia_semana}
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2 text-gray-600 dark:text-dark-text2">
                      {clase.hora_inicio && clase.hora_fin
                        ? `${clase.hora_inicio} - ${clase.hora_fin}`
                        : 'Sin horario'
                      }
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                        {clase.nivel_clase}
                      </span>
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${clase.tipo_clase === 'particular'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                        {clase.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                      </span>
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2 text-gray-600 dark:text-dark-text2">
                      {clase.profesor || 'Sin asignar'}
                    </td>
                    <td className="border border-gray-300 dark:border-dark-border px-4 py-2 text-gray-600 dark:text-dark-text2">
                      {clase.fecha_inicio && clase.fecha_fin
                        ? `${new Date(clase.fecha_inicio).toLocaleDateString('es-ES')} - ${new Date(clase.fecha_fin).toLocaleDateString('es-ES')}`
                        : 'Sin fechas'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {claseSeleccionada && (
        <>
          {/* Información detallada de la clase seleccionada */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
                👥 Asignar alumnos a: {claseActual?.nombre}
              </h4>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${esClaseParticular
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text2">📅 Día:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text2">{claseActual?.dia_semana}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text2">🕐 Horario:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text2">
                  {claseActual?.hora_inicio && claseActual?.hora_fin
                    ? `${claseActual.hora_inicio} - ${claseActual.hora_fin}`
                    : 'Sin horario'
                  }
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text2">🎯 Nivel:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text2">{claseActual?.nivel_clase}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-dark-text2">👨‍🏫 Profesor:</span>
                <span className="ml-2 text-gray-600 dark:text-dark-text2">{claseActual?.profesor || 'Sin asignar'}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/30">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-dark-text2">
                  📊 {asignados.size}/{maxAlumnos} alumnos asignados
                </span>
                {maxAlcanzado && (
                  <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                    ⚠️ Capacidad máxima alcanzada
                  </span>
                )}
                <button
                  onClick={() => setShowModal(!showModal)}
                  className="btn-secondary text-sm"
                >
                  {showModal ? '📋 Ocultar Lista' : '📋 Ver Lista'}
                </button>
              </div>
            </div>
          </div>

          {/* Resumen de alumnos asignados */}
          <div className="mb-4">
            {asignados.size > 0 ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                  Alumnos asignados ({asignados.size}/{maxAlumnos}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(asignados).map(alumnoId => {
                    const alumno = alumnos.find(a => a.id === alumnoId);
                    return (
                      <span
                        key={alumnoId}
                        className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs flex items-center space-x-1"
                      >
                        <span>{alumno?.nombre}</span>
                        <button
                          onClick={() => toggleAlumno(alumnoId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-dark-text2 text-sm">No hay alumnos asignados a esta clase.</p>
            )}
          </div>

          {/* Búsqueda de alumnos */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o apellidos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input w-full"
            />
            {busqueda && (
              <div className="mt-2 text-xs text-gray-500 dark:text-dark-text2">
                Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
              </div>
            )}
          </div>

          {/* Lista desplegable de alumnos */}
          {showModal && (
            <div className="border dark:border-dark-border rounded-lg p-4 bg-gray-50 dark:bg-dark-surface2">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">Seleccionar Alumnos</h4>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* Campo de búsqueda */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o apellidos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {busqueda && (
                  <div className="mt-2 text-xs text-gray-500">
                    Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alumnos.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay alumnos registrados.</p>
                ) : alumnosFiltrados.length === 0 ? (
                  <p className="text-gray-500 text-sm">No se encontraron alumnos que coincidan con la búsqueda.</p>
                ) : (
                  alumnosFiltrados.map(alumno => (
                    <label
                      key={alumno.id}
                      className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${asignados.has(alumno.id)
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100 border border-transparent'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={asignados.has(alumno.id)}
                        onChange={() => toggleAlumno(alumno.id)}
                        disabled={!asignados.has(alumno.id) && asignados.size >= maxAlumnos}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="flex-1">{alumno.nombre}</span>
                      {asignados.has(alumno.id) && (
                        <span className="text-xs text-blue-600 font-medium">✓ Asignado</span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Estado de la clase */}
          <div className="mt-4">
            {maxAlcanzado ? (
              <div className={`border rounded-lg p-3 ${esClaseParticular
                ? 'bg-purple-50 border-purple-200'
                : 'bg-green-50 border-green-200'
                }`}>
                <p className={`text-sm flex items-center ${esClaseParticular
                  ? 'text-purple-700'
                  : 'text-green-700'
                  }`}>
                  ✅ <span className="ml-2">
                    {esClaseParticular
                      ? 'Clase particular completa (1/1 alumno)'
                      : `Clase completa (${maxAlumnos}/${maxAlumnos} alumnos)`
                    }
                  </span>
                </p>
              </div>
            ) : (
              <div className={`border rounded-lg p-3 ${esClaseParticular
                ? 'bg-purple-50 border-purple-200'
                : 'bg-yellow-50 border-yellow-200'
                }`}>
                <p className={`text-sm ${esClaseParticular
                  ? 'text-purple-700'
                  : 'text-yellow-700'
                  }`}>
                  ⚠️ <span className="ml-2">
                    {esClaseParticular
                      ? 'Clase particular disponible (0/1 alumno)'
                      : `Clase disponible (${asignados.size}/${maxAlumnos} alumnos)`
                    }
                  </span>
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {!claseSeleccionada && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">Selecciona una clase</h3>
          <p className="text-gray-500 dark:text-dark-text2">
            Elige una clase del menú desplegable para comenzar a asignar alumnos
          </p>
        </div>
      )}
    </div>
  );
}