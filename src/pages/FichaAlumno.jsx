import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // ✅ Añadido Link
import { supabase } from '../lib/supabase';
import ModalConfirmacion from '../components/ModalConfirmation';
import EditarAlumno from '../components/EditarAlumno';

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

        if (alumnoRes.error) throw alumnoRes.error;
        setAlumno(alumnoRes.data);
      } catch (err) {
        console.error('Error recargando datos:', err);
      }
    };
    recargarDatos();
  };

  if (loading) return <p className="text-gray-700 dark:text-dark-text">Cargando...</p>;
  if (!alumno) return <p className="text-gray-700 dark:text-dark-text">Alumno no encontrado</p>;

  // URL de la foto (o placeholder)
  const fotoUrl = alumno.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random&color=fff&size=128`;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white p-8 rounded-xl shadow-md">
        {/* Encabezado con foto */}
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <img
            src={fotoUrl}
            alt={alumno.nombre}
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
          />
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">{alumno.nombre}</h2>
            <p className="text-gray-600">{alumno.email}</p>
            <p className="text-gray-600">{alumno.telefono}</p>
            <p className="text-gray-600">Nivel: <strong>{alumno.nivel}</strong></p>

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
        </div>

        <hr className="my-8 border-gray-200" />

        <div className="grid md:grid-cols-2 gap-10">
          {/* Clases */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">📚 Clases Asignadas</h3>
            <ul className="space-y-3">
              {clases.map(clase => (
                <li key={clase.id} className="border-l-4 border-blue-500 pl-3 py-1 text-gray-700">
                  {clase.nombre} • {clase.dia_semana} • {clase.hora_inicio}
                </li>
              ))}
            </ul>
          </div>

          {/* Pagos */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">💸 Últimos Pagos</h3>
            {pagos.length === 0 ? (
              <p className="text-gray-500">No hay pagos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {pagos.map(pago => (
                  <li key={pago.id} className="flex justify-between py-1 border-b border-gray-100">
                    <span>€{pago.cantidad} - {pago.mes_cubierto}</span>
                    <span className="text-green-600 font-medium">Pagado</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Asistencias */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">📅 Historial de Asistencias</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Clase</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map(asistencia => (
                <tr key={asistencia.id}>
                  <td>{asistencia.fecha}</td>
                  <td>{asistencia.clases?.nombre}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${asistencia.estado === 'asistio'
                      ? 'bg-green-100 text-green-800'
                      : asistencia.estado === 'falta'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {asistencia.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Acciones */}
        <div className="mt-10 flex flex-wrap gap-4">
          <button
            onClick={() => setEditarModalOpen(true)}
            className="btn-primary"
          >
            ✏️ Editar Perfil
          </button>
          <Link to={`/alumno/${id}/seguimiento`} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">
            📊 Seguimiento
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
          >
            🗑️ Eliminar Alumno
          </button>
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