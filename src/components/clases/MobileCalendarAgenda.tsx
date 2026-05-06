import { useMemo, useState, useEffect } from 'react';
import MobileEventoActionsModal from './MobileEventoActionsModal';

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

export default function MobileCalendarAgenda({
  eventos = [],
  currentDate,
  onSelectSlot,
  handlers,
  _getClassColors,
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
    <div className="space-y-4">
      <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="date"
            value={fechaISO}
            onChange={e => {
              const d = new Date(e.target.value);
              setSelectedDate(d);
              setShowAllEvents(false);
            }}
            className="flex-1 w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium dark:bg-dark-surface2 dark:text-dark-text focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
          <button
            onClick={() => onSelectSlot?.({ start: selectedDate, end: selectedDate })}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            ➕ Nueva clase
          </button>
        </div>
      </div>

      {(showAllEvents ? eventosProximos : eventosDelDia).map(ev => (
        <button
          key={ev.id}
          onClick={() => {
            setEventoSeleccionado(ev);
            setMostrarModalAcciones(true);
          }}
          className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200"
        >
          <div className="font-semibold text-gray-900 dark:text-dark-text mb-1">
            {ev?.resource?.clases?.nombre || 'Clase'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {ev.start instanceof Date
              ? ev.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
