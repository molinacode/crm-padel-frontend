/**
 * Utilidades para manejo de fechas
 * Incluye funciones para calcular semanas, rangos de fechas y formateo
 */

/**
 * Obtiene el rango de la semana (lunes a domingo)
 * @param {string} tipo - 'actual' | 'anterior' | 'siguiente'
 * @returns {{ fechaInicio: Date, fechaFin: Date }}
 */
export const obtenerRangoSemana = (tipo = 'actual') => {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajustar para que lunes sea el inicio

  let fechaInicio, fechaFin;

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
    default: // 'actual'
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(hoy.getDate() + diasHastaLunes);
      fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaInicio.getDate() + 6);
      break;
  }

  // Normalizar a inicio/fin de día
  fechaInicio.setHours(0, 0, 0, 0);
  fechaFin.setHours(23, 59, 59, 999);

  return { fechaInicio, fechaFin };
};

/**
 * Obtiene el lunes de la semana actual
 * @returns {Date}
 */
export const obtenerInicioSemanaActual = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const fechaInicio = new Date(hoy);
  fechaInicio.setDate(hoy.getDate() + diasHastaLunes);
  fechaInicio.setHours(0, 0, 0, 0);

  return fechaInicio;
};

/**
 * Obtiene el domingo de la semana actual
 * @returns {Date}
 */
export const obtenerFinSemanaActual = () => {
  const { fechaFin } = obtenerRangoSemana('actual');
  return fechaFin;
};

/**
 * Obtiene el primer y último día de la semana actual
 * @returns {{ lunes: string, domingo: string }} - Fechas en formato ISO
 */
export const obtenerRangoSemanaISO = () => {
  const { fechaInicio, fechaFin } = obtenerRangoSemana('actual');

  return {
    lunes: fechaInicio.toISOString().split('T')[0],
    domingo: fechaFin.toISOString().split('T')[0],
  };
};

/**
 * Formatea una fecha para mostrar en la UI
 * @param {Date|string} fecha
 * @param {object} opciones - Opciones de formato
 * @returns {string}
 */
export const formatearFecha = (fecha, opciones = {}) => {
  const defaultOptions = {
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

/**
 * Formatea una fecha como "DD/MM/YYYY"
 * @param {Date|string} fecha
 * @returns {string}
 */
export const formatearFechaCorta = fecha => {
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

  return fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Calcula el mes actual en formato 'YYYY-MM'
 * @returns {string}
 */
export const obtenerMesActual = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calcula días entre dos fechas
 * @param {Date|string} fecha1
 * @param {Date|string} fecha2
 * @returns {number}
 */
export const diasEntreFechas = (fecha1, fecha2) => {
  const d1 = fecha1 instanceof Date ? fecha1 : new Date(fecha1);
  const d2 = fecha2 instanceof Date ? fecha2 : new Date(fecha2);

  const diff = d2 - d1;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si una fecha está dentro de un rango
 * @param {Date|string} fecha
 * @param {Date|string} fechaInicio
 * @param {Date|string} fechaFin
 * @returns {boolean}
 */
export const fechaEnRango = (fecha, fechaInicio, fechaFin) => {
  const f = fecha instanceof Date ? fecha : new Date(fecha);
  const inicio =
    fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  const fin = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

  f.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);

  return f >= inicio && f <= fin;
};
