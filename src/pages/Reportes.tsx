import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import { PageHeader, SectionCard } from '../components/shared';
import { reportesService } from '../services/reportesService';

interface SerieReporte {
  mes: string;
  ingresos: number;
  gastos: number;
}

function crearRangoPorDefecto() {
  const hoy = new Date();
  const hasta = hoy.toISOString().split('T')[0];
  const haceSeisMeses = new Date(hoy);
  haceSeisMeses.setMonth(haceSeisMeses.getMonth() - 5);
  haceSeisMeses.setDate(1);
  const desde = haceSeisMeses.toISOString().split('T')[0];
  return { desde, hasta };
}

export default function Reportes() {
  const rangoInicial = useMemo(() => crearRangoPorDefecto(), []);
  const [desde, setDesde] = useState(rangoInicial.desde);
  const [hasta, setHasta] = useState(rangoInicial.hasta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<SerieReporte[]>([]);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const { series: datos, error: err } =
          await reportesService.getIngresosVsGastosPorMes({ desde, hasta });
        if (cancelado) return;
        if (err) {
          setError('No se pudieron cargar los datos de reportes.');
          setSeries([]);
        } else {
          setSeries((datos || []) as SerieReporte[]);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [desde, hasta]);

  const chartData = useMemo(() => {
    const labels = series.map(s => s.mes);
    const ingresos = series.map(s => s.ingresos);
    const gastos = series.map(s => s.gastos);

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresos,
          borderColor: 'rgb(59,130,246)',
          backgroundColor: 'rgba(59,130,246,0.15)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Gastos',
          data: gastos,
          borderColor: 'rgb(239,68,68)',
          backgroundColor: 'rgba(239,68,68,0.15)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [series]);

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#4b5563',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#6b7280',
          },
        },
        y: {
          ticks: {
            color: '#6b7280',
          },
        },
      },
    }),
    []
  );

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Reportes'
        subtitle='Analiza ingresos y gastos por periodo'
      />

      <SectionCard title='Ingresos vs Gastos'>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text mb-1'>
                Desde
              </label>
              <input
                type='date'
                value={desde}
                onChange={e => setDesde(e.target.value)}
                className='w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text mb-1'>
                Hasta
              </label>
              <input
                type='date'
                value={hasta}
                onChange={e => setHasta(e.target.value)}
                className='w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>

          {loading && (
            <p className='text-sm text-gray-500 dark:text-dark-text'>
              Cargando datos de reportes...
            </p>
          )}
          {error && (
            <p className='text-sm text-red-500 dark:text-red-400'>{error}</p>
          )}

          <div className='h-96'>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

