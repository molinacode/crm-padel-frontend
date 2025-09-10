import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando alumnos...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center">{error}</p>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-dark-text">📋 Lista de Alumnos</h3>

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
          <option value="iniciación">Iniciación</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
          <option value="infantil">Infantil</option>
        </select>
      </div>

      {/* Vista de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumnosFiltrados.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-text2 col-span-full text-center">No hay alumnos que coincidan con la búsqueda.</p>
        ) : (
          alumnosFiltrados.map(alumno => {
            const fotoUrl = alumno.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random&color=fff&size=128`;

            return (
              <div key={alumno.id} className="bg-white dark:bg-dark-surface rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <img
                  src={fotoUrl}
                  alt={alumno.nombre}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 dark:text-dark-text">
                    <Link to={`/alumno/${alumno.id}`} className="hover:underline">
                      {alumno.nombre}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text2">{alumno.email}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-text2">{alumno.telefono}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{alumno.nivel}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}