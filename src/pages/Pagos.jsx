import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Paginacion from '../components/Paginacion';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Estado para clases internas del día
  const [internasHoy, setInternasHoy] = useState([]);

  // Estado para nuevo pago
  const [nuevoPago, setNuevoPago] = useState({
    alumno_id: '',
    cantidad: '',
    tipo_pago: 'mensual', // 'mensual' o 'clases'
    mes_cubierto: '',
    fecha_inicio: '',
    fecha_fin: '',
    clases_cubiertas: '',
    metodo: 'transferencia',
  });

  // Estado para filtro
  const [filtroAlumnoId, setFiltroAlumnoId] = useState('');

  // Estado para alumnos con deuda
  const [alumnosConDeuda, setAlumnosConDeuda] = useState([]);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Estados para edición de pagos
  const [pagoEditando, setPagoEditando] = useState(null);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] =
    useState(false);

  // Estado para tabs
  const [tabActivo, setTabActivo] = useState('historial');

  // Cargar clases internas del día y su estado de pago
  const cargarClasesInternasHoy = useCallback(async () => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString().split('T')[0];

      // Eventos de hoy con clase interna
      const { data: eventos, error: eventosError } = await supabase
        .from('eventos_clase')
        .select(
          `id, fecha, hora_inicio, hora_fin, clase_id,
           clases!inner (id, nombre, tipo_clase)`
        )
        .eq('fecha', hoyISO)
        .eq('clases.tipo_clase', 'interna');

      if (eventosError) throw eventosError;

      const claseIds = (eventos || []).map(e => e.clase_id);

      let pagosMapa = new Map();
      if (claseIds.length > 0) {
        const { data: pagosInternas, error: pagosInternasError } =
          await supabase
            .from('pagos_clases_internas')
            .select('*')
            .in('clase_id', claseIds)
            .eq('fecha', hoyISO);

        if (pagosInternasError) throw pagosInternasError;

        pagosMapa = new Map((pagosInternas || []).map(p => [p.clase_id, p]));
      }

      // Filtro defensivo en cliente por si el join no se aplica
      const soloInternas = (eventos || []).filter(
        ev => ev?.clases?.tipo_clase === 'interna'
      );

      const resultados = soloInternas.map(ev => {
        const pago = pagosMapa.get(ev.clase_id);
        return {
          eventoId: ev.id,
          claseId: ev.clase_id,
          nombre: ev.clases?.nombre || 'Clase interna',
          fecha: ev.fecha,
          hora_inicio: ev.hora_inicio,
          hora_fin: ev.hora_fin,
          estado: pago?.estado || 'pendiente',
          pagoId: pago?.id || null,
        };
      });

      setInternasHoy(resultados);
    } catch (e) {
      console.error('Error cargando clases internas de hoy:', e);
      setInternasHoy([]);
    }
  }, []);

  const togglePagoInterna = useCallback(
    async (claseId, fecha, estadoActual, pagoId) => {
      const nuevoEstado = estadoActual === 'pagada' ? 'pendiente' : 'pagada';
      try {
        if (pagoId) {
          const { error } = await supabase
            .from('pagos_clases_internas')
            .update({ estado: nuevoEstado })
            .eq('id', pagoId);
          if (error) throw error;
        } else {
          // Crear registro si no existe y se marca como pagada
          const payload = {
            clase_id: claseId,
            fecha,
            estado: nuevoEstado,
          };
          const { error } = await supabase
            .from('pagos_clases_internas')
            .insert([payload]);
          if (error) throw error;
        }
        await cargarClasesInternasHoy();
      } catch (e) {
        console.error('Error actualizando estado de pago interna:', e);
        alert('❌ No se pudo actualizar el estado de pago.');
      }
    },
    [cargarClasesInternasHoy]
  );

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
        .select(
          `
          *,
          alumnos (nombre)
        `
        )
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

      console.log('✅ Datos cargados:', {
        alumnos: alumnosData?.length,
        pagos: pagosData?.length,
      });
    } catch (err) {
      console.error('💥 Error cargando datos:', err);
      setError('No se pudieron cargar los datos');

      // Datos de demostración si falla Supabase
      setAlumnos([
        { id: '1', nombre: 'María García', email: 'maria@email.com' },
        { id: '2', nombre: 'Carlos López', email: 'carlos@email.com' },
        { id: '3', nombre: 'Ana Martín', email: 'ana@email.com' },
      ]);
      setPagos([
        {
          id: '1',
          alumno_id: '1',
          cantidad: 80,
          mes_cubierto: '2024-01',
          fecha_pago: '2024-01-15',
          alumnos: { nombre: 'María García' },
        },
        {
          id: '2',
          alumno_id: '2',
          cantidad: 60,
          mes_cubierto: '2024-01',
          fecha_pago: '2024-01-14',
          alumnos: { nombre: 'Carlos López' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar alumnos con deuda
  const cargarAlumnosConDeuda = useCallback(async () => {
    try {
      console.log('🔄 Calculando alumnos con deuda en página Pagos...');
      console.log('👥 Alumnos disponibles:', alumnos.length);

      if (alumnos.length === 0) {
        console.log('⚠️ No hay alumnos cargados, saltando cálculo de deudas');
        setAlumnosConDeuda([]);
        return;
      }

      // Obtener todos los pagos
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .order('fecha_pago', { ascending: false });

      if (pagosError) throw pagosError;

      console.log('💰 Pagos encontrados:', pagos?.length || 0);

      // Usar la función unificada para calcular deudas (todos los alumnos, no solo mes actual)
      const { alumnos: alumnosConDeuda } = await calcularAlumnosConDeuda(
        alumnos,
        pagos,
        false
      );

      console.log(
        '📈 Total alumnos con deuda en página Pagos:',
        alumnosConDeuda.length
      );
      console.log('📋 Detalles de alumnos con deuda:', alumnosConDeuda);

      setAlumnosConDeuda(alumnosConDeuda);
    } catch (err) {
      console.error('Error cargando alumnos con deuda:', err);
      setAlumnosConDeuda([]);
    }
  }, [alumnos]);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (alumnos.length > 0) {
      cargarAlumnosConDeuda();
    }
  }, [alumnos, cargarAlumnosConDeuda]);

  // Cargar internas del día al entrar a Pagos y cuando se active el tab
  useEffect(() => {
    cargarClasesInternasHoy();
  }, [cargarClasesInternasHoy]);

  // Manejar envío de nuevo pago
  const handleNuevoPago = async e => {
    e.preventDefault();
    try {
      console.log('💾 Registrando nuevo pago:', nuevoPago);

      const { data, error } = await supabase
        .from('pagos')
        .insert([
          {
            alumno_id: nuevoPago.alumno_id,
            cantidad: parseFloat(nuevoPago.cantidad),
            tipo_pago: nuevoPago.tipo_pago,
            mes_cubierto:
              nuevoPago.tipo_pago === 'mensual' ? nuevoPago.mes_cubierto : null,
            fecha_inicio:
              nuevoPago.tipo_pago === 'clases' ? nuevoPago.fecha_inicio : null,
            fecha_fin:
              nuevoPago.tipo_pago === 'clases' ? nuevoPago.fecha_fin : null,
            clases_cubiertas:
              nuevoPago.tipo_pago === 'clases'
                ? nuevoPago.clases_cubiertas
                : null,
            metodo: nuevoPago.metodo,
            fecha_pago: new Date().toISOString(),
          },
        ])
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
        metodo: 'transferencia',
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
  const handleCambiarPagina = nuevaPagina => {
    setPaginaActual(nuevaPagina);
  };

  // Resetear página cuando cambie el filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroAlumnoId]);

  // Función para editar pago
  const handleEditarPago = pago => {
    setPagoEditando(pago);
    setMostrarFormularioEdicion(true);
  };

  // Función para actualizar pago
  const handleActualizarPago = async e => {
    e.preventDefault();
    try {
      const updateData = {
        alumno_id: pagoEditando.alumno_id,
        cantidad: parseFloat(pagoEditando.cantidad),
        tipo_pago: pagoEditando.tipo_pago,
        metodo: pagoEditando.metodo,
      };

      // Agregar campos según el tipo de pago
      if (pagoEditando.tipo_pago === 'mensual') {
        updateData.mes_cubierto = pagoEditando.mes_cubierto;
        updateData.fecha_inicio = null;
        updateData.fecha_fin = null;
        updateData.clases_cubiertas = null;
      } else if (pagoEditando.tipo_pago === 'clases') {
        updateData.fecha_inicio = pagoEditando.fecha_inicio;
        updateData.fecha_fin = pagoEditando.fecha_fin;
        updateData.clases_cubiertas = parseInt(pagoEditando.clases_cubiertas);
        updateData.mes_cubierto = null;
      }

      const { error } = await supabase
        .from('pagos')
        .update(updateData)
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
  const handleEliminarPago = async pagoId => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from('pagos').delete().eq('id', pagoId);

      if (error) throw error;

      alert('✅ Pago eliminado correctamente');
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando pago:', err);
      alert('❌ Error al eliminar el pago: ' + err.message);
    }
  };

  if (loading)
    return (
      <p className='text-center py-8 text-gray-700 dark:text-dark-text'>
        Cargando datos...
      </p>
    );
  if (error)
    return (
      <p className='text-red-500 dark:text-red-400 text-center'>{error}</p>
    );

  return (
    <div>
      {/* Header mejorado con Refactoring UI */}
      <div className='bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/10 dark:to-teal-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm mb-8'>
        <div className='flex items-center gap-5'>
          <div className='bg-green-50 dark:bg-green-950/30 p-4 rounded-2xl'>
            <svg
              className='w-9 h-9 text-green-600 dark:text-green-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight'>
              Pagos
            </h1>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
              Gestiona los pagos de tus alumnos
            </p>
          </div>
        </div>
      </div>

      {/* Banner de alerta para alumnos con deuda */}
      {alumnosConDeuda.length > 0 && (
        <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg'>
          <div className='flex items-center gap-3'>
            <div className='text-red-600 dark:text-red-400 text-2xl'>⚠️</div>
            <div>
              <h3 className='font-semibold text-red-800 dark:text-red-200'>
                {alumnosConDeuda.length} alumno
                {alumnosConDeuda.length !== 1 ? 's' : ''} con pagos pendientes
              </h3>
              <p className='text-sm text-red-700 dark:text-red-300'>
                Alumnos activos con clases normales (no internas/escuela) que
                deben dinero
              </p>
            </div>
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            {alumnosConDeuda.slice(0, 5).map(alumno => (
              <span
                key={alumno.id}
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  alumno.diasSinPagar > 30
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : alumno.diasSinPagar > 15
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                }`}
              >
                {alumno.nombre} (
                {alumno.diasSinPagar === 999
                  ? 'Sin pagos'
                  : `${alumno.diasSinPagar}d`}
                )
              </span>
            ))}
            {alumnosConDeuda.length > 5 && (
              <span className='px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 rounded-full'>
                +{alumnosConDeuda.length - 5} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sistema de Tabs */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden'>
        {/* Navegación de tabs */}
        <div className='border-b border-gray-200 dark:border-dark-border'>
          <nav className='flex space-x-8 px-6' aria-label='Tabs'>
            <button
              onClick={() => setTabActivo('historial')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                tabActivo === 'historial'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text2 dark:hover:text-dark-text'
              }`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
                Historial de Pagos
              </div>
            </button>
            <button
              onClick={() => setTabActivo('nuevos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                tabActivo === 'nuevos'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text2 dark:hover:text-dark-text'
              }`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                Nuevos Pagos
              </div>
            </button>
            <button
              onClick={() => setTabActivo('deudas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                tabActivo === 'deudas'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text2 dark:hover:text-dark-text'
              }`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
                Alumnos con Deuda ({alumnosConDeuda.length})
              </div>
            </button>
            <button
              onClick={() => setTabActivo('internas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                tabActivo === 'internas'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text2 dark:hover:text-dark-text'
              }`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M3 7h18M3 12h18M3 17h18'
                  />
                </svg>
                Clases internas (hoy)
              </div>
            </button>
          </nav>
        </div>

        {/* Contenido de los tabs */}
        <div className='p-8'>
          {/* Tab: Nuevos Pagos */}
          {tabActivo === 'nuevos' && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl'>
                  <svg
                    className='w-6 h-6 text-blue-600 dark:text-blue-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  Registrar Nuevo Pago
                </h2>
              </div>
              <form onSubmit={handleNuevoPago} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Alumno *
                  </label>
                  <select
                    name='alumno_id'
                    value={nuevoPago.alumno_id}
                    onChange={e =>
                      setNuevoPago({ ...nuevoPago, alumno_id: e.target.value })
                    }
                    required
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  >
                    <option value=''>Selecciona un alumno</option>
                    {alumnos.map(alumno => (
                      <option key={alumno.id} value={alumno.id}>
                        {alumno.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Cantidad (€) *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    name='cantidad'
                    value={nuevoPago.cantidad}
                    onChange={e =>
                      setNuevoPago({ ...nuevoPago, cantidad: e.target.value })
                    }
                    required
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                    placeholder='50'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Tipo de pago *
                  </label>
                  <select
                    name='tipo_pago'
                    value={nuevoPago.tipo_pago}
                    onChange={e => {
                      const nuevoTipo = e.target.value;
                      console.log('Cambiando tipo de pago a:', nuevoTipo);
                      setNuevoPago({
                        ...nuevoPago,
                        tipo_pago: nuevoTipo,
                        // Limpiar campos del tipo anterior
                        mes_cubierto:
                          nuevoTipo === 'mensual' ? nuevoPago.mes_cubierto : '',
                        fecha_inicio:
                          nuevoTipo === 'clases' ? nuevoPago.fecha_inicio : '',
                        fecha_fin:
                          nuevoTipo === 'clases' ? nuevoPago.fecha_fin : '',
                        clases_cubiertas:
                          nuevoTipo === 'clases'
                            ? nuevoPago.clases_cubiertas
                            : '',
                      });
                    }}
                    required
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  >
                    <option value='mensual'>💰 Pago Mensual</option>
                    <option value='clases'>📅 Pago por Clases/Días</option>
                  </select>
                </div>

                {/* Indicador del tipo de pago seleccionado */}
                <div className='p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-lg'>
                      {nuevoPago.tipo_pago === 'mensual' ? '💰' : '📅'}
                    </span>
                    <span className='font-medium text-gray-700 dark:text-dark-text2'>
                      {nuevoPago.tipo_pago === 'mensual'
                        ? 'Pago Mensual'
                        : 'Pago por Clases/Días'}
                    </span>
                  </div>
                  <p className='text-sm text-gray-500 dark:text-dark-text2'>
                    {nuevoPago.tipo_pago === 'mensual'
                      ? 'Selecciona el mes que cubre este pago'
                      : 'Especifica el período y las clases que cubre este pago'}
                  </p>
                </div>

                {/* Campos condicionales según el tipo de pago */}
                {nuevoPago.tipo_pago === 'mensual' ? (
                  <div>
                    <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                      Mes cubierto *
                    </label>
                    <input
                      type='month'
                      name='mes_cubierto'
                      value={nuevoPago.mes_cubierto}
                      onChange={e =>
                        setNuevoPago({
                          ...nuevoPago,
                          mes_cubierto: e.target.value,
                        })
                      }
                      required
                      className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                    />
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                        Fecha inicio *
                      </label>
                      <input
                        type='date'
                        name='fecha_inicio'
                        value={nuevoPago.fecha_inicio}
                        onChange={e =>
                          setNuevoPago({
                            ...nuevoPago,
                            fecha_inicio: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                        Fecha fin *
                      </label>
                      <input
                        type='date'
                        name='fecha_fin'
                        value={nuevoPago.fecha_fin}
                        onChange={e =>
                          setNuevoPago({
                            ...nuevoPago,
                            fecha_fin: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                        Clases cubiertas
                      </label>
                      <input
                        type='text'
                        name='clases_cubiertas'
                        value={nuevoPago.clases_cubiertas}
                        onChange={e =>
                          setNuevoPago({
                            ...nuevoPago,
                            clases_cubiertas: e.target.value,
                          })
                        }
                        className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                        placeholder='Ej: Clases del 15-20 enero, Clase particular del 25'
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Método
                  </label>
                  <select
                    name='metodo'
                    value={nuevoPago.metodo}
                    onChange={e =>
                      setNuevoPago({ ...nuevoPago, metodo: e.target.value })
                    }
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  >
                    <option value='transferencia'>Transferencia</option>
                    <option value='efectivo'>Efectivo</option>
                    <option value='bizum'>Bizum</option>
                  </select>
                </div>

                <div className='flex justify-center'>
                  <button
                    type='submit'
                    className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  >
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Historial de Pagos */}
          {tabActivo === 'historial' && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl'>
                  <svg
                    className='w-6 h-6 text-purple-600 dark:text-purple-400'
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
                <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  Historial de Pagos
                </h2>
              </div>

              {/* Filtro y listado */}

              {/* Selector de alumno */}
              <div className='mb-4'>
                <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                  Seleccionar Alumno
                </label>
                <select
                  value={filtroAlumnoId}
                  onChange={e => setFiltroAlumnoId(e.target.value)}
                  className='input w-full'
                >
                  <option value=''>Ver todos los pagos</option>
                  {alumnos.map(alumno => (
                    <option key={alumno.id} value={alumno.id}>
                      {alumno.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título dinámico con contador */}
              <div className='flex justify-between items-center mb-3'>
                <h4 className='font-semibold text-gray-800 dark:text-dark-text'>
                  {filtroAlumnoId
                    ? `Pagos de: ${alumnoSeleccionado?.nombre || 'Alumno'}`
                    : 'Todos los pagos registrados'}
                </h4>
                <span className='text-sm text-gray-500 dark:text-dark-text2'>
                  {pagosFiltrados.length} pago
                  {pagosFiltrados.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Botón limpiar filtro */}
              {filtroAlumnoId && (
                <button
                  onClick={() => setFiltroAlumnoId('')}
                  className='text-xs text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text mb-3'
                >
                  🔁 Ver todos los pagos
                </button>
              )}

              {/* Tabla de pagos */}
              {pagosFiltrados.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-6xl mb-4'>💰</div>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                    No hay pagos registrados
                  </h3>
                  <p className='text-gray-500 dark:text-dark-text2'>
                    {filtroAlumnoId
                      ? 'Este alumno no tiene pagos registrados'
                      : 'No se han registrado pagos aún'}
                  </p>
                </div>
              ) : (
                <>
                  <div className='overflow-x-auto'>
                    <table className='table w-full'>
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
                            <td className='font-medium'>
                              {pago.alumnos?.nombre || 'Alumno eliminado'}
                            </td>
                            <td className='font-semibold text-green-600 dark:text-green-400'>
                              €{pago.cantidad}
                            </td>
                            <td>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  pago.tipo_pago === 'mensual'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                }`}
                              >
                                {pago.tipo_pago === 'mensual'
                                  ? '💰 Mensual'
                                  : '📅 Por Clases'}
                              </span>
                            </td>
                            <td className='text-gray-600 dark:text-dark-text2'>
                              {pago.tipo_pago === 'mensual' ? (
                                pago.mes_cubierto
                              ) : (
                                <div className='text-xs'>
                                  <div>
                                    {pago.fecha_inicio &&
                                      new Date(
                                        pago.fecha_inicio
                                      ).toLocaleDateString('es-ES')}
                                  </div>
                                  <div>
                                    {pago.fecha_fin &&
                                      new Date(
                                        pago.fecha_fin
                                      ).toLocaleDateString('es-ES')}
                                  </div>
                                  {pago.clases_cubiertas && (
                                    <div className='text-gray-500 mt-1'>
                                      {pago.clases_cubiertas}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className='text-gray-600 dark:text-dark-text2'>
                              {pago.fecha_pago
                                ? new Date(pago.fecha_pago).toLocaleDateString(
                                    'es-ES'
                                  )
                                : 'Sin fecha'}
                            </td>
                            <td>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  pago.metodo === 'transferencia'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : pago.metodo === 'efectivo'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                }`}
                              >
                                {pago.metodo === 'transferencia'
                                  ? '🏦 Transferencia'
                                  : pago.metodo === 'efectivo'
                                    ? '💵 Efectivo'
                                    : '💳 Bizum'}
                              </span>
                            </td>
                            <td>
                              <div className='flex space-x-2'>
                                <button
                                  onClick={() => handleEditarPago(pago)}
                                  className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm'
                                  title='Editar pago'
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleEliminarPago(pago.id)}
                                  className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm'
                                  title='Eliminar pago'
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
          )}

          {/* Tab: Clases internas (hoy) */}
          {tabActivo === 'internas' && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-xl'>
                  <svg
                    className='w-6 h-6 text-green-600 dark:text-green-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M3 7h18M3 12h18M3 17h18'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  Clases internas de hoy
                </h2>
              </div>

              {internasHoy.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-6xl mb-4'>📅</div>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                    No hay clases internas hoy
                  </h3>
                  <p className='text-gray-500 dark:text-dark-text2'>
                    Cuando haya clases internas, podrás marcarlas como pagadas.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {internasHoy.map(item => (
                    <div
                      key={`${item.claseId}-${item.eventoId}`}
                      className='flex items-center justify-between p-5 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-800/50'
                    >
                      <div className='min-w-0 mr-4 flex-1'>
                        <p className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                          {item.nombre}
                        </p>
                        <p className='text-sm text-gray-600 dark:text-dark-text2'>
                          {new Date(item.fecha).toLocaleDateString('es-ES')} •{' '}
                          {item.hora_inicio?.slice(0, 5)} -{' '}
                          {item.hora_fin?.slice(0, 5)}
                        </p>
                      </div>
                      <div className='text-right flex-shrink-0'>
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm ${
                            item.estado === 'pagada'
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50'
                          }`}
                        >
                          {item.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                        </span>
                        <div className='mt-2'>
                          <button
                            onClick={() =>
                              togglePagoInterna(
                                item.claseId,
                                item.fecha,
                                item.estado,
                                item.pagoId
                              )
                            }
                            className={`px-4 py-2 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[32px] ${
                              item.estado === 'pagada'
                                ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            }`}
                          >
                            {item.estado === 'pagada'
                              ? 'Marcar pendiente'
                              : 'Marcar pagada'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Tab: Alumnos con Deuda */}
          {tabActivo === 'deudas' && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <div className='bg-red-100 dark:bg-red-900/30 p-3 rounded-xl'>
                  <svg
                    className='w-6 h-6 text-red-600 dark:text-red-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  Alumnos con Deuda
                </h2>
              </div>

              {alumnosConDeuda.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-6xl mb-4'>✅</div>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                    ¡Todo al día!
                  </h3>
                  <p className='text-gray-500 dark:text-dark-text2'>
                    Todos los alumnos activos tienen sus pagos al corriente
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {alumnosConDeuda.map(alumno => (
                    <div
                      key={alumno.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alumno.diasSinPagar > 30
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : alumno.diasSinPagar > 15
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      }`}
                    >
                      <div className='flex justify-between items-start'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                              {alumno.nombre}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                alumno.diasSinPagar > 30
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : alumno.diasSinPagar > 15
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                              }`}
                            >
                              {alumno.diasSinPagar > 30
                                ? '🔴 Crítico'
                                : alumno.diasSinPagar > 15
                                  ? '🟡 Atrasado'
                                  : '🟠 Pendiente'}
                            </span>
                          </div>
                          <p className='text-sm text-gray-600 dark:text-dark-text2'>
                            {alumno.diasSinPagar === 999
                              ? 'Nunca ha realizado un pago'
                              : `Sin pagar desde hace ${alumno.diasSinPagar} días`}
                          </p>
                          {alumno.ultimoPago && (
                            <p className='text-xs text-gray-500 dark:text-dark-text2'>
                              Último pago:{' '}
                              {new Date(alumno.ultimoPago).toLocaleDateString(
                                'es-ES'
                              )}
                            </p>
                          )}
                          <p className='text-xs text-gray-500 dark:text-dark-text2 mt-1'>
                            Clases "Escuela": {alumno.clasesPagables} asignadas
                          </p>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => {
                              setTabActivo('nuevos');
                              setNuevoPago(prev => ({
                                ...prev,
                                alumno_id: alumno.id,
                              }));
                            }}
                            className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors'
                          >
                            💰 Registrar Pago
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de pago */}
      {mostrarFormularioEdicion && pagoEditando && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-30 z-50 flex items-center justify-center p-4'>
          <div className='bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-semibold text-gray-900 dark:text-dark-text'>
                  ✏️ Editar Pago
                </h3>
                <button
                  onClick={() => {
                    setMostrarFormularioEdicion(false);
                    setPagoEditando(null);
                  }}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleActualizarPago} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Alumno *
                  </label>
                  <select
                    name='alumno_id'
                    value={pagoEditando.alumno_id}
                    onChange={e =>
                      setPagoEditando({
                        ...pagoEditando,
                        alumno_id: e.target.value,
                      })
                    }
                    required
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  >
                    {alumnos.map(alumno => (
                      <option key={alumno.id} value={alumno.id}>
                        {alumno.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Cantidad (€) *
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    name='cantidad'
                    value={pagoEditando.cantidad}
                    onChange={e =>
                      setPagoEditando({
                        ...pagoEditando,
                        cantidad: e.target.value,
                      })
                    }
                    required
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Tipo de pago *
                  </label>
                  <select
                    name='tipo_pago'
                    value={pagoEditando.tipo_pago || 'mensual'}
                    onChange={e => {
                      const nuevoTipo = e.target.value;
                      setPagoEditando({
                        ...pagoEditando,
                        tipo_pago: nuevoTipo,
                        // Limpiar campos del tipo anterior
                        mes_cubierto:
                          nuevoTipo === 'mensual'
                            ? pagoEditando.mes_cubierto
                            : '',
                        fecha_inicio:
                          nuevoTipo === 'clases'
                            ? pagoEditando.fecha_inicio
                            : '',
                        fecha_fin:
                          nuevoTipo === 'clases' ? pagoEditando.fecha_fin : '',
                        clases_cubiertas:
                          nuevoTipo === 'clases'
                            ? pagoEditando.clases_cubiertas
                            : '',
                      });
                    }}
                    required
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  >
                    <option value='mensual'>💰 Pago Mensual</option>
                    <option value='clases'>📅 Pago por Clases/Días</option>
                  </select>
                </div>

                {/* Campos condicionales según el tipo de pago */}
                {pagoEditando.tipo_pago === 'mensual' ? (
                  <div>
                    <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                      Mes cubierto *
                    </label>
                    <input
                      type='month'
                      name='mes_cubierto'
                      value={pagoEditando.mes_cubierto || ''}
                      onChange={e =>
                        setPagoEditando({
                          ...pagoEditando,
                          mes_cubierto: e.target.value,
                        })
                      }
                      required
                      className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                        Fecha inicio *
                      </label>
                      <input
                        type='date'
                        name='fecha_inicio'
                        value={pagoEditando.fecha_inicio || ''}
                        onChange={e =>
                          setPagoEditando({
                            ...pagoEditando,
                            fecha_inicio: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                        Fecha fin *
                      </label>
                      <input
                        type='date'
                        name='fecha_fin'
                        value={pagoEditando.fecha_fin || ''}
                        onChange={e =>
                          setPagoEditando({
                            ...pagoEditando,
                            fecha_fin: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                        Clases cubiertas *
                      </label>
                      <input
                        type='number'
                        min='1'
                        name='clases_cubiertas'
                        value={pagoEditando.clases_cubiertas || ''}
                        onChange={e =>
                          setPagoEditando({
                            ...pagoEditando,
                            clases_cubiertas: e.target.value,
                          })
                        }
                        required
                        className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2'>
                    Método
                  </label>
                  <select
                    name='metodo'
                    value={pagoEditando.metodo || 'transferencia'}
                    onChange={e =>
                      setPagoEditando({
                        ...pagoEditando,
                        metodo: e.target.value,
                      })
                    }
                    className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                  >
                    <option value='transferencia'>Transferencia</option>
                    <option value='efectivo'>Efectivo</option>
                    <option value='bizum'>Bizum</option>
                  </select>
                </div>

                <div className='flex space-x-3 pt-4'>
                  <button
                    type='submit'
                    className='flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors duration-200'
                  >
                    ✅ Actualizar
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setMostrarFormularioEdicion(false);
                      setPagoEditando(null);
                    }}
                    className='flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors duration-200'
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
