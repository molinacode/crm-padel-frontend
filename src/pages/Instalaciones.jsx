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

  if (loading) return <p className="text-center py-8">Cargando instalaciones...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🏢 Gestión de Instalaciones</h2>

      {/* Filtro por fecha */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Ver datos hasta:</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="input"
        />
      </div>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Ingresos Totales</h3>
          <p className="text-2xl font-bold text-blue-900">€{totalIngresos}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-red-800">Gastos Totales</h3>
          <p className="text-2xl font-bold text-red-900">€{totalGastos}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">Beneficio Neto</h3>
          <p className="text-2xl font-bold text-green-900">€{beneficio}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold mb-4">📈 Evolución Mensual</h3>
        <Bar data={data} options={options} />
      </div>

      {/* Clases del día seleccionado */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">📅 Clases de hoy ({fecha})</h3>
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