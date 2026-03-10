import AsignarAlumnosClase from '../AsignarAlumnosClase';

export default function ModalAsignarAlumnos({
  eventoParaAsignar,
  onClose,
  onSuccess,
  refreshTrigger,
}) {
  if (!eventoParaAsignar) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div
        className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-asignar-alumnos ${
          eventoParaAsignar.alumnoRecuperacion
            ? 'bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-200 dark:border-purple-700'
            : 'bg-white dark:bg-dark-surface'
        }`}
      >
        <div className='p-6'>
          {eventoParaAsignar.alumnoRecuperacion && (
            <div className='mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg'>
              <div className='flex items-center'>
                <div className='text-purple-600 dark:text-purple-400 mr-3'>
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
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-purple-800 dark:text-purple-300'>
                    Asignación de Recuperación
                  </h3>
                  <p className='text-sm text-purple-700 dark:text-purple-400'>
                    Estás asignando una clase de recuperación. El alumno tiene
                    derecho a recuperar esta clase por una falta justificada.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text'>
              Asignar Alumnos a Clase
            </h2>
            <button
              onClick={onClose}
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

          <AsignarAlumnosClase
            eventoParaAsignar={eventoParaAsignar}
            onCancel={onClose}
            onSuccess={onSuccess}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
