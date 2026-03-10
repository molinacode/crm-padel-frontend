import { useMemo } from 'react';
import { obtenerRangoSemana } from '../utils/dateUtils';

/**
 * Filtra eventos por semana y profesor, y los agrupa por día.
 * @param {Array} eventos - Lista de eventos ya procesados con campos { start, resource, profesor }
 * @param {string} filtroSemana - 'actual' | 'anterior' | 'siguiente'
 * @param {string} profesorSeleccionado - id/nombre del profesor o '' para todos
 * @returns {{ eventosFiltrados: Array, eventosPorDia: Object, infoSemana: {inicio: string, fin: string, mes: string} }}
 */
export function useEventosSemanaProfesor(
  eventos,
  filtroSemana,
  profesorSeleccionado
) {
  const { eventosFiltrados, eventosPorDia, infoSemana } = useMemo(() => {
    const { fechaInicio, fechaFin } = obtenerRangoSemana(filtroSemana);

    const base = (eventos || [])
      .filter(evento => {
        const fechaEvento = new Date(evento.start);
        fechaEvento.setHours(0, 0, 0, 0);

        const esDelProfesor =
          !profesorSeleccionado || evento.profesor === profesorSeleccionado;
        const esDeLaSemana =
          fechaEvento >= fechaInicio && fechaEvento <= fechaFin;
        const noEstaCancelada = evento.resource?.estado !== 'cancelada';

        return esDelProfesor && esDeLaSemana && noEstaCancelada;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    const grupos = {};
    base.forEach(evento => {
      const fecha = evento.start.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
      });
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(evento);
    });

    const infoSemana = {
      inicio: fechaInicio.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      }),
      fin: fechaFin.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      }),
      mes: fechaInicio.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      }),
    };

    return { eventosFiltrados: base, eventosPorDia: grupos, infoSemana };
  }, [eventos, filtroSemana, profesorSeleccionado]);

  return { eventosFiltrados, eventosPorDia, infoSemana };
}
