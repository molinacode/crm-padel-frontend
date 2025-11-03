export function getWeekNumber(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function getYear(dateInput) {
  return new Date(dateInput).getFullYear();
}

export function formatDateES(dateInput, options) {
  if (!dateInput) return 'Sin fecha';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleDateString('es-ES', options);
}

export function formatEUR(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}


