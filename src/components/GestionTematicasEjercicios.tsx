import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

interface EventoVistaProfesor {
  resource?: {
    clase_id?: string | null;
    clases?: { profesor?: string | null } | null;
  } | null;
  subtitle?: string | null;
}

interface GestionTematicasEjerciciosProps {
  claseId?: string | null;
  profesor?: string | null;
  evento?: EventoVistaProfesor | null;
  onClose: () => void;
}

interface EjercicioDisponible {
  id: string;
  nombre: string;
  description?: string | null;
  categoria?: string | null;
  dificultad?: string | null;
}

export default function GestionTematicasEjercicios({
  claseId,
  profesor,
  evento,
  onClose,
}: GestionTematicasEjerciciosProps) {
  const claseIdEfectivo = claseId ?? evento?.resource?.clase_id ?? null;
  const profesorEfectivo = profesor ?? evento?.resource?.clases?.profesor ?? evento?.subtitle ?? '';

  const [tematica, setTematica] = useState('');
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState<string[]>([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState<EjercicioDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEjercicios, setLoadingEjercicios] = useState(true);
  const [tematicasExistentes, setTematicasExistentes] = useState<string[]>([]);

  const cargarEjercicios = async () => {
    try {
      setLoadingEjercicios(true);
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEjerciciosDisponibles((data || []) as EjercicioDisponible[]);
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      alert('Error al cargar los ejercicios');
    } finally {
      setLoadingEjercicios(false);
    }
  };

  const cargarTematicasExistentes = async () => {
    try {
      const { data, error } = await supabase
        .from('tematicas_clase')
        .select('tematica')
        .order('tematica', { ascending: true });

      if (error) throw error;

      const tematicasUnicas = [...new Set((data || []).map(t => t.tematica).filter(Boolean))];
      setTematicasExistentes(tematicasUnicas as string[]);
    } catch (error) {
      console.error('Error cargando temáticas:', error);
    }
  };

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargarEjercicios();
      void cargarTematicasExistentes();
    });
  }, []);

  const toggleEjercicio = (ejercicioId: string) => {
    setEjerciciosSeleccionados(prev =>
      prev.includes(ejercicioId) ? prev.filter(id => id !== ejercicioId) : [...prev, ejercicioId]
    );
  };

  const asignarTematicaYEjercicios = async () => {
    if (!claseIdEfectivo) {
      alert('No se identificó la clase.');
      return;
    }
    if (!profesorEfectivo.trim()) {
      alert('No se identificó el profesor de la clase.');
      return;
    }
    if (!tematica.trim()) {
      alert('Por favor, ingresa una temática');
      return;
    }
    if (ejerciciosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un ejercicio');
      return;
    }

    try {
      setLoading(true);

      const fechaAsignacion = new Date().toISOString().split('T')[0];
      const { error: tematicaError } = await supabase.from('tematicas_clase').insert([
        {
          clase_id: claseIdEfectivo,
          tematica: tematica.trim(),
          profesor: profesorEfectivo,
          fecha_asignacion: fechaAsignacion,
          ejercicios_asignados: ejerciciosSeleccionados.length,
        },
      ]);

      if (tematicaError) throw tematicaError;

      const ejerciciosParaInsertar = ejerciciosSeleccionados.map(ejercicioId => ({
        clase_id: claseIdEfectivo,
        ejercicio_id: ejercicioId,
        tematica: tematica.trim(),
        profesor: profesorEfectivo,
        fecha_asignacion: fechaAsignacion,
      }));

      const { error: ejerciciosError } = await supabase
        .from('clases_ejercicios')
        .insert(ejerciciosParaInsertar);

      if (ejerciciosError) throw ejerciciosError;

      alert(`✅ Temática "${tematica}" y ${ejerciciosSeleccionados.length} ejercicios asignados correctamente`);
      onClose();
    } catch (error: unknown) {
      console.error('Error asignando temática y ejercicios:', error);
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al asignar la temática y ejercicios: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                📚 Asignar Temática y Ejercicios
              </h2>
            </div>
            <button type='button' onClick={onClose} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
              🎯 Temática de la Clase *
            </label>
            <input
              type='text'
              value={tematica}
              onChange={e => setTematica(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg'
            />
            {tematicasExistentes.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {tematicasExistentes.slice(0, 10).map((tematicaExistente, index) => (
                  <button
                    type='button'
                    key={index}
                    onClick={() => setTematica(tematicaExistente)}
                    className='px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 rounded-full'
                  >
                    {tematicaExistente}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-3'>
              💪 Ejercicios Seleccionados ({ejerciciosSeleccionados.length})
            </label>
            {loadingEjercicios ? (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-lg p-3'>
                {ejerciciosDisponibles.map(ejercicio => (
                  <div
                    key={ejercicio.id}
                    className='p-3 rounded-lg border cursor-pointer'
                    onClick={() => toggleEjercicio(ejercicio.id)}
                  >
                    <h4 className='font-medium text-sm'>{ejercicio.nombre}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-dark-border'>
            <button type='button' onClick={onClose} className='px-6 py-2 text-gray-600 dark:text-gray-400'>
              Cancelar
            </button>
            <button
              type='button'
              onClick={asignarTematicaYEjercicios}
              disabled={loading || !tematica.trim() || ejerciciosSeleccionados.length === 0}
              className='px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors'
            >
              {loading ? 'Asignando...' : 'Asignar a esta clase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
