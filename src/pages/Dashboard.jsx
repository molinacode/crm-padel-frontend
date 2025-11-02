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
  const { stats, loading } = useDashboardData();

  if (loading)
    return (
      <LoadingSpinner size='large' text='Cargando datos del Dashboard...' />
    );

  return (
    <div className='space-y-6'>
      {/* Header - Refactoring UI principles */}
      <DashboardHeader />

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
