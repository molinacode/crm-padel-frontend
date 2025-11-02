import { useNavigate } from 'react-router-dom';

export default function FichaAlumnoTabRecuperaciones({
  recuperaciones,
  alumnoId,
  onCompletar,
  onAsignar,
  onCancelar,
}) {
  const navigate = useNavigate();
  const recuperacionesArray = Array.isArray(recuperaciones)
    ? recuperaciones
    : [];

  if (recuperacionesArray.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>🔄</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          No hay recuperaciones pendientes
        </h3>
        <p className='text-gray-500 dark:text-dark-text2'>
          Este alumno no tiene clases pendientes de recuperación
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
        <div className='flex items-center'>
          <div className='text-yellow-600 dark:text-yellow-400 mr-3'>
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
          </div>
          <div>
            <h4 className='text-sm font-medium text-yellow-800 dark:text-yellow-300'>
              Clases pendientes de recuperación
            </h4>
            <p className='text-sm text-yellow-700 dark:text-yellow-400'>
              Estas clases deben ser recuperadas por faltas justificadas
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        {recuperacionesArray.map(recuperacion => (
          <div
            key={recuperacion?.id || Math.random()}
            className='bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition-shadow'
          >
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <h5 className='font-medium text-gray-900 dark:text-dark-text'>
                  {recuperacion?.clases?.nombre || 'Clase eliminada'}
                </h5>
                <div className='mt-1 text-sm text-gray-600 dark:text-dark-text2'>
                  <p>
                    <span className='font-medium'>Fecha de falta:</span>{' '}
                    {recuperacion?.fecha_falta
                      ? new Date(recuperacion.fecha_falta).toLocaleDateString(
                          'es-ES'
                        )
                      : 'N/A'}
                  </p>
                  <p>
                    <span className='font-medium'>Nivel:</span>{' '}
                    {recuperacion?.clases?.nivel_clase || 'N/A'}
                  </p>
                  <p>
                    <span className='font-medium'>Tipo:</span>{' '}
                    {recuperacion?.clases?.tipo_clase || 'N/A'}
                  </p>
                  {recuperacion?.observaciones && (
                    <p className='mt-2 text-xs text-gray-500 dark:text-dark-text2'>
                      {recuperacion.observaciones}
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-center space-x-2 ml-4'>
                <button
                  onClick={() => recuperacion && onCompletar?.(recuperacion)}
                  className='px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors'
                >
                  ✅ Completar
                </button>
                <button
                  onClick={() => recuperacion && onAsignar?.(recuperacion)}
                  className='px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors'
                  title='Ir a Clases para asignar esta recuperación'
                >
                  📝 Asignar
                </button>
                <button
                  onClick={() => recuperacion && onCancelar?.(recuperacion)}
                  className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors'
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
