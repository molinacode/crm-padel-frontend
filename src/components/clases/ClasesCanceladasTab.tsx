import ClasesEventosTable from './ClasesEventosTable';

interface Handlers {
  handleDesasignar?: (...args: unknown[]) => void;
  handleCancelar?: (...args: unknown[]) => void;
  handleEditar?: (...args: unknown[]) => void;
  handleEditarSerie?: (...args: unknown[]) => void;
  handleEditarProfesor?: (...args: unknown[]) => void;
  handleEliminar?: (...args: unknown[]) => void;
}

interface ClasesCanceladasTabProps {
  eventosCancelados: unknown[];
  getClassColors: (...args: unknown[]) => { badgeClass: string; label: string };
  handlers: Handlers;
  elementosPorPagina: number;
  paginaActual: number;
  setPaginaActual: (page: number) => void;
  totalPaginas: number;
  searchParams: URLSearchParams;
  onEliminarSerie?: (...args: unknown[]) => void;
}

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
}: ClasesCanceladasTabProps) {
  return (
    <div>
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
        <div className="flex items-center gap-3">
          <div className="text-2xl">❌</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-text">
              Clases Canceladas
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text2">
              Clases que han sido canceladas ({eventosCancelados.length} clases)
            </p>
          </div>
        </div>
      </div>

      <ClasesEventosTable
        eventos={eventosCancelados}
        getClassColors={getClassColors}
        onAsignar={null}
        onOcuparHuecos={null}
        onOcuparHuecosRecuperacion={null}
        onRecuperacion={null}
        onDesasignar={handlers.handleDesasignar}
        onCancelar={handlers.handleCancelar}
        onEditar={handlers.handleEditar}
        onEditarSerie={handlers.handleEditarSerie}
        onEditarProfesor={handlers.handleEditarProfesor}
        onEliminar={handlers.handleEliminar}
        onEliminarSerie={onEliminarSerie}
        onToggleExcluirAlquiler={null}
        elementosPorPagina={elementosPorPagina}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        searchParams={searchParams}
      />
    </div>
  );
}
