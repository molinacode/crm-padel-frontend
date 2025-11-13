import { useIsMobile } from '../../hooks/useIsMobile';
import ClasesViewToggle from './ClasesViewToggle';
import ClasesCalendarView from './ClasesCalendarView';
import ClasesEventosTable from './ClasesEventosTable';
import MobileCalendarAgenda from './MobileCalendarAgenda';

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

  // Usar hook reutilizable para detección de móvil
  const isMobile = useIsMobile(1024);

  return (
    <div className='space-y-4'>
      {isMobile ? (
        // Versión móvil: mostrar tabla de eventos (mismos datos que desktop)
        // La tabla ya es responsive y funciona bien en móviles
        <>
          <div className='mb-4'>
            <ClasesViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
          
          {viewMode === 'calendar' ? (
            // En móvil, si elige calendario, mostrar agenda móvil
            <MobileCalendarAgenda
              eventos={todosLosEventos}
              currentDate={currentDate}
              onSelectEvent={onSelectEvent}
              onSelectSlot={onSelectSlot}
              handlers={handlers}
              getClassColors={getClassColors}
            />
          ) : (
            // En móvil, mostrar tabla de eventos (mismos datos que desktop)
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
        // Versión desktop: mostrar controles y calendario/tabla normal
        <>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <ClasesViewToggle viewMode={viewMode} setViewMode={setViewMode} />

            {viewMode === 'calendar' && (
              <div className='flex items-center gap-2 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-800 p-1'>
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
