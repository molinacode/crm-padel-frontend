import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function GestionTematicasEjercicios({ claseId, profesor, onClose }) {
  const [tematica, setTematica] = useState('');
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEjercicios, setLoadingEjercicios] = useState(true);
  const [tematicasExistentes, setTematicasExistentes] = useState([]);

  // Cargar ejercicios disponibles
  useEffect(() => {
    cargarEjercicios();
    cargarTematicasExistentes();
  }, []);

  const cargarEjercicios = async () => {
    try {
      setLoadingEjercicios(true);
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEjerciciosDisponibles(data || []);
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
      
      const tematicasUnicas = [...new Set(data?.map(t => t.tematica) || [])];
      setTematicasExistentes(tematicasUnicas);
    } catch (error) {
      console.error('Error cargando temáticas:', error);
    }
  };

  const toggleEjercicio = (ejercicioId) => {
    setEjerciciosSeleccionados(prev => 
      prev.includes(ejercicioId)
        ? prev.filter(id => id !== ejercicioId)
        : [...prev, ejercicioId]
    );
  };

  const asignarTematicaYEjercicios = async () => {
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

      // Crear registro de temática para esta clase
      const { error: tematicaError } = await supabase
        .from('tematicas_clase')
        .insert([{
          clase_id: claseId,
          tematica: tematica.trim(),
          profesor: profesor,
          fecha_asignacion: new Date().toISOString().split('T')[0],
          ejercicios_asignados: ejerciciosSeleccionados.length
        }]);

      if (tematicaError) throw tematicaError;

      // Asignar ejercicios a la clase
      const ejerciciosParaInsertar = ejerciciosSeleccionados.map(ejercicioId => ({
        clase_id: claseId,
        ejercicio_id: ejercicioId,
        tematica: tematica.trim(),
        profesor: profesor,
        fecha_asignacion: new Date().toISOString().split('T')[0]
      }));

      const { error: ejerciciosError } = await supabase
        .from('clases_ejercicios')
        .insert(ejerciciosParaInsertar);

      if (ejerciciosError) throw ejerciciosError;

      alert(`✅ Temática "${tematica}" y ${ejerciciosSeleccionados.length} ejercicios asignados correctamente`);
      onClose();
    } catch (error) {
      console.error('Error asignando temática y ejercicios:', error);
      alert('Error al asignar la temática y ejercicios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const asignarAMultiplesClases = async () => {
    if (!tematica.trim()) {
      alert('Por favor, ingresa una temática');
      return;
    }

    if (ejerciciosSeleccionados.length === 0) {
      alert('Por favor, selecciona al menos un ejercicio');
      return;
    }

    // Aquí podrías abrir un modal para seleccionar múltiples clases
    // Por ahora, solo asignamos a la clase actual
    asignarTematicaYEjercicios();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                📚 Asignar Temática y Ejercicios
              </h2>
              <p className="text-gray-600 dark:text-dark-text2 mt-1">
                Define la temática de la clase y selecciona los ejercicios correspondientes
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Temática */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
              🎯 Temática de la Clase *
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={tematica}
                onChange={(e) => setTematica(e.target.value)}
                placeholder="Ej: Trabajo de derecha, Saque, Volea, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              />
              
              {/* Temáticas existentes */}
              {tematicasExistentes.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text2 mb-2">
                    Temáticas usadas anteriormente:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tematicasExistentes.slice(0, 10).map((tematicaExistente, index) => (
                      <button
                        key={index}
                        onClick={() => setTematica(tematicaExistente)}
                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {tematicaExistente}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ejercicios */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-3">
              💪 Ejercicios Seleccionados ({ejerciciosSeleccionados.length})
            </label>
            
            {loadingEjercicios ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-dark-text2">Cargando ejercicios...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-dark-border rounded-lg p-3">
                {ejerciciosDisponibles.map((ejercicio) => (
                  <div
                    key={ejercicio.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      ejerciciosSeleccionados.includes(ejercicio.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => toggleEjercicio(ejercicio.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-dark-text text-sm">
                          {ejercicio.nombre}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-dark-text2 mt-1">
                          {ejercicio.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ejercicio.categoria === 'Técnica' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            ejercicio.categoria === 'Físico' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            ejercicio.categoria === 'Táctico' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {ejercicio.categoria}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ejercicio.dificultad === 'Fácil' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            ejercicio.dificultad === 'Intermedio' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {ejercicio.dificultad}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        ejerciciosSeleccionados.includes(ejercicio.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {ejerciciosSeleccionados.includes(ejercicio.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={asignarTematicaYEjercicios}
              disabled={loading || !tematica.trim() || ejerciciosSeleccionados.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Asignar a esta clase
                </>
              )}
            </button>
            <button
              onClick={asignarAMultiplesClases}
              disabled={loading || !tematica.trim() || ejerciciosSeleccionados.length === 0}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Asignar a múltiples clases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
