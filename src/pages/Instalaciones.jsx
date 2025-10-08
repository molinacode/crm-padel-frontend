import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bar, Line } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';
import FormularioGastoMaterial from '../components/FormularioGastoMaterial';
import { verificarTablaGastos } from '../utils/verificarTablaGastos';

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
  const [eventos, setEventos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [gastosMaterial, setGastosMaterial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('diario');
  const [mostrarFormularioGasto, setMostrarFormularioGasto] = useState(false);
  const [gastoEditar, setGastoEditar] = useState(null);

  // Cargar eventos y pagos
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Cargando datos para Instalaciones...');

        // Verificar que la tabla gastos_material existe y es accesible
        const verificacion = await verificarTablaGastos();
        if (!verificacion.success) {
          console.warn('⚠️ Problema con tabla gastos_material:', verificacion.error);
          // Continuar sin gastos de material si hay problemas
        }

        // Cargar eventos para gastos (clases de escuela)
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_clase')
          .select(`
            id,
            fecha,
            estado,
            clases (
              id,
              nombre,
              tipo_clase
            )
          `)
          .order('fecha', { ascending: true });

        if (eventosError) {
          console.error('❌ Error cargando eventos:', eventosError);
          throw eventosError;
        }

        // Cargar pagos reales para ingresos
        const { data: pagosData, error: pagosError } = await supabase
          .from('pagos')
          .select(`
            id,
            cantidad,
            fecha_pago,
            tipo_pago,
            mes_cubierto
          `)
          .order('fecha_pago', { ascending: true });

        // Cargar asignaciones para detectar clases mixtas por origen
        const { data: asignacionesData } = await supabase
          .from('alumnos_clases')
          .select('clase_id, origen');

        // Cargar gastos de material - usando select('*') para evitar problemas de esquema
        const { data: gastosMaterialData, error: gastosMaterialError } = await supabase
          .from('gastos_material')
          .select('*')
          .order('fecha_gasto', { ascending: false });

        if (pagosError) {
          console.error('❌ Error cargando pagos:', pagosError);
          throw pagosError;
        }

        if (gastosMaterialError) {
          console.error('❌ Error cargando gastos de material:', gastosMaterialError);
          console.log('⚠️ Continuando sin gastos de material...');
          // No lanzar error, continuar sin gastos de material
        }

        console.log('✅ Eventos cargados:', eventosData?.length || 0);
        console.log('✅ Pagos cargados:', pagosData?.length || 0);
        console.log('✅ Asignaciones cargadas:', asignacionesData?.length || 0);
        console.log('✅ Gastos de material cargados:', gastosMaterialData?.length || 0);

        // Cargar estadísticas de eventos eliminados para información
        const { data: eventosEliminadosData } = await supabase
          .from('eventos_clase')
          .select('id, fecha, estado, clases (nombre, tipo_clase)')
          .eq('estado', 'eliminado')
          .order('fecha', { ascending: false });

        console.log('📊 Eventos eliminados:', eventosEliminadosData?.length || 0);

        // Construir mapa de orígenes por clase para detectar "mixtas"
        const origenesPorClase = {};
        (asignacionesData || []).forEach(a => {
          if (!a || !a.clase_id) return;
          if (!origenesPorClase[a.clase_id]) origenesPorClase[a.clase_id] = new Set();
          if (a.origen) origenesPorClase[a.clase_id].add(a.origen);
        });

        // Filtrar eventos eliminados y adjuntar flag esMixta a cada evento según su clase
        const eventosFiltrados = (Array.isArray(eventosData) ? eventosData : []).filter(ev =>
          ev.estado !== 'eliminado'
        );

        const eventosConMixta = eventosFiltrados.map(ev => {
          const setOrigenes = origenesPorClase[ev.clases?.id];
          const esMixta = setOrigenes && setOrigenes.has('escuela') && setOrigenes.has('interna');
          return { ...ev, esMixta: Boolean(esMixta) };
        });

        console.log('📊 Eventos cargados:', eventosData?.length || 0);
        console.log('📊 Eventos filtrados (sin eliminados):', eventosFiltrados.length);

        setEventos(eventosConMixta);
        setPagos(Array.isArray(pagosData) ? pagosData : []);
        setGastosMaterial(Array.isArray(gastosMaterialData) ? gastosMaterialData : []);
      } catch (err) {
        console.error('💥 Error inesperado:', err);
        setEventos([]);
        setPagos([]);
        setGastosMaterial([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Calcular tipo de clase según nuevos criterios
  const getTipoClase = (nombre, tipoClase, esMixta = false) => {
    // Clases mixtas: no generan ni gasto ni ingreso automático
    if (esMixta) {
      return { tipo: 'neutro', valor: 0, descripcion: 'Mixta (sin automático)' };
    }
    console.log('🔍 Analizando clase:', { nombre, tipoClase });

    // Normalizar tipoClase para comparaciones
    const tipoNormalizado = tipoClase?.toLowerCase()?.trim();
    const nombreNormalizado = nombre?.toLowerCase()?.trim();

    // Solo clases internas generan ingresos: +15€
    if (tipoNormalizado === 'interna' || nombreNormalizado?.includes('interna')) {
      console.log('✅ Clase interna detectada - Ingreso: +15€');
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase interna' };
    }

    // Clases de escuela: se pagan (alquiler) a 21€
    if (tipoNormalizado === 'escuela' || nombreNormalizado?.includes('escuela')) {
      console.log('✅ Clase escuela detectada - Gasto: -21€');
      return { tipo: 'gasto', valor: 21, descripcion: 'Alquiler escuela' };
    }

    // Clases particulares: ingresos variables (por ahora neutro)
    if (tipoNormalizado === 'particular' || nombreNormalizado?.includes('particular')) {
      console.log('✅ Clase particular detectada - Neutro (ingreso manual)');
      return { tipo: 'neutro', valor: 0, descripcion: 'Clase particular (ingreso manual)' };
    }

    // Clases grupales: ingresos de 15€
    if (tipoNormalizado === 'grupal' || nombreNormalizado?.includes('grupal')) {
      console.log('✅ Clase grupal detectada - Ingreso: +15€');
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase grupal' };
    }

    // Mantener lógica anterior para compatibilidad
    if (nombre?.includes('Escuela')) {
      console.log('✅ Escuela detectada - Gasto: -21€');
      return { tipo: 'gasto', valor: 21, descripcion: 'Escuela' };
    }

    console.log('⚠️ Tipo de clase no reconocido:', { nombre, tipoClase });
    return { tipo: 'neutro', valor: 0, descripcion: 'Clase normal' };
  };

  // Función para número de semana
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  // Función para obtener el año
  const getYear = (date) => {
    return new Date(date).getFullYear();
  };

  // Procesar datos por períodos
  const datosProcesados = useMemo(() => {
    const diario = {};
    const semanal = {};
    const mensual = {};
    const anual = {};

    console.log('📊 Procesando datos...');
    console.log('📅 Eventos:', eventos.length);
    console.log('💰 Pagos:', pagos.length);

    // Procesar eventos (ingresos de clases internas + gastos de escuela)
    if (Array.isArray(eventos)) {
      eventos.forEach((ev, index) => {
        // Saltar eventos eliminados o cancelados
        if (ev.estado === 'eliminado' || ev.estado === 'cancelada') {
          console.log(`⏭️ Saltando evento ${index + 1} (${ev.estado}):`, ev.clases?.nombre);
          return;
        }

        const fechaEv = new Date(ev.fecha);
        const nombreClase = ev.clases?.nombre || '';
        const tipoClase = ev.clases?.tipo_clase || '';
        const { tipo, valor } = getTipoClase(nombreClase, tipoClase, ev.esMixta);

        console.log(`📅 Evento ${index + 1}:`, {
          fecha: ev.fecha,
          fechaObj: fechaEv,
          nombre: nombreClase,
          tipo: tipoClase,
          estado: ev.estado,
          resultado: { tipo, valor }
        });

        // Procesar tanto ingresos como gastos
        if (tipo !== 'neutro') {
          const dia = fechaEv.toISOString().split('T')[0];
          const semana = `${fechaEv.getFullYear()}-W${getWeekNumber(fechaEv)}`;
          const mes = `${fechaEv.getFullYear()}-${String(fechaEv.getMonth() + 1).padStart(2, '0')}`;
          const año = getYear(fechaEv);

          // Diario
          if (!diario[dia]) diario[dia] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') diario[dia].ingresos += valor;
          if (tipo === 'gasto') diario[dia].gastos += valor;

          // Semanal
          if (!semanal[semana]) semanal[semana] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') semanal[semana].ingresos += valor;
          if (tipo === 'gasto') semanal[semana].gastos += valor;

          // Mensual
          if (!mensual[mes]) mensual[mes] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') mensual[mes].ingresos += valor;
          if (tipo === 'gasto') mensual[mes].gastos += valor;

          // Anual
          if (!anual[año]) anual[año] = { ingresos: 0, gastos: 0 };
          if (tipo === 'ingreso') anual[año].ingresos += valor;
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

        console.log(`💰 Pago ${index + 1}:`, {
          fecha: pago.fecha_pago,
          fechaObj: fechaPago,
          cantidad: pago.cantidad,
          tipo: pago.tipo_pago
        });

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

    // Procesar gastos de material
    if (Array.isArray(gastosMaterial)) {
      gastosMaterial.forEach((gasto, index) => {
        const fechaGasto = new Date(gasto.fecha_gasto);
        const dia = fechaGasto.toISOString().split('T')[0];
        const semana = `${fechaGasto.getFullYear()}-W${getWeekNumber(fechaGasto)}`;
        // Usar fecha_gasto_mes si está disponible, sino calcular desde fecha_gasto
        const mes = gasto.fecha_gasto_mes
          ? `${new Date(gasto.fecha_gasto_mes).getFullYear()}-${String(new Date(gasto.fecha_gasto_mes).getMonth() + 1).padStart(2, '0')}`
          : `${fechaGasto.getFullYear()}-${String(fechaGasto.getMonth() + 1).padStart(2, '0')}`;
        const año = getYear(fechaGasto);

        console.log(`🛒 Gasto material ${index + 1}:`, {
          fecha: gasto.fecha_gasto,
          fecha_gasto_mes: gasto.fecha_gasto_mes,
          fechaObj: fechaGasto,
          cantidad: gasto.cantidad,
          concepto: gasto.concepto,
          mesCalculado: mes
        });

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

    console.log('📈 Resumen de datos procesados:');
    console.log('📅 Diario:', Object.keys(diario).length, 'días');
    console.log('📅 Fechas diarias:', Object.keys(diario).sort());
    console.log('📊 Semanal:', Object.keys(semanal).length, 'semanas');
    console.log('📈 Mensual:', Object.keys(mensual).length, 'meses');
    console.log('📋 Anual:', Object.keys(anual).length, 'años');

    return { diario, semanal, mensual, anual };
  }, [eventos, pagos, gastosMaterial]);

  // Calcular estadísticas para cards
  const estadisticas = useMemo(() => {
    const { diario, semanal, mensual, anual } = datosProcesados;

    const hoy = new Date().toISOString().split('T')[0];
    const semanaActual = `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`;
    const mesActual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const añoActual = new Date().getFullYear();

    return {
      diario: {
        ingresos: diario[hoy]?.ingresos || 0,
        gastos: diario[hoy]?.gastos || 0,
        balance: (diario[hoy]?.ingresos || 0) - (diario[hoy]?.gastos || 0)
      },
      semanal: {
        ingresos: semanal[semanaActual]?.ingresos || 0,
        gastos: semanal[semanaActual]?.gastos || 0,
        balance: (semanal[semanaActual]?.ingresos || 0) - (semanal[semanaActual]?.gastos || 0)
      },
      mensual: {
        ingresos: mensual[mesActual]?.ingresos || 0,
        gastos: mensual[mesActual]?.gastos || 0,
        balance: (mensual[mesActual]?.ingresos || 0) - (mensual[mesActual]?.gastos || 0)
      },
      anual: {
        ingresos: anual[añoActual]?.ingresos || 0,
        gastos: anual[añoActual]?.gastos || 0,
        balance: (anual[añoActual]?.ingresos || 0) - (anual[añoActual]?.gastos || 0)
      }
    };
  }, [datosProcesados]);

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
        const fechasValidas = Object.keys(diario).filter(fecha => {
          const fechaObj = new Date(fecha);
          return fechaObj >= hace30Dias && fechaObj <= hoy;
        }).sort();

        labels = fechasValidas;
        ingresos = labels.map(d => diario[d].ingresos);
        gastos = labels.map(d => diario[d].gastos);

        console.log('📅 Fechas diarias válidas:', labels);
        console.log('📊 Ingresos diarios:', ingresos);
        console.log('💸 Gastos diarios:', gastos);
        break;
      }
      case 'semanal': {
        // Filtrar solo semanas de los últimos 3 meses y ordenar
        const hoy = new Date();
        const hace3Meses = new Date();
        hace3Meses.setMonth(hoy.getMonth() - 3);

        const semanasValidas = Object.keys(semanal).filter(semana => {
          // Extraer año y número de semana del formato "2024-W15"
          const [año, semanaNum] = semana.split('-W');
          const fechaSemana = new Date(parseInt(año), 0, 1);
          const diasHastaSemana = (parseInt(semanaNum) - 1) * 7;
          fechaSemana.setDate(fechaSemana.getDate() + diasHastaSemana);

          return fechaSemana >= hace3Meses && fechaSemana <= hoy;
        }).sort();

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
          }
        }
      }
    }
  };

  // Función para eliminar gasto de material
  const eliminarGastoMaterial = async (gasto) => {
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
  const editarGastoMaterial = (gasto) => {
    setGastoEditar(gasto);
    setMostrarFormularioGasto(true);
  };

  // Función para actualizar gasto de material
  const actualizarGastoMaterial = async (gastoData) => {
    try {
      // Validar datos antes de enviar
      const gastoValidado = {
        concepto: gastoData.concepto?.trim(),
        cantidad: parseFloat(gastoData.cantidad),
        fecha_gasto: gastoData.fecha_gasto,
        categoria: gastoData.categoria || 'otros'
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
        prev.map(g => g.id === gastoEditar.id ? data[0] : g)
      );
      
      setMostrarFormularioGasto(false);
      setGastoEditar(null);

      alert('✅ Gasto de material actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando gasto:', error);
      const mensajeError = error.message || 'Error desconocido al actualizar el gasto de material';
      alert(`❌ ${mensajeError}`);
    }
  };

  // Función para agregar nuevo gasto de material
  const agregarGastoMaterial = async (gastoData) => {
    try {
      // Validar datos antes de enviar - solo campos esenciales
      const gastoValidado = {
        concepto: gastoData.concepto?.trim(),
        cantidad: parseFloat(gastoData.cantidad),
        fecha_gasto: gastoData.fecha_gasto,
        categoria: gastoData.categoria || 'otros'
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
      const mensajeError = error.message || 'Error desconocido al registrar el gasto de material';
      alert(`❌ ${mensajeError}`);
    }
  };

  if (loading) return <LoadingSpinner size="large" text="Cargando datos de instalaciones..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-green-100 dark:border-green-800/30">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Gestión de Instalaciones
              </h1>
              <p className="text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base">
                Control de gastos e ingresos por períodos
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setMostrarFormularioGasto(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Gasto Material
            </button>
          </div>
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Diario */}
        <div 
          className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200 hover:border-blue-300 dark:hover:border-blue-600"
          onClick={() => navigate('/instalaciones/detalle?tipo=hoy')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Hoy</span>
            <svg className="w-4 h-4 text-gray-400 dark:text-dark-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Ingresos:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">+{estadisticas.diario.ingresos}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Gastos:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{estadisticas.diario.gastos}€</span>
            </div>
            <div className="border-t border-gray-200 dark:border-dark-border pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Balance:</span>
                <span className={`font-bold ${estadisticas.diario.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {estadisticas.diario.balance >= 0 ? '+' : ''}{estadisticas.diario.balance}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Semanal */}
        <div 
          className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200 hover:border-purple-300 dark:hover:border-purple-600"
          onClick={() => navigate('/instalaciones/detalle?tipo=semana')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Esta semana</span>
            <svg className="w-4 h-4 text-gray-400 dark:text-dark-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Ingresos:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">+{estadisticas.semanal.ingresos}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Gastos:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{estadisticas.semanal.gastos}€</span>
            </div>
            <div className="border-t border-gray-200 dark:border-dark-border pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Balance:</span>
                <span className={`font-bold ${estadisticas.semanal.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {estadisticas.semanal.balance >= 0 ? '+' : ''}{estadisticas.semanal.balance}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Mensual */}
        <div 
          className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6 cursor-pointer hover:shadow-xl transition-shadow duration-200 hover:border-orange-300 dark:hover:border-orange-600"
          onClick={() => navigate('/instalaciones/detalle?tipo=mes')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Este mes</span>
            <svg className="w-4 h-4 text-gray-400 dark:text-dark-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Ingresos:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">+{estadisticas.mensual.ingresos}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Gastos:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{estadisticas.mensual.gastos}€</span>
            </div>
            <div className="border-t border-gray-200 dark:border-dark-border pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Balance:</span>
                <span className={`font-bold ${estadisticas.mensual.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {estadisticas.mensual.balance >= 0 ? '+' : ''}{estadisticas.mensual.balance}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Anual */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Este año</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Ingresos:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">+{estadisticas.anual.ingresos}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-dark-text2">Gastos:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{estadisticas.anual.gastos}€</span>
            </div>
            <div className="border-t border-gray-200 dark:border-dark-border pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text">Balance:</span>
                <span className={`font-bold ${estadisticas.anual.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {estadisticas.anual.balance >= 0 ? '+' : ''}{estadisticas.anual.balance}€
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs y Gráfico */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        {/* Navegación de tabs */}
        <div className="border-b border-gray-200 dark:border-dark-border">
          <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setTabActiva('diario')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'diario'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📅 Diario
            </button>
            <button
              onClick={() => setTabActiva('semanal')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'semanal'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📊 Semanal
            </button>
            <button
              onClick={() => setTabActiva('mensual')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'mensual'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📈 Mensual
            </button>
            <button
              onClick={() => setTabActiva('anual')}
              className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${tabActiva === 'anual'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
                }`}
            >
              📋 Anual
            </button>
          </nav>
        </div>

        {/* Contenido de las tabs */}
        <div className="p-4 sm:p-6">
          <div className="h-96">
            <Line data={data} options={options} />
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Información</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Los ingresos incluyen pagos reales + clases internas (15€), los gastos son alquileres de escuela (-21€)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <span className="font-medium text-gray-700 dark:text-dark-text2">Ingresos:</span>
            </div>
            <ul className="text-gray-600 dark:text-dark-text2 space-y-1">
              <li>• Pagos reales de alumnos</li>
              <li>• Clases internas: +15€</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💸</span>
              <span className="font-medium text-gray-700 dark:text-dark-text2">Gastos:</span>
            </div>
            <ul className="text-gray-600 dark:text-dark-text2 space-y-1">
              <li>• Alquileres de escuela: -21€</li>
              <li>• Gastos de material deportivo</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-dark-surface rounded-lg p-3 border border-orange-200 dark:border-orange-800/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🗑️</span>
              <span className="font-medium text-gray-700 dark:text-dark-text2">Eventos eliminados:</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-dark-text2">
              Los eventos eliminados o cancelados NO cuentan en los gastos de instalaciones.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de gastos de material */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Gastos de Material</h3>
                <p className="text-sm text-gray-500 dark:text-dark-text2">
                  {gastosMaterial.length} gastos registrados
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setGastoEditar(null);
                setMostrarFormularioGasto(true);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Gasto
            </button>
          </div>
        </div>

        <div className="p-6">
          {gastosMaterial.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-2">No hay gastos de material</h3>
              <p className="text-gray-500 dark:text-dark-text2 mb-4">
                Registra el primer gasto de material para comenzar el seguimiento
              </p>
              <button
                onClick={() => {
                  setGastoEditar(null);
                  setMostrarFormularioGasto(true);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Agregar Primer Gasto
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {gastosMaterial.slice(0, 10).map(gasto => (
                <div key={gasto.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-dark-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-dark-text">{gasto.concepto}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${gasto.categoria === 'material_deportivo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        gasto.categoria === 'mantenimiento' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          gasto.categoria === 'limpieza' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            gasto.categoria === 'seguridad' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                        {gasto.categoria.replace('_', ' ')}
                      </span>
                    </div>
                    {gasto.descripcion && gasto.descripcion.trim() && (
                      <p className="text-sm text-gray-600 dark:text-dark-text2 mb-1">{gasto.descripcion}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-dark-text2">
                      <span>📅 {new Date(gasto.fecha_gasto).toLocaleDateString('es-ES')}</span>
                      {gasto.proveedor && <span>🏪 {gasto.proveedor}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        -{gasto.cantidad}€
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarGastoMaterial(gasto)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar gasto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarGastoMaterial(gasto)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar gasto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {gastosMaterial.length > 10 && (
                <p className="text-center text-sm text-gray-500 dark:text-dark-text2">
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
          onSuccess={gastoEditar ? actualizarGastoMaterial : agregarGastoMaterial}
          gastoEditar={gastoEditar}
        />
      )}
    </div>
  );
}