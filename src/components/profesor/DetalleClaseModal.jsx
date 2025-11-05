import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DetalleClaseModal({ evento, onClose }) {
  const [loading, setLoading] = useState(true);
  const [clase, setClase] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [tematica, setTematica] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);

  useEffect(() => {
    if (evento?.resource?.clase_id) {
      cargarDetalleClase();
    }
  }, [evento]);

  const cargarDetalleClase = async () => {
    try {
      setLoading(true);
      const claseId = evento.resource.clase_id;

      // Cargar información de la clase
      const { data: claseData, error: claseError } = await supabase
        .from('clases')
        .select('*')
        .eq('id', claseId)
        .single();

      if (claseError) throw claseError;
      setClase(claseData);

      // Cargar alumnos asignados a esta clase
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('alumnos_clases')
        .select(
          `
          alumnos (id, nombre, email, telefono, nivel)
        `
        )
        .eq('clase_id', claseId);

      if (alumnosError) throw alumnosError;
      setAlumnos(
        (alumnosData || []).map(ac => ac.alumnos).filter(Boolean)
      );

      // Cargar temática asignada para esta clase y fecha
      const fechaEvento = evento.start.toISOString().split('T')[0];
      const { data: tematicaData, error: tematicaError } = await supabase
        .from('tematicas_clase')
        .select('*')
        .eq('clase_id', claseId)
        .lte('fecha_asignacion', fechaEvento)
        .order('fecha_asignacion', { ascending: false })
        .limit(1);

      if (tematicaError) {
        console.error('Error cargando temática:', tematicaError);
      } else if (tematicaData && tematicaData.length > 0) {
        setTematica(tematicaData[0]);

        // Cargar ejercicios de esta temática
        const { data: ejerciciosData, error: ejerciciosError } = await supabase
          .from('clases_ejercicios')
          .select(
            `
            *,
            ejercicios (id, nombre, categoria, dificultad, duracion_minutos, description)
          `
          )
          .eq('clase_id', claseId)
          .eq('tematica', tematicaData[0].tematica);

        if (ejerciciosError) {
          console.error('Error cargando ejercicios:', ejerciciosError);
        } else {
          setEjercicios(ejerciciosData || []);
        }
      }
    } catch (error) {
      console.error('Error cargando detalle de clase:', error);
      alert('❌ Error al cargar el detalle de la clase');
    } finally {
      setLoading(false);
    }
  };

  if (!evento) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl'>
                <svg
                  className='w-6 h-6 text-purple-600 dark:text-purple-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                  Detalle de Clase
                </h2>
                <p className='text-gray-600 dark:text-dark-text2'>
                  {evento.title || 'Clase'} —{' '}
                  {new Date(evento.start).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600'></div>
            </div>
          ) : (
            <>
              {/* Información de la clase */}
              {clase && (
                <div className='bg-gray-50 dark:bg-dark-surface2 rounded-xl p-4'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text mb-3'>
                    📚 Información de la Clase
                  </h3>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-600 dark:text-dark-text2'>
                        Nombre:
                      </span>
                      <span className='ml-2 font-medium text-gray-900 dark:text-dark-text'>
                        {clase.nombre}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600 dark:text-dark-text2'>
                        Nivel:
                      </span>
                      <span className='ml-2 font-medium text-gray-900 dark:text-dark-text'>
                        {clase.nivel_clase}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600 dark:text-dark-text2'>
                        Tipo:
                      </span>
                      <span className='ml-2 font-medium text-gray-900 dark:text-dark-text'>
                        {clase.tipo_clase}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600 dark:text-dark-text2'>
                        Profesor:
                      </span>
                      <span className='ml-2 font-medium text-gray-900 dark:text-dark-text'>
                        {clase.profesor || 'Sin asignar'}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600 dark:text-dark-text2'>
                        Día:
                      </span>
                      <span className='ml-2 font-medium text-gray-900 dark:text-dark-text'>
                        {clase.dia_semana}
                      </span>
                    </div>
                    <div>
                      <span className='text-gray-600 dark:text-dark-text2'>
                        Horario:
                      </span>
                      <span className='ml-2 font-medium text-gray-900 dark:text-dark-text'>
                        {clase.hora_inicio} - {clase.hora_fin}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Alumnos */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text mb-3'>
                  👥 Alumnos Asignados ({alumnos.length})
                </h3>
                {alumnos.length === 0 ? (
                  <p className='text-gray-500 dark:text-dark-text2 text-sm'>
                    No hay alumnos asignados a esta clase.
                  </p>
                ) : (
                  <div className='space-y-2'>
                    {alumnos.map(alumno => (
                      <div
                        key={alumno.id}
                        className='bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border p-3'
                      >
                        <div className='font-medium text-gray-900 dark:text-dark-text'>
                          {alumno.nombre}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-dark-text2'>
                          {alumno.email} • {alumno.telefono} • Nivel: {alumno.nivel}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Temática */}
              {tematica && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text mb-3'>
                    🎯 Temática
                  </h3>
                  <div className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30'>
                    <div className='font-medium text-gray-900 dark:text-dark-text mb-2'>
                      {tematica.tematica}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-dark-text2'>
                      Asignada el:{' '}
                      {new Date(tematica.fecha_asignacion).toLocaleDateString(
                        'es-ES'
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Ejercicios */}
              {ejercicios.length > 0 && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text mb-3'>
                    💪 Ejercicios ({ejercicios.length})
                  </h3>
                  <div className='space-y-3'>
                    {ejercicios.map(ej => (
                      <div
                        key={ej.id}
                        className='bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border p-4'
                      >
                        <div className='font-medium text-gray-900 dark:text-dark-text mb-2'>
                          {ej.ejercicios?.nombre || 'Ejercicio'}
                        </div>
                        <div className='flex gap-2 flex-wrap text-sm'>
                          <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300'>
                            {ej.ejercicios?.categoria || 'Sin categoría'}
                          </span>
                          <span className='px-2 py-1 bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-300'>
                            {ej.ejercicios?.dificultad || 'Sin dificultad'}
                          </span>
                          {ej.ejercicios?.duracion_minutos && (
                            <span className='px-2 py-1 bg-purple-100 text-purple-800 rounded-full dark:bg-purple-900/30 dark:text-purple-300'>
                              {ej.ejercicios.duracion_minutos} min
                            </span>
                          )}
                        </div>
                        {ej.ejercicios?.description && (
                          <p className='text-sm text-gray-600 dark:text-dark-text2 mt-2'>
                            {ej.ejercicios.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 dark:border-dark-border p-4 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

