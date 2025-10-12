import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function InstalacionesDetalle() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({
    ingresos: [],
    gastos: [],
    eventos: [],
    resumen: {
      totalIngresos: 0,
      totalGastos: 0,
      balance: 0,
    },
  });

  const tipo = searchParams.get('tipo'); // 'hoy', 'semana', 'mes'
  const fecha = searchParams.get('fecha');

  // Función para determinar tipo de clase (copiada de Instalaciones.jsx)
  const getTipoClase = (nombre, tipoClase) => {
    // Normalizar tipoClase para comparaciones
    const tipoNormalizado = tipoClase?.toLowerCase()?.trim();
    const nombreNormalizado = nombre?.toLowerCase()?.trim();

    // Solo clases internas generan ingresos: +15€
    if (
      tipoNormalizado === 'interna' ||
      nombreNormalizado?.includes('interna')
    ) {
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase interna' };
    }

    // Clases de escuela: se pagan (alquiler) a 21€
    if (
      tipoNormalizado === 'escuela' ||
      nombreNormalizado?.includes('escuela')
    ) {
      return { tipo: 'gasto', valor: 21, descripcion: 'Alquiler escuela' };
    }

    // Clases particulares: ingresos variables (por ahora neutro)
    if (
      tipoNormalizado === 'particular' ||
      nombreNormalizado?.includes('particular')
    ) {
      return {
        tipo: 'neutro',
        valor: 0,
        descripcion: 'Clase particular (ingreso manual)',
      };
    }

    // Clases grupales: ingresos de 15€
    if (tipoNormalizado === 'grupal' || nombreNormalizado?.includes('grupal')) {
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase grupal' };
    }

    // Mantener lógica anterior para compatibilidad
    if (nombre?.includes('Escuela')) {
      return { tipo: 'gasto', valor: 21, descripcion: 'Escuela' };
    }

    return { tipo: 'neutro', valor: 0, descripcion: 'Clase normal' };
  };

  useEffect(() => {
    cargarDatosDetalle();
  }, [tipo, fecha]);

  const cargarDatosDetalle = async () => {
    setLoading(true);
    try {
      let fechaInicio, fechaFin;
      const hoy = new Date();

      // Determinar rango de fechas según el tipo
      switch (tipo) {
        case 'hoy':
          fechaInicio = new Date(hoy);
          fechaFin = new Date(hoy);
          fechaFin.setHours(23, 59, 59, 999);
          break;
        case 'semana':
          fechaInicio = new Date(hoy);
          fechaInicio.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes
          fechaInicio.setHours(0, 0, 0, 0);
          fechaFin = new Date(fechaInicio);
          fechaFin.setDate(fechaInicio.getDate() + 6); // Domingo
          fechaFin.setHours(23, 59, 59, 999);
          break;
        case 'mes':
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
          fechaFin.setHours(23, 59, 59, 999);
          break;
        default:
          fechaInicio = new Date(fecha);
          fechaFin = new Date(fecha);
          fechaFin.setHours(23, 59, 59, 999);
      }

      console.log('🔍 InstalacionesDetalle - Cargando datos para tipo:', tipo);
      console.log('📅 Rango de fechas:', {
        inicio: fechaInicio.toISOString().split('T')[0],
        fin: fechaFin.toISOString().split('T')[0],
      });

      // Cargar ingresos (pagos)
      const { data: ingresosData, error: ingresosError } = await supabase
        .from('pagos')
        .select(
          `
          id,
          cantidad,
          fecha_pago,
          tipo_pago,
          mes_cubierto,
          alumnos (nombre)
        `
        )
        .gte('fecha_pago', fechaInicio.toISOString().split('T')[0])
        .lte('fecha_pago', fechaFin.toISOString().split('T')[0])
        .order('fecha_pago', { ascending: false });

      if (ingresosError) {
        console.error('Error cargando ingresos:', ingresosError);
      }

      // Cargar gastos de material
      console.log('🛒 Cargando gastos de material para rango:', {
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
      });

      const { data: gastosData, error: gastosError } = await supabase
        .from('gastos_material')
        .select('*')
        .gte('fecha_gasto', fechaInicio.toISOString().split('T')[0])
        .lte('fecha_gasto', fechaFin.toISOString().split('T')[0])
        .order('fecha_gasto', { ascending: false });

      if (gastosError) {
        console.error('❌ Error cargando gastos:', gastosError);
      } else {
        console.log('✅ Gastos cargados en detalle:', gastosData?.length || 0);
        console.log('📋 Gastos encontrados:', gastosData);
      }

      console.log('📅 Cargando eventos de clases para rango:', {
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
        tipo: tipo,
      });

      console.log('🔍 Ejecutando consulta con filtros:', {
        tabla: 'eventos_clase',
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
        estado: '!= eliminado',
      });

      // Cargar TODOS los eventos (igual que la página principal)
      const { data: todosEventosData, error: todosEventosError } =
        await supabase
          .from('eventos_clase')
          .select(
            `
          id,
          fecha,
          estado,
          clases (nombre, tipo_clase)
        `
          )
          .order('fecha', { ascending: true });

      if (todosEventosError) {
        console.error(
          '❌ Error cargando todos los eventos:',
          todosEventosError
        );
      } else {
        console.log(
          '✅ Todos los eventos cargados:',
          todosEventosData?.length || 0
        );
      }

      // Filtrar eventos por rango de fechas en JavaScript (igual que la página principal)
      const eventosData =
        todosEventosData?.filter(evento => {
          const fechaEvento = new Date(evento.fecha);
          return (
            fechaEvento >= fechaInicio &&
            fechaEvento <= fechaFin &&
            evento.estado !== 'eliminado'
          );
        }) || [];

      console.log('✅ Eventos filtrados para el rango:', eventosData.length);
      console.log('📋 Eventos en rango:', eventosData);

      // Calcular resumen
      const totalIngresos =
        ingresosData?.reduce(
          (sum, ingreso) => sum + (ingreso.cantidad || 0),
          0
        ) || 0;
      const totalGastos =
        gastosData?.reduce((sum, gasto) => sum + (gasto.cantidad || 0), 0) || 0;

      // Procesar eventos para gastos e ingresos automáticos
      let ingresosAutomaticos = 0;
      let gastosAutomaticos = 0;

      if (eventosData) {
        eventosData.forEach(evento => {
          // Saltar eventos cancelados o eliminados
          if (evento.estado === 'cancelada' || evento.estado === 'eliminado')
            return;

          const nombreClase = evento.clases?.nombre || '';
          const tipoClase = evento.clases?.tipo_clase || '';
          const { tipo, valor } = getTipoClase(nombreClase, tipoClase);

          // Contar TODAS las clases (programadas e impartidas) para detalles
          // Esto es útil para ver el plan financiero del período
          if (tipo === 'ingreso') {
            ingresosAutomaticos += valor;
          } else if (tipo === 'gasto') {
            gastosAutomaticos += valor;
          }
        });
      }

      const totalIngresosFinal = totalIngresos + ingresosAutomaticos;
      const totalGastosFinal = totalGastos + gastosAutomaticos;
      const balance = totalIngresosFinal - totalGastosFinal;

      console.log('📊 Datos cargados:', {
        ingresos: ingresosData?.length || 0,
        gastos: gastosData?.length || 0,
        eventos: eventosData?.length || 0,
        ingresosManuales: totalIngresos,
        gastosManuales: totalGastos,
        ingresosAutomaticos,
        gastosAutomaticos,
        totalIngresos: totalIngresosFinal,
        totalGastos: totalGastosFinal,
        balance,
        nota: 'Incluye clases programadas e impartidas',
      });

      setDatos({
        ingresos: ingresosData || [],
        gastos: gastosData || [],
        eventos: eventosData || [],
        resumen: {
          totalIngresos: totalIngresosFinal,
          totalGastos: totalGastosFinal,
          balance,
        },
      });
    } catch (error) {
      console.error('Error cargando datos detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = fecha => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearMoneda = cantidad => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(cantidad);
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'hoy':
        return 'Detalle de Hoy';
      case 'semana':
        return 'Detalle de Esta Semana';
      case 'mes':
        return 'Detalle de Este Mes';
      default:
        return `Detalle del ${formatearFecha(fecha)}`;
    }
  };

  // Función para procesar eventos y crear desglose día por día
  const procesarEventosPorDia = () => {
    if (!datos.eventos || datos.eventos.length === 0) return {};

    const eventosPorDia = {};

    datos.eventos.forEach(evento => {
      if (evento.estado === 'cancelada' || evento.estado === 'eliminado')
        return;

      const fecha = evento.fecha;
      const nombreClase = evento.clases?.nombre || '';
      const tipoClase = evento.clases?.tipo_clase || '';
      const { tipo, valor, descripcion } = getTipoClase(nombreClase, tipoClase);

      if (!eventosPorDia[fecha]) {
        eventosPorDia[fecha] = {
          fecha,
          ingresos: 0,
          gastos: 0,
          clases: [],
        };
      }

      if (tipo === 'ingreso') {
        eventosPorDia[fecha].ingresos += valor;
      } else if (tipo === 'gasto') {
        eventosPorDia[fecha].gastos += valor;
      }

      eventosPorDia[fecha].clases.push({
        nombre: nombreClase,
        tipo: tipoClase,
        valor,
        descripcion,
        tipoOperacion: tipo,
      });
    });

    return eventosPorDia;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/30'>
        <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/instalaciones')}
              className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
            >
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
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2'>
                {getTitulo()}
              </h1>
              <p className='text-gray-600 dark:text-dark-text2'>
                Ingresos y gastos detallados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30'>
          <div className='flex items-center gap-3'>
            <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-lg'>
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
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-green-600 dark:text-green-400'>
                Total Ingresos
              </p>
              <p className='text-2xl font-bold text-green-700 dark:text-green-300'>
                {formatearMoneda(datos.resumen.totalIngresos)}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30'>
          <div className='flex items-center gap-3'>
            <div className='bg-red-100 dark:bg-red-900/30 p-3 rounded-lg'>
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
                  d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <div>
              <p className='text-sm font-medium text-red-600 dark:text-red-400'>
                Total Gastos
              </p>
              <p className='text-2xl font-bold text-red-700 dark:text-red-300'>
                {formatearMoneda(datos.resumen.totalGastos)}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            datos.resumen.balance >= 0
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'
          }`}
        >
          <div className='flex items-center gap-3'>
            <div
              className={`p-3 rounded-lg ${
                datos.resumen.balance >= 0
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
              }`}
            >
              <svg
                className={`w-6 h-6 ${
                  datos.resumen.balance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                />
              </svg>
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  datos.resumen.balance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                Balance
              </p>
              <p
                className={`text-2xl font-bold ${
                  datos.resumen.balance >= 0
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}
              >
                {formatearMoneda(datos.resumen.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose día por día */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2'>
            <span className='text-blue-600'>📅</span>
            Desglose día por día
          </h2>
        </div>
        <div className='p-4 sm:p-6'>
          {(() => {
            const eventosPorDia = procesarEventosPorDia();
            const fechas = Object.keys(eventosPorDia).sort();

            if (fechas.length === 0) {
              return (
                <div className='text-center py-8 text-gray-500 dark:text-dark-text2'>
                  <div className='text-4xl mb-2'>📅</div>
                  <p>No hay clases programadas en este período</p>
                </div>
              );
            }

            return (
              <div className='space-y-4'>
                {fechas.map(fecha => {
                  const dia = eventosPorDia[fecha];
                  const balance = dia.ingresos - dia.gastos;

                  return (
                    <div
                      key={fecha}
                      className='border border-gray-200 dark:border-dark-border rounded-lg p-4'
                    >
                      <div className='flex justify-between items-center mb-3'>
                        <h3 className='font-semibold text-gray-900 dark:text-dark-text'>
                          {formatearFecha(fecha)}
                        </h3>
                        <div className='flex items-center gap-4 text-sm'>
                          <span className='text-green-600 dark:text-green-400'>
                            +{dia.ingresos}€
                          </span>
                          <span className='text-red-600 dark:text-red-400'>
                            -{dia.gastos}€
                          </span>
                          <span
                            className={`font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                          >
                            {balance >= 0 ? '+' : ''}
                            {balance}€
                          </span>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        {dia.clases.map((clase, index) => (
                          <div
                            key={index}
                            className='flex justify-between items-center text-sm'
                          >
                            <span className='text-gray-600 dark:text-dark-text2'>
                              • {clase.nombre} ({clase.tipo})
                            </span>
                            <span
                              className={`font-medium ${clase.tipoOperacion === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                              {clase.tipoOperacion === 'ingreso' ? '+' : '-'}
                              {clase.valor}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Ingresos */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2'>
            <span className='text-green-600'>💰</span>
            Ingresos ({datos.ingresos.length})
          </h2>
        </div>
        <div className='p-4 sm:p-6'>
          {datos.ingresos.length === 0 ? (
            <div className='text-center py-8 text-gray-500 dark:text-dark-text2'>
              <div className='text-4xl mb-2'>📭</div>
              <p>No hay ingresos registrados</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {datos.ingresos.map(ingreso => (
                <div
                  key={ingreso.id}
                  className='flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30'
                >
                  <div>
                    <p className='font-medium text-gray-900 dark:text-dark-text'>
                      {ingreso.alumnos?.nombre || 'Pago sin alumno'}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-dark-text2'>
                      {formatearFecha(ingreso.fecha_pago)} • {ingreso.tipo_pago}
                    </p>
                    {ingreso.mes_cubierto && (
                      <p className='text-xs text-gray-500 dark:text-dark-text2'>
                        Mes: {ingreso.mes_cubierto}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-green-700 dark:text-green-300'>
                      +{formatearMoneda(ingreso.cantidad)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gastos */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2'>
            <span className='text-red-600'>🛒</span>
            Gastos de Material ({datos.gastos.length})
          </h2>
        </div>
        <div className='p-4 sm:p-6'>
          {datos.gastos.length === 0 ? (
            <div className='text-center py-8 text-gray-500 dark:text-dark-text2'>
              <div className='text-4xl mb-2'>📭</div>
              <p>No hay gastos registrados</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {datos.gastos.map(gasto => (
                <div
                  key={gasto.id}
                  className='flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30'
                >
                  <div>
                    <p className='font-medium text-gray-900 dark:text-dark-text'>
                      {gasto.concepto || 'Gasto sin concepto'}
                    </p>
                    <p className='text-sm text-gray-600 dark:text-dark-text2'>
                      {formatearFecha(gasto.fecha_gasto)}
                    </p>
                    {gasto.descripcion && (
                      <p className='text-xs text-gray-500 dark:text-dark-text2'>
                        {gasto.descripcion}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-red-700 dark:text-red-300'>
                      -{formatearMoneda(gasto.cantidad)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
