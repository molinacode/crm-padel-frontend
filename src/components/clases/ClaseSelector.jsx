import Paginacion from '../Paginacion';

/**
 * Componente para seleccionar una clase con filtros y paginación
 */
export default function ClaseSelector({
  clases,
  clasesFiltradas,
  clasesPaginadas,
  claseSeleccionada,
  setClaseSeleccionada,
  filtroNivel,
  setFiltroNivel,
  paginaClases,
  setPaginaClases,
  elementosPorPagina,
  totalPaginas,
  onEliminarClase,
  loading = false,
}) {
  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
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
              d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
            />
          </svg>
        </div>
        <div>
          <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
            Seleccionar Clase
          </h3>
          <p className='text-sm text-gray-500 dark:text-dark-text2'>
            {clasesFiltradas.length} de {clases.length} clases disponibles
            {filtroNivel && ` (filtradas por nivel: ${filtroNivel})`}
          </p>
        </div>
      </div>

      {/* Filtro por nivel */}
      <div className='mb-4'>
        <div className='flex items-center gap-3'>
          <label className='text-sm font-medium text-gray-700 dark:text-dark-text2'>
            🎯 Filtrar por nivel:
          </label>
          <select
            value={filtroNivel}
            onChange={e => {
              setFiltroNivel(e.target.value);
              setPaginaClases(1);
            }}
            className='border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface2 text-sm text-gray-900 dark:text-dark-text min-w-[150px]'
          >
            <option value=''>Todos los niveles</option>
            <option value='Iniciación (1)'>Iniciación (1)</option>
            <option value='Iniciación (2)'>Iniciación (2)</option>
            <option value='Medio (3)'>Medio (3)</option>
            <option value='Medio (4)'>Medio (4)</option>
            <option value='Avanzado (5)'>Avanzado (5)</option>
            <option value='Infantil (1)'>Infantil (1)</option>
            <option value='Infantil (2)'>Infantil (2)</option>
            <option value='Infantil (3)'>Infantil (3)</option>
          </select>
          {filtroNivel && (
            <button
              onClick={() => {
                setFiltroNivel('');
                setPaginaClases(1);
              }}
              className='px-2 py-1 text-xs font-medium text-gray-600 dark:text-dark-text2 hover:text-gray-800 dark:hover:text-dark-text bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200'
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {clasesFiltradas.length === 0 ? (
        <div className='text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <div className='text-6xl mb-4'>📚</div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
            {clases.length === 0
              ? 'No hay clases registradas'
              : 'No hay clases que coincidan con el filtro'}
          </h3>
          <p className='text-gray-500 dark:text-dark-text2'>
            {clases.length === 0
              ? 'Crea algunas clases primero para poder asignar alumnos'
              : filtroNivel
                ? `No se encontraron clases de nivel "${filtroNivel}". Intenta con otro nivel o limpia el filtro.`
                : 'No se encontraron clases disponibles'}
          </p>
          {filtroNivel && (
            <button
              onClick={() => {
                setFiltroNivel('');
                setPaginaClases(1);
              }}
              className='mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200'
            >
              Limpiar filtro
            </button>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Lista de clases mejorada */}
          <div className='space-y-3 max-h-[400px] overflow-y-auto'>
            {clasesPaginadas.map(clase => (
              <div
                key={clase.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  claseSeleccionada === clase.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                }`}
                onClick={() => setClaseSeleccionada(clase.id)}
                title={`ID: ${clase.id} | Tabla: clases | Eventos: ${clase.eventos_proximos?.length || 0}`}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <input
                        type='radio'
                        name='clase'
                        checked={claseSeleccionada === clase.id}
                        onChange={() => setClaseSeleccionada(clase.id)}
                        onClick={e => e.stopPropagation()}
                        className='w-4 h-4 text-blue-600'
                      />
                      <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                        {clase.nombre}
                      </h4>
                      <span className='text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded font-mono'>
                        ID: {clase.id}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          clase.tipo_clase === 'particular'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {clase.tipo_clase === 'particular'
                          ? '🎯 Particular'
                          : '👥 Grupal'}
                      </span>
                    </div>

                    <div className='grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-dark-text2'>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg'>📅</span>
                        <span>{clase.dia_semana}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg'>🎯</span>
                        <span>{clase.nivel_clase}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg'>👨‍🏫</span>
                        <span>{clase.profesor || 'Sin asignar'}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg'>📝</span>
                        <span>
                          {clase.observaciones ? 'Con notas' : 'Sin notas'}
                        </span>
                      </div>
                    </div>

                    {/* Mostrar próxima clase */}
                    {clase.eventos_proximos &&
                      clase.eventos_proximos.length > 0 && (
                        <div className='mt-3 pt-3 border-t border-gray-200 dark:border-dark-border'>
                          <div className='flex items-center gap-2 text-sm flex-wrap'>
                            <span className='text-lg'>⏰</span>
                            <span className='text-gray-500 dark:text-dark-text2'>
                              {clase.eventos_proximos[0]?.fecha
                                ? new Date(
                                    clase.eventos_proximos[0].fecha
                                  ).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                  })
                                : 'Sin fecha'}
                            </span>
                            <span className='text-gray-400'>•</span>
                            <span className='text-gray-500 dark:text-dark-text2'>
                              {clase.eventos_proximos[0].hora_inicio} -{' '}
                              {clase.eventos_proximos[0].hora_fin}
                            </span>
                            <span className='text-gray-400'>•</span>
                            <span className='text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono' title={`ID del evento en tabla eventos_clase`}>
                              EvID: {clase.eventos_proximos[0].id}
                            </span>
                            <span className='text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded'>
                              {clase.eventos_proximos.length} evento{clase.eventos_proximos.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                  <div className='flex flex-col gap-2 ml-4'>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `¿Estás seguro de que quieres eliminar la clase "${clase.nombre}"?\n\nEsta acción eliminará:\n- La clase y todos sus eventos\n- Todas las asignaciones de alumnos\n- Todas las asistencias relacionadas\n\nEsta acción NO se puede deshacer.`
                          )
                        ) {
                          onEliminarClase(clase.id, clase.nombre);
                        }
                      }}
                      className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      title='Eliminar clase'
                      disabled={loading}
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
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <Paginacion
              paginaActual={paginaClases}
              totalPaginas={totalPaginas}
              onCambiarPagina={setPaginaClases}
              elementosPorPagina={elementosPorPagina}
              totalElementos={clasesFiltradas.length}
            />
          )}
        </div>
      )}
    </div>
  );
}

