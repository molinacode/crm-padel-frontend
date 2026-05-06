import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string) => format(date, formatStr, { locale: es }),
  parse: (dateStr: string, formatStr: string) =>
    parse(dateStr, formatStr, new Date(), { locale: es }),
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay: (date: Date) => getDay(date),
  locales: { es },
});

const { WEEK, DAY, MONTH } = Views;

interface CalendarEvento {
  resource?: { estado?: string };
  className?: string;
  style?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ClasesCalendarViewProps {
  eventos: unknown[];
  currentDate: Date;
  currentView: 'week' | 'day' | 'month' | string;
  onNavigate: (...args: unknown[]) => void;
  onViewChange: (view: 'week' | 'day' | 'month') => void;
  onSelectEvent: (...args: unknown[]) => void;
  onSelectSlot: (...args: unknown[]) => void;
  onDoubleClickEvent: (...args: unknown[]) => void;
}

export default function ClasesCalendarView({
  eventos,
  currentDate,
  currentView,
  onNavigate,
  onViewChange,
  onSelectEvent,
  onSelectSlot,
  onDoubleClickEvent,
}: ClasesCalendarViewProps) {
  const view =
    currentView === 'week'
      ? WEEK
      : currentView === 'day'
      ? DAY
      : currentView === 'month'
      ? MONTH
      : WEEK;

  const eventosFiltrados = ((eventos || []) as CalendarEvento[]).filter(
    evento =>
      evento?.resource?.estado !== 'eliminado' &&
      evento?.resource?.estado !== 'cancelada'
  );

  const hoy = new Date();
  const min = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 0, 0);
  const max = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 0, 0);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px] h-[400px] sm:h-[500px]">
        <Calendar
          localizer={localizer}
          events={eventosFiltrados}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '400px' }}
          views={[MONTH, WEEK, DAY]}
          view={view}
          date={currentDate || new Date()}
          onNavigate={onNavigate}
          onView={onViewChange}
          messages={{
            today: 'Hoy',
            previous: 'Anterior',
            next: 'Siguiente',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
          }}
          culture="es"
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
          onDoubleClickEvent={onDoubleClickEvent}
          selectable
          eventPropGetter={(event: unknown) => ({
            className: (event as CalendarEvento)?.className || '',
            style: {
              ...(((event as CalendarEvento)?.style || {}) as Record<string, unknown>),
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
