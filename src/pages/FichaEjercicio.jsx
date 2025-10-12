import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function FichaEjercicio() {
  const { id } = useParams();
  const [ejercicio, setEjercicio] = useState(null);
  const [clasesAsignadas, setClasesAsignadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar datos del ejercicio
      const { data: ejercicioData, error: ejercicioError } = await supabase
        .from('ejercicios')
        .select('*')
        .eq('id', id)
        .single();

      if (ejercicioError) throw ejercicioError;
      setEjercicio(ejercicioData);

      // Cargar clases donde se usa este ejercicio
      const { data: clasesData, error: clasesError } = await supabase
        .from('clases_ejercicios')
        .select(
          `
          id,
          clases (
            id,
            nombre,
            nivel_clase,
            tipo_clase,
            dia_semana,
            hora_inicio,
            hora_fin
          )
        `
        )
        .eq('ejercicio_id', id);

      if (clasesError) {
        console.error('Error cargando clases:', clasesError);
      } else {
        setClasesAsignadas(clasesData || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos del ejercicio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-dark-text2'>
            Cargando datos del ejercicio...
          </p>
        </div>
      </div>
    );
  }

  if (!ejercicio) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>❌</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          Ejercicio no encontrado
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
          El ejercicio que buscas no existe o ha sido eliminado
        </p>
        <Link to='/ejercicios' className='btn-primary px-6 py-3'>
          Volver a Ejercicios
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
          <div className='flex items-center space-x-4'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
              <span className='text-green-600 font-bold text-2xl'>
                {ejercicio.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                {ejercicio.nombre}
              </h1>
              <p className='text-gray-600'>
                {ejercicio.categoria} • {ejercicio.tipo}
              </p>
              <div className='flex items-center mt-2 space-x-2'>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    ejercicio.dificultad === 'Fácil'
                      ? 'bg-green-100 text-green-800'
                      : ejercicio.dificultad === 'Intermedio'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {ejercicio.dificultad}
                </span>
                {ejercicio.duracion_minutos && (
                  <span className='inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                    {ejercicio.duracion_minutos} min
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className='flex space-x-3'>
            <Link
              to={`/ejercicio/${id}/editar`}
              className='btn-secondary px-4 py-2 text-sm font-medium'
            >
              ✏️ Editar
            </Link>
            <Link
              to='/ejercicios'
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
              onClick={() => setActiveTab('instrucciones')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'instrucciones'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              📖 Instrucciones
            </button>
            <button
              onClick={() => setActiveTab('clases')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clases'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              📅 Clases ({clasesAsignadas.length})
            </button>
          </nav>
        </div>

        <div className='p-6'>
          {/* Tab Información */}
          {activeTab === 'info' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Información Básica */}
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    💪 Información Básica
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Nombre:
                      </span>
                      <p className='text-gray-900'>{ejercicio.nombre}</p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Categoría:
                      </span>
                      <p className='text-gray-900'>{ejercicio.categoria}</p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Tipo:
                      </span>
                      <p className='text-gray-900'>{ejercicio.tipo}</p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Dificultad:
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                          ejercicio.dificultad === 'Fácil'
                            ? 'bg-green-100 text-green-800'
                            : ejercicio.dificultad === 'Intermedio'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ejercicio.dificultad}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Duración:
                      </span>
                      <p className='text-gray-900'>
                        {ejercicio.duracion_minutos
                          ? `${ejercicio.duracion_minutos} minutos`
                          : 'No especificada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Material y Descripción */}
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    🎾 Material y Descripción
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Descripción:
                      </span>
                      <p className='text-gray-900'>
                        {ejercicio.description || 'Sin descripción'}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-500'>
                        Material necesario:
                      </span>
                      <p className='text-gray-900'>
                        {ejercicio.material_necesario || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {ejercicio.observaciones && (
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    📝 Observaciones
                  </h3>
                  <p className='text-gray-700 whitespace-pre-wrap'>
                    {ejercicio.observaciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab Instrucciones */}
          {activeTab === 'instrucciones' && (
            <div className='space-y-6'>
              <div className='bg-gray-50 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  📋 Instrucciones Paso a Paso
                </h3>
                <div className='prose max-w-none'>
                  <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                    {ejercicio.instrucciones ||
                      'No hay instrucciones detalladas disponibles.'}
                  </p>
                </div>
              </div>

              {ejercicio.variaciones && (
                <div className='bg-gray-50 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    🔄 Variaciones
                  </h3>
                  <div className='prose max-w-none'>
                    <p className='text-gray-700 whitespace-pre-wrap leading-relaxed'>
                      {ejercicio.variaciones}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Clases */}
          {activeTab === 'clases' && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  📅 Clases que usan este ejercicio
                </h3>
                <span className='text-sm text-gray-500'>
                  {clasesAsignadas.length} clase
                  {clasesAsignadas.length !== 1 ? 's' : ''}
                </span>
              </div>

              {clasesAsignadas.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-4xl mb-4'>📅</div>
                  <p className='text-gray-500'>
                    Este ejercicio no está asignado a ninguna clase
                  </p>
                </div>
              ) : (
                <div className='grid gap-4'>
                  {clasesAsignadas.map(item => (
                    <div key={item.id} className='bg-gray-50 rounded-lg p-4'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <h4 className='font-semibold text-gray-900'>
                            {item.clases.nombre}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {item.clases.nivel_clase} • {item.clases.tipo_clase}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {item.clases.dia_semana} • {item.clases.hora_inicio}{' '}
                            - {item.clases.hora_fin}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.clases.tipo_clase === 'particular'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.clases.tipo_clase === 'particular'
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
        </div>
      </div>
    </div>
  );
}
