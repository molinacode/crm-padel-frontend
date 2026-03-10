import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function InfoClasesExternas() {
  const [clasesExternas, setClasesExternas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarClasesExternas();
  }, []);

  const cargarClasesExternas = async () => {
    try {
      setLoading(true);

      // Obtener solo clases internas (no requieren pago directo del alumno)
      const { data: clases, error } = await supabase
        .from('clases')
        .select(
          `
          id,
          nombre,
          tipo_clase,
          nivel_clase,
          dia_semana,
          hora_inicio,
          hora_fin,
          alumnos_clases (
            alumno_id,
            alumnos (
              id,
              nombre
            )
          )
        `
        )
        .eq('tipo_clase', 'interna');

      if (error) throw error;

      // Procesar datos para mostrar información útil
      const clasesProcesadas = clases.map(clase => ({
        ...clase,
        alumnosAsignados:
          clase.alumnos_clases?.map(ac => ac.alumnos).filter(Boolean) || [],
        totalAlumnos: clase.alumnos_clases?.length || 0,
      }));

      setClasesExternas(clasesProcesadas);
    } catch (err) {
      console.error('Error cargando clases externas:', err);
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

  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-gray-200 dark:border-dark-border'>
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
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <div>
          <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
            Clases Internas
          </h3>
          <p className='text-sm text-gray-500 dark:text-dark-text2'>
            Clases internas (los alumnos no deben dinero)
          </p>
        </div>
      </div>

      {clasesExternas.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-6xl mb-4'>📚</div>
          <h4 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            No hay clases internas
          </h4>
          <p className='text-gray-500 dark:text-dark-text2'>
            No se encontraron clases internas registradas
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {clasesExternas.map(clase => (
            <div
              key={clase.id}
              className='p-4 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20'
            >
              <div className='flex justify-between items-start'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                      {clase.nombre}
                    </h4>
                    <span className='px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                      🏠 Interna
                    </span>
                  </div>
                  <div className='text-sm text-gray-600 dark:text-dark-text2 space-y-1'>
                    <p>
                      📅 {clase.dia_semana} • 🕐 {clase.hora_inicio} -{' '}
                      {clase.hora_fin}
                    </p>
                    <p>📚 {clase.nivel_clase}</p>
                    <p>
                      👥 {clase.totalAlumnos} alumno
                      {clase.totalAlumnos !== 1 ? 's' : ''} asignado
                      {clase.totalAlumnos !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {clase.alumnosAsignados.length > 0 && (
                    <div className='mt-2'>
                      <p className='text-xs text-gray-500 dark:text-dark-text2 mb-1'>
                        Alumnos:
                      </p>
                      <div className='flex flex-wrap gap-1'>
                        {clase.alumnosAsignados.slice(0, 3).map(alumno => (
                          <span
                            key={alumno.id}
                            className='px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full'
                          >
                            {alumno.nombre}
                          </span>
                        ))}
                        {clase.alumnosAsignados.length > 3 && (
                          <span className='px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full'>
                            +{clase.alumnosAsignados.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className='text-right'>
                  <div className='text-xs text-gray-500 dark:text-dark-text2'>
                    💰 Pago externo
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className='pt-4 border-t border-gray-200 dark:border-dark-border'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='text-blue-600 dark:text-blue-400 text-lg'>
                  ℹ️
                </div>
                <div>
                  <p className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                    Información importante
                  </p>
                  <p className='text-xs text-blue-700 dark:text-blue-300'>
                    Los alumnos de estas clases internas no aparecen en las
                    alertas de pagos pendientes porque el pago lo realiza un
                    tercero (empresa, institución, etc.). Estas clases pueden
                    ser grupales o particulares según su capacidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
