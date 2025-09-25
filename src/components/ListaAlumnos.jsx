import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner, { LoadingTable } from './LoadingSpinner';
import ExportarListado from './ExportarListado';

export default function ListaAlumnos({
  refreshTrigger,
  alumnos: alumnosProp,
  onVerFicha,
  mostrarClasesEscuela = false,
  mostrarClasesInternas = false
}) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const listaRef = useRef(null);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10; // 10 cards por página

  const cargarAlumnos = async () => {
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`Total alumnos en BD: ${data?.length || 0}`);
      setAlumnos(data || []);
    } catch (err) {
      setError('No se pudieron cargar los alumnos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alumnosProp) {
      // Si se pasan alumnos como prop, usarlos directamente
      setAlumnos(alumnosProp);
      setLoading(false);
    } else {
      // Si no, cargar desde la base de datos
      cargarAlumnos();
    }
  }, [refreshTrigger, alumnosProp]);

  // Calcular estadísticas
  const alumnosActivos = alumnos.filter(alumno => alumno.activo === true || alumno.activo === null || alumno.activo === undefined);
  const alumnosInactivos = alumnos.filter(alumno => alumno.activo === false);

  // Filtrar alumnos por búsqueda, nivel y estado activo
  const alumnosFiltrados = alumnos.filter(alumno => {
    const coincideBusqueda =
      alumno.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (alumno.email && alumno.email.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
      (alumno.telefono && alumno.telefono.includes(filtroBusqueda));

    const coincideNivel = !filtroNivel || alumno.nivel === filtroNivel;

    // Filtrar por estado activo/inactivo
    const esActivo = alumno.activo === true || alumno.activo === null || alumno.activo === undefined;
    const coincideEstado = mostrarInactivos ? true : esActivo;

    return coincideBusqueda && coincideNivel && coincideEstado;
  });

  // Calcular paginación
  const totalPaginas = Math.ceil(alumnosFiltrados.length / elementosPorPagina);
  const inicioIndice = (paginaActual - 1) * elementosPorPagina;
  const finIndice = inicioIndice + elementosPorPagina;
  const alumnosPaginados = alumnosFiltrados.slice(inicioIndice, finIndice);

  // Función para cambiar página
  const handleCambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    // Scroll hacia arriba para mejor UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroBusqueda, filtroNivel, mostrarInactivos]);

  if (loading) return <LoadingSpinner size="large" text="Cargando alumnos..." />;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center">{error}</p>;

  return (
    <div ref={listaRef}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text">📋 Lista de Alumnos</h3>

        {/* Botones de exportación */}
        <ExportarListado
          datos={alumnosFiltrados}
          nombreArchivo={`lista-alumnos-${new Date().toISOString().split('T')[0]}`}
          titulo="Lista de Alumnos"
          elementoRef={listaRef}
        />
      </div>

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
          <option value="Iniciación (1)">Iniciación (1)</option>
          <option value="Iniciación (2)">Iniciación (2)</option>
          <option value="Medio (3)">Medio (3)</option>
          <option value="Medio (4)">Medio (4)</option>
          <option value="Avanzado (5)">Avanzado (5)</option>
          <option value="Infantil (1)">Infantil (1)</option>
          <option value="Infantil (2)">Infantil (2)</option>
          <option value="Infantil (3)">Infantil (3)</option>
        </select>

        {/* Toggle para mostrar inactivos */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-dark-text2">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={e => setMostrarInactivos(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Mostrar inactivos</span>
          </label>
          {alumnosInactivos.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-300">
              {alumnosInactivos.length} inactivo{alumnosInactivos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Información de resultados */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2">
          <span>
            Mostrando {alumnosPaginados.length} de {alumnosFiltrados.length} alumnos
            {totalPaginas > 1 && ` (Página ${paginaActual} de ${totalPaginas})`}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-300">
              {alumnosActivos.length} activos
            </span>
            {alumnosInactivos.length > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900/30 dark:text-red-300">
                {alumnosInactivos.length} inactivos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vista de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {alumnosFiltrados.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-text2 col-span-full text-center">No hay alumnos que coincidan con la búsqueda.</p>
        ) : (
          alumnosPaginados.map(alumno => {
            const fotoUrl = alumno.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random&color=fff&size=128`;
            const esActivo = alumno.activo === true || alumno.activo === null || alumno.activo === undefined;

            return (
              <div
                key={alumno.id}
                onClick={() => onVerFicha ? onVerFicha(alumno.id) : null}
                className={`block rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer group ${esActivo
                  ? 'bg-white dark:bg-dark-surface'
                  : 'bg-gray-100 dark:bg-gray-800 opacity-75'
                  }`}
              >
                <img
                  src={fotoUrl}
                  alt={alumno.nombre}
                  className="w-full h-32 object-cover group-hover:brightness-110 transition-all duration-200"
                />
                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-base text-gray-800 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {alumno.nombre}
                    </h3>
                    {!esActivo && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-300">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-dark-text2 truncate">{alumno.email}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-text2">{alumno.telefono}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{alumno.nivel}</p>

                  {/* Información de clases */}
                  {mostrarClasesEscuela && alumno.clasesEscuela && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-dark-text2">Clases de escuela:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {alumno.clasesEscuela.slice(0, 2).map((clase, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                            {clase.nombre}
                          </span>
                        ))}
                        {alumno.clasesEscuela.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-dark-text2">
                            +{alumno.clasesEscuela.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {mostrarClasesInternas && alumno.clasesInternas && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-dark-text2">Clases internas:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {alumno.clasesInternas.slice(0, 2).map((clase, index) => (
                          <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-300">
                            {clase.nombre}
                          </span>
                        ))}
                        {alumno.clasesInternas.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-dark-text2">
                            +{alumno.clasesInternas.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Controles de paginación */}
      {totalPaginas > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2">
            {/* Botón Anterior */}
            <button
              onClick={() => handleCambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-surface dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface2"
            >
              ← Anterior
            </button>

            {/* Números de página */}
            <div className="flex space-x-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => {
                // Mostrar solo algunas páginas alrededor de la actual
                const mostrarPagina =
                  numero === 1 ||
                  numero === totalPaginas ||
                  (numero >= paginaActual - 1 && numero <= paginaActual + 1);

                if (!mostrarPagina) {
                  // Mostrar puntos suspensivos
                  if (numero === paginaActual - 2 || numero === paginaActual + 2) {
                    return (
                      <span key={numero} className="px-3 py-2 text-sm text-gray-500 dark:text-dark-text2">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={numero}
                    onClick={() => handleCambiarPagina(numero)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${numero === paginaActual
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface2'
                      }`}
                  >
                    {numero}
                  </button>
                );
              })}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => handleCambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-surface dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface2"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}