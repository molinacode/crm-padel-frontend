import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useClasesHandlers,
  useEventosData,
  useEventosFiltrados,
  useClasesEventoHandlers,
} from '@features/clases';
import { getClassColors } from '../utils/getClassColors';
import {
  ClasesHeader,
  ClasesFiltrosAvanzados,
  ClasesProximasTab,
  ClasesImpartidasTab,
  ClasesCanceladasTab,
} from '@features/clases';
import {
  ClasesTabsContainer,
  ModalCancelarEvento,
  ModalAsignarAlumnos,
  FormularioClase,
  AsignarAlumnosClase,
  OcuparHuecos,
  DesasignarAlumnos,
} from '@features/clases';

export default function Clases() {
  const [searchParams] = useSearchParams();
  const [refresh, setRefresh] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [viewMode, setViewMode] = useState('calendar');
  const [claseParaEditar, setClaseParaEditar] = useState(null);
  const [showModalCancelar, setShowModalCancelar] = useState(false);
  const [eventoACancelar, setEventoACancelar] = useState(null);
  const [mostrarOcuparHuecos, setMostrarOcuparHuecos] = useState(false);
  const [eventoParaOcupar, setEventoParaOcupar] = useState(null);
  const [mostrarAsignarAlumnos, setMostrarAsignarAlumnos] = useState(false);
  const [eventoParaAsignar, setEventoParaAsignar] = useState(null);
  const [mostrarDesasignarAlumnos, setMostrarDesasignarAlumnos] =
    useState(false);
  const [eventoParaDesasignar, setEventoParaDesasignar] = useState(null);
  const [tabActiva, setTabActiva] = useState('proximas');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroTipoClase, setFiltroTipoClase] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Hooks de datos
  const { eventos } = useEventosData(refresh);
  const { eventosProximos, eventosImpartidos, eventosCancelados } =
    useEventosFiltrados(eventos, {
      filtroNivel,
      filtroTipoClase,
      filtroFechaInicio,
      filtroFechaFin,
    });

  // Handlers de eventos
  const eventoHandlers = useClasesEventoHandlers(setRefresh);

  // Totales de páginas memoizados por pestaña
  const totalPaginasProximas = useMemo(
    () => Math.max(1, Math.ceil(eventosProximos.length / elementosPorPagina)),
    [eventosProximos.length, elementosPorPagina]
  );
  const totalPaginasImpartidas = useMemo(
    () => Math.max(1, Math.ceil(eventosImpartidos.length / elementosPorPagina)),
    [eventosImpartidos.length, elementosPorPagina]
  );
  const totalPaginasCanceladas = useMemo(
    () => Math.max(1, Math.ceil(eventosCancelados.length / elementosPorPagina)),
    [eventosCancelados.length, elementosPorPagina]
  );

  // Asegurar rangos de paginación válidos según pestaña seleccionada
  useEffect(() => {
    const total =
      tabActiva === 'proximas'
        ? totalPaginasProximas
        : tabActiva === 'impartidas'
          ? totalPaginasImpartidas
          : tabActiva === 'canceladas'
            ? totalPaginasCanceladas
            : 1;
    if (paginaActual > total) setPaginaActual(total);
    if (paginaActual < 1) setPaginaActual(1);
  }, [
    tabActiva,
    paginaActual,
    totalPaginasProximas,
    totalPaginasImpartidas,
    totalPaginasCanceladas,
  ]);

  // Manejar parámetros URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');
    const highlight = searchParams.get('highlight');
    const preferNivel = searchParams.get('preferNivel');

    if (tab) setTabActiva(tab);
    if (view === 'table') setViewMode('table');
    if (preferNivel) setFiltroNivel(preferNivel);

    if (highlight && eventos.length > 0) {
      setTimeout(() => {
        const elemento = document.getElementById(`evento-${highlight}`);
        if (elemento) {
          elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          elemento.classList.add(
            'ring-4',
            'ring-yellow-400',
            'ring-opacity-75'
          );
        }
      }, 100);
    }
  }, [searchParams, eventos]);

  // Handlers para el calendario
  const handleNavigate = useCallback(date => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback(view => {
    // Aceptar 'month' además de 'week' y 'day'
    const v = typeof view === 'string' ? view : String(view).toLowerCase();
    const allowed = ['week', 'day', 'month'];
    setCurrentView(allowed.includes(v) ? v : 'week');
  }, []);

  // Resetear página cuando cambie el tab o los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [
    tabActiva,
    filtroNivel,
    filtroTipoClase,
    filtroFechaInicio,
    filtroFechaFin,
  ]);

  // Handlers del calendario
  const handleSelectSlot = useCallback(() => {
    setTabActiva('nueva');
  }, []);

  const handleSelectEvent = useCallback(() => {
    setTabActiva('asignar');
  }, []);

  const handleDoubleClickEvent = useCallback(evento => {
    setClaseParaEditar(evento.resource.clases);
    setTabActiva('nueva');
  }, []);

  // Definir handleEventoClick antes de usarlo en useClasesHandlers (como declaración de función para evitar TDZ)
  function handleEventoClick(evento) {
    return eventoHandlers.handleEventoClick(
      evento,
      setEventoACancelar,
      setShowModalCancelar
    );
  }

  // Hook para handlers centralizados (debe ir después de handleEventoClick)
  const handlers = useClasesHandlers({
    setTabActiva,
    setEventoParaAsignar,
    setMostrarAsignarAlumnos,
    setEventoParaOcupar,
    setMostrarOcuparHuecos,
    setEventoParaDesasignar,
    setMostrarDesasignarAlumnos,
    handleEventoClick,
    editarEventoIndividual: eventoHandlers.editarEventoIndividual,
    editarTodaLaSerie: eventoHandlers.editarTodaLaSerie,
    handleEliminarEvento: eventoHandlers.handleEliminarEvento,
  });

  const cancelarEventoIndividual = useCallback(async () => {
    if (eventoACancelar) {
      await eventoHandlers.cancelarEventoIndividual(eventoACancelar);
      setShowModalCancelar(false);
      setEventoACancelar(null);
    }
  }, [eventoACancelar, eventoHandlers]);

  const cancelarTodaLaSerie = useCallback(async () => {
    if (eventoACancelar) {
      await eventoHandlers.cancelarTodaLaSerie(eventoACancelar);
      setShowModalCancelar(false);
      setEventoACancelar(null);
    }
  }, [eventoACancelar, eventoHandlers]);

  return (
    <div className='space-y-8'>
      <ClasesHeader />

      {/* Filtros avanzados */}
      {tabActiva !== 'nueva' && (
        <ClasesFiltrosAvanzados
          filtroNivel={filtroNivel}
          setFiltroNivel={setFiltroNivel}
          filtroTipoClase={filtroTipoClase}
          setFiltroTipoClase={setFiltroTipoClase}
          filtroFechaInicio={filtroFechaInicio}
          setFiltroFechaInicio={setFiltroFechaInicio}
          filtroFechaFin={filtroFechaFin}
          setFiltroFechaFin={setFiltroFechaFin}
        />
      )}

      {/* Sistema de Pestañas */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <ClasesTabsContainer
          tabActiva={tabActiva}
          setTabActiva={setTabActiva}
          eventosProximos={eventosProximos}
          eventosImpartidos={eventosImpartidos}
          eventosCancelados={eventosCancelados}
        />

        {/* Contenido de las pestañas */}
        <div className='p-4 sm:p-6'>
          {/* Pestaña Próximas Clases */}
          {tabActiva === 'proximas' && (
            <ClasesProximasTab
              eventosProximos={eventosProximos}
              eventosImpartidos={eventosImpartidos}
              viewMode={viewMode}
              setViewMode={setViewMode}
              currentDate={currentDate}
              currentView={currentView}
              onNavigate={handleNavigate}
              onViewChange={handleViewChange}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onDoubleClickEvent={handleDoubleClickEvent}
              getClassColors={getClassColors}
              handlers={handlers}
              elementosPorPagina={elementosPorPagina}
              paginaActual={paginaActual}
              setPaginaActual={setPaginaActual}
              totalPaginas={totalPaginasProximas}
              searchParams={searchParams}
            />
          )}

          {/* Pestaña Clases Impartidas */}
          {tabActiva === 'impartidas' && (
            <ClasesImpartidasTab
              eventosImpartidos={eventosImpartidos}
              getClassColors={getClassColors}
              handlers={handlers}
              elementosPorPagina={elementosPorPagina}
              paginaActual={paginaActual}
              setPaginaActual={setPaginaActual}
              totalPaginas={totalPaginasImpartidas}
              searchParams={searchParams}
            />
          )}

          {/* Pestaña Clases Canceladas */}
          {tabActiva === 'canceladas' && (
            <ClasesCanceladasTab
              eventosCancelados={eventosCancelados}
              getClassColors={getClassColors}
              handlers={handlers}
              elementosPorPagina={elementosPorPagina}
              paginaActual={paginaActual}
              setPaginaActual={setPaginaActual}
              totalPaginas={totalPaginasCanceladas}
              searchParams={searchParams}
              onEliminarSerie={eventoHandlers.eliminarSerieCompleta}
            />
          )}

          {/* Pestaña Nueva Clase */}
          {tabActiva === 'nueva' && (
            <div>
              <div className='flex justify-center'>
                <div className='w-full max-w-2xl'>
                  <FormularioClase
                    onCancel={() => setTabActiva('proximas')}
                    onSuccess={() => {
                      setRefresh(prev => prev + 1);
                      setTabActiva('proximas');
                    }}
                    claseParaEditar={claseParaEditar}
                    setClaseParaEditar={setClaseParaEditar}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pestaña Asignar Alumnos */}
          {tabActiva === 'asignar' && (
            <div>
              <AsignarAlumnosClase
                onCancel={() => setTabActiva('proximas')}
                onSuccess={() => {
                  setRefresh(prev => prev + 1);
                  setTabActiva('proximas');
                }}
                refreshTrigger={refresh}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para cancelar evento */}
      {showModalCancelar && (
        <ModalCancelarEvento
          eventoACancelar={eventoACancelar}
          onCancel={() => {
            setShowModalCancelar(false);
            setEventoACancelar(null);
          }}
          onCancelarIndividual={cancelarEventoIndividual}
          onCancelarSerie={cancelarTodaLaSerie}
        />
      )}

      {/* Modal para ocupar huecos */}
      {mostrarOcuparHuecos && eventoParaOcupar && (
        <OcuparHuecos
          evento={eventoParaOcupar}
          esRecuperacion={eventoParaOcupar.esRecuperacion || false}
          onClose={() => {
            setMostrarOcuparHuecos(false);
            setEventoParaOcupar(null);
          }}
          onSuccess={() => {
            setMostrarOcuparHuecos(false);
            setEventoParaOcupar(null);
            setRefresh(prev => prev + 1); // Recargar datos para reflejar los cambios
          }}
        />
      )}

      {/* Modal para desasignar alumnos */}
      {mostrarDesasignarAlumnos && eventoParaDesasignar && (
        <DesasignarAlumnos
          evento={eventoParaDesasignar}
          onClose={() => {
            setMostrarDesasignarAlumnos(false);
            setEventoParaDesasignar(null);
          }}
          onSuccess={() => {
            setMostrarDesasignarAlumnos(false);
            setEventoParaDesasignar(null);
            setRefresh(prev => prev + 1); // Recargar datos para reflejar los cambios
          }}
        />
      )}

      {/* Modal para asignar alumnos */}
      {mostrarAsignarAlumnos && (
        <ModalAsignarAlumnos
          eventoParaAsignar={eventoParaAsignar}
          onClose={() => {
            setMostrarAsignarAlumnos(false);
            setEventoParaAsignar(null);
          }}
          onSuccess={() => {
            setMostrarAsignarAlumnos(false);
            setEventoParaAsignar(null);
            setRefresh(prev => prev + 1);
          }}
          refreshTrigger={refresh}
        />
      )}
    </div>
  );
}
