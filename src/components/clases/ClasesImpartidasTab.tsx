import ClasesEventosTable from './ClasesEventosTable';

interface Handlers {
  handleOcuparHuecos?: (...args: unknown[]) => void;
  handleOcuparHuecosRecuperacion?: (...args: unknown[]) => void;
  handleRecuperacion?: (...args: unknown[]) => void;
  handleDesasignar?: (...args: unknown[]) => void;
  handleCancelar?: (...args: unknown[]) => void;
  handleEditar?: (...args: unknown[]) => void;
  handleEditarSerie?: (...args: unknown[]) => void;
  handleEditarProfesor?: (...args: unknown[]) => void;
  handleEliminar?: (...args: unknown[]) => void;
  handleToggleExcluirAlquiler?: (...args: unknown[]) => void;
}

interface ClasesImpartidasTabProps {
  eventosImpartidos: unknown[];
  getClassColors: (...args: unknown[]) => { badgeClass: string; label: string };
  handlers: Handlers;
  elementosPorPagina: number;
  paginaActual: number;
  setPaginaActual: (page: number) => void;
  totalPaginas: number;
  searchParams: URLSearchParams;
}

export default function ClasesImpartidasTab({
  eventosImpartidos,
  getClassColors,
  handlers,
  elementosPorPagina,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  searchParams,
}: ClasesImpartidasTabProps) {
  return (
    <div>
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📚</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-text">
              Clases Impartidas
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text2">
              Clases que ya han sido impartidas o canceladas ({eventosImpartidos.length} clases)
            </p>
          </div>
        </div>
      </div>

      <ClasesEventosTable
        eventos={eventosImpartidos}
        getClassColors={getClassColors}
        onAsignar={null}
        onOcuparHuecos={handlers.handleOcuparHuecos}
        onOcuparHuecosRecuperacion={handlers.handleOcuparHuecosRecuperacion}
        onRecuperacion={handlers.handleRecuperacion}
        onDesasignar={handlers.handleDesasignar}
        onCancelar={handlers.handleCancelar}
        onEditar={handlers.handleEditar}
        onEditarSerie={handlers.handleEditarSerie}
        onEditarProfesor={handlers.handleEditarProfesor}
        onEliminar={handlers.handleEliminar}
        onEliminarSerie={null}
        onToggleExcluirAlquiler={handlers.handleToggleExcluirAlquiler}
        elementosPorPagina={elementosPorPagina}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalPaginas={totalPaginas}
        searchParams={searchParams}
      />
    </div>
  );
}
