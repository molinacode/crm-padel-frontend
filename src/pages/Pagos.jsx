import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Paginacion from '../components/Paginacion';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para nuevo pago
  const [nuevoPago, setNuevoPago] = useState({
    alumno_id: '',
    cantidad: '',
    tipo_pago: 'mensual', // 'mensual' o 'clases'
    mes_cubierto: '',
    fecha_inicio: '',
    fecha_fin: '',
    clases_cubiertas: '',
    metodo: 'transferencia'
  });

  // Estado para filtro
  const [filtroAlumnoId, setFiltroAlumnoId] = useState('');

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Estados para edición de pagos
  const [pagoEditando, setPagoEditando] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);

  // Cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando datos de pagos...');

      // Cargar alumnos
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('alumnos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      // Cargar pagos con información del alumno
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select(`
          *,
          alumnos (nombre)
        `)
        .order('fecha_pago', { ascending: false });

      if (alumnosError) {
        console.error('Error cargando alumnos:', alumnosError);
        throw alumnosError;
      }

      if (pagosError) {
        console.error('Error cargando pagos:', pagosError);
        throw pagosError;
      }

      setAlumnos(alumnosData || []);
      setPagos(pagosData || []);

      console.log('✅ Datos cargados:', { alumnos: alumnosData?.length, pagos: pagosData?.length });
    } catch (err) {
      console.error('💥 Error cargando datos:', err);
      setError('No se pudieron cargar los datos');

      // Datos de demostración si falla Supabase
      setAlumnos([
        { id: '1', nombre: 'María García', email: 'maria@email.com' },
        { id: '2', nombre: 'Carlos López', email: 'carlos@email.com' },
        { id: '3', nombre: 'Ana Martín', email: 'ana@email.com' }
      ]);
      setPagos([
        {
          id: '1',
          alumno_id: '1',
          cantidad: 80,
          mes_cubierto: '2024-01',
          fecha_pago: '2024-01-15',
          alumnos: { nombre: 'María García' }
        },
        {
          id: '2',
          alumno_id: '2',
          cantidad: 60,
          mes_cubierto: '2024-01',
          fecha_pago: '2024-01-14',
          alumnos: { nombre: 'Carlos López' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejar envío de nuevo pago
  const handleNuevoPago = async (e) => {
    e.preventDefault();
    try {
      console.log('💾 Registrando nuevo pago:', nuevoPago);

      const { data, error } = await supabase
        .from('pagos')
        .insert([{
          alumno_id: nuevoPago.alumno_id,
          cantidad: parseFloat(nuevoPago.cantidad),
          tipo_pago: nuevoPago.tipo_pago,
          mes_cubierto: nuevoPago.tipo_pago === 'mensual' ? nuevoPago.mes_cubierto : null,
          fecha_inicio: nuevoPago.tipo_pago === 'clases' ? nuevoPago.fecha_inicio : null,
          fecha_fin: nuevoPago.tipo_pago === 'clases' ? nuevoPago.fecha_fin : null,
          clases_cubiertas: nuevoPago.tipo_pago === 'clases' ? nuevoPago.clases_cubiertas : null,
          metodo: nuevoPago.metodo,
          fecha_pago: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Error insertando pago:', error);
        alert('❌ Error: ' + error.message);
        return;
      }

      console.log('✅ Pago registrado:', data);
      alert('✅ Pago registrado correctamente');

      // Limpiar formulario
      setNuevoPago({
        alumno_id: '',
        cantidad: '',
        tipo_pago: 'mensual',
        mes_cubierto: '',
        fecha_inicio: '',
        fecha_fin: '',
        clases_cubiertas: '',
        metodo: 'transferencia'
      });

      // Recargar datos
      cargarDatos();

    } catch (err) {
      console.error('💥 Error registrando pago:', err);
      alert('❌ Error de conexión');
    }
  };

  // Filtrar pagos por alumno
  const pagosFiltrados = filtroAlumnoId
    ? pagos.filter(p => p.alumno_id === filtroAlumnoId)
    : pagos;

  // Obtener nombre del alumno filtrado
  const alumnoSeleccionado = alumnos.find(a => a.id === filtroAlumnoId);

  // Lógica de paginación
  const totalPaginas = Math.ceil(pagosFiltrados.length / elementosPorPagina);
  const inicioIndice = (paginaActual - 1) * elementosPorPagina;
  const finIndice = inicioIndice + elementosPorPagina;
  const pagosPaginados = pagosFiltrados.slice(inicioIndice, finIndice);

  // Función para cambiar página
  const handleCambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  // Resetear página cuando cambie el filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroAlumnoId]);

  // Función para editar pago
  const handleEditarPago = (pago) => {
    setPagoEditando(pago);
    setMostrarFormularioEdicion(true);
  };

  // Función para actualizar pago
  const handleActualizarPago = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('pagos')
        .update({
          alumno_id: pagoEditando.alumno_id,
          cantidad: parseFloat(pagoEditando.cantidad),
          mes_cubierto: pagoEditando.mes_cubierto,
          metodo: pagoEditando.metodo
        })
        .eq('id', pagoEditando.id);

      if (error) throw error;

      alert('✅ Pago actualizado correctamente');
      setMostrarFormularioEdicion(false);
      setPagoEditando(null);
      cargarDatos();
    } catch (err) {
      console.error('Error actualizando pago:', err);
      alert('❌ Error al actualizar el pago: ' + err.message);
    }
  };

  // Función para eliminar pago
  const handleEliminarPago = async (pagoId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', pagoId);

      if (error) throw error;

      alert('✅ Pago eliminado correctamente');
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando pago:', err);
      alert('❌ Error al eliminar el pago: ' + err.message);
    }
  };

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando datos...</p>;
  if (error) return <p className="text-red-500 dark:text-red-400 text-center">{error}</p>;

  return (
    <div>
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800/30 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Gestión de Pagos
            </h1>
            <p className="text-gray-600 dark:text-dark-text2">
              Administra los pagos de tus alumnos
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulario de registro */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Registrar Pago</h3>
          </div>
          <form onSubmit={handleNuevoPago} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Alumno *</label>
              <select
                name="alumno_id"
                value={nuevoPago.alumno_id}
                onChange={e => setNuevoPago({ ...nuevoPago, alumno_id: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              >
                <option value="">Selecciona un alumno</option>
                {alumnos.map(alumno => (
                  <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Cantidad (€) *</label>
              <input
                type="number"
                step="0.01"
                name="cantidad"
                value={nuevoPago.cantidad}
                onChange={e => setNuevoPago({ ...nuevoPago, cantidad: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Tipo de pago *</label>
              <select
                name="tipo_pago"
                value={nuevoPago.tipo_pago}
                onChange={e => {
                  const nuevoTipo = e.target.value;
                  console.log('Cambiando tipo de pago a:', nuevoTipo);
                  setNuevoPago({
                    ...nuevoPago,
                    tipo_pago: nuevoTipo,
                    // Limpiar campos del tipo anterior
                    mes_cubierto: nuevoTipo === 'mensual' ? nuevoPago.mes_cubierto : '',
                    fecha_inicio: nuevoTipo === 'clases' ? nuevoPago.fecha_inicio : '',
                    fecha_fin: nuevoTipo === 'clases' ? nuevoPago.fecha_fin : '',
                    clases_cubiertas: nuevoTipo === 'clases' ? nuevoPago.clases_cubiertas : ''
                  });
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              >
                <option value="mensual">💰 Pago Mensual</option>
                <option value="clases">📅 Pago por Clases/Días</option>
              </select>
            </div>

            {/* Indicador del tipo de pago seleccionado */}
            <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {nuevoPago.tipo_pago === 'mensual' ? '💰' : '📅'}
                </span>
                <span className="font-medium text-gray-700 dark:text-dark-text2">
                  {nuevoPago.tipo_pago === 'mensual' ? 'Pago Mensual' : 'Pago por Clases/Días'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-dark-text2">
                {nuevoPago.tipo_pago === 'mensual'
                  ? 'Selecciona el mes que cubre este pago'
                  : 'Especifica el período y las clases que cubre este pago'
                }
              </p>
            </div>

            {/* Campos condicionales según el tipo de pago */}
            {nuevoPago.tipo_pago === 'mensual' ? (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Mes cubierto *</label>
                <input
                  type="month"
                  name="mes_cubierto"
                  value={nuevoPago.mes_cubierto}
                  onChange={e => setNuevoPago({ ...nuevoPago, mes_cubierto: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Fecha inicio *</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={nuevoPago.fecha_inicio}
                    onChange={e => setNuevoPago({ ...nuevoPago, fecha_inicio: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Fecha fin *</label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={nuevoPago.fecha_fin}
                    onChange={e => setNuevoPago({ ...nuevoPago, fecha_fin: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Clases cubiertas</label>
                  <input
                    type="text"
                    name="clases_cubiertas"
                    value={nuevoPago.clases_cubiertas}
                    onChange={e => setNuevoPago({ ...nuevoPago, clases_cubiertas: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                    placeholder="Ej: Clases del 15-20 enero, Clase particular del 25"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Método</label>
              <select
                name="metodo"
                value={nuevoPago.metodo}
                onChange={e => setNuevoPago({ ...nuevoPago, metodo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="bizum">Bizum</option>
              </select>
            </div>

            <div className="flex justify-center">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors duration-200">
                Registrar Pago
              </button>
            </div>
          </form>
        </div>

        {/* Filtro y listado */}
        <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Buscar Pagos</h3>
          </div>

          {/* Selector de alumno */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Seleccionar Alumno</label>
            <select
              value={filtroAlumnoId}
              onChange={e => setFiltroAlumnoId(e.target.value)}
              className="input w-full"
            >
              <option value="">Ver todos los pagos</option>
              {alumnos.map(alumno => (
                <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
              ))}
            </select>
          </div>

          {/* Título dinámico con contador */}
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800 dark:text-dark-text">
              {filtroAlumnoId
                ? `Pagos de: ${alumnoSeleccionado?.nombre || 'Alumno'}`
                : 'Todos los pagos registrados'}
            </h4>
            <span className="text-sm text-gray-500 dark:text-dark-text2">
              {pagosFiltrados.length} pago{pagosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Botón limpiar filtro */}
          {filtroAlumnoId && (
            <button
              onClick={() => setFiltroAlumnoId('')}
              className="text-xs text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text mb-3"
            >
              🔁 Ver todos los pagos
            </button>
          )}

          {/* Tabla de pagos */}
          {pagosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No hay pagos registrados</h3>
              <p className="text-gray-500 dark:text-dark-text2">
                {filtroAlumnoId ? 'Este alumno no tiene pagos registrados' : 'No se han registrado pagos aún'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Cantidad</th>
                      <th>Tipo</th>
                      <th>Período</th>
                      <th>Fecha Pago</th>
                      <th>Método</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosPaginados.map(pago => (
                      <tr key={pago.id}>
                        <td className="font-medium">{pago.alumnos?.nombre || 'Alumno eliminado'}</td>
                        <td className="font-semibold text-green-600 dark:text-green-400">€{pago.cantidad}</td>
                        <td>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${pago.tipo_pago === 'mensual'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                            {pago.tipo_pago === 'mensual' ? '💰 Mensual' : '📅 Por Clases'}
                          </span>
                        </td>
                        <td className="text-gray-600 dark:text-dark-text2">
                          {pago.tipo_pago === 'mensual' ? (
                            pago.mes_cubierto
                          ) : (
                            <div className="text-xs">
                              <div>{pago.fecha_inicio && new Date(pago.fecha_inicio).toLocaleDateString('es-ES')}</div>
                              <div>{pago.fecha_fin && new Date(pago.fecha_fin).toLocaleDateString('es-ES')}</div>
                              {pago.clases_cubiertas && (
                                <div className="text-gray-500 mt-1">{pago.clases_cubiertas}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="text-gray-600 dark:text-dark-text2">{new Date(pago.fecha_pago).toLocaleDateString('es-ES')}</td>
                        <td>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${pago.metodo === 'transferencia'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : pago.metodo === 'efectivo'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                            {pago.metodo === 'transferencia' ? '🏦 Transferencia' :
                              pago.metodo === 'efectivo' ? '💵 Efectivo' :
                                '💳 Tarjeta'}
                          </span>
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditarPago(pago)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                              title="Editar pago"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleEliminarPago(pago.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                              title="Eliminar pago"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <Paginacion
                  paginaActual={paginaActual}
                  totalPaginas={totalPaginas}
                  onCambiarPagina={handleCambiarPagina}
                  elementosPorPagina={elementosPorPagina}
                  totalElementos={pagosFiltrados.length}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de edición de pago */}
      {mostrarFormularioEdicion && pagoEditando && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text">✏️ Editar Pago</h3>
                <button
                  onClick={() => {
                    setMostrarFormularioEdicion(false);
                    setPagoEditando(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleActualizarPago} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Alumno *</label>
                  <select
                    name="alumno_id"
                    value={pagoEditando.alumno_id}
                    onChange={e => setPagoEditando({ ...pagoEditando, alumno_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                  >
                    {alumnos.map(alumno => (
                      <option key={alumno.id} value={alumno.id}>{alumno.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Cantidad (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cantidad"
                    value={pagoEditando.cantidad}
                    onChange={e => setPagoEditando({ ...pagoEditando, cantidad: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Mes cubierto *</label>
                  <input
                    type="month"
                    name="mes_cubierto"
                    value={pagoEditando.mes_cubierto}
                    onChange={e => setPagoEditando({ ...pagoEditando, mes_cubierto: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Método</label>
                  <select
                    name="metodo"
                    value={pagoEditando.metodo}
                    onChange={e => setPagoEditando({ ...pagoEditando, metodo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors duration-200"
                  >
                    ✅ Actualizar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormularioEdicion(false);
                      setPagoEditando(null);
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors duration-200"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}