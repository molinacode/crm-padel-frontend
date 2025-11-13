import { useMemo, useState, useEffect } from 'react';
import MobileEventoActionsModal from './MobileEventoActionsModal';

export default function MobileCalendarAgenda({
  eventos = [],
  currentDate,
  onSelectEvent,
  onSelectSlot,
  handlers,
  getClassColors,
}) {
  const [selectedDate, setSelectedDate] = useState(
    currentDate ? new Date(currentDate) : new Date()
  );
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarModalAcciones, setMostrarModalAcciones] = useState(false);

  useEffect(() => {
    if (currentDate) setSelectedDate(new Date(currentDate));
  }, [currentDate]);

  const fechaISO = selectedDate.toISOString().split('T')[0];

  // Filtrar eventos próximos (no cancelados ni eliminados)
  const eventosProximos = useMemo(() => {
    return (eventos || [])
      .filter(e => {
        const estado = e?.resource?.estado;
        return estado !== 'eliminado' && estado !== 'cancelada';
      })
      .filter(e => {
        const fechaEvento = e?.resource?.fecha || e?.start;
        if (!fechaEvento) return false;
        const fecha = typeof fechaEvento === 'string' 
          ? new Date(fechaEvento) 
          : fechaEvento;
        return fecha >= new Date().setHours(0, 0, 0, 0);
      })
      .sort((a, b) => {
        const fechaA = a?.start || a?.resource?.fecha;
        const fechaB = b?.start || b?.resource?.fecha;
        if (!fechaA || !fechaB) return 0;
        return new Date(fechaA) - new Date(fechaB);
      });
  }, [eventos]);

  const eventosDelDia = useMemo(() => {
    return eventosProximos
      .filter(e => {
        const fechaEvento = e?.resource?.fecha || e?.start;
        if (!fechaEvento) return false;
        const fecha = typeof fechaEvento === 'string' 
          ? new Date(fechaEvento) 
          : fechaEvento;
        const fechaISOEvento = fecha.toISOString().split('T')[0];
        return fechaISOEvento === fechaISO;
      })
      .sort((a, b) => {
        const horaA = a?.start || a?.resource?.hora_inicio;
        const horaB = b?.start || b?.resource?.hora_inicio;
        if (!horaA || !horaB) return 0;
        return new Date(horaA) - new Date(horaB);
      });
  }, [eventosProximos, fechaISO]);

  return (
    <div className='space-y-4'>
      {/* Selector de fecha y botones */}
      <div className='bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border p-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
          <input
            type='date'
            value={fechaISO}
            onChange={e => {
              const d = new Date(e.target.value);
              setSelectedDate(d);
              setShowAllEvents(false);
            }}
            className='flex-1 w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium dark:bg-dark-surface2 dark:text-dark-text focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors'
          />
          <button
            onClick={() => {
              onSelectSlot &&
                onSelectSlot({ start: selectedDate, end: selectedDate });
            }}
            className='w-full sm:w-auto px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm hover:shadow-md'
          >
            ➕ Nueva clase
          </button>
        </div>
        <div className='mt-3 flex items-center justify-between'>
          <div className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            {new Date(fechaISO).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className='text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors'
          >
            {showAllEvents ? 'Ver día' : `Ver todos (${eventosProximos.length})`}
          </button>
        </div>
      </div>

      {/* Lista de eventos */}
      {showAllEvents ? (
        // Mostrar todos los eventos próximos
        eventosProximos.length === 0 ? (
          <div className='p-6 text-center bg-gray-50 dark:bg-dark-surface2 rounded-lg border border-gray-200 dark:border-dark-border'>
            <div className='text-4xl mb-2'>📅</div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
              No hay clases próximas
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-500'>
              Haz clic en "Nueva clase" para programar una
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
              Todas las clases próximas ({eventosProximos.length})
            </h3>
            {eventosProximos.map(ev => {
              const fechaEvento = ev?.resource?.fecha || ev?.start;
              const fecha = typeof fechaEvento === 'string' 
                ? new Date(fechaEvento) 
                : fechaEvento;
              const fechaISOEvento = fecha.toISOString().split('T')[0];
              
              return (
                <button
                  key={ev.id}
                  onClick={() => {
                    setEventoSeleccionado(ev);
                    setMostrarModalAcciones(true);
                  }}
                  className='w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1'>
                      <div className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                        {ev?.resource?.clases?.nombre || 'Clase'}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                        {fecha.toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                      <div className='flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400'>
                        <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium'>
                          {ev?.resource?.clases?.nivel_clase || 'N/A'}
                        </span>
                        <span className='px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium'>
                          {ev?.resource?.clases?.tipo_clase || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold text-gray-900 dark:text-dark-text'>
                        {ev.start?.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) || ev?.resource?.hora_inicio}
                      </div>
                      {ev.end && (
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {ev.end.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) || ev?.resource?.hora_fin}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        // Mostrar solo eventos del día seleccionado
        eventosDelDia.length === 0 ? (
          <div className='p-6 text-center bg-gray-50 dark:bg-dark-surface2 rounded-lg border border-gray-200 dark:border-dark-border'>
            <div className='text-4xl mb-2'>📅</div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-1'>
              No hay clases en este día
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-500'>
              Haz clic en "Nueva clase" para programar una o "Ver todos" para ver todas las clases próximas
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
              Clases programadas ({eventosDelDia.length})
            </h3>
            {eventosDelDia.map(ev => (
              <button
                key={ev.id}
                onClick={() => {
                  setEventoSeleccionado(ev);
                  setMostrarModalAcciones(true);
                }}
                className='w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1'>
                    <div className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                      {ev?.resource?.clases?.nombre || 'Clase'}
                    </div>
                    <div className='flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400'>
                      <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium'>
                        {ev?.resource?.clases?.nivel_clase || 'N/A'}
                      </span>
                      <span className='px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium'>
                        {ev?.resource?.clases?.tipo_clase || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm font-semibold text-gray-900 dark:text-dark-text'>
                      {ev.start?.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      }) || ev?.resource?.hora_inicio}
                    </div>
                    {ev.end && (
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        {ev.end.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) || ev?.resource?.hora_fin}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* Modal de acciones */}
      {handlers && (
        <MobileEventoActionsModal
          evento={eventoSeleccionado}
          isOpen={mostrarModalAcciones}
          onClose={() => {
            setMostrarModalAcciones(false);
            setEventoSeleccionado(null);
          }}
          handlers={handlers}
          getClassColors={getClassColors}
        />
      )}
    </div>
  );
}
