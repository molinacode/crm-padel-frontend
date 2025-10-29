import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format: (date, formatStr) => format(date, formatStr, { locale: es }),
  parse: (dateStr, formatStr) =>
    parse(dateStr, formatStr, new Date(), { locale: es }),
  startOfWeek: date => startOfWeek(date, { weekStartsOn: 1 }),
  getDay: date => getDay(date),
  locales: { es },
});

const { WEEK, DAY } = Views;

export default function ClasesCalendarView({
  eventos,
  currentDate,
  currentView,
  onNavigate,
  onViewChange,
  onSelectEvent,
  onSelectSlot,
  onDoubleClickEvent,
}) {
  // Convertir currentView de string a Views constant
  const view =
    currentView === 'week' ? WEEK : currentView === 'day' ? DAY : WEEK;

  const eventosFiltrados = (eventos || []).filter(
    evento =>
      evento?.resource?.estado !== 'eliminado' &&
      evento?.resource?.estado !== 'cancelada'
  );

  // Calcular horas mínimas y máximas dinámicamente
  const hoy = new Date();
  const min = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    9,
    0,
    0
  );
  const max = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    0,
    0
  );

  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[600px] h-[400px] sm:h-[500px]'>
        <Calendar
          localizer={localizer}
          events={eventosFiltrados}
          startAccessor='start'
          endAccessor='end'
          style={{ height: '100%', minHeight: '400px' }}
          views={[WEEK, DAY]}
          view={view}
          date={currentDate || new Date()}
          onNavigate={onNavigate}
          onView={onViewChange}
          messages={{
            today: 'Hoy',
            previous: 'Anterior',
            next: 'Siguiente',
            week: 'Semana',
            day: 'Día',
          }}
          culture='es'
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
          onDoubleClickEvent={onDoubleClickEvent}
          selectable
          eventPropGetter={event => ({
            className: event?.className || '',
            style: {
              ...(event?.style || {}),
              fontSize: '12px',
              fontWeight: '500',
            },
          })}
          showMultiDayTimes={false}
          popup={false}
          doShowMoreDrillDown={false}
          min={min}
          max={max}
          step={30}
          timeslots={2}
        />
      </div>
    </div>
  );
}
