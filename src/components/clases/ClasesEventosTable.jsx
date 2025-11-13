import Paginacion from '../Paginacion';
import { useSearchParams } from 'react-router-dom';

export default function ClasesEventosTable({
  eventos,
  getClassColors,
  onAsignar,
  onOcuparHuecos,
  onOcuparHuecosRecuperacion,
  onRecuperacion,
  onDesasignar,
  onCancelar,
  onEditar,
  onEditarSerie,
  onEditarProfesor,
  onEliminar,
  onEliminarSerie,
  onToggleExcluirAlquiler,
  elementosPorPagina = 10,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  searchParams,
}) {
  const [searchParamsHook] = useSearchParams();
  const params = searchParams || searchParamsHook;

  if (!eventos || eventos.length === 0) {
    return (
      <div className='text-center py-12 text-gray-500 dark:text-dark-text2'>
        <div className='flex flex-col items-center space-y-2'>
          <div className='text-4xl'>📅</div>
          <div className='text-lg font-medium'>No hay eventos registrados</div>
          <div className='text-sm'>Crea tu primera clase para comenzar</div>
        </div>
      </div>
    );
  }

  const eventosPaginados = eventos.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

  return (
    <>
      <div className='overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border shadow-sm'>
        <div className='sticky top-0 z-10 flex justify-between items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-transparent dark:from-dark-surface2 dark:to-transparent pointer-events-none lg:hidden'>
          <span className='text-xs text-gray-500 dark:text-dark-text2 font-medium'>
            ← Desliza para ver más →
          </span>
        </div>

        <table className='w-full text-sm table-hover-custom min-w-[600px] md:min-w-[800px] lg:min-w-[900px]'>
          <thead className='bg-gray-50 dark:bg-dark-surface2'>
            <tr>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Fecha
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Hora
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Clase
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Tipo
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Profesor
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Alumnos
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Estado
              </th>
              <th className='text-left py-4 px-4 font-semibold text-gray-700 dark:text-dark-text'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {eventosPaginados.map(evento => (
              <tr
                key={evento.id}
                id={`evento-${evento.id}`}
                className='border-b border-gray-100 dark:border-dark-border transition-colors duration-150'
              >
                <td className='py-4 px-4'>
                  <div className='font-semibold text-gray-900 dark:text-dark-text'>
                    {evento.start.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <div className='text-gray-600 dark:text-dark-text2 font-medium'>
                    {evento.start.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {evento.end.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <div className='font-semibold text-gray-900 dark:text-dark-text'>
                    {evento.resource.clases.nombre}
                  </div>
                  <div className='text-sm text-gray-500 dark:text-dark-text2 mt-1'>
                    {evento.resource.clases.nivel_clase}
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      getClassColors(
                        evento.resource.clases,
                        evento.resource.estado === 'cancelada'
                      ).badgeClass
                    }`}
                  >
                    {
                      getClassColors(
                        evento.resource.clases,
                        evento.resource.estado === 'cancelada'
                      ).label
                    }
                  </span>
                </td>
                <td className='py-4 px-4'>
                  <div className='flex items-center gap-2'>
                    <div className='text-gray-700 dark:text-dark-text font-medium'>
                      {evento.resource.clases.profesor || 'Sin asignar'}
                    </div>
                    {onEditarProfesor && (
                      <button
                        onClick={() => onEditarProfesor(evento)}
                        className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium'
                        title='Cambiar profesor de esta clase'
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <div className='space-y-2'>
                    <div className='flex flex-wrap gap-1'>
                      {evento.alumnosAsignados?.length === 0 ? (
                        <span className='text-sm text-gray-400 dark:text-dark-text2 italic'>
                          Sin alumnos
                        </span>
                      ) : (
                        evento.alumnosAsignados?.map(alumno => {
                          const esJustificado =
                            evento.alumnosJustificados?.some(
                              j => j.id === alumno.id
                            );
                          return (
                            <span
                              key={alumno.id}
                              className={`px-2 py-1 rounded-full text-sm font-medium ${
                                esJustificado
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 line-through'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                              title={
                                esJustificado ? 'Falta justificada' : 'Asignado'
                              }
                            >
                              {alumno.nombre} {esJustificado && '⚠️'}
                            </span>
                          );
                        })
                      )}
                    </div>
                    {evento.huecosDisponibles > 0 && (
                      <div className='mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800/30'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-orange-600 dark:text-orange-400 text-sm font-medium'>
                            ⚠️ Huecos disponibles:
                          </span>
                          <span className='text-orange-700 dark:text-orange-300 font-semibold'>
                            {evento.huecosDisponibles}
                          </span>
                        </div>
                        <div className='text-xs text-orange-600 dark:text-orange-400'>
                          {evento.alumnosJustificados
                            ?.map(j => j.nombre)
                            .join(', ')}
                        </div>
                      </div>
                    )}
                    <div className='text-xs text-gray-500 dark:text-dark-text2'>
                      {evento.alumnosPresentes || 0}/
                      {evento.resource.clases.tipo_clase === 'particular'
                        ? '1'
                        : '4'}{' '}
                      alumno
                      {evento.resource.clases.tipo_clase === 'particular'
                        ? ''
                        : 's'}
                      {evento.huecosDisponibles > 0 && (
                        <span className='ml-2 text-orange-600 dark:text-orange-400'>
                          ({evento.huecosDisponibles} hueco
                          {evento.huecosDisponibles !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    {evento.excluirAlquiler && (
                      <div className='inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300'>
                        Sin alquiler
                      </div>
                    )}
                  </div>
                </td>
                <td className='py-4 px-4'>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      evento.resource.estado === 'cancelada'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {evento.resource.estado === 'cancelada'
                      ? '❌ Cancelada'
                      : '✅ Programada'}
                  </span>
                </td>
                <td className='py-4 px-4'>
                  <div className='flex space-x-2 flex-wrap'>
                    {onAsignar && (
                      <button
                        onClick={() => onAsignar(evento)}
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[38px]'
                      >
                        Asignar
                      </button>
                    )}
                    {params?.get?.('alumno') && onRecuperacion && (
                      <button
                        onClick={() => onRecuperacion(evento)}
                        className='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 min-h-[38px]'
                        title='Asignar esta clase como recuperación'
                      >
                        <svg
                          className='w-3 h-3'
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
                        Recuperación
                      </button>
                    )}
                    {((evento.huecosDisponibles ?? 0) > 0 || evento.alumnosJustificados?.length > 0) && onOcuparHuecos && (
                      <button
                        onClick={() => onOcuparHuecos(evento)}
                        className='px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 min-h-[38px]'
                        title={`Asignar alumnos a huecos disponibles (${evento.alumnosJustificados?.length || 0} alumno${evento.alumnosJustificados?.length !== 1 ? 's' : ''} con falta justificada)`}
                      >
                        <svg
                          className='w-3 h-3'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                          />
                        </svg>
                        Ocupar huecos ({evento.huecosDisponibles ?? 0})
                      </button>
                    )}
                    {((evento.huecosDisponibles ?? 0) > 0 || evento.alumnosJustificados?.length > 0) && onOcuparHuecosRecuperacion && (
                      <button
                        onClick={() => onOcuparHuecosRecuperacion(evento)}
                        className='px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 min-h-[38px]'
                        title='Ocupar huecos disponibles con alumnos que tienen recuperaciones pendientes'
                      >
                        <svg
                          className='w-3 h-3'
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
                        Recuperar ({evento.huecosDisponibles ?? 0})
                      </button>
                    )}
                    {onDesasignar && (
                      <button
                        onClick={() => onDesasignar(evento)}
                        className='text-fuchsia-700 hover:text-fuchsia-900 dark:text-fuchsia-400 dark:hover:text-fuchsia-300 text-sm font-medium flex items-center gap-1'
                        title={`Desasignar alumnos (${evento.alumnosPresentes}/${evento.resource.clases.tipo_clase === 'particular' ? 1 : 4})`}
                      >
                        <svg
                          className='w-3 h-3'
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
                        Desasignar
                      </button>
                    )}
                    {onCancelar && (
                      <button
                        onClick={() => onCancelar(evento)}
                        className='text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium'
                      >
                        {evento.resource.estado === 'cancelada'
                          ? 'Reactivar'
                          : 'Cancelar'}
                      </button>
                    )}
                    {onToggleExcluirAlquiler && (
                      <button
                        onClick={() => onToggleExcluirAlquiler(evento)}
                        className={`text-sm font-medium ${
                          evento.excluirAlquiler || evento.resource?.excluir_alquiler
                            ? 'text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                            : 'text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300'
                        }`}
                        title={
                          evento.excluirAlquiler || evento.resource?.excluir_alquiler
                            ? 'Incluir esta clase en el cálculo de alquiler'
                            : 'Excluir esta clase del cálculo de alquiler'
                        }
                      >
                        {evento.excluirAlquiler || evento.resource?.excluir_alquiler ? 'Incluir alquiler' : 'Excluir alquiler'}
                      </button>
                    )}
                    {onEditar && (
                      <button
                        onClick={() => onEditar(evento)}
                        className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium'
                        title='Cambiar día y hora de este evento individual'
                      >
                        📅 Cambiar día/hora
                      </button>
                    )}
                    {onEditarSerie && (
                      <button
                        onClick={() => onEditarSerie(evento)}
                        className='text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium'
                        title='Cambiar hora de inicio y fin para TODA la serie de eventos'
                      >
                        🔄 Cambiar hora serie
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        onClick={() => onEliminar(evento)}
                        className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium'
                      >
                        Eliminar
                      </button>
                    )}
                    {onEliminarSerie && (
                      <button
                        onClick={() => onEliminarSerie(evento)}
                        className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium'
                        title='Eliminar toda la serie de eventos'
                      >
                        Eliminar Serie
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div className='mt-4'>
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPaginaActual}
            elementosPorPagina={elementosPorPagina}
            totalElementos={eventos.length}
          />
        </div>
      )}
    </>
  );
}
