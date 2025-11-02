import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@shared';
import {
  InstalacionesDetalleHeader,
  InstalacionesDetalleResumen,
  InstalacionesDetalleDesglose,
  ListaIngresos,
  ListaGastos,
  useInstalacionesDetalle,
} from '@features/instalaciones';

export default function InstalacionesDetalle() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const tipo = searchParams.get('tipo'); // 'hoy', 'semana', 'mes'
  const fecha = searchParams.get('fecha');

  // Función para determinar tipo de clase (copiada de Instalaciones.jsx)
  const getTipoClase = useCallback((nombre, tipoClase) => {
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
  }, []);

  const {
    loading: loadingHook,
    datos,
    eventosPorDia,
  } = useInstalacionesDetalle({ tipo, fecha, getTipoClase });

  useEffect(() => {
    setLoading(loadingHook);
  }, [loadingHook]);

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

  // eventosPorDia ya viene calculado del hook

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className='space-y-6'>
      <InstalacionesDetalleHeader
        titulo={getTitulo()}
        onBack={() => navigate('/instalaciones')}
      />

      <InstalacionesDetalleResumen
        totalIngresos={datos.resumen.totalIngresos}
        totalGastos={datos.resumen.totalGastos}
        balance={datos.resumen.balance}
        formatearMoneda={formatearMoneda}
      />

      {/* Desglose día por día */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='p-4 sm:p-6 border-b border-gray-200 dark:border-dark-border'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2'>
            <span className='text-blue-600'>📅</span>
            Desglose día por día
          </h2>
        </div>
        <div className='p-4 sm:p-6'>
          <InstalacionesDetalleDesglose
            eventosPorDia={eventosPorDia}
            formatearFecha={formatearFecha}
          />
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
          <ListaIngresos
            ingresos={datos.ingresos}
            formatearFecha={formatearFecha}
            formatearMoneda={formatearMoneda}
          />
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
          <ListaGastos
            gastos={datos.gastos}
            formatearFecha={formatearFecha}
            formatearMoneda={formatearMoneda}
          />
        </div>
      </div>
    </div>
  );
}
