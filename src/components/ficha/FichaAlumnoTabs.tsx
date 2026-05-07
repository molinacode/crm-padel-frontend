import MobileTabsSelector from '../common/MobileTabsSelector';

interface FichaCounts {
  clases: number;
  pagos: number;
  asistencias: number;
  recuperaciones: number;
}

interface FichaAlumnoTabsProps {
  tabActiva: string;
  setTabActiva: (tab: string) => void;
  counts: FichaCounts;
}

export default function FichaAlumnoTabs({
  tabActiva,
  setTabActiva,
  counts,
}: FichaAlumnoTabsProps) {
  const tabs = [
    {
      key: 'clases',
      label: `Clases Asignadas (${counts.clases})`,
      icon: '📚',
    },
    {
      key: 'pagos',
      label: `Pagos (${counts.pagos})`,
      icon: '💸',
    },
    {
      key: 'asistencias',
      label: `Asistencias (${counts.asistencias})`,
      icon: '📅',
    },
    {
      key: 'recuperaciones',
      label: `Recuperaciones (${counts.recuperaciones})`,
      icon: '🔄',
    },
  ];

  return (
    <MobileTabsSelector
      tabs={tabs}
      activeTab={tabActiva}
      onTabChange={setTabActiva}
    />
  );
}
