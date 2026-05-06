import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeText } from '../utils/text';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

type TipoRango = 'hoy' | 'semana' | 'mes' | 'año' | string;

interface ClaseMini {
  id: string | null;
  nombre: string | null;
  tipo_clase: string | null;
}

interface EventoMini {
  id: string;
  fecha: string;
  estado: string | null;
  clases: ClaseMini | null;
}

interface IngresoRow {
  id: string;
  cantidad: number | null;
  fecha_pago: string | null;
}

interface GastoRow {
  id: string;
  cantidad: number | null;
  fecha_gasto: string | null;
}

interface TipoClaseResult {
  tipo: 'ingreso' | 'gasto' | string;
  valor: number;
  descripcion?: string;
}

interface InstalacionesDetalleParams {
  tipo: TipoRango;
  fecha?: string | null;
  getTipoClase: (nombre: string, tipoClase: string) => TipoClaseResult;
}

export function useInstalacionesDetalle({ tipo, fecha, getTipoClase }: InstalacionesDetalleParams) {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<{
    ingresos: IngresoRow[];
    gastos: GastoRow[];
    eventos: EventoMini[];
    resumen: {
      totalIngresos: number;
      totalGastos: number;
      balance: number;
      internasPagadas?: number;
      internasPendientes?: number;
    };
  }>({
    ingresos: [],
    gastos: [],
    eventos: [],
    resumen: { totalIngresos: 0, totalGastos: 0, balance: 0 },
  });

  const calcularRango = useCallback(() => {
    const hoy = new Date();
      let fechaInicio: Date;
      let fechaFin: Date;
    switch (tipo) {
      case 'hoy':
        fechaInicio = new Date(hoy);
        fechaFin = new Date(hoy);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - hoy.getDay() + 1);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        if (fecha) {
          const f = new Date(fecha);
          fechaInicio = new Date(f.getFullYear(), f.getMonth(), 1);
          fechaFin = new Date(f.getFullYear(), f.getMonth() + 1, 0);
        } else {
          fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
        fechaFin.setHours(23, 59, 59, 999);
        break;
      case 'año':
        if (fecha) {
          const f = new Date(fecha);
          fechaInicio = new Date(f.getFullYear(), 0, 1);
          fechaFin = new Date(f.getFullYear(), 11, 31);
        } else {
          fechaInicio = new Date(hoy.getFullYear(), 0, 1);
          fechaFin = new Date(hoy.getFullYear(), 11, 31);
        }
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin.setHours(23, 59, 59, 999);
        break;
      default:
        fechaInicio = new Date(fecha || new Date().toISOString().split('T')[0]);
        fechaFin = new Date(fecha || new Date().toISOString().split('T')[0]);
        fechaFin.setHours(23, 59, 59, 999);
    }

    return { fechaInicio, fechaFin };
  }, [tipo, fecha]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { fechaInicio, fechaFin } = calcularRango();

      const [ingresosRes, gastosRes, eventosRes] = await Promise.all([
        supabase
          .from('pagos')
          .select(
            `id, cantidad, fecha_pago, tipo_pago, mes_cubierto, alumnos (nombre)`
          )
          .gte('fecha_pago', fechaInicio.toISOString().split('T')[0])
          .lte('fecha_pago', fechaFin.toISOString().split('T')[0])
          .order('fecha_pago', { ascending: false }),
        supabase
          .from('gastos_material')
          .select('*')
          .gte('fecha_gasto', fechaInicio.toISOString().split('T')[0])
          .lte('fecha_gasto', fechaFin.toISOString().split('T')[0])
          .order('fecha_gasto', { ascending: false }),
        supabase
          .from('eventos_clase')
          .select(`id, fecha, estado, clases (id, nombre, tipo_clase)`) // traer todos y filtrar
          .order('fecha', { ascending: true }),
      ]);

      const todosEventos = (eventosRes.data as EventoMini[] | null) || [];
      const eventosFiltrados = todosEventos.filter((ev: EventoMini) => {
        const f = new Date(ev.fecha);
        return f >= fechaInicio && f <= fechaFin && ev.estado !== 'eliminado';
      });

      // Determinar la primera fecha con clase interna visible en calendario (por tipo_clase o nombre)
      const esInterna = (ev: EventoMini) => {
        const t = normalizeText(ev.clases?.tipo_clase);
        const n = normalizeText(ev.clases?.nombre);
        return t.includes('interna') || n.includes('interna');
      };
      let primeraFechaInterna: string | null = null;
      eventosFiltrados.forEach((ev: EventoMini) => {
        if (esInterna(ev)) {
          if (!primeraFechaInterna || ev.fecha < primeraFechaInterna) {
            primeraFechaInterna = ev.fecha;
          }
        }
      });

      // Ajustar rango efectivo desde la primera interna si existe
      let fechaInicioEfectiva = fechaInicio.toISOString().split('T')[0];
      const primeraFecha = primeraFechaInterna as string | null;
      if (primeraFecha && primeraFecha > fechaInicioEfectiva) {
        fechaInicioEfectiva = primeraFecha;
      }

      // Aplicar filtro desde fechaInicioEfectiva a ingresos/gastos/eventos
      const ingresosFiltradosDesde = (((ingresosRes.data as IngresoRow[] | null) || [])).filter(
        i => (i.fecha_pago || '') >= fechaInicioEfectiva
      );
      const gastosFiltradosDesde = (((gastosRes.data as GastoRow[] | null) || [])).filter(
        g => (g.fecha_gasto || '') >= fechaInicioEfectiva
      );
      const eventosDesde = eventosFiltrados.filter(
        ev => ev.fecha >= fechaInicioEfectiva
      );

      const totalIngresosManuales = (ingresosFiltradosDesde || []).reduce(
        (s, i) => s + (i.cantidad || 0),
        0
      );
      const totalGastosManuales = (gastosFiltradosDesde || []).reduce(
        (s, g) => s + (g.cantidad || 0),
        0
      );

      // Cargar estados de pago de internas para el rango efectivo
      // Obtener ids de clases presentes en eventos
      const claseIds = Array.from(new Set(eventosDesde.map(ev => ev.clases?.id || ''))).filter(
        (id): id is string => Boolean(id)
      );
      let pagosMap = new Map<string, string>();
      if (claseIds.length > 0) {
        const { data: pagosInternas } = await supabase
          .from('pagos_clases_internas')
          .select('id, clase_id, fecha, estado')
          .in('clase_id', claseIds)
          .gte('fecha', fechaInicioEfectiva)
          .lte('fecha', fechaFin.toISOString().split('T')[0]);
        pagosMap = new Map(
          (((pagosInternas as Array<{ clase_id: string | null; fecha: string | null; estado: string | null }> | null) || []).map(p => [
            `${p.clase_id}|${p.fecha}`,
            p.estado || 'pendiente',
          ]))
        );
      }

      let ingresosAuto = 0;
      let gastosAuto = 0;
      let internasPagadas = 0;
      let internasPendientes = 0;
      eventosDesde.forEach((ev: EventoMini) => {
        if (ev.estado === 'cancelada' || ev.estado === 'eliminado') return;
        const nombre = ev.clases?.nombre || '';
        const tipoClase = ev.clases?.tipo_clase || '';
        const { tipo, valor } = getTipoClase(nombre, tipoClase);
        if (tipo === 'ingreso') {
          // Si es interna, contar solo si está pagada
          if (esInterna(ev)) {
            const key = `${ev.clases?.id}|${ev.fecha}`;
            const estado = pagosMap.get(key) || 'pendiente';
            if (estado === 'pagada') {
              ingresosAuto += valor;
              internasPagadas++;
            } else {
              internasPendientes++;
            }
          } else {
            ingresosAuto += valor;
          }
        }
        if (tipo === 'gasto') gastosAuto += valor;
      });

      const totalIngresos = totalIngresosManuales + ingresosAuto;
      const totalGastos = totalGastosManuales + gastosAuto;
      const balance = totalIngresos - totalGastos;

      setDatos({
        ingresos: ingresosFiltradosDesde || [],
        gastos: gastosFiltradosDesde || [],
        eventos: eventosDesde || [],
        resumen: {
          totalIngresos,
          totalGastos,
          balance,
          internasPagadas,
          internasPendientes,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [calcularRango, getTipoClase]);

  useEffect(() => {
    if (!tipo) return undefined;
    return scheduleEffectWork(() => {
      void cargar();
    });
  }, [tipo, fecha, cargar]);

  const eventosPorDia = useMemo(() => {
    const out: Record<string, { fecha: string; ingresos: number; gastos: number; clases: Array<{ nombre: string; tipo: string; valor: number; descripcion?: string; tipoOperacion: string }> }> = {};
    (datos.eventos || []).forEach((ev: EventoMini) => {
      if (ev.estado === 'cancelada' || ev.estado === 'eliminado') return;
      const f = ev.fecha;
      const nombre = ev.clases?.nombre || '';
      const tipoClase = ev.clases?.tipo_clase || '';
      const { tipo, valor, descripcion } = getTipoClase(nombre, tipoClase);
      if (!out[f]) out[f] = { fecha: f, ingresos: 0, gastos: 0, clases: [] };
      if (tipo === 'ingreso') out[f].ingresos += valor;
      if (tipo === 'gasto') out[f].gastos += valor;
      out[f].clases.push({
        nombre,
        tipo: tipoClase,
        valor,
        descripcion,
        tipoOperacion: tipo,
      });
    });
    return out;
  }, [datos.eventos, getTipoClase]);

  return { loading, datos, eventosPorDia, recargar: cargar };
}


