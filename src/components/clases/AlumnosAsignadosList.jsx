/**
 * Componente para mostrar la lista de alumnos asignados
 */
export default function AlumnosAsignadosList({
  asignados,
  alumnos,
  maxAlumnos,
  onToggleAlumno,
}) {
  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
      <div className='flex items-center gap-3 mb-4'>
        <div className='bg-green-100 dark:bg-green-900/30 p-2 rounded-lg'>
          <svg
            className='w-5 h-5 text-green-600 dark:text-green-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M5 13l4 4L19 7'
            />
          </svg>
        </div>
        <h4 className='text-lg font-bold text-gray-900 dark:text-dark-text'>
          Alumnos Asignados ({asignados.size}/{maxAlumnos})
        </h4>
      </div>

      {asignados.size > 0 ? (
        <div className='space-y-3'>
          {Array.from(asignados).map(alumnoId => {
            const alumno = alumnos.find(a => a.id === alumnoId);
            return (
              <div
                key={alumnoId}
                className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center text-sm font-medium text-green-800 dark:text-green-200'>
                    {alumno?.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className='font-medium text-gray-900 dark:text-dark-text'>
                      {alumno?.nombre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleAlumno(alumnoId)}
                  className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                  title='Quitar alumno'
                >
                  <svg
                    className='w-4 h-4'
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
            );
          })}
        </div>
      ) : (
        <div className='text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <div className='text-4xl mb-2'>👥</div>
          <p className='text-gray-500 dark:text-dark-text2'>
            No hay alumnos asignados
          </p>
          <p className='text-sm text-gray-400 dark:text-dark-text2'>
            Selecciona alumnos de la lista de abajo
          </p>
        </div>
      )}
    </div>
  );
}

