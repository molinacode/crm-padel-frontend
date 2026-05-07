import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import LoadingSpinner from './LoadingSpinner';

interface AlumnoEvento {
  id: string;
  nombre: string;
  _origen?: string;
}

interface EventoDesasignacion {
  clase_id: string;
  nombre: string;
  alumnosPresentes: number;
  maxAlumnos: number;
  fecha?: string | null;
  alumnosAsignados?: AlumnoEvento[];
}

interface DesasignarAlumnosProps {
  onClose: () => void;
  onSuccess: () => void;
  evento: EventoDesasignacion;
}

export default function DesasignarAlumnos({
  onClose,
  onSuccess,
  evento,
}: DesasignarAlumnosProps) {
  const [alumnosAsignados, setAlumnosAsignados] = useState<AlumnoEvento[]>([]);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargarAlumnosAsignados = async () => {
    try {
      setLoading(true);
      const { error: claseError } = await supabase
        .from('clases')
        .select('tipo_clase, nombre')
        .eq('id', evento.clase_id)
        .single();

      if (claseError) throw claseError;
      setAlumnosAsignados(evento.alumnosAsignados || []);
    } catch (error) {
      console.error('Error cargando alumnos asignados:', error);
      alert('Error al cargar alumnos asignados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargarAlumnosAsignados();
    });
  }, [evento]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAlumno = (alumnoId: string) => {
    const nuevoSeleccionados = new Set(alumnosSeleccionados);
    if (nuevoSeleccionados.has(alumnoId)) {
      nuevoSeleccionados.delete(alumnoId);
    } else {
      const alumnosAExceso = Math.max(0, evento.alumnosPresentes - evento.maxAlumnos);
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

    const alumnosAExceso = Math.max(0, evento.alumnosPresentes - evento.maxAlumnos);
    if (alumnosAExceso > 0 && alumnosSeleccionados.size > alumnosAExceso) {
      alert(
        `❌ No puedes desasignar más de ${alumnosAExceso} alumno${alumnosAExceso !== 1 ? 's' : ''} (exceso).`
      );
      return;
    }

    try {
      setProcesando(true);
      const { error: desasignacionError } = await supabase
        .from('alumnos_clases')
        .delete()
        .eq('clase_id', evento.clase_id)
        .in('alumno_id', Array.from(alumnosSeleccionados));

      if (desasignacionError) throw desasignacionError;

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

  const alumnosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return alumnosAsignados;
    return alumnosAsignados.filter(alumno =>
      alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [alumnosAsignados, busqueda]);

  if (loading) return <LoadingSpinner size='medium' text='Cargando alumnos asignados...' />;

  const alumnosAExceso = evento.alumnosPresentes - evento.maxAlumnos;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        <div className='p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex justify-end gap-3'>
            <button type='button' onClick={onClose} className='px-4 py-2 text-gray-600'>
              Cancelar
            </button>
            <button
              type='button'
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

        <div className='p-6 overflow-y-auto max-h-[calc(90vh-300px)]'>
          <div className='mb-6'>
            <input
              type='text'
              placeholder='Buscar alumnos...'
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg'
            />
          </div>

          {alumnosFiltrados.length === 0 ? (
            <div className='text-center py-12'>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-dark-text mb-2'>
                No hay alumnos asignados
              </h3>
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
                  className={`p-4 rounded-xl border-2 cursor-pointer ${
                    alumnosSeleccionados.has(alumno.id)
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-dark-border'
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
                        <div className='text-sm text-gray-600 dark:text-dark-text2'>
                          🎯 {alumno._origen || 'Sin origen'}
                        </div>
                      </div>
                    </div>
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
