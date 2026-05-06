import { useMemo } from 'react';

type HandlerFn = (evento: EventoClase) => void;

interface Handlers {
  handleAsignar?: HandlerFn;
  handleOcuparHuecos?: HandlerFn;
  handleRecuperacion?: HandlerFn;
  handleOcuparHuecosRecuperacion?: HandlerFn;
  handleEditar?: HandlerFn;
  handleEditarSerie?: HandlerFn;
  handleEditarProfesor?: HandlerFn;
  handleDesasignar?: HandlerFn;
  handleCancelar?: HandlerFn;
  handleEliminar?: HandlerFn;
}

interface ClaseRecurso {
  nombre?: string;
  nivel_clase?: string;
  tipo_clase?: string;
  profesor?: string;
}

interface EventoClase {
  start?: Date | string;
  end?: Date | string;
  huecosDisponibles?: number;
  alumnosJustificados?: { id?: string; nombre?: string }[];
  resource?: {
    fecha?: string | Date;
    clases?: ClaseRecurso;
  };
}

interface AccionItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  badge?: string | null;
  onClick: () => void;
}

interface MobileEventoActionsModalProps {
  evento: EventoClase | null;
  isOpen: boolean;
  onClose: () => void;
  handlers?: Handlers | null;
}

export default function MobileEventoActionsModal({
  evento,
  isOpen,
  onClose,
  handlers,
}: MobileEventoActionsModalProps) {
  const clase = evento?.resource?.clases || {};
  const huecosDisponibles = evento?.huecosDisponibles ?? 0;
  const alumnosJustificados = useMemo(
    () => evento?.alumnosJustificados || [],
    [evento?.alumnosJustificados]
  );
  const tieneHuecos = useMemo(
    () => huecosDisponibles > 0 || alumnosJustificados.length > 0,
    [huecosDisponibles, alumnosJustificados]
  );

  const accionesPrincipales = useMemo<AccionItem[]>(() => {
    if (!evento || !handlers) return [];
    const acciones: AccionItem[] = [];

    if (handlers.handleAsignar) {
      acciones.push({
        id: 'asignar',
        label: 'Asignar alumnos',
        icon: '📝',
        color: 'blue',
        onClick: () => {
          handlers.handleAsignar?.(evento);
          onClose();
        },
      });
    }

    if (tieneHuecos && handlers.handleOcuparHuecos) {
      acciones.push({
        id: 'ocupar-huecos',
        label: `Ocupar huecos (${huecosDisponibles})`,
        icon: '🕳️',
        color: 'orange',
        badge:
          huecosDisponibles > 0
            ? `${huecosDisponibles} disponible${huecosDisponibles !== 1 ? 's' : ''}`
            : null,
        onClick: () => {
          handlers.handleOcuparHuecos?.(evento);
          onClose();
        },
      });
    }

    if (handlers.handleRecuperacion) {
      acciones.push({
        id: 'recuperacion-url',
        label: 'Asignar como recuperación',
        icon: '🔄',
        color: 'purple',
        onClick: () => {
          handlers.handleRecuperacion?.(evento);
          onClose();
        },
      });
    }

    if (tieneHuecos && handlers.handleOcuparHuecosRecuperacion) {
      acciones.push({
        id: 'ocupar-huecos-recuperacion',
        label: 'Ocupar huecos (Recuperación)',
        icon: '🔄',
        color: 'purple',
        badge:
          alumnosJustificados.length > 0
            ? `${alumnosJustificados.length} con recuperaciones`
            : null,
        onClick: () => {
          handlers.handleOcuparHuecosRecuperacion?.(evento);
          onClose();
        },
      });
    }

    return acciones;
  }, [
    evento,
    handlers,
    huecosDisponibles,
    alumnosJustificados,
    tieneHuecos,
    onClose,
  ]);

  const accionesGestion = useMemo<AccionItem[]>(() => {
    const acciones: AccionItem[] = [];
    if (!evento || !handlers) return acciones;

    if (handlers.handleEditar) {
      acciones.push({
        id: 'editar',
        label: 'Editar evento',
        icon: '✏️',
        color: 'gray',
        onClick: () => {
          handlers.handleEditar?.(evento);
          onClose();
        },
      });
    }

    if (handlers.handleEditarSerie) {
      acciones.push({
        id: 'editar-serie',
        label: 'Editar toda la serie',
        icon: '📅',
        color: 'gray',
        onClick: () => {
          handlers.handleEditarSerie?.(evento);
          onClose();
        },
      });
    }

    if (handlers.handleEditarProfesor) {
      acciones.push({
        id: 'editar-profesor',
        label: 'Cambiar profesor',
        icon: '👨‍🏫',
        color: 'gray',
        onClick: () => {
          handlers.handleEditarProfesor?.(evento);
          onClose();
        },
      });
    }

    if (handlers.handleDesasignar) {
      acciones.push({
        id: 'desasignar',
        label: 'Desasignar alumnos',
        icon: '👥',
        color: 'fuchsia',
        onClick: () => {
          handlers.handleDesasignar?.(evento);
          onClose();
        },
      });
    }

    return acciones;
  }, [evento, handlers, onClose]);

  const accionesPeligrosas = useMemo<AccionItem[]>(() => {
    const acciones: AccionItem[] = [];
    if (!evento || !handlers) return acciones;

    if (handlers.handleCancelar) {
      acciones.push({
        id: 'cancelar',
        label: 'Cancelar evento',
        icon: '❌',
        color: 'red',
        onClick: () => {
          handlers.handleCancelar?.(evento);
          onClose();
        },
      });
    }

    if (handlers.handleEliminar) {
      acciones.push({
        id: 'eliminar',
        label: 'Eliminar evento',
        icon: '🗑️',
        color: 'red',
        onClick: () => {
          handlers.handleEliminar?.(evento);
          onClose();
        },
      });
    }

    return acciones;
  }, [evento, handlers, onClose]);

  if (!isOpen || !evento || !handlers) return null;

  const fechaEvento = evento.resource?.fecha || evento.start;
  const fecha =
    fechaEvento && typeof fechaEvento === 'string'
      ? new Date(fechaEvento)
      : (fechaEvento as Date | null);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface rounded-t-3xl shadow-2xl z-[9999] max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out"
        style={{ zIndex: 9999, animation: 'slideUp 0.3s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="px-6 pb-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">
                {clase.nombre || 'Clase'}
              </h3>
              {fecha && (
                <p className="text-sm text-gray-600 dark:text-dark-text2 mt-1">
                  {fecha.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {accionesPrincipales.length > 0 && (
          <div className="px-6 py-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Acciones principales</h4>
            <div className="space-y-2">
              {accionesPrincipales.map(accion => (
                <button key={accion.id} onClick={accion.onClick} className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{accion.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 dark:text-dark-text">{accion.label}</div>
                      {accion.badge && <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{accion.badge}</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {accionesGestion.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Gestión</h4>
            <div className="space-y-2">
              {accionesGestion.map(accion => (
                <button key={accion.id} onClick={accion.onClick} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{accion.icon}</span>
                    <div className="font-semibold text-gray-900 dark:text-dark-text">{accion.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {accionesPeligrosas.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Acciones peligrosas</h4>
            <div className="space-y-2">
              {accionesPeligrosas.map(accion => (
                <button key={accion.id} onClick={accion.onClick} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{accion.icon}</span>
                    <div className="font-semibold text-red-700 dark:text-red-300">{accion.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>
    </>
  );
}
