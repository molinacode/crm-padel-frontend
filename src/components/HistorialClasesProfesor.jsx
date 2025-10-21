import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function HistorialClasesProfesor({ profesor }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTematica, setFiltroTematica] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, [profesor]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      
      // Cargar temáticas de clases del profesor
      const { data: tematicasData, error: tematicasError } = await supabase
        .from('tematicas_clase')
        .select(`
          *,
          clases (
            id,
            nombre,
            nivel_clase,
            tipo_clase,
            dia_semana,
            hora_inicio,
            hora_fin
          )
        `)
        .eq('profesor', profesor)
        .order('fecha_asignacion', { ascending: false });

      if (tematicasError) throw tematicasError;

      // Cargar ejercicios asignados para cada temática
      const historialConEjercicios = await Promise.all(
        (tematicasData || []).map(async (tematica) => {
          const { data: ejerciciosData, error: ejerciciosError } = await supabase
            .from('clases_ejercicios')
            .select(`
              *,
              ejercicios (
                id,
                nombre,
                categoria,
                dificultad,
                duracion_minutos,
                description
              )
            `)
            .eq('clase_id', tematica.clase_id)
            .eq('tematica', tematica.tematica)
            .eq('profesor', profesor);

          if (ejerciciosError) {
            console.error('Error cargando ejercicios:', ejerciciosError);
            return { ...tematica, ejercicios: [] };
          }

          return {
            ...tematica,
            ejercicios: ejerciciosData || []
          };
        })
      );

      setHistorial(historialConEjercicios);
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar el historial de clases');
    } finally {
      setLoading(false);
    }
  };

  const historialFiltrado = historial.filter(item => {
    const matchesTematica = !filtroTematica || 
      item.tematica.toLowerCase().includes(filtroTematica.toLowerCase());
    const matchesFecha = !filtroFecha || 
      item.fecha_asignacion.includes(filtroFecha);
    return matchesTematica && matchesFecha;
  });

  const tematicasUnicas = [...new Set(historial.map(h => h.tematica))];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-dark-text2">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-4 sm:p-6 border border-green-200 dark:border-green-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">📚</div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Historial de Clases - {profesor}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Temáticas y ejercicios impartidos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
              🔍 Filtrar por temática
            </label>
            <select
              value={filtroTematica}
              onChange={(e) => setFiltroTematica(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
            >
              <option value="">Todas las temáticas</option>
              {tematicasUnicas.map(tematica => (
                <option key={tematica} value={tematica}>
                  {tematica}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
              📅 Filtrar por fecha
            </label>
            <input
              type="month"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📚</span>
            <span className="font-medium text-gray-700 dark:text-dark-text2">
              Total de temáticas:
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tematicasUnicas.length}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💪</span>
            <span className="font-medium text-gray-700 dark:text-dark-text2">
              Total de ejercicios:
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {historial.reduce((total, item) => total + item.ejercicios.length, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-dark-surface rounded-lg p-4 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📅</span>
            <span className="font-medium text-gray-700 dark:text-dark-text2">
              Clases con temática:
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {historial.length}
          </p>
        </div>
      </div>

      {/* Lista de historial */}
      {historialFiltrado.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
            No hay historial disponible
          </h3>
          <p className="text-gray-500 dark:text-dark-text2">
            {filtroTematica || filtroFecha 
              ? 'No se encontraron clases con los filtros aplicados'
              : 'Aún no se han asignado temáticas a las clases'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historialFiltrado.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden"
            >
              {/* Header de la temática */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
                      🎯 {item.tematica}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2">
                      <span>📅 {new Date(item.fecha_asignacion).toLocaleDateString('es-ES')}</span>
                      <span>👨‍🏫 {item.profesor}</span>
                      <span>💪 {item.ejercicios.length} ejercicios</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-dark-text2 mb-1">
                      Clase:
                    </div>
                    <div className="font-medium text-gray-900 dark:text-dark-text">
                      {item.clases?.nombre || 'Clase no encontrada'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-dark-text2">
                      {item.clases?.nivel_clase} • {item.clases?.tipo_clase}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ejercicios */}
              <div className="p-4 sm:p-6">
                {item.ejercicios.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-dark-text2">
                    <div className="text-4xl mb-2">💪</div>
                    <p>No hay ejercicios asignados para esta temática</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {item.ejercicios.map((ejercicioItem) => {
                      const ejercicio = ejercicioItem.ejercicios;
                      if (!ejercicio) return null;
                      
                      return (
                        <div
                          key={ejercicioItem.id}
                          className="p-4 border border-gray-200 dark:border-dark-border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="font-medium text-gray-900 dark:text-dark-text text-sm">
                              {ejercicio.nombre}
                            </h5>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              ejercicio.categoria === 'Técnica' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              ejercicio.categoria === 'Físico' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              ejercicio.categoria === 'Táctico' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {ejercicio.categoria}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-dark-text2 mb-3 line-clamp-2">
                            {ejercicio.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-text2">
                            <span className={`px-2 py-1 rounded-full ${
                              ejercicio.dificultad === 'Fácil' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              ejercicio.dificultad === 'Intermedio' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {ejercicio.dificultad}
                            </span>
                            {ejercicio.duracion_minutos && (
                              <span>⏱️ {ejercicio.duracion_minutos} min</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
