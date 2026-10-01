import { useMemo, useState, useEffect } from 'react';
import MobileEventoActionsModal from './MobileEventoActionsModal';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

interface EventoClase {
  id: string;
  start?: Date | string;
  end?: Date | string;
  resource?: {
    fecha?: string | Date;
    hora_inicio?: string;
    hora_fin?: string;
    estado?: string;
    clases?: {
      nombre?: string;
      nivel_clase?: string;
      tipo_clase?: string;
    };
  };
}

interface MobileCalendarAgendaProps {
  eventos?: EventoClase[];
  currentDate: Date;
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  handlers: {
    handleAsignar?: (...args: unknown[]) => void;
    handleOcuparHuecos?: (...args: unknown[]) => void;
    handleRecuperacion?: (...args: unknown[]) => void;
    handleOcuparHuecosRecuperacion?: (...args: unknown[]) => void;
    handleEditar?: (...args: unknown[]) => void;
    handleEditarSerie?: (...args: unknown[]) => void;
    handleEditarProfesor?: (...args: unknown[]) => void;
    handleDesasignar?: (...args: unknown[]) => void;
    handleCancelar?: (...args: unknown[]) => void;
    handleEliminar?: (...args: unknown[]) => void;
  };
  _getClassColors?: (...args: unknown[]) => unknown;
}

function shiftDay(date: Date, delta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export default function MobileCalendarAgenda({
  eventos = [],
  currentDate,
  onSelectSlot,
  handlers,
}: MobileCalendarAgendaProps) {
  const [selectedDate, setSelectedDate] = useState(
    currentDate ? new Date(currentDate) : new Date()
  );
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoClase | null>(null);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  useEffect(() => {
    if (currentDate) {
      const newDate = new Date(currentDate);
      setTimeout(() => setSelectedDate(newDate), 0);
    }
  }, [currentDate]);

  const cambiarDia = (delta: number) => {
    setSelectedDate(prev => shiftDay(prev, delta));
    setShowAllEvents(false);
  };

  const swipe = useSwipeGesture({
    axis: 'horizontal',
    threshold: 56,
    onSwipeLeft: () => cambiarDia(1),
    onSwipeRight: () => cambiarDia(-1),
  });

  const fechaISO = selectedDate.toISOString().split('T')[0];

  const eventosProximos = useMemo(() => {
    return (eventos || [])
      .filter(e => {
        const estado = e?.resource?.estado;
        return estado !== 'eliminado' && estado !== 'cancelada';
      })
      .filter(e => {
        const fechaEvento = e?.resource?.fecha || e?.start;
        if (!fechaEvento) return false;
        const fecha = typeof fechaEvento === 'string' ? new Date(fechaEvento) : fechaEvento;
        return fecha.getTime() >= new Date().setHours(0, 0, 0, 0);
      })
      .sort((a, b) => {
        const fechaA = a?.start || a?.resource?.fecha;
        const fechaB = b?.start || b?.resource?.fecha;
        if (!fechaA || !fechaB) return 0;
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      });
  }, [eventos]);

  const eventosDelDia = useMemo(() => {
    return eventosProximos
      .filter(e => {
        const fechaEvento = e?.resource?.fecha || e?.start;
        if (!fechaEvento) return false;
        const fecha = typeof fechaEvento === 'string' ? new Date(fechaEvento) : fechaEvento;
        const fechaISOEvento = fecha.toISOString().split('T')[0];
        return fechaISOEvento === fechaISO;
      })
      .sort((a, b) => {
        const horaA = a?.start || a?.resource?.hora_inicio;
        const horaB = b?.start || b?.resource?.hora_inicio;
        if (!horaA || !horaB) return 0;
        return new Date(horaA).getTime() - new Date(horaB).getTime();
      });
  }, [eventosProximos, fechaISO]);

  return (
    <div className="space-y-3" {...swipe}>
      <div className="border-b border-neutral-200 py-3 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarDia(-1)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 dark:border-dark-border dark:text-dark-text"
            aria-label="Día anterior"
          >
            ‹
          </button>
          <input
            type="date"
            value={fechaISO}
            onChange={e => {
              const d = new Date(e.target.value);
              setSelectedDate(d);
              setShowAllEvents(false);
            }}
            className="min-h-11 flex-1 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 focus:border-[#c9a658] focus:outline-none dark:border-dark-border dark:bg-dark-surface2 dark:text-dark-text"
          />
          <button
            type="button"
            onClick={() => cambiarDia(1)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 dark:border-dark-border dark:text-dark-text"
            aria-label="Día siguiente"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => onSelectSlot?.({ start: selectedDate, end: selectedDate })}
            className="btn-primary min-h-11 shrink-0 px-4 text-sm"
          >
            Nueva
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-600 dark:text-dark-text2">
          Desliza para cambiar de día
        </p>
      </div>

      {(showAllEvents ? eventosProximos : eventosDelDia).map(ev => (
        <button
          key={ev.id}
          type="button"
          onClick={() => {
            setEventoSeleccionado(ev);
            setMostrarModalAcciones(true);
          }}
          className="w-full border-b border-neutral-200 py-3 text-left dark:border-dark-border"
        >
          <div className="font-medium text-neutral-900 dark:text-dark-text">
            {ev?.resource?.clases?.nombre || 'Clase'}
          </div>
          <div className="text-xs text-neutral-600 dark:text-dark-text2">
            {ev.start instanceof Date
              ? ev.start.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ev?.resource?.hora_inicio}
          </div>
        </button>
      ))}

      {handlers && (
        <MobileEventoActionsModal
          evento={eventoSeleccionado}
          isOpen={mostrarModalAcciones}
          onClose={() => {
            setMostrarModalAcciones(false);
            setEventoSeleccionado(null);
          }}
          handlers={handlers}
        />
      )}
    </div>
  );
}
