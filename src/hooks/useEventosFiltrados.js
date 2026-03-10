import { useMemo } from 'react';
import { normalizeText } from '../utils/text';

/**
 * Hook para filtrar eventos por estado y criterios
 */
export function useEventosFiltrados(eventos, filtros) {
  const { filtroNivel, filtroTipoClase, filtroFechaInicio, filtroFechaFin } =
    filtros;

  const eventosProximos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.start);
        fechaEvento.setHours(0, 0, 0, 0);
        const esFuturo =
          fechaEvento >= hoy &&
          evento.resource.estado !== 'cancelada' &&
          evento.resource.estado !== 'eliminado';
        const coincideNivel =
          !filtroNivel || evento.resource.clases.nivel_clase === filtroNivel;

        let coincideTipo = true;
        if (filtroTipoClase) {
          const clase = evento.resource.clases;
          const tipo = normalizeText(clase.tipo_clase);
          const nom = normalizeText(clase.nombre);
          const f = normalizeText(filtroTipoClase);
          if (f === 'interna' || f === 'escuela') {
            coincideTipo = tipo === f || nom.includes(f);
          } else {
            coincideTipo = tipo === f;
          }
        }

        let coincideFecha = true;
        if (filtroFechaInicio) {
          const fechaInicio = new Date(filtroFechaInicio);
          fechaInicio.setHours(0, 0, 0, 0);
          coincideFecha = coincideFecha && fechaEvento >= fechaInicio;
        }
        if (filtroFechaFin) {
          const fechaFin = new Date(filtroFechaFin);
          fechaFin.setHours(23, 59, 59, 999);
          coincideFecha = coincideFecha && fechaEvento <= fechaFin;
        }

        return esFuturo && coincideNivel && coincideTipo && coincideFecha;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [
    eventos,
    filtroNivel,
    filtroTipoClase,
    filtroFechaInicio,
    filtroFechaFin,
  ]);

  const eventosImpartidos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return eventos
      .filter(evento => {
        const fechaEvento = new Date(evento.start);
        fechaEvento.setHours(0, 0, 0, 0);
        const esPasado =
          fechaEvento < hoy &&
          evento.resource.estado !== 'cancelada' &&
          evento.resource.estado !== 'eliminado';
        const coincideNivel =
          !filtroNivel || evento.resource.clases.nivel_clase === filtroNivel;

        let coincideTipo = true;
        if (filtroTipoClase) {
          const clase = evento.resource.clases;
          const tipo = normalizeText(clase.tipo_clase);
          const nom = normalizeText(clase.nombre);
          const f = normalizeText(filtroTipoClase);
          if (f === 'interna' || f === 'escuela') {
            coincideTipo = tipo === f || nom.includes(f);
          } else {
            coincideTipo = tipo === f;
          }
        }

        let coincideFecha = true;
        if (filtroFechaInicio) {
          const fechaInicio = new Date(filtroFechaInicio);
          fechaInicio.setHours(0, 0, 0, 0);
          coincideFecha = coincideFecha && fechaEvento >= fechaInicio;
        }
        if (filtroFechaFin) {
          const fechaFin = new Date(filtroFechaFin);
          fechaFin.setHours(23, 59, 59, 999);
          coincideFecha = coincideFecha && fechaEvento <= fechaFin;
        }

        return esPasado && coincideNivel && coincideTipo && coincideFecha;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.start);
        const fechaB = new Date(b.start);
        return fechaB - fechaA;
      });
  }, [
    eventos,
    filtroNivel,
    filtroTipoClase,
    filtroFechaInicio,
    filtroFechaFin,
  ]);

  const eventosCancelados = useMemo(() => {
    return eventos
      .filter(evento => {
        const esCancelada =
          evento.resource.estado === 'cancelada' ||
          evento.resource.estado === 'eliminado';
        const coincideNivel =
          !filtroNivel || evento.resource.clases.nivel_clase === filtroNivel;

        let coincideTipo = true;
        if (filtroTipoClase) {
          const clase = evento.resource.clases;
          const tipo = normalizeText(clase.tipo_clase);
          const nom = normalizeText(clase.nombre);
          const f = normalizeText(filtroTipoClase);
          if (f === 'interna' || f === 'escuela') {
            coincideTipo = tipo === f || nom.includes(f);
          } else {
            coincideTipo = tipo === f;
          }
        }

        let coincideFecha = true;
        if (filtroFechaInicio) {
          const fechaInicio = new Date(filtroFechaInicio);
          fechaInicio.setHours(0, 0, 0, 0);
          const fechaEvento = new Date(evento.start);
          fechaEvento.setHours(0, 0, 0, 0);
          coincideFecha = coincideFecha && fechaEvento >= fechaInicio;
        }
        if (filtroFechaFin) {
          const fechaFin = new Date(filtroFechaFin);
          fechaFin.setHours(23, 59, 59, 999);
          const fechaEvento = new Date(evento.start);
          fechaEvento.setHours(0, 0, 0, 0);
          coincideFecha = coincideFecha && fechaEvento <= fechaFin;
        }

        return esCancelada && coincideNivel && coincideTipo && coincideFecha;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.start);
        const fechaB = new Date(b.start);
        return fechaB - fechaA;
      });
  }, [
    eventos,
    filtroNivel,
    filtroTipoClase,
    filtroFechaInicio,
    filtroFechaFin,
  ]);

  return {
    eventosProximos,
    eventosImpartidos,
    eventosCancelados,
  };
}
