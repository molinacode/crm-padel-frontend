/**
 * Utilidades para manejar el origen de asignaciones
 */

/**
 * Obtiene el origen más común de un array de orígenes
 * @param {string[]} origenes - Array de orígenes
 * @returns {string|null} - El origen más común o null si no hay orígenes
 */
export function obtenerOrigenMasComun(origenes) {
  if (!origenes || origenes.length === 0) {
    return null; // Indica que no hay permanentes
  }
  
  const frecuencia = {};
  origenes.forEach(o => {
    frecuencia[o] = (frecuencia[o] || 0) + 1;
  });
  
  return Object.keys(frecuencia).reduce((a, b) =>
    frecuencia[a] > frecuencia[b] ? a : b
  );
}

/**
 * Determina el origen automático basado en el nombre de la clase
 * @param {object} clase - Objeto de clase con propiedad nombre
 * @returns {string} - 'escuela' o 'interna'
 */
export function determinarOrigenAutomatico(clase) {
  if (!clase) return 'escuela';

  // Si la clase contiene "Escuela" en el nombre, es de origen "escuela"
  if (clase.nombre?.toLowerCase().includes('escuela')) {
    return 'escuela';
  }

  // Si la clase contiene "Interna" en el nombre, es de origen "interna"
  if (clase.nombre?.toLowerCase().includes('interna')) {
    return 'interna';
  }

  // Por defecto, clases normales son de origen "escuela"
  return 'escuela';
}

/**
 * Obtiene el origen de un alumno basado en sus asignaciones permanentes
 * @param {string} alumnoId - ID del alumno
 * @param {Array} asignacionesPermanentes - Array de asignaciones permanentes
 * @returns {string|null} - El origen más común o null si no tiene permanentes
 */
export function obtenerOrigenDeAlumno(alumnoId, asignacionesPermanentes) {
  const origenesAlumno = asignacionesPermanentes
    .filter(ap => ap.alumno_id === alumnoId && ap.origen)
    .map(ap => ap.origen);
  
  return obtenerOrigenMasComun(origenesAlumno);
}

