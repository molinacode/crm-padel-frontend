import { useNavigate } from 'react-router-dom';
import { NotificacionesPagos } from '@shared';
import {
  DashboardHeader,
  DashboardStatsCards,
  DashboardHuecos,
  DashboardClasesIncompletas,
  DashboardUltimosPagos,
  useDashboardData,
} from '@features/dashboard';
import { LoadingSpinner } from '@shared';

export default function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState('mes');
  const { stats, loading } = useDashboardData(periodo);

  if (loading)
    return (
      <LoadingSpinner size='large' text='Cargando datos del Dashboard...' />
    );

  return (
    <div className='space-y-6'>
      {/* Header - Refactoring UI principles */}
      <DashboardHeader />

      <div className='flex justify-end'>
        <div className='inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm'>
          <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
            Periodo
          </span>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className='text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-dark-text'
          >
            <option value='mes'>Mes actual</option>
            <option value='anio'>Año actual</option>
          </select>
        </div>
      </div>

      {/* Estadísticas principales - Aplicando principios de Refactoring UI */}
      <DashboardStatsCards stats={stats} navigate={navigate} />

      {/* Información adicional */}
      <div className='grid lg:grid-cols-2 gap-8'>
        {/* Notificaciones de pagos pendientes */}
        <NotificacionesPagos />

        {/* Huecos por faltas */}
        <DashboardHuecos
          huecosPorFaltas={stats.huecosPorFaltas || []}
          totalHuecos={stats.totalHuecosPorFaltas || 0}
        />

        {/* Clases incompletas */}
        <DashboardClasesIncompletas
          clasesIncompletas={stats.clasesIncompletas || []}
        />

        {/* Últimos pagos */}
        <DashboardUltimosPagos ultimosPagos={stats.ultimosPagos || []} />
      </div>
    </div>
  );
}
