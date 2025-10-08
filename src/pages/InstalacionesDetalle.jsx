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
    resumen: {
      totalIngresos: 0,
      totalGastos: 0,
      balance: 0
    }
  });

  const tipo = searchParams.get('tipo'); // 'hoy', 'semana', 'mes'
  const fecha = searchParams.get('fecha');

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

      // Cargar ingresos (pagos)
      const { data: ingresosData, error: ingresosError } = await supabase
        .from('pagos')
        .select(`
          id,
          cantidad,
          fecha_pago,
          tipo_pago,
          mes_cubierto,
          alumnos (nombre)
        `)
        .gte('fecha_pago', fechaInicio.toISOString().split('T')[0])
        .lte('fecha_pago', fechaFin.toISOString().split('T')[0])
        .order('fecha_pago', { ascending: false });

      if (ingresosError) {
        console.error('Error cargando ingresos:', ingresosError);
      }

      // Cargar gastos de material
      const { data: gastosData, error: gastosError } = await supabase
        .from('gastos_material')
        .select('*')
        .gte('fecha_gasto', fechaInicio.toISOString().split('T')[0])
        .lte('fecha_gasto', fechaFin.toISOString().split('T')[0])
        .order('fecha_gasto', { ascending: false });

      if (gastosError) {
        console.error('Error cargando gastos:', gastosError);
      }

      // Calcular resumen
      const totalIngresos = ingresosData?.reduce((sum, ingreso) => sum + (ingreso.cantidad || 0), 0) || 0;
      const totalGastos = gastosData?.reduce((sum, gasto) => sum + (gasto.cantidad || 0), 0) || 0;
      const balance = totalIngresos - totalGastos;

      setDatos({
        ingresos: ingresosData || [],
        gastos: gastosData || [],
        resumen: {
          totalIngresos,
          totalGastos,
          balance
        }
      });

    } catch (error) {
      console.error('Error cargando datos detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/instalaciones')}
              className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                {getTitulo()}
              </h1>
              <p className="text-gray-600 dark:text-dark-text2">
                Ingresos y gastos detallados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatearMoneda(datos.resumen.totalIngresos)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/30">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Gastos</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatearMoneda(datos.resumen.totalGastos)}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${datos.resumen.balance >= 0 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30' 
          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${datos.resumen.balance >= 0 
              ? 'bg-blue-100 dark:bg-blue-900/30' 
              : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              <svg className={`w-6 h-6 ${datos.resumen.balance >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${datos.resumen.balance >= 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400'
              }`}>
                Balance
              </p>
              <p className={`text-2xl font-bold ${datos.resumen.balance >= 0 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-orange-700 dark:text-orange-300'
              }`}>
                {formatearMoneda(datos.resumen.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ingresos */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
            <span className="text-green-600">💰</span>
            Ingresos ({datos.ingresos.length})
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {datos.ingresos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-dark-text2">
              <div className="text-4xl mb-2">📭</div>
              <p>No hay ingresos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {datos.ingresos.map(ingreso => (
                <div key={ingreso.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {ingreso.alumnos?.nombre || 'Pago sin alumno'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">
                      {formatearFecha(ingreso.fecha_pago)} • {ingreso.tipo_pago}
                    </p>
                    {ingreso.mes_cubierto && (
                      <p className="text-xs text-gray-500 dark:text-dark-text2">
                        Mes: {ingreso.mes_cubierto}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700 dark:text-green-300">
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
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
            <span className="text-red-600">🛒</span>
            Gastos de Material ({datos.gastos.length})
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {datos.gastos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-dark-text2">
              <div className="text-4xl mb-2">📭</div>
              <p>No hay gastos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {datos.gastos.map(gasto => (
                <div key={gasto.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {gasto.concepto || 'Gasto sin concepto'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-dark-text2">
                      {formatearFecha(gasto.fecha_gasto)}
                    </p>
                    {gasto.descripcion && (
                      <p className="text-xs text-gray-500 dark:text-dark-text2">
                        {gasto.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-700 dark:text-red-300">
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
