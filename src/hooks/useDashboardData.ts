import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

interface DashboardStats {
  totalAlumnos: number;
  ingresosMes: number;
  clasesEstaSemana: number;
  ultimosPagos: unknown[];
  clasesIncompletas: unknown[];
  alumnosConDeuda: number;
  totalProfesores: number;
  profesoresActivos: number;
  clasesPorProfesor: Record<string, number>;
  huecosPorFaltas: unknown[];
  totalHuecosPorFaltas: number;
}

export function useDashboardData(periodo: 'mes' | 'anio' = 'mes') {
  const [stats, setStats] = useState<DashboardStats>({
    totalAlumnos: 0,
    ingresosMes: 0,
    clasesEstaSemana: 0,
    ultimosPagos: [],
    clasesIncompletas: [],
    alumnosConDeuda: 0,
    totalProfesores: 0,
    profesoresActivos: 0,
    clasesPorProfesor: {},
    huecosPorFaltas: [],
    totalHuecosPorFaltas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const { stats: statsData, error } = await dashboardService.cargarStats({
          periodo,
        });
        
        if (error) {
          throw error;
        }

        if (statsData) setStats(statsData as unknown as DashboardStats);
      } catch (err) {
        console.error('💥 Error cargando stats desde Supabase:', err);
        setStats((s: DashboardStats) => ({
          ...s,
          ultimosPagos: [],
          clasesIncompletas: [],
          huecosPorFaltas: [],
          totalHuecosPorFaltas: 0,
        }));
      } finally {
        setLoading(false);
      }
    };

    cargarStats();
  }, [periodo]);

  return { stats, loading };
}


