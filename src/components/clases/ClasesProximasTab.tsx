import { useIsMobile } from '../../hooks/useIsMobile';
import ClasesViewToggle from './ClasesViewToggle';
import ClasesCalendarView from './ClasesCalendarView';
import ClasesEventosTable from './ClasesEventosTable';
import MobileCalendarAgenda from './MobileCalendarAgenda';

interface Handlers {
  handleAsignar?: (...args: unknown[]) => void;
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

interface ClasesProximasTabProps {
  eventosProximos: unknown[];
  eventosImpartidos: unknown[];
  viewMode: 'calendar' | 'table';
  setViewMode: (mode: 'calendar' | 'table') => void;
  currentDate: Date;
  currentView: 'month' | 'week' | 'day';
  onNavigate: (...args: unknown[]) => void;
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  onSelectEvent: (...args: unknown[]) => void;
  onSelectSlot: (...args: unknown[]) => void;
  onDoubleClickEvent: (...args: unknown[]) => void;
  getClassColors: (...args: unknown[]) => { badgeClass: string; label: string };
  handlers: Handlers;
  elementosPorPagina: number;
  paginaActual: number;
  setPaginaActual: (page: number) => void;
  totalPaginas: number;
  searchParams: URLSearchParams;
}

export default function ClasesProximasTab({
  eventosProximos,
  eventosImpartidos,
  viewMode,
  setViewMode,
  currentDate,
  currentView,
  onNavigate,
  onViewChange,
  onSelectEvent,
  onSelectSlot,
  onDoubleClickEvent,
  getClassColors,
  handlers,
  elementosPorPagina,
  paginaActual,
  setPaginaActual,
  totalPaginas,
  searchParams,
}: ClasesProximasTabProps) {
  const todosLosEventos = [...(eventosProximos || []), ...(eventosImpartidos || [])];
  const isMobile = useIsMobile(1024);

  return (
    <div className="space-y-4">
      {isMobile ? (
        <>
          <div className="mb-4">
            <ClasesViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          {viewMode === 'calendar' ? (
            <MobileCalendarAgenda
              eventos={todosLosEventos as never[]}
              currentDate={currentDate}
              onSelectSlot={onSelectSlot}
              handlers={handlers}
              _getClassColors={getClassColors}
            />
          ) : (
            <ClasesEventosTable
              eventos={eventosProximos}
              getClassColors={getClassColors}
              onAsignar={handlers.handleAsignar}
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
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ClasesViewToggle viewMode={viewMode} setViewMode={setViewMode} />

            {viewMode === 'calendar' && (
              <div className="flex items-center gap-2 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-800 p-1">
                <button
                  onClick={() => onViewChange('month')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentView === 'month'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface2'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => onViewChange('week')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentView === 'week'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface2'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => onViewChange('day')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    currentView === 'day'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface2'
                  }`}
                >
                  Día
                </button>
              </div>
            )}
          </div>

          {viewMode === 'calendar' ? (
            <ClasesCalendarView
              eventos={todosLosEventos}
              currentDate={currentDate}
              currentView={currentView}
              onNavigate={onNavigate}
              onViewChange={onViewChange}
              onSelectEvent={onSelectEvent}
              onSelectSlot={onSelectSlot}
              onDoubleClickEvent={onDoubleClickEvent}
            />
          ) : (
            <ClasesEventosTable
              eventos={eventosProximos}
              getClassColors={getClassColors}
              onAsignar={handlers.handleAsignar}
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
          )}
        </>
      )}
    </div>
  );
}
