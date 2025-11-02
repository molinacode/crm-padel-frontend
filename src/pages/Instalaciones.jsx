import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { LoadingSpinner } from '@shared';
import { FormularioGastoMaterial } from '@features/instalaciones';
import {
  InstalacionesHeader,
  InstalacionesStatsCard,
  InstalacionesTabs,
  useInstalacionesData,
} from '@features/instalaciones';
import { supabase } from '../lib/supabase';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Instalaciones() {
  const navigate = useNavigate();
  const { eventos, pagos, gastosMaterial, loading } = useInstalacionesData();
  const [tabActiva, setTabActiva] = useState('diario');
  const [mostrarFormularioGasto, setMostrarFormularioGasto] = useState(false);
  const [gastoEditar, setGastoEditar] = useState(null);
  const [pagosInternasMap, setPagosInternasMap] = useState(new Map());

  // Funciones para manejar gastos de material

  // Cargar estados de pago de clases internas para el rango de eventos presentes
  useEffect(() => {
    const cargarPagosInternas = async () => {
      try {
        if (!Array.isArray(eventos) || eventos.length === 0) {
          setPagosInternasMap(new Map());
          return;
        }
        const fechas = eventos
          .map(e => e.fecha)
          .filter(Boolean)
          .sort();
        const fechaInicio = fechas[0];
        const fechaFin = fechas[fechas.length - 1];
        const claseIds = Array.from(
          new Set(eventos.map(e => e.clases?.id || e.clase_id).filter(Boolean))
        );
        if (claseIds.length === 0) {
          setPagosInternasMap(new Map());
          return;
        }
        const { data, error } = await supabase
          .from('pagos_clases_internas')
          .select('clase_id, fecha, estado')
          .in('clase_id', claseIds)
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin);
        if (error) throw error;
        const map = new Map(
          (data || []).map(p => [`${p.clase_id}|${p.fecha}`, p.estado])
        );
        setPagosInternasMap(map);
      } catch (e) {
        console.error('Error cargando pagos internas:', e);
        setPagosInternasMap(new Map());
      }
    };
    cargarPagosInternas();
  }, [eventos]);

  // Calcular tipo de clase según nuevos criterios
  const getTipoClase = (nombre, tipoClase) => {
    // Normalizar tipoClase para comparaciones
    const tipoNormalizado = tipoClase?.toLowerCase()?.trim();
    const nombreNormalizado = nombre?.toLowerCase()?.trim();

    // Solo clases internas generan ingresos: +15€
    if (
      tipoNormalizado === 'interna' ||
      nombreNormalizado?.includes('interna')
    ) {
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase interna' };
    }

    // Clases de escuela: se pagan (alquiler) a 21€
    if (
      tipoNormalizado === 'escuela' ||
      nombreNormalizado?.includes('escuela')
    ) {
      return { tipo: 'gasto', valor: 21, descripcion: 'Alquiler escuela' };
    }

    // Clases particulares: ingresos variables (por ahora neutro)
    if (
      tipoNormalizado === 'particular' ||
      nombreNormalizado?.includes('particular')
    ) {
      return {
        tipo: 'neutro',
        valor: 0,
        descripcion: 'Clase particular (ingreso manual)',
      };
    }

    // Clases grupales: ingresos de 15€
    if (tipoNormalizado === 'grupal' || nombreNormalizado?.includes('grupal')) {
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase grupal' };
    }

    // Mantener lógica anterior para compatibilidad
    if (nombre?.includes('Escuela')) {
      return { tipo: 'gasto', valor: 21, descripcion: 'Escuela' };
    }

    return { tipo: 'neutro', valor: 0, descripcion: 'Clase normal' };
  };

  // Función para número de semana
  const getWeekNumber = date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
  };

  // Función para obtener el año
  const getYear = date => {
    return new Date(date).getFullYear();
  };

  // Procesar datos por períodos
  const datosProcesados = useMemo(() => {
    const diario = {};
    const semanal = {};
    const mensual = {};
    const anual = {};

    // Procesar eventos (ingresos de clases internas + gastos de escuela)
    if (Array.isArray(eventos)) {
      eventos.forEach((ev, index) => {
        // Saltar eventos eliminados o cancelados
        if (ev.estado === 'eliminado' || ev.estado === 'cancelada') {
          console.log(
            `⏭️ Saltando evento ${index + 1} (${ev.estado}):`,
            ev.clases?.nombre
          );
          return;
        }

        const fechaEv = new Date(ev.fecha);
        const nombreClase = ev.clases?.nombre || '';
        const tipoClase = ev.clases?.tipo_clase || '';
        const { tipo, valor } = getTipoClase(nombreClase, tipoClase);

        // Procesar tanto ingresos como gastos (internas: contar solo si pagadas)
        if (tipo !== 'neutro') {
          const dia = fechaEv.toISOString().split('T')[0];
          const semana = `${fechaEv.getFullYear()}-W${getWeekNumber(fechaEv)}`;
          const mes = `${fechaEv.getFullYear()}-${String(fechaEv.getMonth() + 1).padStart(2, '0')}`;
          const año = getYear(fechaEv);

          // Debug temporal: verificar eventos procesados
          if (index < 5) {
            console.log(`📅 Evento ${index + 1}:`, {
              fecha: dia,
              nombre: nombreClase,
              tipo: tipoClase,
              tipoCalculado: tipo,
              valor,
              estado: ev.estado,
            });
          }

          // Diario
          if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') {
            const tipoNorm = (tipoClase || '').toLowerCase();
            const nombreNorm = (nombreClase || '').toLowerCase();
            const esInterna =
              tipoNorm.includes('interna') || nombreNorm.includes('interna');
            if (esInterna) {
              const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
              const estado = pagosInternasMap.get(key) || 'pendiente';
              if (estado === 'pagada') diario[dia].ingresos += valor;
            } else {
              diario[dia].ingresos += valor;
            }
          }
          if (tipo === 'gasto') diario[dia].gastos += valor;

          // Semanal
          if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') {
            const tipoNorm = (tipoClase || '').toLowerCase();
            const nombreNorm = (nombreClase || '').toLowerCase();
            const esInterna =
              tipoNorm.includes('interna') || nombreNorm.includes('interna');
            if (esInterna) {
              const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
              const estado = pagosInternasMap.get(key) || 'pendiente';
              if (estado === 'pagada') semanal[semana].ingresos += valor;
            } else {
              semanal[semana].ingresos += valor;
            }
          }
          if (tipo === 'gasto') semanal[semana].gastos += valor;

          // Mensual
          if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') {
            const tipoNorm = (tipoClase || '').toLowerCase();
            const nombreNorm = (nombreClase || '').toLowerCase();
            const esInterna =
              tipoNorm.includes('interna') || nombreNorm.includes('interna');
            if (esInterna) {
              const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
              const estado = pagosInternasMap.get(key) || 'pendiente';
              if (estado === 'pagada') mensual[mes].ingresos += valor;
            } else {
              mensual[mes].ingresos += valor;
            }
          }
          if (tipo === 'gasto') mensual[mes].gastos += valor;

          // Anual
          if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') {
            const tipoNorm = (tipoClase || '').toLowerCase();
            const nombreNorm = (nombreClase || '').toLowerCase();
            const esInterna =
              tipoNorm.includes('interna') || nombreNorm.includes('interna');
            if (esInterna) {
              const key = `${ev.clases?.id || ev.clase_id}|${dia}`;
              const estado = pagosInternasMap.get(key) || 'pendiente';
              if (estado === 'pagada') anual[año].ingresos += valor;
            } else {
              anual[año].ingresos += valor;
            }
          }
          if (tipo === 'gasto') anual[año].gastos += valor;
        }
      });
    }

    // Procesar ingresos desde pagos reales
    if (Array.isArray(pagos)) {
      pagos.forEach((pago, index) => {
        const fechaPago = new Date(pago.fecha_pago);
        const dia = fechaPago.toISOString().split('T')[0];
        const semana = `${fechaPago.getFullYear()}-W${getWeekNumber(fechaPago)}`;
        const mes = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}`;
        const año = getYear(fechaPago);

        // Diario
        if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
        diario[dia].ingresos += pago.cantidad;

        // Semanal
        if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
        semanal[semana].ingresos += pago.cantidad;

        // Mensual
        if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
        mensual[mes].ingresos += pago.cantidad;

        // Anual
        if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
        anual[año].ingresos += pago.cantidad;
      });
    }

    if (Array.isArray(gastosMaterial) && gastosMaterial.length > 0) {
      gastosMaterial.forEach((gasto, index) => {
        const fechaGasto = new Date(gasto.fecha_gasto);
        const dia = fechaGasto.toISOString().split('T')[0];
        const semana = `${fechaGasto.getFullYear()}-W${getWeekNumber(fechaGasto)}`;
        // Usar fecha_gasto_mes si está disponible, sino calcular desde fecha_gasto
        const mes = gasto.fecha_gasto_mes
          ? `${new Date(gasto.fecha_gasto_mes).getFullYear()}-${String(new Date(gasto.fecha_gasto_mes).getMonth() + 1).padStart(2, '0')}`
          : `${fechaGasto.getFullYear()}-${String(fechaGasto.getMonth() + 1).padStart(2, '0')}`;
        const año = getYear(fechaGasto);

        // Diario
        if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
        diario[dia].gastos += gasto.cantidad;

        // Semanal
        if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
        semanal[semana].gastos += gasto.cantidad;

        // Mensual
        if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
        mensual[mes].gastos += gasto.cantidad;

        // Anual
        if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
        anual[año].gastos += gasto.cantidad;
      });
    }

    return { diario, semanal, mensual, anual };
  }, [eventos, pagos, gastosMaterial]);

  // Calcular estadísticas para cards
  const estadisticas = useMemo(() => {
    const { diario, semanal, mensual, anual } = datosProcesados;

    const hoy = new Date().toISOString().split('T')[0];
    const semanaActual = `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`;
    const mesActual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const añoActual = new Date().getFullYear();

    const stats = {
      diario: {
        ingresos: diario[hoy]?.ingresos || 0,
        gastos: diario[hoy]?.gastos || 0,
        balance: (diario[hoy]?.ingresos || 0) - (diario[hoy]?.gastos || 0),
      },
      semanal: {
        ingresos: semanal[semanaActual]?.ingresos || 0,
        gastos: semanal[semanaActual]?.gastos || 0,
        balance:
          (semanal[semanaActual]?.ingresos || 0) -
          (semanal[semanaActual]?.gastos || 0),
      },
      mensual: {
        ingresos: mensual[mesActual]?.ingresos || 0,
        gastos: mensual[mesActual]?.gastos || 0,
        balance:
          (mensual[mesActual]?.ingresos || 0) -
          (mensual[mesActual]?.gastos || 0),
      },
      anual: {
        ingresos: anual[añoActual]?.ingresos || 0,
        gastos: anual[añoActual]?.gastos || 0,
        balance:
          (anual[añoActual]?.ingresos || 0) - (anual[añoActual]?.gastos || 0),
      },
    };

    return stats;
  }, [datosProcesados]);

  // Resumen de internas (pagadas/pendientes) para el período activo
  const internasResumenPeriodo = useMemo(() => {
    if (!Array.isArray(eventos)) return { pagadas: 0, pendientes: 0 };
    const hoy = new Date();
    let inicio, fin;
    if (tabActiva === 'diario') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      fin = new Date(inicio);
    } else if (tabActiva === 'semanal') {
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - hoy.getDay() + 1);
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
    } else if (tabActiva === 'mensual') {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    } else {
      inicio = new Date(hoy.getFullYear(), 0, 1);
      fin = new Date(hoy.getFullYear(), 11, 31);
    }
    const inRange = e => {
      const d = new Date(e.fecha);
      d.setHours(0, 0, 0, 0);
      return d >= inicio && d <= fin;
    };
    let pagadas = 0;
    let pendientes = 0;
    eventos.filter(inRange).forEach(ev => {
      const nombre = ev.clases?.nombre?.toLowerCase() || '';
      const tipo = ev.clases?.tipo_clase?.toLowerCase() || '';
      const esInterna = tipo.includes('interna') || nombre.includes('interna');
      if (!esInterna) return;
      const key = `${ev.clases?.id || ev.clase_id}|${ev.fecha}`;
      const estado = pagosInternasMap.get(key) || 'pendiente';
      if (estado === 'pagada') pagadas++;
      else pendientes++;
    });
    return { pagadas, pendientes };
  }, [eventos, pagosInternasMap, tabActiva]);

  // Preparar datos para gráficos
  const datosGrafico = useMemo(() => {
    const { diario, semanal, mensual, anual } = datosProcesados;

    let labels = [];
    let ingresos = [];
    let gastos = [];

    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    switch (tabActiva) {
      case 'diario': {
        // Filtrar solo fechas de los últimos 30 días y ordenar
        const fechasValidas = Object.keys(diario)
          .filter(fecha => {
            const fechaObj = new Date(fecha);
            return fechaObj >= hace30Dias && fechaObj <= hoy;
          })
          .sort();

        labels = fechasValidas;
        ingresos = labels.map(d => diario[d].ingresos);
        gastos = labels.map(d => diario[d].gastos);

        break;
      }
      case 'semanal': {
        // Filtrar solo semanas de los últimos 3 meses y ordenar
        const hoy = new Date();
        const hace3Meses = new Date();
        hace3Meses.setMonth(hoy.getMonth() - 3);

        const semanasValidas = Object.keys(semanal)
          .filter(semana => {
            // Extraer año y número de semana del formato "2024-W15"
            const [año, semanaNum] = semana.split('-W');
            const fechaSemana = new Date(parseInt(año), 0, 1);
            const diasHastaSemana = (parseInt(semanaNum) - 1) * 7;
            fechaSemana.setDate(fechaSemana.getDate() + diasHastaSemana);

            return fechaSemana >= hace3Meses && fechaSemana <= hoy;
          })
          .sort();

        labels = semanasValidas.slice(-12); // Últimas 12 semanas válidas
        ingresos = labels.map(s => semanal[s].ingresos);
        gastos = labels.map(s => semanal[s].gastos);

        console.log('📊 Semanas válidas:', labels);
        console.log('📊 Ingresos semanales:', ingresos);
        console.log('💸 Gastos semanales:', gastos);
        break;
      }
      case 'mensual':
        labels = Object.keys(mensual).sort().slice(-12); // Últimos 12 meses
        ingresos = labels.map(m => mensual[m].ingresos);
        gastos = labels.map(m => mensual[m].gastos);
        break;
      case 'anual':
        labels = Object.keys(anual).sort();
        ingresos = labels.map(a => anual[a].ingresos);
        gastos = labels.map(a => anual[a].gastos);
        break;
    }

    return { labels, ingresos, gastos };
  }, [datosProcesados, tabActiva]);

  const data = {
    labels: datosGrafico.labels,
    datasets: [
      {
        label: 'Ingresos (€)',
        data: datosGrafico.ingresos,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Gastos (€)',
        data: datosGrafico.gastos,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Gastos e Ingresos - Vista ${tabActiva.charAt(0).toUpperCase() + tabActiva.slice(1)}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value + '€';
          },
        },
      },
    },
  };

  // Función para eliminar gasto de material
  const eliminarGastoMaterial = async gasto => {
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres eliminar el gasto "${gasto.concepto}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('gastos_material')
        .delete()
        .eq('id', gasto.id);

      if (error) {
        console.error('❌ Error eliminando gasto:', error);
        alert('❌ Error al eliminar el gasto');
        return;
      }

      // Actualizar estado local
      setGastosMaterial(prev => prev.filter(g => g.id !== gasto.id));
      alert('✅ Gasto eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      alert('❌ Error inesperado al eliminar el gasto');
    }
  };

  // Función para editar gasto de material
  const editarGastoMaterial = gasto => {
    setGastoEditar(gasto);
    setMostrarFormularioGasto(true);
  };

  // Función para actualizar gasto de material
  const actualizarGastoMaterial = async gastoData => {
    try {
      // Validar datos antes de enviar
      const gastoValidado = {
        concepto: gastoData.concepto?.trim(),
        cantidad: parseFloat(gastoData.cantidad),
        fecha_gasto: gastoData.fecha_gasto,
        categoria: gastoData.categoria || 'otros',
      };

      // Campos opcionales - solo incluir si existen
      if (gastoData.descripcion?.trim()) {
        gastoValidado.descripcion = gastoData.descripcion.trim();
      }
      if (gastoData.proveedor?.trim()) {
        gastoValidado.proveedor = gastoData.proveedor.trim();
      }
      if (gastoData.observaciones?.trim()) {
        gastoValidado.observaciones = gastoData.observaciones.trim();
      }

      // Validaciones adicionales
      if (!gastoValidado.concepto) {
        throw new Error('El concepto es obligatorio');
      }
      if (!gastoValidado.cantidad || gastoValidado.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      if (!gastoValidado.fecha_gasto) {
        throw new Error('La fecha del gasto es obligatoria');
      }

      console.log('📝 Actualizando gasto de material:', gastoValidado);

      const { data, error } = await supabase
        .from('gastos_material')
        .update(gastoValidado)
        .eq('id', gastoEditar.id)
        .select();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      // Actualizar estado local
      setGastosMaterial(prev =>
        prev.map(g => (g.id === gastoEditar.id ? data[0] : g))
      );

      setMostrarFormularioGasto(false);
      setGastoEditar(null);

      alert('✅ Gasto de material actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando gasto:', error);
      const mensajeError =
        error.message || 'Error desconocido al actualizar el gasto de material';
      alert(`❌ ${mensajeError}`);
    }
  };

  // Función para agregar nuevo gasto de material
  const agregarGastoMaterial = async gastoData => {
    try {
      // Validar datos antes de enviar - solo campos esenciales
      const gastoValidado = {
        concepto: gastoData.concepto?.trim(),
        cantidad: parseFloat(gastoData.cantidad),
        fecha_gasto: gastoData.fecha_gasto,
        categoria: gastoData.categoria || 'otros',
      };

      // Campos opcionales - solo incluir si existen
      if (gastoData.descripcion?.trim()) {
        gastoValidado.descripcion = gastoData.descripcion.trim();
      }
      if (gastoData.proveedor?.trim()) {
        gastoValidado.proveedor = gastoData.proveedor.trim();
      }
      if (gastoData.observaciones?.trim()) {
        gastoValidado.observaciones = gastoData.observaciones.trim();
      }

      // Validaciones adicionales
      if (!gastoValidado.concepto) {
        throw new Error('El concepto es obligatorio');
      }
      if (!gastoValidado.cantidad || gastoValidado.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }
      if (!gastoValidado.fecha_gasto) {
        throw new Error('La fecha del gasto es obligatoria');
      }

      console.log('📝 Insertando gasto de material:', gastoValidado);

      const { data, error } = await supabase
        .from('gastos_material')
        .insert([gastoValidado])
        .select();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }

      // Actualizar estado local
      setGastosMaterial(prev => [data[0], ...prev]);
      setMostrarFormularioGasto(false);

      alert('✅ Gasto de material registrado correctamente');
    } catch (error) {
      console.error('Error agregando gasto:', error);
      const mensajeError =
        error.message || 'Error desconocido al registrar el gasto de material';
      alert(`❌ ${mensajeError}`);
    }
  };

  // Debug temporal: verificar estadísticas
  console.log('🔍 Estadísticas en render:');
  console.log('  📅 DIARIO:', estadisticas.diario);
  console.log('  📅 SEMANAL:', estadisticas.semanal);
  console.log('  📅 MENSUAL:', estadisticas.mensual);
  console.log('  📅 ANUAL:', estadisticas.anual);

  if (loading)
    return (
      <LoadingSpinner size='large' text='Cargando datos de instalaciones...' />
    );

  return (
    <div className='space-y-8'>
      <InstalacionesHeader
        onAgregarGasto={() => setMostrarFormularioGasto(true)}
      />

      {/* Cards de estadísticas */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <InstalacionesStatsCard
          titulo='Hoy'
          color='blue'
          estadisticas={estadisticas.diario}
          onClick={() => navigate('/instalaciones/detalle?tipo=hoy')}
        />
        <InstalacionesStatsCard
          titulo='Esta semana'
          color='purple'
          estadisticas={estadisticas.semanal}
          onClick={() => navigate('/instalaciones/detalle?tipo=semana')}
        />
        <InstalacionesStatsCard
          titulo='Este mes'
          color='orange'
          estadisticas={estadisticas.mensual}
          onClick={() => navigate('/instalaciones/detalle?tipo=mes')}
        />
        <InstalacionesStatsCard
          titulo='Este año'
          color='indigo'
          estadisticas={estadisticas.anual}
          onClick={() => navigate('/instalaciones/detalle?tipo=año')}
        />
      </div>

      {/* Cards internas pagadas/pendientes del período activo */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center'>
              <span className='text-green-600 dark:text-green-400'>✅</span>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-dark-text2'>
                Internas pagadas
              </div>
              <div className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                {internasResumenPeriodo.pagadas}
              </div>
            </div>
          </div>
        </div>
        <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center'>
              <span className='text-orange-600 dark:text-orange-400'>⏳</span>
            </div>
            <div>
              <div className='text-sm text-gray-500 dark:text-dark-text2'>
                Internas pendientes
              </div>
              <div className='text-2xl font-bold text-gray-900 dark:text-dark-text'>
                {internasResumenPeriodo.pendientes}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs y Gráfico */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <InstalacionesTabs tabActiva={tabActiva} setTabActiva={setTabActiva} />

        {/* Contenido de las tabs */}
        <div className='p-4 sm:p-6'>
          <div className='h-96'>
            <Line data={data} options={options} />
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/30'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='text-2xl'>ℹ️</div>
          <div>
            <h3 className='font-semibold text-blue-900 dark:text-blue-100'>
              Información
            </h3>
            <p className='text-sm text-blue-700 dark:text-blue-300'>
              Los ingresos incluyen pagos reales + clases internas (15€), los
              gastos son alquileres de escuela (-21€)
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div className='bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-lg'>💰</span>
              <span className='font-medium text-gray-700 dark:text-dark-text2'>
                Ingresos:
              </span>
            </div>
            <ul className='text-gray-600 dark:text-dark-text2 space-y-1'>
              <li>• Pagos reales de alumnos</li>
              <li>• Clases internas: +15€</li>
            </ul>
          </div>

          <div className='bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-lg'>💸</span>
              <span className='font-medium text-gray-700 dark:text-dark-text2'>
                Gastos:
              </span>
            </div>
            <ul className='text-gray-600 dark:text-dark-text2 space-y-1'>
              <li>• Alquileres de escuela: -21€</li>
              <li>• Gastos de material deportivo</li>
            </ul>
          </div>

          <div className='bg-white dark:bg-dark-surface rounded-lg p-3 border border-orange-200 dark:border-orange-800/30'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='text-lg'>🗑️</span>
              <span className='font-medium text-gray-700 dark:text-dark-text2'>
                Eventos eliminados:
              </span>
            </div>
            <p className='text-sm text-gray-600 dark:text-dark-text2'>
              Los eventos eliminados o cancelados NO cuentan en los gastos de
              instalaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de gastos de material */}
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <div className='p-6 border-b border-gray-200 dark:border-dark-border'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl'>
                <svg
                  className='w-6 h-6 text-orange-600 dark:text-orange-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                  />
                </svg>
              </div>
              <div>
                <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                  Gastos de Material
                </h3>
                <p className='text-sm text-gray-500 dark:text-dark-text2'>
                  {gastosMaterial.length} gastos registrados
                  {gastosMaterial.length > 0 && (
                    <span className='ml-2 text-green-600 dark:text-green-400'>
                      ✓
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setGastoEditar(null);
                setMostrarFormularioGasto(true);
              }}
              className='bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Nuevo Gasto
            </button>
          </div>
        </div>

        <div className='p-6'>
          {gastosMaterial.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>📦</div>
              <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                No hay gastos de material
              </h3>
              <p className='text-gray-500 dark:text-dark-text2 mb-4'>
                Registra el primer gasto de material para comenzar el
                seguimiento
              </p>
              <button
                onClick={() => {
                  setGastoEditar(null);
                  setMostrarFormularioGasto(true);
                }}
                className='bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200'
              >
                Agregar Primer Gasto
              </button>
            </div>
          ) : (
            <div className='space-y-4'>
              {gastosMaterial.slice(0, 10).map(gasto => (
                <div
                  key={gasto.id}
                  className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-dark-border'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h4 className='font-semibold text-gray-900 dark:text-dark-text'>
                        {gasto.concepto}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          gasto.categoria === 'material_deportivo'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : gasto.categoria === 'mantenimiento'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : gasto.categoria === 'limpieza'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : gasto.categoria === 'seguridad'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {gasto.categoria.replace('_', ' ')}
                      </span>
                    </div>
                    {gasto.descripcion && gasto.descripcion.trim() && (
                      <p className='text-sm text-gray-600 dark:text-dark-text2 mb-1'>
                        {gasto.descripcion}
                      </p>
                    )}
                    <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-dark-text2'>
                      <span>
                        📅{' '}
                        {gasto.fecha_gasto
                          ? new Date(gasto.fecha_gasto).toLocaleDateString(
                              'es-ES'
                            )
                          : 'Sin fecha'}
                      </span>
                      {gasto.proveedor && <span>🏪 {gasto.proveedor}</span>}
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <div className='text-lg font-bold text-red-600 dark:text-red-400'>
                        -{gasto.cantidad}€
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => editarGastoMaterial(gasto)}
                        className='p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
                        title='Editar gasto'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarGastoMaterial(gasto)}
                        className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                        title='Eliminar gasto'
                      >
                        <svg
                          className='w-4 h-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {gastosMaterial.length > 10 && (
                <p className='text-center text-sm text-gray-500 dark:text-dark-text2'>
                  Y {gastosMaterial.length - 10} gastos más...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar gasto de material */}
      {mostrarFormularioGasto && (
        <FormularioGastoMaterial
          onClose={() => {
            setMostrarFormularioGasto(false);
            setGastoEditar(null);
          }}
          onSuccess={
            gastoEditar ? actualizarGastoMaterial : agregarGastoMaterial
          }
          gastoEditar={gastoEditar}
        />
      )}
    </div>
  );
}
