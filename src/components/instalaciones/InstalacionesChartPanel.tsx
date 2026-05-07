import { Line } from 'react-chartjs-2';
import { InstalacionesTabs } from '@features/instalaciones';
import type { ChartData, ChartOptions } from 'chart.js';

interface InstalacionesChartPanelProps {
  tabActiva: string;
  setTabActiva: (tab: string) => void;
  data: ChartData<'line'>;
  options: ChartOptions<'line'>;
}

export default function InstalacionesChartPanel({
  tabActiva,
  setTabActiva,
  data,
  options,
}: InstalacionesChartPanelProps) {
  return (
    <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
      <InstalacionesTabs tabActiva={tabActiva} setTabActiva={setTabActiva} />
      <div className='p-4 sm:p-6'>
        <div className='h-96'>
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}


