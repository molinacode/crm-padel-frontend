import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const FRANJAS_DEFAULT = ['19:00', '20:00', '21:00'];

export const COLORES_GRUPO = [
  '#3b82f6',
  '#8b5cf6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#14b8a6',
];

export const NIVELES_GRUPO = [
  'Infantil',
  'Iniciación (1)',
  'Iniciación (2)',
  'Medio (3)',
  'Medio (4)',
  'Avanzado (5)',
];

export function normalizeHora(hora: string | null | undefined): string {
  if (!hora) return '';
  return hora.slice(0, 5);
}

export function formatHoraLabel(hora: string): string {
  const h = normalizeHora(hora);
  const [hh, mm] = h.split(':');
  if (!hh) return h;
  if (mm === '00') return `${Number(hh)}h`;
  return h;
}

export function slotKey(dia: string, hora: string): string {
  return `${dia}|${normalizeHora(hora)}`;
}

export function addOneHour(hora: string): string {
  const [hhRaw, mmRaw] = normalizeHora(hora).split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw || 0);
  if (Number.isNaN(hh)) return '20:00';
  const next = (hh + 1) % 24;
  return `${String(next).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function mondayOf(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(weekStart: Date) {
  return DIAS_SEMANA.map((nombre, index) => {
    const date = addDays(weekStart, index);
    return {
      nombre,
      date,
      etiqueta: format(date, 'EEE d', { locale: es }),
    };
  });
}

export function franjasDeGrupos(
  horas: Array<string | null | undefined>,
  extra: string[] = FRANJAS_DEFAULT
): string[] {
  const set = new Set(extra.map(normalizeHora).filter(Boolean));
  for (const hora of horas) {
    const h = normalizeHora(hora);
    if (h) set.add(h);
  }
  return [...set].sort();
}

export function grupoEnFranja<T extends { activo?: boolean | null; dia_semana: string | null; hora_inicio: string | null }>(
  grupos: T[],
  dia: string,
  hora: string
): T | undefined {
  return grupos.find(
    g =>
      g.activo !== false &&
      g.dia_semana === dia &&
      normalizeHora(g.hora_inicio) === normalizeHora(hora)
  );
}

export function semanaLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  return `${format(weekStart, 'd MMM', { locale: es })} — ${format(end, 'd MMM yyyy', { locale: es })}`;
}
