/**
 * Componente para mostrar la lista de alumnos disponibles con búsqueda
 */
export default function AlumnosDisponiblesList({
  alumnos,
  alumnosFiltrados,
  busqueda,
  setBusqueda,
  asignados,
  maxAlcanzado,
  onToggleAlumno,
  claseActual = null,
}) {
  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg'>
          <svg
            className='w-5 h-5 text-blue-600 dark:text-blue-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
            />
          </svg>
        </div>
        <div>
          <h4 className='text-lg font-bold text-gray-900 dark:text-dark-text'>
            Alumnos Disponibles
          </h4>
          <p className='text-sm text-gray-500 dark:text-dark-text2'>
            {busqueda
              ? `${alumnosFiltrados.length} de ${alumnos.length} alumnos`
              : `${alumnos.length} alumnos`}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className='mb-6'>
        <div className='relative'>
          <input
            type='text'
            placeholder='🔍 Buscar por nombre...'
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className='w-full px-4 py-3 pl-10 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text'
          />
          <svg
            className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
      </div>

      {/* Lista de alumnos */}
      <div className='max-h-96 overflow-y-auto space-y-3'>
        {alumnosFiltrados.length === 0 ? (
          <div className='text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <div className='text-4xl mb-2'>🔍</div>
            <p className='text-gray-500 dark:text-dark-text2'>
              No se encontraron alumnos
            </p>
            <p className='text-sm text-gray-400 dark:text-dark-text2'>
              Intenta con otros términos de búsqueda
            </p>
          </div>
        ) : (
          alumnosFiltrados.map(alumno => (
            <div
              key={alumno.id}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                asignados.has(alumno.id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : maxAlcanzado && !asignados.has(alumno.id)
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
                    : 'border-gray-200 dark:border-dark-border hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm'
              }`}
              onClick={() => {
                if (!maxAlcanzado || asignados.has(alumno.id)) {
                  onToggleAlumno(alumno.id);
                }
              }}
            >
                        <div className='flex items-center gap-4'>
                          <div
                            className={`${alumno.nivel ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm'} rounded-full flex items-center justify-center font-medium ${
                              asignados.has(alumno.id)
                                ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {alumno.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className='flex-1'>
                            <p className={`${alumno.nivel ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-dark-text`}>
                              {alumno.nombre}
                            </p>
                            {alumno.email && (
                              <p className='text-xs text-gray-500 dark:text-dark-text2'>
                                {alumno.email}
                              </p>
                            )}
                            {alumno.nivel && (
                              <div className='flex items-center gap-2 mt-1'>
                                <span className='text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'>
                                  🎯 {alumno.nivel}
                                </span>
                                {claseActual &&
                                  alumno.nivel !== claseActual.nivel_clase && (
                                    <span className='text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center gap-1'>
                                      ⚠️ Nivel diferente
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center'>
                          {asignados.has(alumno.id) ? (
                            <span className='text-green-600 dark:text-green-400 text-xl'>
                              ✓
                            </span>
                          ) : maxAlcanzado ? (
                            <span className='text-gray-400 dark:text-gray-600 text-sm font-medium'>
                              Lleno
                            </span>
                          ) : (
                            <span className='text-blue-600 dark:text-blue-400 text-xl'>
                              +
                            </span>
                          )}
                        </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

