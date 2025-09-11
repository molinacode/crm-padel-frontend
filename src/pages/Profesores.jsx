import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    cargarProfesores();
  }, []);

  const cargarProfesores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profesores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setProfesores(data || []);
    } catch (error) {
      console.error('Error cargando profesores:', error);
      alert('Error al cargar los profesores');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este profesor?')) return;

    try {
      const { error } = await supabase
        .from('profesores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProfesores(profesores.filter(p => p.id !== id));
      alert('Profesor eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando profesor:', error);
      alert('Error al eliminar el profesor');
    }
  };

  const profesoresFiltrados = profesores.filter(profesor =>
    profesor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profesor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profesor.telefono.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text2">Cargando profesores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header estandarizado */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Profesores
              </h1>
              <p className="text-gray-600 dark:text-dark-text2">
                Gestiona el personal docente y sus horarios
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/profesores/nuevo"
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Profesor
            </Link>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Lista de profesores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {profesoresFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron profesores' : 'No hay profesores registrados'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer profesor'}
            </p>
            {!searchTerm && (
              <Link
                to="/profesores/nuevo"
                className="btn-primary px-6 py-3"
              >
                ➕ Agregar Primer Profesor
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-hover-custom">
              <thead className="bg-gray-50 dark:bg-dark-surface2">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Profesor</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Contacto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Especialidad</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Estado</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {profesoresFiltrados.map(profesor => (
                  <tr key={profesor.id} className="transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {profesor.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{profesor.nombre}</div>
                          <div className="text-sm text-gray-500">{profesor.apellidos}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">{profesor.email}</div>
                        <div className="text-sm text-gray-500">{profesor.telefono}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {profesor.especialidad || 'Pádel'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${profesor.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {profesor.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Link
                          to={`/profesor/${profesor.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver
                        </Link>
                        <Link
                          to={`/profesor/${profesor.id}/editar`}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleEliminar(profesor.id)}
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
