import ClasesViewToggle from './ClasesViewToggle';
import ClasesCalendarView from './ClasesCalendarView';
import ClasesEventosTable from './ClasesEventosTable';

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
}) {
  // Combinar eventos futuros e impartidos para el calendario
  const todosLosEventos = [
    ...(eventosProximos || []),
    ...(eventosImpartidos || []),
  ];

  const eventosPaginados = eventosProximos.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

  return (
    <div>
      <ClasesViewToggle viewMode={viewMode} setViewMode={setViewMode} />

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
          eventos={eventosPaginados}
          getClassColors={getClassColors}
          onAsignar={handlers.handleAsignar}
          onOcuparHuecos={handlers.handleOcuparHuecos}
          onRecuperacion={handlers.handleRecuperacion}
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
      )}
    </div>
  );
}
