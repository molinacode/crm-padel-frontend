import { useCallback, useMemo } from 'react';
import { normalizeText } from '../utils/text';

interface EventoLike {
  start: string | Date;
  resource: {
    estado?: string | null;
    clases: {
      nombre?: string | null;
      tipo_clase?: string | null;
      nivel_clase?: string | null;
    };
  };
}

interface FiltrosEventos {
  filtroNivel?: string;
  filtroTipoClase?: string;
  filtroFechaInicio?: string;
  filtroFechaFin?: string;
}

export function useEventosFiltrados(eventos: EventoLike[], filtros: FiltrosEventos) {
  const { filtroNivel, filtroTipoClase, filtroFechaInicio, filtroFechaFin } = filtros;

  const filtrarBase = useCallback((evento: EventoLike, hoyCmp: 'futuro' | 'pasado' | 'todos') => {
    const fechaEvento = new Date(evento.start);
    fechaEvento.setHours(0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (hoyCmp === 'futuro' && fechaEvento < hoy) return false;
    if (hoyCmp === 'pasado' && fechaEvento >= hoy) return false;

    const estado = evento.resource?.estado;
    const esCancelada = estado === 'cancelada' || estado === 'eliminado';
    if (hoyCmp !== 'todos' && esCancelada) return false;
    if (hoyCmp === 'todos' && !esCancelada) return false;

    const coincideNivel = !filtroNivel || evento.resource?.clases?.nivel_clase === filtroNivel;

    let coincideTipo = true;
    if (filtroTipoClase) {
      const clase = evento.resource.clases;
      const tipo = normalizeText(clase.tipo_clase);
      const nom = normalizeText(clase.nombre);
      const f = normalizeText(filtroTipoClase);
      coincideTipo = f === 'interna' || f === 'escuela' ? tipo === f || nom.includes(f) : tipo === f;
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

    return coincideNivel && coincideTipo && coincideFecha;
  }, [filtroFechaFin, filtroFechaInicio, filtroNivel, filtroTipoClase]);

  const eventosProximos = useMemo(() => {
    return [...eventos]
      .filter((e) => filtrarBase(e, 'futuro'))
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [eventos, filtrarBase]);

  const eventosImpartidos = useMemo(() => {
    return [...eventos]
      .filter((e) => filtrarBase(e, 'pasado'))
      .sort((a, b) => +new Date(b.start) - +new Date(a.start));
  }, [eventos, filtrarBase]);

  const eventosCancelados = useMemo(() => {
    return [...eventos]
      .filter((e) => filtrarBase(e, 'todos'))
      .sort((a, b) => +new Date(b.start) - +new Date(a.start));
  }, [eventos, filtrarBase]);

  return { eventosProximos, eventosImpartidos, eventosCancelados };
}


