import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { correspondeMesActual } from '../utils/calcularDeudas';
import { esAlumnoActivo } from '../utils/alumnoUtils';

export default function NotificacionesPagos() {
  const [alumnosConDeuda, setAlumnosConDeuda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarAlumnosConDeuda();
  }, []);

  const cargarAlumnosConDeuda = async () => {
    try {
      setLoading(true);

      // Obtener todos los alumnos activos asignados a clases que requieren pago directo
      const { data: alumnosAsignados, error: alumnosError } = await supabase
        .from('alumnos_clases')
        .select(
          `
          alumno_id,
          origen,
          alumnos!inner (
            id,
            nombre,
            email,
            telefono,
            activo
          ),
          clases!inner (
            id,
            tipo_clase,
            nombre
          )
        `
        )
        ;

      if (alumnosError) throw alumnosError;

      // Filtrar alumnos activos considerando fecha_baja en el cliente
      const alumnosAsignadosActivos = (alumnosAsignados || []).filter(asignacion => {
        const alumno = asignacion.alumnos;
        return alumno && esAlumnoActivo(alumno, new Date());
      });

      // Obtener todos los pagos
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .order('fecha_pago', { ascending: false });

      if (pagosError) throw pagosError;

      // Procesar alumnos y detectar deudas
      const alumnosConDeuda = [];
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

      // Agrupar alumnos únicos con sus clases que requieren pago directo
      const alumnosConClasesPagables = {};
      alumnosAsignadosActivos.forEach(asignacion => {
        const alumno = asignacion.alumnos;
        const clase = asignacion.clases;
        const origenAsignacion = asignacion.origen || 'escuela';

        // Solo considerar clases "Escuela" que requieren pago directo del alumno
        // Y solo si el origen de la asignación es "escuela"
        // (alumnos con origen "interna" en clases de escuela NO generan deuda automática)
        // Además, verificar que el alumno esté activo considerando fecha_baja
        if (
          origenAsignacion === 'escuela' &&
          clase.nombre?.includes('Escuela') &&
          esAlumnoActivo(alumno, new Date())
        ) {
          if (!alumnosConClasesPagables[alumno.id]) {
            alumnosConClasesPagables[alumno.id] = {
              ...alumno,
              clasesPagables: [],
            };
          }
          alumnosConClasesPagables[alumno.id].clasesPagables.push(clase);
        }
      });

      // Verificar pagos para cada alumno que tiene clases que requieren pago directo
      Object.values(alumnosConClasesPagables).forEach(alumno => {
        const pagosAlumno = pagos.filter(p => p.alumno_id === alumno.id);

        // Verificar si tiene pagos pendientes
        const tienePagoMesActual = pagosAlumno.some(
          p => p.tipo_pago === 'mensual' && correspondeMesActual(p.mes_cubierto, mesActual)
        );

        // Verificar pagos por clases (últimos 30 días)
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        const tienePagoClasesReciente = pagosAlumno.some(
          p =>
            p.tipo_pago === 'clases' &&
            p.fecha_inicio &&
            new Date(p.fecha_inicio) >= hace30Dias
        );

        // Si no tiene pagos recientes Y tiene clases que requieren pago directo, agregar a la lista de deudores
        if (
          !tienePagoMesActual &&
          !tienePagoClasesReciente &&
          alumno.clasesPagables.length > 0
        ) {
          const ultimoPago = pagosAlumno[0];
          const diasSinPagar = ultimoPago
            ? Math.floor(
                (hoy - new Date(ultimoPago.fecha_pago)) / (1000 * 60 * 60 * 24)
              )
            : 999; // Si nunca ha pagado

          alumnosConDeuda.push({
            ...alumno,
            diasSinPagar,
            ultimoPago: ultimoPago?.fecha_pago,
            tipoDeuda: tienePagoMesActual ? 'mensual' : 'clases',
            clasesPagables: alumno.clasesPagables.length,
          });
        }
      });

      // Ordenar por días sin pagar (mayor a menor)
      alumnosConDeuda.sort((a, b) => b.diasSinPagar - a.diasSinPagar);

      setAlumnosConDeuda(alumnosConDeuda);
    } catch (err) {
      console.error('Error cargando alumnos con deuda:', err);
      setError('Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded'></div>
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded'></div>
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='text-center text-red-500 dark:text-red-400'>
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
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
        <div>
          <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
            Alertas de Pagos Pendientes
          </h2>
          <p className='text-sm text-gray-500 dark:text-dark-text2'>
            Alumnos activos con clases "Escuela" que deben dinero
          </p>
        </div>
      </div>

      {alumnosConDeuda.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-6xl mb-4'>✅</div>
          <h4 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            ¡Todo al día!
          </h4>
          <p className='text-gray-500 dark:text-dark-text2'>
            Todos los alumnos activos tienen sus pagos al corriente
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {alumnosConDeuda.slice(0, 5).map(alumno => (
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
                    <Link
                      to={`/alumno/${alumno.id}`}
                      className='font-semibold text-gray-900 dark:text-dark-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
                    >
                      {alumno.nombre}
                    </Link>
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
                      {new Date(alumno.ultimoPago).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Link
                    to={`/pagos?alumno=${alumno.id}`}
                    className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors'
                  >
                    💰 Registrar Pago
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {alumnosConDeuda.length > 5 && (
            <div className='text-center pt-4 border-t border-gray-200 dark:border-dark-border'>
              <p className='text-sm text-gray-500 dark:text-dark-text2'>
                Y {alumnosConDeuda.length - 5} alumnos más con pagos
                pendientes...
              </p>
              <Link
                to='/pagos'
                className='mt-2 inline-block px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center'
                aria-label='Ver todos los pagos registrados'
              >
                Ver todos los pagos
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
