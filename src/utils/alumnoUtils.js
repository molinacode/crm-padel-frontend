import { supabase } from '../lib/supabase';

/**
 * Obtiene alumnos compatibles con un horario específico
 * @param {string} diaSemana - Día de la semana (ej: 'Lunes')
 * @param {string} horaInicio - Hora de inicio (ej: '10:00')
 * @param {string} horaFin - Hora de fin (ej: '11:00')
 * @param {string} nivel - Nivel requerido (ej: 'Iniciación (1)')
 * @returns {Array} Lista de alumnos compatibles
 */
export const obtenerAlumnosCompatibles = async (
  diaSemana,
  horaInicio,
  horaFin,
  nivel
) => {
  try {
    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('nivel', nivel);

    if (error) throw error;

    // Filtrar alumnos que tengan disponibilidad compatible
    const alumnosCompatibles = alumnos.filter(alumno => {
      // Verificar si el día está en sus días disponibles
      const diaDisponible =
        alumno.dias_disponibles && alumno.dias_disponibles.includes(diaSemana);

      if (!diaDisponible) return false;

      // Verificar si el horario está dentro de su disponibilidad
      const horariosDisponibles = alumno.horarios_disponibles || [];

      // Compatibilidad con formato antiguo
      if (
        horariosDisponibles.length === 0 &&
        alumno.hora_inicio_disponible &&
        alumno.hora_fin_disponible
      ) {
        horariosDisponibles.push({
          hora_inicio: alumno.hora_inicio_disponible,
          hora_fin: alumno.hora_fin_disponible,
        });
      }

      if (horariosDisponibles.length === 0) return false;

      // Convertir horas a minutos para comparar
      const convertirAMinutos = hora => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };

      const inicioClase = convertirAMinutos(horaInicio);
      const finClase = convertirAMinutos(horaFin);

      // Verificar si la clase está dentro de alguno de los horarios disponibles
      return horariosDisponibles.some(horario => {
        const inicioAlumno = convertirAMinutos(horario.hora_inicio);
        const finAlumno = convertirAMinutos(horario.hora_fin);

        // La clase debe estar dentro del horario disponible del alumno
        return inicioClase >= inicioAlumno && finClase <= finAlumno;
      });
    });

    return alumnosCompatibles;
  } catch (error) {
    console.error('Error obteniendo alumnos compatibles:', error);
    return [];
  }
};

/**
 * Obtiene sugerencias de horarios basadas en la disponibilidad de alumnos
 * @param {string} nivel - Nivel requerido
 * @returns {Array} Lista de sugerencias de horarios
 */
export const obtenerSugerenciasHorarios = async nivel => {
  try {
    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('nivel', nivel);

    if (error) throw error;

    // Crear un mapa de disponibilidad por día
    const disponibilidadPorDia = {
      Lunes: [],
      Martes: [],
      Miércoles: [],
      Jueves: [],
      Viernes: [],
      Sábado: [],
      Domingo: [],
    };

    // Agrupar alumnos por días disponibles
    alumnos.forEach(alumno => {
      if (alumno.dias_disponibles) {
        let horariosDisponibles = alumno.horarios_disponibles || [];

        // Compatibilidad con formato antiguo
        if (
          horariosDisponibles.length === 0 &&
          alumno.hora_inicio_disponible &&
          alumno.hora_fin_disponible
        ) {
          horariosDisponibles = [
            {
              hora_inicio: alumno.hora_inicio_disponible,
              hora_fin: alumno.hora_fin_disponible,
            },
          ];
        }

        if (horariosDisponibles.length > 0) {
          alumno.dias_disponibles.forEach(dia => {
            if (disponibilidadPorDia[dia]) {
              horariosDisponibles.forEach(horario => {
                disponibilidadPorDia[dia].push({
                  nombre: alumno.nombre,
                  hora_inicio: horario.hora_inicio,
                  hora_fin: horario.hora_fin,
                });
              });
            }
          });
        }
      }
    });

    // Generar sugerencias de horarios
    const sugerencias = [];

    Object.entries(disponibilidadPorDia).forEach(
      ([dia, alumnosDisponibles]) => {
        if (alumnosDisponibles.length > 0) {
          // Encontrar horarios comunes
          const horariosComunes = encontrarHorariosComunes(alumnosDisponibles);

          horariosComunes.forEach(horario => {
            sugerencias.push({
              dia,
              hora_inicio: horario.inicio,
              hora_fin: horario.fin,
              alumnos_compatibles: horario.alumnos.length,
              alumnos: horario.alumnos.map(a => a.nombre),
            });
          });
        }
      }
    );

    // Ordenar por número de alumnos compatibles (descendente)
    return sugerencias.sort(
      (a, b) => b.alumnos_compatibles - a.alumnos_compatibles
    );
  } catch (error) {
    console.error('Error obteniendo sugerencias de horarios:', error);
    return [];
  }
};

/**
 * Encuentra horarios comunes entre múltiples alumnos
 * @param {Array} alumnos - Lista de alumnos con sus horarios
 * @returns {Array} Lista de horarios comunes
 */
const encontrarHorariosComunes = alumnos => {
  const horariosComunes = [];

  // Convertir todos los horarios a minutos
  const convertirAMinutos = hora => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const convertirAMinutosAHora = minutos => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Generar horarios de 1 hora cada 30 minutos entre 8:00 y 22:00
  for (let inicio = 8 * 60; inicio <= 21 * 60; inicio += 30) {
    const fin = inicio + 60; // Clase de 1 hora

    const alumnosCompatibles = alumnos.filter(alumno => {
      const inicioAlumno = convertirAMinutos(alumno.hora_inicio);
      const finAlumno = convertirAMinutos(alumno.hora_fin);

      return inicio >= inicioAlumno && fin <= finAlumno;
    });

    if (alumnosCompatibles.length > 0) {
      horariosComunes.push({
        inicio: convertirAMinutosAHora(inicio),
        fin: convertirAMinutosAHora(fin),
        alumnos: alumnosCompatibles,
      });
    }
  }

  return horariosComunes;
};
