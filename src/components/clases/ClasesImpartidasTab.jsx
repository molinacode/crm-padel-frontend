import ClasesEventosTable from './ClasesEventosTable';

export default function ClasesImpartidasTab({
  eventosImpartidos,
  getClassColors,
  handlers,
  elementosPorPagina,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  searchParams,
}) {
  // La paginación la gestiona la tabla para evitar doble slicing

  return (
    <div>
      {/* Header informativo */}
      <div className='mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-dark-border'>
        <div className='flex items-center gap-3'>
          <div className='text-2xl'>📚</div>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-dark-text'>
              Clases Impartidas
            </h3>
            <p className='text-sm text-gray-600 dark:text-dark-text2'>
              Clases que ya han sido impartidas o canceladas (
              {eventosImpartidos.length} clases)
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de clases impartidas */}
      <ClasesEventosTable
        eventos={eventosImpartidos}
        getClassColors={getClassColors}
        onAsignar={null}
        onOcuparHuecos={null}
        onRecuperacion={null}
        onDesasignar={handlers.handleDesasignar}
        onCancelar={handlers.handleCancelar}
        onEditar={handlers.handleEditar}
        onEliminar={handlers.handleEliminar}
        elementosPorPagina={elementosPorPagina}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        searchParams={searchParams}
      />
    </div>
  );
}
