export function getWeekNumber(dateInput: string | number | Date): number {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getYear(dateInput: string | number | Date): number {
  return new Date(dateInput).getFullYear();
}

export function formatDateES(
  dateInput: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return 'Sin fecha';
  const d =
    typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
  return d.toLocaleDateString('es-ES', options);
}

export function formatEUR(amount: string | number | null | undefined): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));
}
