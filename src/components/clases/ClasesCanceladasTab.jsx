import ClasesEventosTable from './ClasesEventosTable';

export default function ClasesCanceladasTab({
  eventosCancelados,
  getClassColors,
  handlers,
  elementosPorPagina,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  searchParams,
  onEliminarSerie,
}) {
  return (
    <div>
      {/* Header informativo */}
      <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30'>
        <div className='flex items-center gap-3'>
          <div className='text-2xl'>❌</div>
          <div>
            <h3 className='font-semibold text-gray-900 dark:text-dark-text'>
              Clases Canceladas
            </h3>
            <p className='text-sm text-gray-600 dark:text-dark-text2'>
              Clases que han sido canceladas ({eventosCancelados.length} clases)
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de clases canceladas */}
      <ClasesEventosTable
        eventos={eventosCancelados}
        getClassColors={getClassColors}
        onAsignar={null}
        onOcuparHuecos={null}
        onRecuperacion={null}
        onDesasignar={handlers.handleDesasignar}
        onCancelar={handlers.handleCancelar}
        onEditar={handlers.handleEditar}
        onEditarSerie={handlers.handleEditarSerie}
        onEditarProfesor={handlers.handleEditarProfesor}
        onEliminar={handlers.handleEliminar}
        onEliminarSerie={onEliminarSerie}
        elementosPorPagina={elementosPorPagina}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        searchParams={searchParams}
      />
    </div>
  );
}
