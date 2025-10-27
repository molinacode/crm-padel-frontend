import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FichaProfesor() {
  const { id } = useParams();
  const [profesor, setProfesor] = useState(null);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar datos del profesor
      const { data: profesorData, error: profesorError } = await supabase
        .from('profesores')
        .select('*')
        .eq('id', id)
        .single();

      if (profesorError) throw profesorError;
      setProfesor(profesorData);

      // Cargar clases del profesor
      const { data: clasesData, error: clasesError } = await supabase
        .from('clases')
        .select(
          `
          id,
          nombre,
          nivel_clase,
          tipo_clase,
          dia_semana,
          hora_inicio,
          hora_fin,
          eventos_clase (
            id,
            fecha,
            estado
          )
        `
        )
        .eq('profesor', profesorData.nombre);

      if (clasesError) {
        console.error('Error cargando clases:', clasesError);
      } else {
        setClases(clasesData || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos del profesor');
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = fechaNacimiento => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const obtenerProximasClases = () => {
    const hoy = new Date();
    const proximasClases = [];

    clases.forEach(clase => {
      clase.eventos_clase?.forEach(evento => {
        const fechaEvento = new Date(evento.fecha);
        if (fechaEvento >= hoy && evento.estado !== 'cancelada') {
          proximasClases.push({
            ...clase,
            evento: evento,
          });
        }
      });
    });

    return proximasClases.sort(
      (a, b) => new Date(a.evento.fecha) - new Date(b.evento.fecha)
    );
  };

  if (loading) {
    return (
      <LoadingSpinner size='large' text='Cargando datos del profesor...' />
    );
  }

  if (!profesor) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>❌</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          Profesor no encontrado
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
          El profesor que buscas no existe o ha sido eliminado
        </p>
        <Link to='/profesores' className='btn-primary px-6 py-3'>
          Volver a Profesores
        </Link>
      </div>
    );
  }

  const proximasClases = obtenerProximasClases();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
          <div className='flex items-center space-x-4'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
              <span className='text-blue-600 font-bold text-2xl'>
                {profesor.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {profesor.nombre} {profesor.apellidos}
              </h1>
              <p className='text-gray-600'>
                {profesor.especialidad} • {profesor.nivel_experiencia}
              </p>
              <div className='flex items-center mt-2'>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    profesor.activo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {profesor.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <div className='flex space-x-3'>
            <Link
              to={`/profesor/${id}/editar`}
              className='btn-secondary px-4 py-2 text-sm font-medium'
            >
              ✏️ Editar
            </Link>
            <Link
              to='/profesores'
              className='btn-primary px-4 py-2 text-sm font-medium'
            >
              ← Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8 px-6'>
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              📋 Información
            </button>
            <button
              onClick={() => setActiveTab('clases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clases'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              📅 Clases ({clases.length})
            </button>
            <button
              onClick={() => setActiveTab('horarios')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'horarios'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              ⏰ Horarios
            </button>
          </nav>
        </div>

        <div className='p-6'>
          {/* Tab Información */}
          {activeTab === 'info' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Información Personal */}
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    👤 Información Personal
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre completo:
                      </span>
                      <p className='text-gray-900'>
                        {profesor.nombre} {profesor.apellidos}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Edad:
                      </span>
                      <p className='text-gray-900'>
                        {calcularEdad(profesor.fecha_nacimiento)} años
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Teléfono:
                      </span>
                      <p className='text-gray-900'>
                        {profesor.telefono || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Email:
                      </span>
                      <p className='text-gray-900'>{profesor.email}</p>
                    </div>
                    {profesor.direccion && (
                      <div>
                        <span className='text-sm font-medium text-gray-500'>
                          Dirección:
                        </span>
                        <p className='text-gray-900'>{profesor.direccion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información Profesional */}
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    🏆 Información Profesional
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Especialidad:
                      </span>
                      <p className='text-gray-900'>{profesor.especialidad}</p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nivel de experiencia:
                      </span>
                      <p className='text-gray-900'>
                        {profesor.nivel_experiencia}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Estado:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                          profesor.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {profesor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {profesor.observaciones && (
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    📝 Observaciones
                  </h3>
                  <p className='text-gray-700 whitespace-pre-wrap'>
                    {profesor.observaciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab Clases */}
          {activeTab === 'clases' && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  📅 Clases Asignadas
                </h3>
                <span className='text-sm text-gray-500'>
                  {clases.length} clase{clases.length !== 1 ? 's' : ''}
                </span>
              </div>

              {clases.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-4xl mb-4'>📅</div>
                  <p className='text-gray-500'>
                    No hay clases asignadas a este profesor
                  </p>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {clases.map(clase => (
                    <div key={clase.id} className='bg-gray-50 rounded-lg p-4'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <h4 className='font-semibold text-gray-900'>
                            {clase.nombre}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {clase.nivel_clase} • {clase.tipo_clase}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {clase.dia_semana} • {clase.hora_inicio} -{' '}
                            {clase.hora_fin}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            clase.tipo_clase === 'particular'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {clase.tipo_clase === 'particular'
                            ? '🎯 Particular'
                            : '👥 Grupal'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Horarios */}
          {activeTab === 'horarios' && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  ⏰ Próximas Clases
                </h3>
                <span className='text-sm text-gray-500'>
                  {proximasClases.length} clase
                  {proximasClases.length !== 1 ? 's' : ''}
                </span>
              </div>

              {proximasClases.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-4xl mb-4'>⏰</div>
                  <p className='text-gray-500'>
                    No hay clases programadas próximamente
                  </p>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {proximasClases.slice(0, 10).map((clase, index) => (
                    <div
                      key={`${clase.id}-${clase.evento.id}`}
                      className='bg-gray-50 rounded-lg p-4'
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <h4 className='font-semibold text-gray-900'>
                            {clase.nombre}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {clase.nivel_clase} • {clase.tipo_clase}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {clase.evento?.fecha
                              ? new Date(clase.evento.fecha).toLocaleDateString(
                                  'es-ES',
                                  {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  }
                                )
                              : 'Sin fecha'}{' '}
                            • {clase.hora_inicio} - {clase.hora_fin}
                          </p>
                        </div>
                        <div className='text-right'>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              clase.tipo_clase === 'particular'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {clase.tipo_clase === 'particular'
                              ? '🎯 Particular'
                              : '👥 Grupal'}
                          </span>
                          <p className='text-xs text-gray-500 mt-1'>
                            {clase.evento.estado === 'cancelada'
                              ? '❌ Cancelada'
                              : '✅ Programada'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
