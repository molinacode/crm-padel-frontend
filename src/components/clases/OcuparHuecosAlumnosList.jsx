/**
 * Lista de alumnos disponibles para ocupar huecos
 */
export default function OcuparHuecosAlumnosList({
  alumnosFiltrados,
  busqueda,
  setBusqueda,
  alumnosSeleccionados,
  huecosDisponibles,
  onToggleAlumno,
}) {
  return (
    <div className='p-6 overflow-y-auto max-h-[calc(90vh-300px)]'>
      {/* Búsqueda */}
      <div className='mb-6'>
        <input
          type='text'
          placeholder='Buscar alumnos...'
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-dark-text'
        />
      </div>

      {/* Lista de alumnos disponibles */}
      {alumnosFiltrados.length === 0 ? (
        <div className='text-center py-12'>
          <div className='bg-gray-100 dark:bg-gray-800/30 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center'>
            <svg
              className='w-12 h-12 text-gray-400 dark:text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
              />
            </svg>
          </div>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-dark-text mb-2'>
            No hay alumnos disponibles
          </h3>
          <p className='text-gray-500 dark:text-dark-text2'>
            {busqueda
              ? 'No se encontraron alumnos que coincidan con la búsqueda'
              : 'No hay huecos reales disponibles en esta clase o todos los alumnos activos ya están asignados'}
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-900 dark:text-dark-text'>
              Alumnos disponibles ({alumnosFiltrados.length})
            </h3>
            <span className='text-sm text-gray-500 dark:text-dark-text2'>
              Seleccionados: {alumnosSeleccionados.size}/{huecosDisponibles}
            </span>
          </div>

          {alumnosFiltrados.map(alumno => (
            <div
              key={alumno.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                alumnosSeleccionados.has(alumno.id)
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                  : 'border-gray-200 dark:border-dark-border hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm'
              }`}
              onClick={() => onToggleAlumno(alumno.id)}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <input
                    type='checkbox'
                    checked={alumnosSeleccionados.has(alumno.id)}
                    onChange={() => onToggleAlumno(alumno.id)}
                    onClick={e => e.stopPropagation()}
                    className='w-4 h-4 text-orange-600'
                  />
                  <div>
                    <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                      {alumno.nombre}
                      {alumno.recuperacion && (
                        <span className='ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'>
                          🔄 Recuperación
                        </span>
                      )}
                    </h4>
                    <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-dark-text2'>
                      {alumno.email && <span>📧 {alumno.email}</span>}
                      {alumno.telefono && <span>📱 {alumno.telefono}</span>}
                      {alumno.nivel && <span>🎯 {alumno.nivel}</span>}
                    </div>
                    {alumno.recuperacion && (
                      <div className='mt-2 text-xs text-purple-600 dark:text-purple-400'>
                        <p>
                          <strong>Clase original:</strong>{' '}
                          {alumno.recuperacion.clase_original?.nombre}
                        </p>
                        <p>
                          <strong>Falta:</strong>{' '}
                          {new Date(
                            alumno.recuperacion.fecha_falta
                          ).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {alumnosSeleccionados.has(alumno.id) && (
                  <div className='bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-medium'>
                    Seleccionado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

