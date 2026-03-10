import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboardData() {
  const [stats, setStats] = useState({
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
        const { stats: statsData, error } = await dashboardService.cargarStats();
        
        if (error) {
          throw error;
        }

        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error('💥 Error cargando stats desde Supabase:', err);
        setStats(s => ({
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
  }, []);

  return { stats, loading };
}
