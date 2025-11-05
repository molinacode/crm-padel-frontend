import { useEffect, useState } from 'react';
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

  // No paginar aquí: la tabla se encarga de paginar internamente

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const isNarrow = window.matchMedia('(max-width: 1024px)').matches;
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      setIsMobile(isNarrow || isPortrait);
    };
    check();
    window.addEventListener('resize', check);
    const mq = window.matchMedia('(orientation: portrait)');
    mq.addEventListener?.('change', check);
    return () => {
      window.removeEventListener('resize', check);
      mq.removeEventListener?.('change', check);
    };
  }, []);

  return (
    <div className='space-y-4'>
      {isMobile ? (
        // Versión móvil: solo mostrar el calendario móvil sin controles
        <MobileCalendarAgenda
          eventos={todosLosEventos}
          currentDate={currentDate}
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
        />
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
