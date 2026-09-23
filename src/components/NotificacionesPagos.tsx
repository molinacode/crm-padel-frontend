import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import {
  calcularAlumnosConDeuda,
  type AlumnoConDeuda,
} from '../utils/calcularDeudas';

export default function NotificacionesPagos() {
  const [alumnosConDeuda, setAlumnosConDeuda] = useState<AlumnoConDeuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    return scheduleEffectWork(() => {
      void (async () => {
        try {
          setLoading(true);
          const { alumnos } = await calcularAlumnosConDeuda();
          setAlumnosConDeuda(alumnos);
        } catch (err) {
          console.error('Error cargando alumnos con deuda:', err);
          setError('Error al cargar las notificaciones');
        } finally {
          setLoading(false);
        }
      })();
    });
  }, []);

  if (loading) {
    return (
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='text-center text-red-500 dark:text-red-400'>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
      <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-dark-text'>
        Deudas
      </h3>
      {alumnosConDeuda.length === 0 ? (
        <div className='text-center py-8'>
          <h4 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            Todo al día
          </h4>
        </div>
      ) : (
        <div className='space-y-4'>
          {alumnosConDeuda.slice(0, 5).map(alumno => (
            <div key={alumno.id} className='p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20'>
              <div className='flex justify-between items-start gap-3'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Link to={`/alumno/${alumno.id}`} className='font-semibold text-gray-900 dark:text-dark-text'>
                      {alumno.nombre}
                    </Link>
                    {alumno.baja && (
                      <span className='text-xs text-gray-500'>Baja</span>
                    )}
                  </div>
                  <p className='text-sm text-gray-600 dark:text-dark-text2'>
                    {alumno.mesReferencia}
                  </p>
                </div>
                <Link
                  to='/pagos'
                  className='px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300'
                >
                  Ver deudas
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
