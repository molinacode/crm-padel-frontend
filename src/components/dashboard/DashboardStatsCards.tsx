interface DashboardStats {
  totalAlumnos: number;
  ingresosMes: number;
  ingresosPeriodoAnterior?: number;
  clasesEstaSemana: number;
  clasesIncompletas: unknown[];
  alumnosConDeuda: number;
  totalProfesores: number;
  profesoresActivos: number;
}

interface DashboardStatsCardsProps {
  stats: DashboardStats;
  navigate: (path: string) => void;
}

export default function DashboardStatsCards({ stats, navigate }: DashboardStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">Alumnos</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.totalAlumnos}</p>
      </div>
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
          €{stats.ingresosMes.toLocaleString('es-ES')}
        </p>
      </div>
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">Clases</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.clasesEstaSemana}</p>
        <button
          onClick={() => navigate('/clases?tab=proximas&view=table')}
          className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl"
        >
          Ver →
        </button>
      </div>
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">Incompletas</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.clasesIncompletas.length}</p>
      </div>
      <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.alumnosConDeuda}</p>
      </div>
    </div>
  );
}
