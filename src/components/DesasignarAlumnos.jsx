import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

export default function DesasignarAlumnos({ onClose, onSuccess, evento }) {
  const [alumnosAsignados, setAlumnosAsignados] = useState([]);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarAlumnosAsignados();
  }, [evento]);

  const cargarAlumnosAsignados = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando alumnos asignados para desasignar...');

      // Obtener información de la clase
      const { data: claseData, error: claseError } = await supabase
        .from('clases')
        .select('tipo_clase, nombre')
        .eq('id', evento.clase_id)
        .single();

      if (claseError) throw claseError;

      // Los alumnos ya vienen en el evento
      setAlumnosAsignados(evento.alumnosAsignados || []);
      console.log(
        '👥 Alumnos asignados encontrados:',
        evento.alumnosAsignados?.length || 0
      );
    } catch (error) {
      console.error('Error cargando alumnos asignados:', error);
      alert('Error al cargar alumnos asignados');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlumno = alumnoId => {
    const nuevoSeleccionados = new Set(alumnosSeleccionados);
    if (nuevoSeleccionados.has(alumnoId)) {
      nuevoSeleccionados.delete(alumnoId);
    } else {
      // Permitir seleccionar siempre al menos 1 alumno.
      // Si está sobresaturada, limitar a los de exceso; si no, permitir libremente.
      const alumnosAExceso = Math.max(
        0,
        evento.alumnosPresentes - evento.maxAlumnos
      );
      if (alumnosAExceso > 0 && nuevoSeleccionados.size >= alumnosAExceso) {
        alert(
          `❌ Solo puedes seleccionar hasta ${alumnosAExceso} alumno${alumnosAExceso !== 1 ? 's' : ''} para desasignar (exceso).`
        );
        return;
      }
      nuevoSeleccionados.add(alumnoId);
    }
    setAlumnosSeleccionados(nuevoSeleccionados);
  };

  const desasignarAlumnos = async () => {
    if (alumnosSeleccionados.size === 0) {
      alert('❌ Por favor selecciona al menos un alumno para desasignar.');
      return;
    }

    const alumnosAExceso = Math.max(
      0,
      evento.alumnosPresentes - evento.maxAlumnos
    );
    if (alumnosAExceso > 0 && alumnosSeleccionados.size > alumnosAExceso) {
      alert(
        `❌ No puedes desasignar más de ${alumnosAExceso} alumno${alumnosAExceso !== 1 ? 's' : ''} (exceso).`
      );
      return;
    }

    try {
      setProcesando(true);
      console.log('🔄 Desasignando alumnos seleccionados...');

      // Desasignar alumnos seleccionados
      const { error: desasignacionError } = await supabase
        .from('alumnos_clases')
        .delete()
        .eq('clase_id', evento.clase_id)
        .in('alumno_id', Array.from(alumnosSeleccionados));

      if (desasignacionError) throw desasignacionError;

      console.log('✅ Alumnos desasignados correctamente');
      alert(
        `✅ Se han desasignado ${alumnosSeleccionados.size} alumno${alumnosSeleccionados.size !== 1 ? 's' : ''} correctamente.`
      );

      onSuccess();
    } catch (error) {
      console.error('Error desasignando alumnos:', error);
      alert('Error al desasignar los alumnos');
    } finally {
      setProcesando(false);
    }
  };

  // Filtrar alumnos por búsqueda
  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) {
      return alumnosAsignados;
    }
    return alumnosAsignados.filter(alumno =>
      alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [alumnosAsignados, busqueda]);

  if (loading)
    return (
      <LoadingSpinner size='medium' text='Cargando alumnos asignados...' />
    );

  const alumnosAExceso = evento.alumnosPresentes - evento.maxAlumnos;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='bg-red-100 dark:bg-red-900/30 p-3 rounded-xl'>
                <svg
                  className='w-6 h-6 text-red-600 dark:text-red-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                  Desasignar Alumnos
                </h2>
                <p className='text-gray-600 dark:text-dark-text2'>
                  {evento.nombre} -{' '}
                  {evento.alumnosPresentes > evento.maxAlumnos
                    ? 'Clase sobresaturada'
                    : 'Clase'}{' '}
                  ({evento.alumnosPresentes}/{evento.maxAlumnos})
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

        {/* Información del evento */}
        <div className='p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800/30'>
            <div className='grid grid-cols-2 gap-4 text-sm mb-4'>
              <div>
                <p className='font-medium text-red-800 dark:text-red-200'>
                  Clase:
                </p>
                <p className='text-red-900 dark:text-red-100'>
                  {evento.nombre}
                </p>
              </div>
              <div>
                <p className='font-medium text-red-800 dark:text-red-200'>
                  Fecha:
                </p>
                <p className='text-red-900 dark:text-red-100'>
                  {evento.fecha
                    ? new Date(evento.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                      })
                    : 'Sin fecha'}
                </p>
              </div>
              <div>
                <p className='font-medium text-red-800 dark:text-red-200'>
                  Estado actual:
                </p>
                <p className='text-red-900 dark:text-red-100'>
                  {evento.alumnosPresentes}/{evento.maxAlumnos} alumnos
                  {evento.alumnosPresentes > evento.maxAlumnos
                    ? ' (Sobresaturada)'
                    : ''}
                </p>
              </div>
              <div>
                <p className='font-medium text-red-800 dark:text-red-200'>
                  Alumnos a desasignar:
                </p>
                <p className='text-red-900 dark:text-red-100'>
                  {alumnosAExceso} alumno{alumnosAExceso !== 1 ? 's' : ''}{' '}
                  (mínimo)
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className='flex justify-end gap-3 pt-3 border-t border-red-200 dark:border-red-800/30'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={desasignarAlumnos}
                disabled={procesando || alumnosSeleccionados.size === 0}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {procesando
                  ? 'Procesando...'
                  : `Desasignar ${alumnosSeleccionados.size} alumno${alumnosSeleccionados.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-300px)]'>
          {/* Búsqueda */}
          <div className='mb-6'>
            <input
              type='text'
              placeholder='Buscar alumnos...'
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-dark-text'
            />
          </div>

          {/* Lista de alumnos asignados */}
          {alumnosFiltrados.length === 0 ? (
            <div className='text-center py-12'>
              <div className='bg-gray-100 dark:bg-gray-800/30 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center'>
                <svg
                  className='w-12 h-12 text-gray-400 dark:text-gray-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-dark-text mb-2'>
                No hay alumnos asignados
              </h3>
              <p className='text-gray-500 dark:text-dark-text2'>
                {busqueda
                  ? 'No se encontraron alumnos que coincidan con la búsqueda'
                  : 'No hay alumnos asignados a esta clase'}
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-semibold text-gray-900 dark:text-dark-text'>
                  Alumnos asignados ({alumnosFiltrados.length})
                </h3>
                <span className='text-sm text-gray-500 dark:text-dark-text2'>
                  Seleccionados: {alumnosSeleccionados.size}/{alumnosAExceso}
                </span>
              </div>

              {alumnosFiltrados.map(alumno => (
                <div
                  key={alumno.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    alumnosSeleccionados.has(alumno.id)
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                      : 'border-gray-200 dark:border-dark-border hover:border-red-300 dark:hover:border-red-600 hover:shadow-sm'
                  }`}
                  onClick={() => toggleAlumno(alumno.id)}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <input
                        type='checkbox'
                        checked={alumnosSeleccionados.has(alumno.id)}
                        onChange={() => toggleAlumno(alumno.id)}
                        onClick={e => e.stopPropagation()}
                        className='w-4 h-4 text-red-600'
                      />
                      <div>
                        <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                          {alumno.nombre}
                        </h4>
                        <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2'>
                          <span>🎯 {alumno._origen || 'Sin origen'}</span>
                        </div>
                      </div>
                    </div>
                    {alumnosSeleccionados.has(alumno.id) && (
                      <div className='bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded-full text-xs font-medium'>
                        Para desasignar
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
