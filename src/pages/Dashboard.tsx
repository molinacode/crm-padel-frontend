/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cursoAbierto, type Curso } from '../services/cursoService';
import { useNavigate } from 'react-router-dom';
import { NotificacionesPagos } from '../components/shared';
import {
  DashboardHeader,
  DashboardStatsCards,
  DashboardHuecos,
  DashboardClasesIncompletas,
  DashboardUltimosPagos,
  useDashboardData,
} from '@features/dashboard';
import { LoadingSpinner } from '../components/shared';

export default function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<'mes' | 'anio'>('mes');
  const [curso, setCurso] = useState<Curso | null | undefined>(undefined);
  const { stats, loading } = useDashboardData(periodo as any);

  useEffect(() => {
    void cursoAbierto()
      .then(setCurso)
      .catch(() => setCurso(null));
  }, []);

  if (loading)
    return (
      <LoadingSpinner size='large' text='Cargando datos del Dashboard...' />
    );

  return (
    <div className='space-y-6'>
      {/* Header - Refactoring UI principles */}
      <DashboardHeader />

      {curso === null && (
        <div className='rounded-xl border border-[#2a332c] bg-[#1c241e] px-4 py-3 text-sm text-[#f5f1e8]'>
          No hay curso abierto. Las deudas del curso cerrado siguen en Pagos.{' '}
          <Link to='/cursos' className='text-[#c9a658]'>
            Abrir curso
          </Link>
        </div>
      )}
      {curso && (
        <div className='rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'>
          Curso abierto: {curso.nombre} ({curso.fecha_inicio} → {curso.fecha_fin}).{' '}
          <Link to='/cursos' className='text-[#8c6e2e] dark:text-[#c9a658]'>
            Ver curso
          </Link>
        </div>
      )}

      <div className='flex justify-end'>
        <div className='inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm'>
          <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
            Periodo
          </span>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value === 'anio' ? 'anio' : 'mes')}
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
          huecosPorFaltas={(stats.huecosPorFaltas || []) as any[]}
          totalHuecos={stats.totalHuecosPorFaltas || 0}
        />

        {/* Clases incompletas */}
        <DashboardClasesIncompletas
          clasesIncompletas={(stats.clasesIncompletas || []) as any[]}
        />

        {/* Últimos pagos */}
        <DashboardUltimosPagos ultimosPagos={(stats.ultimosPagos || []) as any[]} />
      </div>
    </div>
  );
}
