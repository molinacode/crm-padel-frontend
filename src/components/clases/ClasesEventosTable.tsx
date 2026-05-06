import { useState, useMemo } from 'react';
import Paginacion from '../Paginacion';
import { useSearchParams } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import ActionBottomSheet from '../common/ActionBottomSheet';
import MobileEventoCard from '../common/MobileEventoCard';

interface Evento {
  id: string;
  start: string | Date;
  end: string | Date;
  huecosDisponibles?: number;
  alumnosJustificados?: Array<{ id?: string; nombre?: string }>;
  resource?: {
    estado?: string;
    excluir_alquiler?: boolean;
    clases?: {
      nombre?: string;
      nivel_clase?: string;
      tipo_clase?: string;
      profesor?: string;
    };
  };
  [key: string]: unknown;
}
type MaybeHandler = ((evento: Evento) => void) | null | undefined;

interface ClasesEventosTableProps {
  eventos: unknown[];
  getClassColors: (...args: unknown[]) => { badgeClass: string; label: string };
  onAsignar: MaybeHandler;
  onOcuparHuecos: MaybeHandler;
  onOcuparHuecosRecuperacion: MaybeHandler;
  onRecuperacion: MaybeHandler;
  onDesasignar: MaybeHandler;
  onCancelar: MaybeHandler;
  onEditar: MaybeHandler;
  onEditarSerie: MaybeHandler;
  onEditarProfesor: MaybeHandler;
  onEliminar: MaybeHandler;
  onEliminarSerie: MaybeHandler;
  onToggleExcluirAlquiler: MaybeHandler;
  elementosPorPagina?: number;
  paginaActual: number;
  setPaginaActual: (page: number) => void;
  totalPaginas: number;
  searchParams?: URLSearchParams;
}

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
}: ClasesEventosTableProps) {
  const [searchParamsHook] = useSearchParams();
  const params = searchParams || searchParamsHook;
  const isMobile = useIsMobile(1024);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  const accionesBottomSheet = useMemo(() => {
    if (!eventoSeleccionado || !eventoSeleccionado.resource?.clases) return [];

    const acciones: Array<{ category: string; items: Array<{ id: string; label: string; icon: string; color: string; onClick: () => void }> }> = [];
    const alumnosJustificados = eventoSeleccionado.alumnosJustificados || [];
    const huecosDisponibles = eventoSeleccionado.huecosDisponibles ?? 0;
    const tieneHuecos = huecosDisponibles > 0 || alumnosJustificados.length > 0;
    const principales: Array<{ id: string; label: string; icon: string; color: string; onClick: () => void }> = [];

    if (onAsignar) principales.push({ id: 'asignar', label: 'Asignar alumnos', icon: '📝', color: 'blue', onClick: () => onAsignar(eventoSeleccionado) });
    if (tieneHuecos && onOcuparHuecos) principales.push({ id: 'ocupar-huecos', label: `Ocupar huecos (${huecosDisponibles})`, icon: '🕳️', color: 'orange', onClick: () => onOcuparHuecos(eventoSeleccionado) });
    if (params?.get?.('alumno') && onRecuperacion) principales.push({ id: 'recuperacion', label: 'Asignar como recuperación', icon: '🔄', color: 'purple', onClick: () => onRecuperacion(eventoSeleccionado) });
    if (tieneHuecos && onOcuparHuecosRecuperacion) principales.push({ id: 'ocupar-huecos-recuperacion', label: 'Ocupar huecos (Recuperación)', icon: '🔄', color: 'purple', onClick: () => onOcuparHuecosRecuperacion(eventoSeleccionado) });
    if (principales.length > 0) acciones.push({ category: 'Acciones principales', items: principales });

    const gestion: Array<{ id: string; label: string; icon: string; color: string; onClick: () => void }> = [];
    if (onEditar) gestion.push({ id: 'editar', label: 'Editar evento', icon: '✏️', color: 'gray', onClick: () => onEditar(eventoSeleccionado) });
    if (onEditarSerie) gestion.push({ id: 'editar-serie', label: 'Editar toda la serie', icon: '📅', color: 'gray', onClick: () => onEditarSerie(eventoSeleccionado) });
    if (onEditarProfesor) gestion.push({ id: 'editar-profesor', label: 'Cambiar profesor', icon: '👨‍🏫', color: 'gray', onClick: () => onEditarProfesor(eventoSeleccionado) });
    if (onDesasignar) gestion.push({ id: 'desasignar', label: 'Desasignar alumnos', icon: '👥', color: 'fuchsia', onClick: () => onDesasignar(eventoSeleccionado) });
    if (onToggleExcluirAlquiler) gestion.push({ id: 'toggle-alquiler', label: eventoSeleccionado.excluirAlquiler || eventoSeleccionado.resource?.excluir_alquiler ? 'Incluir en alquiler' : 'Excluir de alquiler', icon: '💰', color: 'gray', onClick: () => onToggleExcluirAlquiler(eventoSeleccionado) });
    if (gestion.length > 0) acciones.push({ category: 'Gestión', items: gestion });

    const peligrosas: Array<{ id: string; label: string; icon: string; color: string; onClick: () => void }> = [];
    if (onCancelar) peligrosas.push({ id: 'cancelar', label: eventoSeleccionado.resource.estado === 'cancelada' ? 'Reactivar evento' : 'Cancelar evento', icon: '❌', color: 'red', onClick: () => onCancelar(eventoSeleccionado) });
    if (onEliminar) peligrosas.push({ id: 'eliminar', label: 'Eliminar evento', icon: '🗑️', color: 'red', onClick: () => onEliminar(eventoSeleccionado) });
    if (onEliminarSerie) peligrosas.push({ id: 'eliminar-serie', label: 'Eliminar toda la serie', icon: '🗑️', color: 'red', onClick: () => onEliminarSerie(eventoSeleccionado) });
    if (peligrosas.length > 0) acciones.push({ category: 'Acciones peligrosas', items: peligrosas });
    return acciones;
  }, [eventoSeleccionado, params, onAsignar, onOcuparHuecos, onRecuperacion, onOcuparHuecosRecuperacion, onEditar, onEditarSerie, onEditarProfesor, onDesasignar, onToggleExcluirAlquiler, onCancelar, onEliminar, onEliminarSerie]);

  const claseSeleccionada = eventoSeleccionado?.resource?.clases || null;
  const badgesBottomSheet = useMemo(() => {
    if (!eventoSeleccionado || !claseSeleccionada) return [];
    const badges: Array<{ label: string; icon?: string; colorClass: string }> = [];
    if (claseSeleccionada.nivel_clase) badges.push({ label: claseSeleccionada.nivel_clase, colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' });
    if (claseSeleccionada.tipo_clase) badges.push({ label: claseSeleccionada.tipo_clase, colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' });
    if (claseSeleccionada.profesor) badges.push({ label: claseSeleccionada.profesor, icon: '👨‍🏫', colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' });
    if ((eventoSeleccionado.huecosDisponibles ?? 0) > 0) badges.push({ label: `${eventoSeleccionado.huecosDisponibles} hueco${eventoSeleccionado.huecosDisponibles !== 1 ? 's' : ''}`, icon: '🕳️', colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' });
    return badges;
  }, [eventoSeleccionado, claseSeleccionada]);

  const eventosTyped = eventos as Evento[];
  if (!eventosTyped || eventosTyped.length === 0) {
    return <div className="text-center py-12 text-gray-500 dark:text-dark-text2">No hay eventos registrados</div>;
  }

  const eventosPaginados = eventosTyped.slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina);

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {eventosPaginados.map(evento => (
            <MobileEventoCard
              key={evento.id}
              evento={evento}
              getClassColors={getClassColors}
              onActionClick={() => {
                setEventoSeleccionado(evento);
                setMostrarModalAcciones(true);
              }}
            />
          ))}
        </div>
        {totalPaginas > 1 && (
          <div className="mt-6">
            <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiarPagina={setPaginaActual} />
          </div>
        )}
        {eventoSeleccionado && (
          <ActionBottomSheet
            isOpen={mostrarModalAcciones}
            onClose={() => {
              setMostrarModalAcciones(false);
              setEventoSeleccionado(null);
            }}
            title={claseSeleccionada?.nombre || 'Clase sin nombre'}
            subtitle="Acciones"
            badges={badgesBottomSheet}
            actions={accionesBottomSheet as unknown as []}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 dark:bg-dark-surface2">
            <tr>
              <th className="text-left py-4 px-4 font-semibold">Fecha</th>
              <th className="text-left py-4 px-4 font-semibold">Hora</th>
              <th className="text-left py-4 px-4 font-semibold">Clase</th>
              <th className="text-left py-4 px-4 font-semibold">Tipo</th>
              <th className="text-left py-4 px-4 font-semibold">Profesor</th>
              <th className="text-left py-4 px-4 font-semibold">Estado</th>
              <th className="text-left py-4 px-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {eventosPaginados.map(evento => (
              <tr key={evento.id} className="border-b border-gray-100 dark:border-dark-border">
                <td className="py-4 px-4">{new Date(evento.start).toLocaleDateString('es-ES')}</td>
                <td className="py-4 px-4">
                  {new Date(evento.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(evento.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-4 px-4">{evento.resource?.clases?.nombre}</td>
                <td className="py-4 px-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getClassColors(evento.resource?.clases, evento.resource?.estado === 'cancelada').badgeClass}`}>
                    {getClassColors(evento.resource?.clases, evento.resource?.estado === 'cancelada').label}
                  </span>
                </td>
                <td className="py-4 px-4">{evento.resource?.clases?.profesor || 'Sin asignar'}</td>
                <td className="py-4 px-4">{evento.resource?.estado === 'cancelada' ? '❌ Cancelada' : '✅ Programada'}</td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2 flex-wrap">
                    {onAsignar && <button onClick={() => onAsignar(evento)} className="px-3 py-1 bg-blue-600 text-white rounded">Asignar</button>}
                    {params?.get?.('alumno') && onRecuperacion && <button onClick={() => onRecuperacion(evento)} className="px-3 py-1 bg-purple-600 text-white rounded">Recuperación</button>}
                    {onOcuparHuecos && <button onClick={() => onOcuparHuecos(evento)} className="px-3 py-1 bg-orange-600 text-white rounded">Huecos</button>}
                    {onOcuparHuecosRecuperacion && <button onClick={() => onOcuparHuecosRecuperacion(evento)} className="px-3 py-1 bg-purple-500 text-white rounded">Recuperar</button>}
                    {onDesasignar && <button onClick={() => onDesasignar(evento)} className="px-3 py-1 bg-fuchsia-200 rounded">Desasignar</button>}
                    {onCancelar && <button onClick={() => onCancelar(evento)} className="px-3 py-1 bg-orange-200 rounded">{evento.resource?.estado === 'cancelada' ? 'Reactivar' : 'Cancelar'}</button>}
                    {onEditar && <button onClick={() => onEditar(evento)} className="px-3 py-1 bg-gray-200 rounded">Editar</button>}
                    {onEditarSerie && <button onClick={() => onEditarSerie(evento)} className="px-3 py-1 bg-indigo-200 rounded">Serie</button>}
                    {onEditarProfesor && <button onClick={() => onEditarProfesor(evento)} className="px-3 py-1 bg-purple-200 rounded">Profesor</button>}
                    {onToggleExcluirAlquiler && <button onClick={() => onToggleExcluirAlquiler(evento)} className="px-3 py-1 bg-amber-200 rounded">Alquiler</button>}
                    {onEliminar && <button onClick={() => onEliminar(evento)} className="px-3 py-1 bg-red-200 rounded">Eliminar</button>}
                    {onEliminarSerie && <button onClick={() => onEliminarSerie(evento)} className="px-3 py-1 bg-red-400 text-white rounded">Eliminar Serie</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div className="mt-4">
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiarPagina={setPaginaActual}
            elementosPorPagina={elementosPorPagina}
            totalElementos={eventosTyped.length}
          />
        </div>
      )}
    </>
  );
}
