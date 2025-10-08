import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SeguimientoAlumno() {
  const { id } = useParams();
  const [alumno, setAlumno] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [clases, setClases] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('seguimiento');
  const [showForm, setShowForm] = useState(false);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Progreso',
    observaciones: '',
    nivel_actual: '',
    objetivos: '',
    recomendaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar datos del alumno
      const { data: alumnoData, error: alumnoError } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', id)
        .single();

      if (alumnoError) throw alumnoError;
      setAlumno(alumnoData);

      // Cargar seguimientos del alumno
      const { data: seguimientosData, error: seguimientosError } = await supabase
        .from('seguimiento_alumnos')
        .select('*')
        .eq('alumno_id', id)
        .order('fecha', { ascending: false });

      if (seguimientosError) {
        console.error('Error cargando seguimientos:', seguimientosError);
      } else {
        setSeguimientos(seguimientosData || []);
      }

      // Cargar clases del alumno
      const { data: clasesData, error: clasesError } = await supabase
        .from('alumnos_clases')
        .select(`
          id,
          clases (
            id,
            nombre,
            nivel_clase,
            tipo_clase,
            dia_semana,
            hora_inicio,
            hora_fin,
            profesor
          )
        `)
        .eq('alumno_id', id);

      if (clasesError) {
        console.error('Error cargando clases:', clasesError);
      } else {
        setClases(clasesData || []);
      }

      // Cargar asistencias del alumno
      const { data: asistenciasData, error: asistenciasError } = await supabase
        .from('asistencias')
        .select(`
          id,
          fecha,
          presente,
          observaciones,
          clases (
            nombre,
            nivel_clase
          )
        `)
        .eq('alumno_id', id)
        .order('fecha', { ascending: false })
        .limit(10);

      if (asistenciasError) {
        console.error('Error cargando asistencias:', asistenciasError);
      } else {
        setAsistencias(asistenciasData || []);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos del alumno');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSeguimiento = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('seguimiento_alumnos')
        .insert([{
          ...nuevoSeguimiento,
          alumno_id: id
        }]);

      if (error) throw error;

      // Recargar seguimientos
      const { data: seguimientosData } = await supabase
        .from('seguimiento_alumnos')
        .select('*')
        .eq('alumno_id', id)
        .order('fecha', { ascending: false });

      setSeguimientos(seguimientosData || []);
      setShowForm(false);
      setNuevoSeguimiento({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'Progreso',
        observaciones: '',
        nivel_actual: '',
        objetivos: '',
        recomendaciones: ''
      });

      alert('Seguimiento creado correctamente');
    } catch (error) {
      console.error('Error creando seguimiento:', error);
      alert('Error al crear el seguimiento');
    }
  };

  const calcularEstadisticas = () => {
    const totalAsistencias = asistencias.length;
    const asistenciasPresentes = asistencias.filter(a => a.presente).length;
    const porcentajeAsistencia = totalAsistencias > 0 ? (asistenciasPresentes / totalAsistencias) * 100 : 0;

    return {
      totalAsistencias,
      asistenciasPresentes,
      porcentajeAsistencia: Math.round(porcentajeAsistencia)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text2">Cargando datos del alumno...</p>
        </div>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">Alumno no encontrado</h3>
        <p className="text-gray-500 dark:text-dark-text2 mb-6">El alumno que buscas no existe o ha sido eliminado</p>
        <Link to="/alumnos" className="btn-primary px-6 py-3">
          Volver a Alumnos
        </Link>
      </div>
    );
  }

  const estadisticas = calcularEstadisticas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">
                {alumno.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Seguimiento - {alumno.nombre} {alumno.apellidos}
              </h1>
              <p className="text-gray-600">Progreso y evolución del alumno</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary px-4 py-2 text-sm font-medium"
            >
              ➕ Nuevo Seguimiento
            </button>
            <Link
              to={`/alumno/${id}`}
              className="btn-secondary px-4 py-2 text-sm font-medium"
            >
              Ver Ficha
            </Link>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Asistencia</p>
              <p className="text-2xl font-semibold text-gray-900">
                {estadisticas.porcentajeAsistencia}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Clases Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {estadisticas.totalAsistencias}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-lg">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Seguimientos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {seguimientos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('seguimiento')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'seguimiento'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📝 Seguimiento
            </button>
            <button
              onClick={() => setActiveTab('clases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'clases'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📅 Clases ({clases.length})
            </button>
            <button
              onClick={() => setActiveTab('asistencias')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'asistencias'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              ✅ Asistencias
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Seguimiento */}
          {activeTab === 'seguimiento' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">📝 Historial de Seguimiento</h3>
                <span className="text-sm text-gray-500">{seguimientos.length} registro{seguimientos.length !== 1 ? 's' : ''}</span>
              </div>

              {seguimientos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-500">No hay seguimientos registrados</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 btn-primary px-6 py-3"
                  >
                    Crear Primer Seguimiento
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {seguimientos.map(seguimiento => (
                    <div key={seguimiento.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {seguimiento.tipo} - {seguimiento.fecha ? new Date(seguimiento.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </h4>
                          {seguimiento.nivel_actual && (
                            <p className="text-sm text-gray-600 mt-1">
                              Nivel actual: {seguimiento.nivel_actual}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${seguimiento.tipo === 'Progreso'
                            ? 'bg-green-100 text-green-800'
                            : seguimiento.tipo === 'Incidencia'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                          {seguimiento.tipo}
                        </span>
                      </div>

                      {seguimiento.observaciones && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Observaciones:</h5>
                          <p className="text-gray-600 whitespace-pre-wrap">{seguimiento.observaciones}</p>
                        </div>
                      )}

                      {seguimiento.objetivos && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-700 mb-2">Objetivos:</h5>
                          <p className="text-gray-600 whitespace-pre-wrap">{seguimiento.objetivos}</p>
                        </div>
                      )}

                      {seguimiento.recomendaciones && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Recomendaciones:</h5>
                          <p className="text-gray-600 whitespace-pre-wrap">{seguimiento.recomendaciones}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Clases */}
          {activeTab === 'clases' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">📅 Clases Asignadas</h3>
                <span className="text-sm text-gray-500">{clases.length} clase{clases.length !== 1 ? 's' : ''}</span>
              </div>

              {clases.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-500">No hay clases asignadas</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {clases.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.clases.nombre}</h4>
                          <p className="text-sm text-gray-600">{item.clases.nivel_clase} • {item.clases.tipo_clase}</p>
                          <p className="text-sm text-gray-500">
                            {item.clases.dia_semana} • {item.clases.hora_inicio} - {item.clases.hora_fin}
                          </p>
                          <p className="text-sm text-gray-500">Profesor: {item.clases.profesor || 'Sin asignar'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.clases.tipo_clase === 'particular'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {item.clases.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Asistencias */}
          {activeTab === 'asistencias' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">✅ Historial de Asistencias</h3>
                <span className="text-sm text-gray-500">{asistencias.length} registro{asistencias.length !== 1 ? 's' : ''}</span>
              </div>

              {asistencias.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-gray-500">No hay asistencias registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Clase</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {asistencias.map(asistencia => (
                        <tr key={asistencia.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {asistencia.fecha ? new Date(asistencia.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{asistencia.clases.nombre}</div>
                              <div className="text-sm text-gray-500">{asistencia.clases.nivel_clase}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${asistencia.presente
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {asistencia.presente ? '✅ Presente' : '❌ Ausente'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600">
                              {asistencia.observaciones || 'Sin observaciones'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Seguimiento */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">📝 Nuevo Seguimiento</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCrearSeguimiento} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                    <input
                      type="date"
                      name="fecha"
                      value={nuevoSeguimiento.fecha}
                      onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, fecha: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      name="tipo"
                      value={nuevoSeguimiento.tipo}
                      onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Progreso">Progreso</option>
                      <option value="Incidencia">Incidencia</option>
                      <option value="Evaluación">Evaluación</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nivel Actual</label>
                  <input
                    type="text"
                    name="nivel_actual"
                    value={nuevoSeguimiento.nivel_actual}
                    onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, nivel_actual: e.target.value })}
                    placeholder="Ej: Principiante, Intermedio, Avanzado..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={nuevoSeguimiento.observaciones}
                    onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, observaciones: e.target.value })}
                    rows={3}
                    placeholder="Describe el progreso, comportamiento, técnica..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos</label>
                  <textarea
                    name="objetivos"
                    value={nuevoSeguimiento.objetivos}
                    onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, objetivos: e.target.value })}
                    rows={2}
                    placeholder="Objetivos a trabajar con el alumno..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recomendaciones</label>
                  <textarea
                    name="recomendaciones"
                    value={nuevoSeguimiento.recomendaciones}
                    onChange={(e) => setNuevoSeguimiento({ ...nuevoSeguimiento, recomendaciones: e.target.value })}
                    rows={2}
                    placeholder="Recomendaciones para el alumno..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary px-6 py-2"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                  >
                    Crear Seguimiento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
