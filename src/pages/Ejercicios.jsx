import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  useEffect(() => {
    cargarEjercicios();
  }, []);

  const cargarEjercicios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEjercicios(data || []);
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
      alert('Error al cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) return;

    try {
      const { error } = await supabase
        .from('ejercicios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEjercicios(ejercicios.filter(e => e.id !== id));
      alert('Ejercicio eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando ejercicio:', error);
      alert('Error al eliminar el ejercicio');
    }
  };

  const categorias = [...new Set(ejercicios.map(e => e.categoria).filter(Boolean))];

  const ejerciciosFiltrados = ejercicios.filter(ejercicio => {
    const matchesSearch = ejercicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ejercicio.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategoria || ejercicio.categoria === filterCategoria;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text2">Cargando ejercicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header estandarizado */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Ejercicios
              </h1>
              <p className="text-gray-600 dark:text-dark-text2">
                Gestiona ejercicios y rutinas para clases y alumnos
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/ejercicios/nuevo"
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Ejercicio
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {ejerciciosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterCategoria ? 'No se encontraron ejercicios' : 'No hay ejercicios registrados'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterCategoria ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer ejercicio'}
            </p>
            {!searchTerm && !filterCategoria && (
              <Link
                to="/ejercicios/nuevo"
                className="btn-primary px-6 py-3"
              >
                ➕ Agregar Primer Ejercicio
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-hover-custom">
              <thead className="bg-gray-50 dark:bg-dark-surface2">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Ejercicio</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Categoría</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Dificultad</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Duración</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Descripción</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {ejerciciosFiltrados.map(ejercicio => (
                  <tr key={ejercicio.id} className="transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-lg">
                            {ejercicio.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{ejercicio.nombre}</div>
                          <div className="text-sm text-gray-500">{ejercicio.tipo || 'Ejercicio'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {ejercicio.categoria || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${ejercicio.dificultad === 'Fácil'
                        ? 'bg-green-100 text-green-800'
                        : ejercicio.dificultad === 'Intermedio'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {ejercicio.dificultad || 'Intermedio'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">
                        {ejercicio.duracion_minutos ? `${ejercicio.duracion_minutos} min` : 'No especificada'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {ejercicio.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Link
                          to={`/ejercicio/${ejercicio.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/ejercicio/${ejercicio.id}/editar`}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleEliminar(ejercicio.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
