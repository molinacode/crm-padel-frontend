import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend);

export default function Instalaciones() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  //Cargar eventos

  useEffect(() => {
    const cargarEventos = async () => {
      setLoading(true);
      try {
        const { eventosData, error } = await supabase.from('eventos_clase').select(`id,fecha,clases(nombre)`);
        if (error) {
          console.error('Error cargando eventos:', error);
          setEventos([]);
        } else {
          setEventos(Array.isArray(eventosData) ? eventosData : []);
        }
      } catch (err) {
        console.error('Error inesperado:', error);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };
    cargarEventos();
  }, []);

  //Calcular tipo de clase
  const getTipoClase = (nombre) => {
    if (nombre.includes('VIP PADEL')) return { tipo: 'ingreso', valor: 15 };
    if (nombre.includes('Escuela')) return { tipo: 'gasto', valor: 20 };
    return { tipo: 'neutro', valor: 0 };
  };

  // Agrupar por día, semana, mes
  const hoy = new Date(fecha);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());

  const diario = {};
  const semanal = {};
  const mensual = {};

  //Validacion de eventos
  if (Array.isArray(eventos)) {
    eventos.forEach(ev => {
      const fechaEv = new Date(ev.fecha);
      const nombreClase = ev.clases.nombre;
      const { tipo, valor } = getTipoClase(nombreClase);

      // Saltar si es neutro
      if (tipo === 'neutro') return;

      const dia = fechaEv.toISOString().split('T')[0];
      const semana = `${fechaEv.getFullYear()}-W${getWeekNumber(fechaEv)}`;
      const mes = `${fechaEv.getFullYear()}-${String(fechaEv.getMonth() + 1).padStart(2, '0')}`;

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
    });
  }

  // Función para número de semana
  function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  // Datos para gráfico mensual
  const meses = Object.keys(mensual).sort();
  const labels = meses;
  const ingresos = meses.map(m => mensual[m].ingresos);
  const gastos = meses.map(m => mensual[m].gastos);

  const data = {
    labels,
    datasets: [
      {
        label: 'Ingresos (€)',
        data: ingresos,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Gastos (€)',
        data: gastos,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Ingresos y Gastos por Mes' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Totales
  const totalIngresos = Object.values(mensual).reduce((acc, m) => acc + m.ingresos, 0);
  const totalGastos = Object.values(mensual).reduce((acc, m) => acc + m.gastos, 0);
  const beneficio = totalIngresos - totalGastos;

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando instalaciones...</p>;

  return (
    <div className="space-y-8">
      {/* Header estandarizado */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Gestión de Instalaciones
            </h1>
            <p className="text-gray-600 dark:text-dark-text2">
              Estadísticas financieras y ocupación de instalaciones
            </p>
          </div>
        </div>
      </div>

      {/* Filtro por fecha */}
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gray-100 dark:bg-gray-800/30 p-2 rounded-lg">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Filtros</h3>
        </div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Ver datos hasta:</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-dark-text"
        />
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Ingresos Totales</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">€{totalIngresos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Gastos Totales</h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">€{totalGastos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Beneficio Neto</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{beneficio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Evolución Mensual</h3>
        </div>
        <div className="bg-gray-50 dark:bg-dark-surface2 p-4 rounded-xl">
          <Bar data={data} options={options} />
        </div>
      </div>

      {/* Clases del día seleccionado */}
      <div className="bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text">Clases de hoy ({fecha})</h3>
        </div>
        {eventos
          .filter(ev => ev.fecha === fecha)
          .map(ev => {
            const { tipo, valor } = getTipoClase(ev.clases.nombre);
            let color = 'bg-gray-100 text-gray-800';
            if (tipo === 'ingreso') color = 'bg-green-100 text-green-800';
            if (tipo === 'gasto') color = 'bg-red-100 text-red-800';

            return (
              <div key={ev.id} className="flex justify-between py-2 border-b border-gray-200">
                <span>{ev.clases.nombre}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                  {tipo === 'ingreso' ? '+' : tipo === 'gasto' ? '-' : ''}€{valor}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}