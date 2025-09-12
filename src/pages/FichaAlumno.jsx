import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // ✅ Añadido Link
import { supabase } from '../lib/supabase';
import ModalConfirmacion from '../components/ModalConfirmation';
import EditarAlumno from '../components/EditarAlumno';
import Paginacion from '../components/Paginacion';

export default function FichaAlumno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [clases, setClases] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para paginación de clases
  const [paginaClases, setPaginaClases] = useState(1);
  const elementosPorPagina = 10;

  // Estado para pestañas
  const [tabActiva, setTabActiva] = useState('clases');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [alumnoRes, clasesRes, pagosRes, asistenciasRes] = await Promise.all([
          supabase.from('alumnos').select('*').eq('id', id).single(),
          supabase.from('clases').select('*'),
          supabase.from('pagos').select('*').eq('alumno_id', id),
          supabase.from('asistencias').select('*').eq('alumno_id', id)
        ]);

        if (alumnoRes.error) throw alumnoRes.error;
        if (clasesRes.error) throw clasesRes.error;
        if (pagosRes.error) throw pagosRes.error;
        if (asistenciasRes.error) throw asistenciasRes.error;

        setAlumno(alumnoRes.data);
        setClases(clasesRes.data || []);
        setPagos(pagosRes.data || []);
        setAsistencias(asistenciasRes.data || []);
      } catch (err) {
        console.error('Error cargando datos:', err);
        alert('No se pudo cargar el alumno');
        navigate('/alumnos');
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarDatos();
  }, [id, navigate]);

  const handleAlumnoActualizado = () => {
    setEditarModalOpen(false);
    // Recargar datos del alumno
    const recargarDatos = async () => {
      try {
        const { data: alumnoRes, error } = await supabase
          .from('alumnos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setAlumno(alumnoRes);
      } catch (err) {
        console.error('Error recargando datos:', err);
      }
    };
    recargarDatos();
  };

  // Funciones para paginación
  const totalPaginasClases = Math.ceil(clases.length / elementosPorPagina);
  const clasesPaginadas = clases.slice(
    (paginaClases - 1) * elementosPorPagina,
    paginaClases * elementosPorPagina
  );

  const handleCambiarPaginaClases = (nuevaPagina) => {
    setPaginaClases(nuevaPagina);
  };

  if (loading) return <p className="text-gray-700 dark:text-dark-text">Cargando...</p>;
  if (!alumno) return <p className="text-gray-700 dark:text-dark-text">Alumno no encontrado</p>;

  // URL de la foto (o placeholder)
  const fotoUrl = alumno.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random&color=fff&size=128`;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        {/* Encabezado con foto */}
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <img
            src={fotoUrl}
            alt={alumno.nombre}
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
          />
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">{alumno.nombre}</h2>
            <div className="space-y-1 text-gray-600 dark:text-dark-text2">
              {alumno.email && <p>📧 {alumno.email}</p>}
              {alumno.telefono && <p>📱 {alumno.telefono}</p>}
              <p>🎯 Nivel: <span className="font-semibold text-blue-600 dark:text-blue-400">{alumno.nivel}</span></p>
            </div>

            {/* Disponibilidad */}
            {alumno.dias_disponibles && alumno.dias_disponibles.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📅 Disponibilidad:</p>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Días:</strong> {alumno.dias_disponibles.join(', ')}</p>

                  {/* Mostrar múltiples horarios */}
                  {alumno.horarios_disponibles && alumno.horarios_disponibles.length > 0 ? (
                    <div className="mt-2">
                      <p><strong>Horarios:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        {alumno.horarios_disponibles.map((horario, index) => (
                          <li key={index}>
                            {horario.hora_inicio} - {horario.hora_fin}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    // Compatibilidad con formato antiguo
                    alumno.hora_inicio_disponible && alumno.hora_fin_disponible && (
                      <p><strong>Horario:</strong> {alumno.hora_inicio_disponible} - {alumno.hora_fin_disponible}</p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción compactos */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setEditarModalOpen(true)}
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg"
              title="Editar perfil"
            >
              ✏️
            </button>
            <button
              onClick={() => navigate(`/seguimiento-alumno/${id}`)}
              className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg"
              title="Ver seguimiento"
            >
              📊
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg"
              title="Eliminar alumno"
            >
              🗑️
            </button>
          </div>
        </div>

        <hr className="my-8 border-gray-200 dark:border-dark-border" />

        {/* Sistema de Pestañas */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          {/* Navegación de pestañas */}
          <div className="border-b border-gray-200 dark:border-dark-border">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setTabActiva('clases')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tabActiva === 'clases'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                  }`}
              >
                📚 Clases Asignadas ({clases.length})
              </button>
              <button
                onClick={() => setTabActiva('pagos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tabActiva === 'pagos'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                  }`}
              >
                💸 Pagos ({pagos.length})
              </button>
              <button
                onClick={() => setTabActiva('asistencias')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tabActiva === 'asistencias'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                  }`}
              >
                📅 Asistencias ({asistencias.length})
              </button>
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="p-6">
            {/* Pestaña Clases */}
            {tabActiva === 'clases' && (
              <div>
                {clases.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No hay clases asignadas</h3>
                    <p className="text-gray-500 dark:text-dark-text2">Este alumno no tiene clases asignadas actualmente</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-hover-custom">
                        <thead className="bg-gray-50 dark:bg-dark-surface2">
                          <tr>
                            <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Clase</th>
                            <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Día</th>
                            <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Hora</th>
                            <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Nivel</th>
                            <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clasesPaginadas.map(clase => (
                            <tr key={clase.id} className="border-b border-gray-100 dark:border-dark-border">
                              <td className="py-3 font-medium text-gray-900 dark:text-dark-text">{clase.nombre}</td>
                              <td className="py-3 text-gray-600 dark:text-dark-text2">{clase.dia_semana}</td>
                              <td className="py-3 text-gray-600 dark:text-dark-text2">{clase.hora_inicio} - {clase.hora_fin}</td>
                              <td className="py-3">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                                  {clase.nivel_clase}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${clase.tipo_clase === 'particular'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  }`}>
                                  {clase.tipo_clase === 'particular' ? '🎯 Particular' : '👥 Grupal'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    <Paginacion
                      paginaActual={paginaClases}
                      totalPaginas={totalPaginasClases}
                      onCambiarPagina={handleCambiarPaginaClases}
                      elementosPorPagina={elementosPorPagina}
                      totalElementos={clases.length}
                    />
                  </>
                )}
              </div>
            )}

            {/* Pestaña Pagos */}
            {tabActiva === 'pagos' && (
              <div>
                {pagos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💸</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No hay pagos registrados</h3>
                    <p className="text-gray-500 dark:text-dark-text2">Este alumno no tiene pagos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagos.map(pago => (
                      <div key={pago.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-dark-surface2 rounded-lg border border-gray-200 dark:border-dark-border hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-dark-text text-lg">€{pago.cantidad}</p>
                            <p className="text-sm text-gray-600 dark:text-dark-text2">Mes: {pago.mes_cubierto}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-dark-text2">
                            {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
                          </p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            ✅ Pagado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña Asistencias */}
            {tabActiva === 'asistencias' && (
              <div>
                {asistencias.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No hay asistencias registradas</h3>
                    <p className="text-gray-500 dark:text-dark-text2">Este alumno no tiene asistencias registradas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-hover-custom">
                      <thead className="bg-gray-50 dark:bg-dark-surface2">
                        <tr>
                          <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Fecha</th>
                          <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Clase</th>
                          <th className="text-left py-3 font-medium text-gray-700 dark:text-dark-text">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asistencias.map(asistencia => (
                          <tr key={asistencia.id} className="border-b border-gray-100 dark:border-dark-border">
                            <td className="py-3 text-gray-900 dark:text-dark-text">
                              {new Date(asistencia.fecha).toLocaleDateString('es-ES')}
                            </td>
                            <td className="py-3 text-gray-600 dark:text-dark-text2">{asistencia.clases?.nombre || 'Clase eliminada'}</td>
                            <td className="py-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${asistencia.estado === 'asistio'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : asistencia.estado === 'falta'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}>
                                {asistencia.estado === 'asistio' ? '✅ Asistió' :
                                  asistencia.estado === 'falta' ? '❌ Falta' :
                                    '⚠️ Justificada'}
                              </span>
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


      </div>

      {/* Modal de confirmación */}
      <ModalConfirmacion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async () => {
          // ✅ Usa supabase-js, no fetch
          const { error } = await supabase
            .from('alumnos')
            .delete()
            .eq('id', id);

          if (error) {
            alert('❌ Error al eliminar: ' + error.message);
            console.error(error);
          } else {
            alert('✅ Alumno eliminado');
            navigate('/alumnos');
          }
        }}
        titulo="¿Eliminar alumno?"
        mensaje={`¿Estás seguro de que deseas eliminar a ${alumno.nombre}? Esta acción no se puede deshacer.`}
      />

      {/* Modal de Editar Alumno */}
      {editarModalOpen && (
        <EditarAlumno
          alumno={alumno}
          onCancel={() => setEditarModalOpen(false)}
          onSuccess={handleAlumnoActualizado}
        />
      )}
    </div>
  );
}