import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@shared';
import { formatDateES, formatEUR } from '../utils/date';
import { normalizeText } from '../utils/text';
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

  // Función para determinar tipo de clase: usa utils de texto para normalizar
  const getTipoClase = useCallback((nombre, tipoClase) => {
    const t = normalizeText(tipoClase);
    const n = normalizeText(nombre);
    const includes = (term) => t === term || n.includes(term);

    if (includes('interna')) return { tipo: 'ingreso', valor: 15, descripcion: 'Clase interna' };
    if (includes('escuela')) return { tipo: 'gasto', valor: 21, descripcion: 'Alquiler escuela' };
    if (includes('particular')) return { tipo: 'neutro', valor: 0, descripcion: 'Clase particular (ingreso manual)' };
    if (includes('grupal')) return { tipo: 'ingreso', valor: 15, descripcion: 'Clase grupal' };
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

  const formatearFecha = fecha =>
    formatDateES(fecha, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatearMoneda = cantidad => formatEUR(cantidad);

  const getTitulo = () => {
    switch (tipo) {
      case 'hoy':
        return 'Detalle de Hoy';
      case 'semana':
        return 'Detalle de Esta Semana';
      case 'mes':
        return 'Detalle de Este Mes';
      default:
        return `Detalle del Año`;
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

      {/* Detalle mensual cuando el tipo es año */}
      {tipo === 'año' && (
        <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text'>
              Detalle mensual del año
            </h3>
            {(() => {
              const years = new Set();
              const añoActual = new Date().getFullYear();
              const añoAnterior = añoActual - 1;
              
              // Siempre incluir el año actual y el anterior
              years.add(añoActual);
              years.add(añoAnterior);
              
              // Agregar años de los datos
              (datos.eventos || []).forEach(e =>
                years.add(new Date(e.fecha).getFullYear())
              );
              (datos.ingresos || []).forEach(i =>
                years.add(new Date(i.fecha_pago).getFullYear())
              );
              (datos.gastos || []).forEach(g =>
                years.add(
                  new Date(
                    g.fecha_gasto || g.fecha || g.created_at
                  ).getFullYear()
                )
              );
              
              const disponibles = Array.from(years).sort((a, b) => a - b);
              const sel = fecha
                ? new Date(fecha).getFullYear()
                : disponibles[disponibles.length - 1] ||
                  new Date().getFullYear();
              const idx = disponibles.indexOf(sel);
              const prev = idx > 0 ? disponibles[idx - 1] : null;
              const next =
                idx >= 0 && idx < disponibles.length - 1
                  ? disponibles[idx + 1]
                  : null;
              
              return (
                <div className='flex items-center gap-2'>
                  <button
                    disabled={!prev}
                    onClick={() =>
                      prev &&
                      navigate(
                        `/instalaciones/detalle?tipo=año&fecha=${prev}-01-01`
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      prev 
                        ? 'border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface2 text-gray-700 dark:text-dark-text' 
                        : 'opacity-40 cursor-not-allowed border-gray-200 dark:border-dark-border'
                    }`}
                    title={prev ? `Ver año ${prev}` : ''}
                  >
                    ◀︎ {prev || ''}
                  </button>
                  <div className='px-4 py-1.5 font-semibold text-lg text-gray-900 dark:text-dark-text bg-gray-50 dark:bg-dark-surface2 rounded-lg'>
                    {sel}
                  </div>
                  <button
                    disabled={!next}
                    onClick={() =>
                      next &&
                      navigate(
                        `/instalaciones/detalle?tipo=año&fecha=${next}-01-01`
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      next 
                        ? 'border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface2 text-gray-700 dark:text-dark-text' 
                        : 'opacity-40 cursor-not-allowed border-gray-200 dark:border-dark-border'
                    }`}
                    title={next ? `Ver año ${next}` : ''}
                  >
                    {next || ''} ▶︎
                  </button>
                </div>
              );
            })()}
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {(() => {
              const mesesNombres = [
                'Enero',
                'Febrero',
                'Marzo',
                'Abril',
                'Mayo',
                'Junio',
                'Julio',
                'Agosto',
                'Septiembre',
                'Octubre',
                'Noviembre',
                'Diciembre',
              ];
              const añoActual = fecha
                ? new Date(fecha).getFullYear()
                : new Date().getFullYear();
              const mensual = Array.from({ length: 12 }, () => ({
                ingresos: 0,
                gastos: 0,
              }));

              // Sumar por evento (ingresos/gastos auto) agrupando por mes
              Object.values(eventosPorDia || {}).forEach(d => {
                const fecha = new Date(d.fecha);
                if (fecha.getFullYear() === añoActual) {
                  const m = fecha.getMonth();
                  mensual[m].ingresos += d.ingresos || 0;
                  mensual[m].gastos += d.gastos || 0;
                }
              });

              // Sumar gastos de material por mes
              (datos.gastos || []).forEach(g => {
                const f = g.fecha_gasto || g.fecha || g.created_at;
                if (!f) return;
                const fecha = new Date(f);
                if (fecha.getFullYear() === añoActual) {
                  mensual[fecha.getMonth()].gastos += Number(
                    g.cantidad || g.importe || 0
                  );
                }
              });

              // Sumar ingresos reales (pagos) por mes
              (datos.ingresos || []).forEach(i => {
                const fi = new Date(i.fecha_pago);
                if (fi.getFullYear() === añoActual) {
                  mensual[fi.getMonth()].ingresos += Number(i.cantidad || 0);
                }
              });

              return mesesNombres.map((nombreMes, idx) => {
                const m = mensual[idx];
                const balance = (m.ingresos || 0) - (m.gastos || 0);
                const fechaMes = `${añoActual}-${String(idx + 1).padStart(2, '0')}-01`;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      navigate(
                        `/instalaciones/detalle?tipo=mes&fecha=${fechaMes}`
                      )
                    }
                    className='text-left rounded-xl border border-gray-200 dark:border-dark-border p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='font-medium text-gray-800 dark:text-dark-text'>
                        {nombreMes}
                      </span>
                      <span
                        className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {balance.toFixed(2)}€
                      </span>
                    </div>
                    <div className='text-sm text-gray-600 dark:text-dark-text2'>
                      <div>
                        Ingresos:{' '}
                        <span className='font-medium text-gray-800 dark:text-dark-text'>
                          {(m.ingresos || 0).toFixed(2)}€
                        </span>
                      </div>
                      <div>
                        Gastos:{' '}
                        <span className='font-medium text-gray-800 dark:text-dark-text'>
                          {(m.gastos || 0).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Desglose día por día: solo para vistas distintas de Año */}
      {tipo !== 'año' && (
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
      )}

      {/* Ingresos: oculto en vista de año */}
      {tipo !== 'año' && (
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
      )}

      {/* Gastos: oculto en vista de año */}
      {tipo !== 'año' && (
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
      )}
    </div>
  );
}
