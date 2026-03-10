import MobileTabsSelector from '../common/MobileTabsSelector';

export default function FichaAlumnoTabs({ tabActiva, setTabActiva, counts }) {
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
