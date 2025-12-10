import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '@shared';
import {
  SeguimientoHeader,
  SeguimientoTabs,
  useSeguimientoData,
  useSeguimientoStats,
  SeguimientoStatsCards,
  SeguimientoHistorial,
  SeguimientoClasesList,
  SeguimientoAsistenciasTable,
} from '@features/seguimiento';

export default function SeguimientoAlumno() {
  const { id } = useParams();
  const {
    alumno,
    seguimientos: seguimientosHook,
    clases: clasesHook,
    asistencias: asistenciasHook,
    loading,
  } = useSeguimientoData(id);
  const [seguimientos, setSeguimientos] = useState([]);
  const [clases, setClases] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [activeTab, setActiveTab] = useState('seguimiento');
  const [showForm, setShowForm] = useState(false);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Progreso',
    observaciones: '',
    nivel_actual: '',
    objetivos: '',
    recomendaciones: '',
  });

  // Sincronizar datos del hook con el estado local
  useEffect(() => {
    setSeguimientos(seguimientosHook || []);
    setClases(clasesHook || []);
    setAsistencias(asistenciasHook || []);
  }, [seguimientosHook, clasesHook, asistenciasHook]);

  const handleCrearSeguimiento = async e => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('seguimiento_alumnos').insert([
        {
          ...nuevoSeguimiento,
          alumno_id: id,
        },
      ]);

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
        recomendaciones: '',
      });

      alert('Seguimiento creado correctamente');
    } catch (error) {
      console.error('Error creando seguimiento:', error);
      alert('Error al crear el seguimiento');
    }
  };

  const stats = useSeguimientoStats(asistencias, seguimientos);

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando datos del alumno...' />;
  }

  if (!alumno) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>❌</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          Alumno no encontrado
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
          El alumno que buscas no existe o ha sido eliminado
        </p>
        <Link to='/alumnos' className='btn-primary px-6 py-3'>
          Volver a Alumnos
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <SeguimientoHeader alumno={alumno} />

      {/* Estadísticas */}
      <SeguimientoStatsCards stats={stats} seguimientosLength={seguimientos.length} />

      <SeguimientoTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clasesCount={clases.length}
        asistenciasCount={asistencias.length}
      />

      <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
        <div className='p-6'>
          {/* Tab Seguimiento */}
          {activeTab === 'seguimiento' && (
            <SeguimientoHistorial
              seguimientos={seguimientos}
              onCrear={() => setShowForm(true)}
            />
          )}

          {/* Tab Clases */}
          {activeTab === 'clases' && (
            <SeguimientoClasesList clases={clases} />
          )}

          {/* Tab Asistencias */}
          {activeTab === 'asistencias' && (
            <SeguimientoAsistenciasTable asistencias={asistencias} />
          )}
        </div>
      </div>

      {/* Modal Nuevo Seguimiento */}
      {showForm && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  📝 Nuevo Seguimiento
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className='text-gray-400 hover:text-gray-600 text-2xl'
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCrearSeguimiento} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Fecha
                    </label>
                    <input
                      type='date'
                      name='fecha'
                      value={nuevoSeguimiento.fecha}
                      onChange={e =>
                        setNuevoSeguimiento({
                          ...nuevoSeguimiento,
                          fecha: e.target.value,
                        })
                      }
                      required
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Tipo
                    </label>
                    <select
                      name='tipo'
                      value={nuevoSeguimiento.tipo}
                      onChange={e =>
                        setNuevoSeguimiento({
                          ...nuevoSeguimiento,
                          tipo: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='Progreso'>Progreso</option>
                      <option value='Incidencia'>Incidencia</option>
                      <option value='Evaluación'>Evaluación</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Nivel Actual
                  </label>
                  <input
                    type='text'
                    name='nivel_actual'
                    value={nuevoSeguimiento.nivel_actual}
                    onChange={e =>
                      setNuevoSeguimiento({
                        ...nuevoSeguimiento,
                        nivel_actual: e.target.value,
                      })
                    }
                    placeholder='Ej: Principiante, Intermedio, Avanzado...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Observaciones
                  </label>
                  <textarea
                    name='observaciones'
                    value={nuevoSeguimiento.observaciones}
                    onChange={e =>
                      setNuevoSeguimiento({
                        ...nuevoSeguimiento,
                        observaciones: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder='Describe el progreso, comportamiento, técnica...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Objetivos
                  </label>
                  <textarea
                    name='objetivos'
                    value={nuevoSeguimiento.objetivos}
                    onChange={e =>
                      setNuevoSeguimiento({
                        ...nuevoSeguimiento,
                        objetivos: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder='Objetivos a trabajar con el alumno...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Recomendaciones
                  </label>
                  <textarea
                    name='recomendaciones'
                    value={nuevoSeguimiento.recomendaciones}
                    onChange={e =>
                      setNuevoSeguimiento({
                        ...nuevoSeguimiento,
                        recomendaciones: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder='Recomendaciones para el alumno...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                <div className='flex justify-end space-x-4 pt-4'>
                  <button
                    type='button'
                    onClick={() => setShowForm(false)}
                    className='btn-secondary px-6 py-2'
                  >
                    Cancelar
                  </button>
                  <button type='submit' className='btn-primary px-6 py-2'>
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
