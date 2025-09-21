import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Bar, Line } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const [eventos, setEventos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('diario');

  // Cargar eventos y pagos
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Cargando datos para Instalaciones...');

        // Cargar eventos para gastos (clases de escuela)
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_clase')
          .select(`
            id,
            fecha,
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

        if (pagosError) {
          console.error('❌ Error cargando pagos:', pagosError);
          throw pagosError;
        }

        console.log('✅ Eventos cargados:', eventosData?.length || 0);
        console.log('✅ Pagos cargados:', pagosData?.length || 0);

        setEventos(Array.isArray(eventosData) ? eventosData : []);
        setPagos(Array.isArray(pagosData) ? pagosData : []);
      } catch (err) {
        console.error('💥 Error inesperado:', err);
        setEventos([]);
        setPagos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Calcular tipo de clase según nuevos criterios
  const getTipoClase = (nombre, tipoClase) => {
    console.log('🔍 Analizando clase:', { nombre, tipoClase });

    // Solo clases internas generan ingresos: +15€
    if (tipoClase === 'interna') {
      console.log('✅ Clase interna detectada - Ingreso: +15€');
      return { tipo: 'ingreso', valor: 15, descripcion: 'Clase interna' };
    }

    // Clases de escuela: se pagan (alquiler) a 21€
    if (tipoClase === 'escuela') {
      console.log('✅ Clase escuela detectada - Gasto: -21€');
      return { tipo: 'gasto', valor: 21, descripcion: 'Alquiler escuela' };
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
        const fechaEv = new Date(ev.fecha);
        const nombreClase = ev.clases?.nombre || '';
        const tipoClase = ev.clases?.tipo_clase || '';
        const { tipo, valor } = getTipoClase(nombreClase, tipoClase);

        console.log(`📅 Evento ${index + 1}:`, {
          fecha: ev.fecha,
          fechaObj: fechaEv,
          nombre: nombreClase,
          tipo: tipoClase,
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

    console.log('📈 Resumen de datos procesados:');
    console.log('📅 Diario:', Object.keys(diario).length, 'días');
    console.log('📅 Fechas diarias:', Object.keys(diario).sort());
    console.log('📊 Semanal:', Object.keys(semanal).length, 'semanas');
    console.log('📈 Mensual:', Object.keys(mensual).length, 'meses');
    console.log('📋 Anual:', Object.keys(anual).length, 'años');

    return { diario, semanal, mensual, anual };
  }, [eventos, pagos]);

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
        </div>
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Diario */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Hoy</span>
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
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Esta semana</span>
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
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-dark-text2">Este mes</span>
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}