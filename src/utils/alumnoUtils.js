/**
 * Utilidades para trabajar con alumnos
 */
import { supabase } from '../lib/supabase';

/**
 * Verifica si un alumno está activo considerando el campo activo y fecha_baja
 * @param {Object} alumno - Objeto alumno con campos activo y fecha_baja
 * @param {Date|string} fechaConsulta - Fecha para verificar (por defecto: hoy)
 * @returns {boolean} - true si el alumno está activo en la fecha consultada
 */
export function esAlumnoActivo(alumno, fechaConsulta = new Date()) {
  if (!alumno) return false;

  // Si está marcado como inactivo, retornar false
  if (alumno.activo === false) {
    return false;
  }

  // Si no tiene fecha_baja, está activo (si activo es true o null/undefined)
  if (!alumno.fecha_baja) {
    return alumno.activo === true || alumno.activo === null || alumno.activo === undefined;
  }

  // Convertir fecha_baja a Date si es string
  const fechaBaja = alumno.fecha_baja instanceof Date 
    ? alumno.fecha_baja 
    : new Date(alumno.fecha_baja);

  // Convertir fechaConsulta a Date si es string
  const fecha = fechaConsulta instanceof Date 
    ? fechaConsulta 
    : new Date(fechaConsulta);

  // Normalizar fechas a medianoche para comparación
  fechaBaja.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);

  // Si la fecha de consulta es anterior a la fecha de baja, está activo
  return fecha < fechaBaja;
}

/**
 * Filtra un array de alumnos para obtener solo los activos
 * @param {Array} alumnos - Array de alumnos
 * @param {Date|string} fechaConsulta - Fecha para verificar (por defecto: hoy)
 * @returns {Array} - Array de alumnos activos
 */
export function filtrarAlumnosActivos(alumnos, fechaConsulta = new Date()) {
  if (!Array.isArray(alumnos)) return [];
  return alumnos.filter(alumno => esAlumnoActivo(alumno, fechaConsulta));
}

/**
 * Obtiene la condición SQL para filtrar alumnos activos en Supabase
 * Considera tanto el campo activo como fecha_baja
 * Nota: Esta función es más compleja de implementar en Supabase debido a las limitaciones
 * de las consultas OR anidadas. Se recomienda usar filtrarAlumnosActivos en el cliente.
 * @param {Date|string} fechaConsulta - Fecha para verificar (por defecto: hoy)
 * @returns {Function} - Función que recibe una query de Supabase y retorna la query filtrada
 * @deprecated Usar filtrarAlumnosActivos en el cliente después de obtener los datos
 */
export function getQueryAlumnosActivos(fechaConsulta = new Date()) {
  // eslint-disable-next-line no-unused-vars
  const fecha = fechaConsulta instanceof Date 
    ? fechaConsulta 
    : new Date(fechaConsulta);

  return (query) => {
    // Alumnos activos son aquellos que:
    // 1. Tienen activo = true Y (fecha_baja IS NULL O fecha_baja > fechaConsulta)
    // 2. O tienen activo = null/undefined Y (fecha_baja IS NULL O fecha_baja > fechaConsulta)
    // Nota: Supabase tiene limitaciones con OR anidados, por lo que esta función
    // solo aplica un filtro básico. El filtrado completo debe hacerse en el cliente.
    
    return query.or('activo.eq.true,activo.is.null');
  };
}

/**
 * Formatea la fecha de baja para mostrar
 * @param {string|Date} fechaBaja - Fecha de baja
 * @returns {string} - Fecha formateada o null
 */
export function formatearFechaBaja(fechaBaja) {
  if (!fechaBaja) return null;
  
  const fecha = fechaBaja instanceof Date ? fechaBaja : new Date(fechaBaja);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Obtiene sugerencias de horarios basadas en la disponibilidad de alumnos de un nivel
 * @param {string} nivel - Nivel de la clase
 * @returns {Promise<Array>} - Array de sugerencias con día, hora_inicio, hora_fin y alumnos_compatibles
 */
export async function obtenerSugerenciasHorarios(nivel) {
  if (!nivel) return [];

  try {
    // Obtener alumnos activos del nivel especificado
    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select('id, nombre, nivel, disponibilidad, activo, fecha_baja')
      .or('activo.eq.true,activo.is.null')
      .eq('nivel', nivel);

    if (error) {
      console.error('Error obteniendo alumnos:', error);
      return [];
    }

    // Filtrar alumnos activos considerando fecha_baja
    const alumnosActivos = filtrarAlumnosActivos(alumnos || [], new Date());

    if (alumnosActivos.length === 0) return [];

    // Analizar disponibilidad de alumnos
    const horariosComunes = {};

    alumnosActivos.forEach(alumno => {
      const disponibilidad = alumno.disponibilidad || {};
      const dias = disponibilidad.dias || [];
      const horarios = disponibilidad.horarios || [];

      dias.forEach(dia => {
        horarios.forEach(horario => {
          const key = `${dia}_${horario.hora_inicio}_${horario.hora_fin}`;
          
          if (!horariosComunes[key]) {
            horariosComunes[key] = {
              dia,
              hora_inicio: horario.hora_inicio,
              hora_fin: horario.hora_fin,
              alumnos_compatibles: 0
            };
          }
          
          horariosComunes[key].alumnos_compatibles++;
        });
      });
    });

    // Convertir a array y ordenar por número de alumnos compatibles (descendente)
    const sugerencias = Object.values(horariosComunes)
      .sort((a, b) => b.alumnos_compatibles - a.alumnos_compatibles);

    return sugerencias;
  } catch (error) {
    console.error('Error obteniendo sugerencias de horarios:', error);
    return [];
  }
}
