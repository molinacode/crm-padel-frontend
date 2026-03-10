/**
 * Utilidades para calcular huecos disponibles en clases
 */

/**
 * Calcula los huecos disponibles en una clase
 * @param {object} params - Parámetros del cálculo
 * @param {Array} params.alumnosAsignados - Array de alumnos asignados
 * @param {Array} params.alumnosLiberados - Array de alumnos liberados
 * @param {Array} params.alumnosJustificados - Array de alumnos justificados
 * @param {Array} params.alumnosConFalta - Array de alumnos con falta
 * @param {number} params.maxAlumnos - Máximo de alumnos (default: 4)
 * @param {boolean} params.esParticular - Si es clase particular (default: false)
 * @returns {object} - Objeto con información detallada de los huecos
 */
export function calcularHuecosDisponibles({
  alumnosAsignados = [],
  alumnosLiberados = [],
  alumnosJustificados = [],
  alumnosConFalta = [],
  maxAlumnos = 4,
  esParticular = false
}) {
  const maxAlumnosCalculado = esParticular ? 1 : maxAlumnos;
  
  // Convertir a Sets para mejor rendimiento
  const asignadosIds = new Set(
    alumnosAsignados.map(a => a.alumno_id || a.id || a)
  );
  const liberadosIds = new Set(
    alumnosLiberados.map(l => l.alumno_id || l.id || l)
  );
  const justificadosIds = new Set(
    alumnosJustificados.map(j => j.id || j.alumno_id || j)
  );
  const faltasIds = new Set(
    alumnosConFalta.map(f => f.id || f.alumno_id || f)
  );
  
  // Calcular alumnos presentes
  // presentes = asignados - liberados - justificados - faltas
  const alumnosPresentes = Math.max(
    0,
    asignadosIds.size - liberadosIds.size - justificadosIds.size - faltasIds.size
  );
  
  // Calcular huecos reales
  const huecosReales = Math.max(0, maxAlumnosCalculado - alumnosPresentes);
  
  return {
    alumnosAsignados: asignadosIds.size,
    alumnosLiberados: liberadosIds.size,
    alumnosJustificados: justificadosIds.size,
    alumnosConFalta: faltasIds.size,
    alumnosPresentes,
    huecosReales,
    maxAlumnos: maxAlumnosCalculado
  };
}

/**
 * Calcula huecos disponibles desde datos de Supabase
 * @param {object} params - Parámetros del cálculo
 * @param {Array} params.asignacionesData - Datos de asignaciones de Supabase
 * @param {Array} params.liberacionesData - Datos de liberaciones de Supabase
 * @param {Array} params.justificadosData - Datos de justificados
 * @param {Array} params.faltasData - Datos de faltas
 * @param {string} params.eventoId - ID del evento (opcional, para filtrar temporales)
 * @param {number} params.maxAlumnos - Máximo de alumnos
 * @param {boolean} params.esParticular - Si es clase particular
 * @returns {object} - Objeto con información detallada de los huecos
 */
export function calcularHuecosDesdeSupabase({
  asignacionesData = [],
  liberacionesData = [],
  justificadosData = [],
  faltasData = [],
  eventoId = null,
  maxAlumnos = 4,
  esParticular = false
}) {
  // Filtrar asignaciones válidas: permanentes + temporales del evento específico
  const asignacionesValidas = asignacionesData.filter(ac => {
    const esPermanente = !ac.tipo_asignacion || ac.tipo_asignacion === 'permanente';
    const esTemporalDeEsteEvento = 
      ac.tipo_asignacion === 'temporal' && 
      (eventoId ? ac.evento_id === eventoId : true);
    return esPermanente || esTemporalDeEsteEvento;
  });

  return calcularHuecosDisponibles({
    alumnosAsignados: asignacionesValidas,
    alumnosLiberados: liberacionesData,
    alumnosJustificados: justificadosData,
    alumnosConFalta: faltasData,
    maxAlumnos,
    esParticular
  });
}

