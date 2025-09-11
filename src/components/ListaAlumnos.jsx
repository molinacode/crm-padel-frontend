import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner, { LoadingTable } from './LoadingSpinner';

export default function ListaAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');

  const cargarAlumnos = async () => {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Ajusta si hay muchos

      if (error) throw error;
      setAlumnos(data);
    } catch (err) {
      setError('No se pudieron cargar los alumnos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAlumnos();
  }, []);

  // Filtrar alumnos por búsqueda y nivel
  const alumnosFiltrados = alumnos.filter(alumno => {
    const coincideBusqueda =
      alumno.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (alumno.email && alumno.email.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
      (alumno.telefono && alumno.telefono.includes(filtroBusqueda));

    const coincideNivel = !filtroNivel || alumno.nivel === filtroNivel;

    return coincideBusqueda && coincideNivel;
  });

  if (loading) return <LoadingSpinner size="large" text="Cargando alumnos..." />;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center">{error}</p>;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">📋 Lista de Alumnos</h3>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={filtroBusqueda}
            onChange={e => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
          />
          <svg
            className="w-5 h-5 text-gray-400 dark:text-dark-text2 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filtro por nivel */}
        <select
          value={filtroNivel}
          onChange={e => setFiltroNivel(e.target.value)}
          className="border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text"
        >
          <option value="">Todos los niveles</option>
          <option value="Iniciación (1)" data-grupo="1">Iniciación (1)</option>
          <option value="Iniciación (2)" data-grupo="2">Iniciación (2)</option>
          <option value="Medio (3)" data-grupo="3">Medio (3)</option>
          <option value="Medio (4)" data-grupo="4">Medio (4)</option>
          <option value="Avanzado (5)">Avanzado (5)</option>
          <option value="Infantil (1)" data-grupo="1">Infantil (1)</option>
          <option value="Infantil (2)" data-grupo="2">Infantil (2)</option>
          <option value="Infantil (3)" data-grupo="3">Infantil (3)</option>
        </select>
      </div>

      {/* Vista de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {alumnosFiltrados.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-text2 col-span-full text-center">No hay alumnos que coincidan con la búsqueda.</p>
        ) : (
          alumnosFiltrados.map(alumno => {
            const fotoUrl = alumno.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random&color=fff&size=128`;

            return (
              <Link
                key={alumno.id}
                to={`/alumno/${alumno.id}`}
                className="block bg-white dark:bg-dark-surface rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer group"
              >
                <img
                  src={fotoUrl}
                  alt={alumno.nombre}
                  className="w-full h-32 object-cover group-hover:brightness-110 transition-all duration-200"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-base text-gray-800 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {alumno.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text2 truncate">{alumno.email}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-text2">{alumno.telefono}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{alumno.nivel}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}