export type TipoRangoSemana = 'actual' | 'anterior' | 'siguiente';

export const obtenerRangoSemana = (
  tipo: TipoRangoSemana = 'actual'
): { fechaInicio: Date; fechaFin: Date } => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  let fechaInicio: Date;
  let fechaFin: Date;

  switch (tipo) {
    case 'anterior':
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() + diasHastaLunes - 7);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6);
      break;
    case 'siguiente':
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() + diasHastaLunes + 7);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6);
      break;
    default:
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() + diasHastaLunes);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6);
      break;
  }

  fechaInicio.setHours(0, 0, 0, 0);
  fechaFin.setHours(23, 59, 59, 999);

  return { fechaInicio, fechaFin };
};

export const obtenerInicioSemanaActual = (): Date => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const fechaInicio = new Date(hoy);
  fechaInicio.setDate(hoy.getDate() + diasHastaLunes);
  fechaInicio.setHours(0, 0, 0, 0);

  return fechaInicio;
};

export const obtenerFinSemanaActual = (): Date => {
  const { fechaFin } = obtenerRangoSemana('actual');
  return fechaFin;
};

export const obtenerRangoSemanaISO = (): { lunes: string; domingo: string } => {
  const { fechaInicio, fechaFin } = obtenerRangoSemana('actual');

  return {
    lunes: fechaInicio.toISOString().split('T')[0],
    domingo: fechaFin.toISOString().split('T')[0],
  };
};

export const formatearFecha = (
  fecha: Date | string,
  opciones: Intl.DateTimeFormatOptions = {}
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  };

  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

  return fechaObj.toLocaleDateString('es-ES', {
    ...defaultOptions,
    ...opciones,
  });
};

export const formatearFechaCorta = (fecha: Date | string): string => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

  return fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const obtenerMesActual = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};

export const diasEntreFechas = (
  fecha1: Date | string,
  fecha2: Date | string
): number => {
  const d1 = fecha1 instanceof Date ? fecha1 : new Date(fecha1);
  const d2 = fecha2 instanceof Date ? fecha2 : new Date(fecha2);

  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const fechaEnRango = (
  fecha: Date | string,
  fechaInicio: Date | string,
  fechaFin: Date | string
): boolean => {
  const f = fecha instanceof Date ? fecha : new Date(fecha);
  const inicio =
    fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

  f.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);

  return f >= inicio && f <= fin;
};
