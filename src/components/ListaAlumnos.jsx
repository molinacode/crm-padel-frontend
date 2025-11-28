import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner, { LoadingTable } from './LoadingSpinner';
import ExportarListado from './ExportarListado';
import { useIsMobile } from '../hooks/useIsMobile';
import ActionBottomSheet from './common/ActionBottomSheet';
import MobileFichaAlumno from './alumnos/MobileFichaAlumno';

export default function ListaAlumnos({
  refreshTrigger,
  alumnos: alumnosProp,
  onVerFicha,
  onEditar,
  onEliminar,
  mostrarClasesEscuela = false,
  mostrarClasesInternas = false,
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile(1024);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);
  const [mostrarFichaAlumno, setMostrarFichaAlumno] = useState(false);
  const [alumnoIdParaFicha, setAlumnoIdParaFicha] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [filtroFaltas, setFiltroFaltas] = useState(''); // '', 'justificadas', 'faltas'
  const [asistenciasData, setAsistenciasData] = useState({});
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

  const cargarAsistencias = async () => {
    try {
      // Cargar asistencias de los últimos 30 días para tener datos recientes
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);

      const { data, error } = await supabase
        .from('asistencias')
        .select('alumno_id, estado, fecha')
        .gte('fecha', fechaLimite.toISOString().split('T')[0])
        .in('estado', ['falta', 'justificada', 'lesionado']);

      if (error) throw error;

      // Agrupar por alumno_id
      const asistenciasPorAlumno = {};
      data?.forEach(asistencia => {
        if (!asistenciasPorAlumno[asistencia.alumno_id]) {
          asistenciasPorAlumno[asistencia.alumno_id] = {
            faltas: 0,
            justificadas: 0,
          };
        }
        if (asistencia.estado === 'falta') {
          asistenciasPorAlumno[asistencia.alumno_id].faltas++;
        } else if (asistencia.estado === 'justificada') {
          asistenciasPorAlumno[asistencia.alumno_id].justificadas++;
        }
      });

      setAsistenciasData(asistenciasPorAlumno);
      console.log(
        'Asistencias cargadas para filtros:',
        Object.keys(asistenciasPorAlumno).length,
        'alumnos'
      );
    } catch (err) {
      console.error('Error cargando asistencias:', err);
      // No fallar si no se pueden cargar asistencias
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
    // Cargar asistencias para los filtros
    cargarAsistencias();
  }, [refreshTrigger, alumnosProp]);

  // Calcular estadísticas
  const alumnosActivos = alumnos.filter(
    alumno =>
      alumno.activo === true ||
      alumno.activo === null ||
      alumno.activo === undefined
  );
  const alumnosInactivos = alumnos.filter(alumno => alumno.activo === false);

  // Filtrar alumnos por búsqueda, nivel, estado activo y faltas
  const alumnosFiltrados = alumnos.filter(alumno => {
    const coincideBusqueda =
      alumno.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (alumno.email &&
        alumno.email.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
      (alumno.telefono && alumno.telefono.includes(filtroBusqueda));

    const coincideNivel = !filtroNivel || alumno.nivel === filtroNivel;

    // Filtrar por estado activo/inactivo
    const esActivo =
      alumno.activo === true ||
      alumno.activo === null ||
      alumno.activo === undefined;
    const coincideEstado = mostrarInactivos ? true : esActivo;

    // Filtrar por faltas
    let coincideFaltas = true;
    if (filtroFaltas) {
      const asistenciasAlumno = asistenciasData[alumno.id] || {
        faltas: 0,
        justificadas: 0,
      };
      if (filtroFaltas === 'justificadas') {
        coincideFaltas = asistenciasAlumno.justificadas > 0;
      } else if (filtroFaltas === 'faltas') {
        coincideFaltas = asistenciasAlumno.faltas > 0;
      }
    }

    return (
      coincideBusqueda && coincideNivel && coincideEstado && coincideFaltas
    );
  });

  // Calcular paginación
  const totalPaginas = Math.ceil(alumnosFiltrados.length / elementosPorPagina);
  const inicioIndice = (paginaActual - 1) * elementosPorPagina;
  const finIndice = inicioIndice + elementosPorPagina;
  const alumnosPaginados = alumnosFiltrados.slice(inicioIndice, finIndice);

  // Función para cambiar página
  const handleCambiarPagina = nuevaPagina => {
    setPaginaActual(nuevaPagina);
    // Scroll hacia arriba para mejor UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroBusqueda, filtroNivel, mostrarInactivos, filtroFaltas]);

  // Memoizar badges y actions FUERA del condicional para cumplir reglas de hooks
  const badgesAlumno = useMemo(() => {
    if (!alumnoSeleccionado) return [];

    const badges = [];

    if (alumnoSeleccionado.nivel) {
      badges.push({
        label: alumnoSeleccionado.nivel,
        colorClass:
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      });
    }

    const esActivo =
      alumnoSeleccionado.activo === true ||
      alumnoSeleccionado.activo === null ||
      alumnoSeleccionado.activo === undefined;

    badges.push({
      label: esActivo ? 'Activo' : 'Inactivo',
      icon: esActivo ? '✅' : '❌',
      colorClass: esActivo
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    });

    if (alumnoSeleccionado.id) {
      const asistenciasAlumno = asistenciasData[alumnoSeleccionado.id] || {
        faltas: 0,
        justificadas: 0,
      };

      if (asistenciasAlumno.justificadas > 0) {
        badges.push({
          label: `${asistenciasAlumno.justificadas} justificada${asistenciasAlumno.justificadas !== 1 ? 's' : ''}`,
          icon: '⚠️',
          colorClass:
            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
        });
      }

      if (asistenciasAlumno.faltas > 0) {
        badges.push({
          label: `${asistenciasAlumno.faltas} falta${asistenciasAlumno.faltas !== 1 ? 's' : ''}`,
          icon: '❌',
          colorClass:
            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        });
      }
    }

    return badges;
  }, [alumnoSeleccionado, asistenciasData]);

  const accionesAlumno = useMemo(() => {
    if (!alumnoSeleccionado || !alumnoSeleccionado.id) {
      return [];
    }

    const acciones = [];
    const principales = [];

    if (onVerFicha) {
      principales.push({
        id: 'ver-ficha',
        label: 'Ver ficha completa',
        icon: '👁️',
        color: 'blue',
        onClick: () => {
          if (isMobile) {
            // En móvil, abrir el modal de ficha
            setAlumnoIdParaFicha(alumnoSeleccionado.id);
            setMostrarFichaAlumno(true);
            setMostrarModalAcciones(false);
            setAlumnoSeleccionado(null);
          } else {
            // En desktop, usar el handler normal
            onVerFicha(alumnoSeleccionado.id);
          }
        },
      });
    }

    if (onEditar) {
      principales.push({
        id: 'editar',
        label: 'Editar alumno',
        icon: '✏️',
        color: 'gray',
        onClick: () => {
          onEditar(alumnoSeleccionado.id);
        },
      });
    } else {
      principales.push({
        id: 'editar',
        label: 'Editar alumno',
        icon: '✏️',
        color: 'gray',
        onClick: () => {
          navigate(`/editar-alumno/${alumnoSeleccionado.id}`);
        },
      });
    }

    if (principales.length > 0) {
      acciones.push({
        category: 'Acciones principales',
        items: principales,
      });
    }

    if (onEliminar) {
      acciones.push({
        category: 'Acciones peligrosas',
        items: [
          {
            id: 'eliminar',
            label: 'Eliminar alumno',
            icon: '🗑️',
            color: 'red',
            onClick: () => {
              if (
                window.confirm(
                  `¿Estás seguro de que quieres eliminar a ${alumnoSeleccionado.nombre || 'este alumno'}?`
                )
              ) {
                onEliminar(alumnoSeleccionado.id);
              }
            },
          },
        ],
      });
    }

    return acciones;
  }, [
    alumnoSeleccionado,
    onVerFicha,
    onEditar,
    onEliminar,
    navigate,
    isMobile,
  ]);

  if (loading)
    return <LoadingSpinner size='large' text='Cargando alumnos...' />;
  if (error)
    return (
      <p className='text-red-500 dark:text-red-400 text-center'>{error}</p>
    );

  return (
    <div ref={listaRef}>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        <h3 className='text-xl font-semibold text-gray-800 dark:text-dark-text'>
          📋 Lista de Alumnos
        </h3>

        {/* Botones de exportación */}
        <ExportarListado
          datos={alumnosFiltrados}
          nombreArchivo={`lista-alumnos-${new Date().toISOString().split('T')[0]}`}
          titulo='Lista de Alumnos'
          elementoRef={listaRef}
        />
      </div>

      {/* Búsqueda y filtros */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        {/* Búsqueda */}
        <div className='relative flex-1 max-w-lg'>
          <input
            type='text'
            placeholder='Buscar por nombre, email o teléfono...'
            value={filtroBusqueda}
            onChange={e => setFiltroBusqueda(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
          />
          <svg
            className='w-5 h-5 text-gray-400 dark:text-dark-text2 absolute left-3 top-2.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>

        {/* Filtro por nivel */}
        <select
          value={filtroNivel}
          onChange={e => setFiltroNivel(e.target.value)}
          className='border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text'
        >
          <option value=''>Todos los niveles</option>
          <option value='Iniciación (1)'>Iniciación (1)</option>
          <option value='Iniciación (2)'>Iniciación (2)</option>
          <option value='Medio (3)'>Medio (3)</option>
          <option value='Medio (4)'>Medio (4)</option>
          <option value='Avanzado (5)'>Avanzado (5)</option>
          <option value='Infantil (1)'>Infantil (1)</option>
          <option value='Infantil (2)'>Infantil (2)</option>
          <option value='Infantil (3)'>Infantil (3)</option>
        </select>

        {/* Filtro por faltas */}
        <select
          value={filtroFaltas}
          onChange={e => setFiltroFaltas(e.target.value)}
          className='border border-gray-300 dark:border-dark-border rounded-lg px-4 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text'
        >
          <option value=''>Todos los alumnos</option>
          <option value='justificadas'>⚠️ Con faltas justificadas</option>
          <option value='faltas'>❌ Con faltas</option>
        </select>

        {/* Toggle para mostrar inactivos */}
        <div className='flex items-center space-x-3'>
          <label className='flex items-center space-x-2 text-sm text-gray-600 dark:text-dark-text2'>
            <input
              type='checkbox'
              checked={mostrarInactivos}
              onChange={e => setMostrarInactivos(e.target.checked)}
              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
            />
            <span>Mostrar inactivos</span>
          </label>
          {alumnosInactivos.length > 0 && (
            <span className='px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded-full border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'>
              {alumnosInactivos.length} inactivo
              {alumnosInactivos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Información de resultados */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2'>
        <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2'>
          <span>
            Mostrando {alumnosPaginados.length} de {alumnosFiltrados.length}{' '}
            alumnos
            {totalPaginas > 1 && ` (Página ${paginaActual} de ${totalPaginas})`}
          </span>
          <div className='flex items-center gap-2'>
            <span className='px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 rounded-full border border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800'>
              {alumnosActivos.length} activos
            </span>
            {alumnosInactivos.length > 0 && (
              <span className='px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded-full border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'>
                {alumnosInactivos.length} inactivos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Vista de tarjetas */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'>
        {alumnosFiltrados.length === 0 ? (
          <p className='text-gray-500 dark:text-dark-text2 col-span-full text-center'>
            No hay alumnos que coincidan con la búsqueda.
          </p>
        ) : (
          alumnosPaginados.map(alumno => {
            const fotoUrl =
              alumno.foto_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre)}&background=random&color=fff&size=128`;
            const esActivo =
              alumno.activo === true ||
              alumno.activo === null ||
              alumno.activo === undefined;
            const asistenciasAlumno = asistenciasData[alumno.id] || {
              faltas: 0,
              justificadas: 0,
            };

            return (
              <div
                key={alumno.id}
                onClick={e => {
                  try {
                    e.preventDefault();
                    e.stopPropagation();
                    // En móvil, abrir bottom sheet en lugar de ir directamente a la ficha
                    if (isMobile) {
                      if (alumno && alumno.id) {
                        setAlumnoSeleccionado(alumno);
                        setMostrarModalAcciones(true);
                      }
                    } else if (onVerFicha && alumno?.id) {
                      onVerFicha(alumno.id);
                    }
                  } catch (error) {
                    console.error('Error al hacer click en alumno:', error);
                  }
                }}
                className={`block rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-100 dark:border-gray-800 ${
                  esActivo
                    ? 'bg-white dark:bg-dark-surface'
                    : 'bg-gray-50 dark:bg-gray-800/50 opacity-75'
                }`}
              >
                <div className='h-32 bg-gradient-to-br from-blue-500 to-purple-500 relative overflow-hidden'>
                  <img
                    src={fotoUrl}
                    alt={alumno.nombre}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                </div>
                <div className='p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <h3 className='font-bold text-base text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                      {alumno.nombre}
                    </h3>
                    {!esActivo && (
                      <span className='text-xs bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-semibold dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'>
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400 truncate mb-1'>
                    {alumno.email}
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                    {alumno.telefono}
                  </p>
                  <p className='text-sm text-blue-700 dark:text-blue-400 font-bold'>
                    {alumno.nivel}
                  </p>

                  {/* Indicadores de faltas */}
                  {(asistenciasAlumno.faltas > 0 ||
                    asistenciasAlumno.justificadas > 0) && (
                    <div className='mt-3 flex flex-wrap gap-1.5'>
                      {asistenciasAlumno.justificadas > 0 && (
                        <span className='text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-semibold border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800'>
                          ⚠️ {asistenciasAlumno.justificadas} justificada
                          {asistenciasAlumno.justificadas !== 1 ? 's' : ''}
                        </span>
                      )}
                      {asistenciasAlumno.faltas > 0 && (
                        <span className='text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-semibold border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'>
                          ❌ {asistenciasAlumno.faltas} falta
                          {asistenciasAlumno.faltas !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Información de clases */}
                  {mostrarClasesEscuela && alumno.clasesEscuela && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500 dark:text-dark-text2'>
                        Clases de escuela:
                      </p>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {alumno.clasesEscuela
                          .slice(0, 2)
                          .map((clase, index) => (
                            <span
                              key={index}
                              className='text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
                            >
                              {clase.nombre}
                            </span>
                          ))}
                        {alumno.clasesEscuela.length > 2 && (
                          <span className='text-xs text-gray-500 dark:text-dark-text2'>
                            +{alumno.clasesEscuela.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {mostrarClasesInternas && alumno.clasesInternas && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500 dark:text-dark-text2'>
                        Clases internas:
                      </p>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {alumno.clasesInternas
                          .slice(0, 2)
                          .map((clase, index) => (
                            <span
                              key={index}
                              className='text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800'
                            >
                              {clase.nombre}
                            </span>
                          ))}
                        {alumno.clasesInternas.length > 2 && (
                          <span className='text-xs text-gray-500 dark:text-dark-text2'>
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
        <div className='mt-8 flex justify-center'>
          <div className='flex items-center space-x-2'>
            {/* Botón Anterior */}
            <button
              onClick={() => handleCambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-surface dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface2'
            >
              ← Anterior
            </button>

            {/* Números de página */}
            <div className='flex space-x-1'>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                numero => {
                  // Mostrar solo algunas páginas alrededor de la actual
                  const mostrarPagina =
                    numero === 1 ||
                    numero === totalPaginas ||
                    (numero >= paginaActual - 1 && numero <= paginaActual + 1);

                  if (!mostrarPagina) {
                    // Mostrar puntos suspensivos
                    if (
                      numero === paginaActual - 2 ||
                      numero === paginaActual + 2
                    ) {
                      return (
                        <span
                          key={numero}
                          className='px-3 py-2 text-sm text-gray-500 dark:text-dark-text2'
                        >
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
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        numero === paginaActual
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface2'
                      }`}
                    >
                      {numero}
                    </button>
                  );
                }
              )}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => handleCambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-surface dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface2'
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet para móvil */}
      {isMobile && alumnoSeleccionado && alumnoSeleccionado.id && (
        <ActionBottomSheet
          isOpen={mostrarModalAcciones}
          onClose={() => {
            setMostrarModalAcciones(false);
            setAlumnoSeleccionado(null);
          }}
          title={alumnoSeleccionado?.nombre || 'Alumno sin nombre'}
          subtitle={
            alumnoSeleccionado?.email ||
            alumnoSeleccionado?.telefono ||
            'Sin contacto'
          }
          badges={badgesAlumno}
          actions={accionesAlumno}
        />
      )}

      {/* Modal de Ficha del Alumno para móvil */}
      {isMobile && (
        <MobileFichaAlumno
          alumnoId={alumnoIdParaFicha}
          isOpen={mostrarFichaAlumno}
          onClose={() => {
            setMostrarFichaAlumno(false);
            setAlumnoIdParaFicha(null);
          }}
        />
      )}
    </div>
  );
}
