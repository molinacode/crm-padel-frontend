import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeText } from '../utils/text';

export function useInstalacionesDetalle({ tipo, fecha, getTipoClase }) {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({
    ingresos: [],
    gastos: [],
    eventos: [],
    resumen: { totalIngresos: 0, totalGastos: 0, balance: 0 },
  });

  const calcularRango = useCallback(() => {
    const hoy = new Date();
    let fechaInicio;
    let fechaFin;
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
        fechaInicio = new Date(fecha);
        fechaFin = new Date(fecha);
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

      const todosEventos = eventosRes.data || [];
      const eventosFiltrados = todosEventos.filter(ev => {
        const f = new Date(ev.fecha);
        return f >= fechaInicio && f <= fechaFin && ev.estado !== 'eliminado';
      });

      // Determinar la primera fecha con clase interna visible en calendario (por tipo_clase o nombre)
      const esInterna = ev => {
        const t = normalizeText(ev.clases?.tipo_clase);
        const n = normalizeText(ev.clases?.nombre);
        return t.includes('interna') || n.includes('interna');
      };
      let primeraFechaInterna = null;
      eventosFiltrados.forEach(ev => {
        if (esInterna(ev)) {
          if (!primeraFechaInterna || ev.fecha < primeraFechaInterna) {
            primeraFechaInterna = ev.fecha;
          }
        }
      });

      // Ajustar rango efectivo desde la primera interna si existe
      let fechaInicioEfectiva = fechaInicio.toISOString().split('T')[0];
      if (primeraFechaInterna && primeraFechaInterna > fechaInicioEfectiva) {
        fechaInicioEfectiva = primeraFechaInterna;
      }

      // Aplicar filtro desde fechaInicioEfectiva a ingresos/gastos/eventos
      const ingresosFiltradosDesde = (ingresosRes.data || []).filter(
        i => i.fecha_pago >= fechaInicioEfectiva
      );
      const gastosFiltradosDesde = (gastosRes.data || []).filter(
        g => g.fecha_gasto >= fechaInicioEfectiva
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
      const claseIds = Array.from(
        new Set((eventosDesde || []).map(ev => ev.clases?.id).filter(Boolean))
      );
      let pagosMap = new Map();
      if (claseIds.length > 0) {
        const { data: pagosInternas } = await supabase
          .from('pagos_clases_internas')
          .select('id, clase_id, fecha, estado')
          .in('clase_id', claseIds)
          .gte('fecha', fechaInicioEfectiva)
          .lte('fecha', fechaFin.toISOString().split('T')[0]);
        pagosMap = new Map(
          (pagosInternas || []).map(p => [`${p.clase_id}|${p.fecha}`, p.estado])
        );
      }

      let ingresosAuto = 0;
      let gastosAuto = 0;
      let internasPagadas = 0;
      let internasPendientes = 0;
      eventosDesde.forEach(ev => {
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
    if (tipo) cargar();
  }, [tipo, fecha, cargar]);

  const eventosPorDia = useMemo(() => {
    const out = {};
    (datos.eventos || []).forEach(ev => {
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
