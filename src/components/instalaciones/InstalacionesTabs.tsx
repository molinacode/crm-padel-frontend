import MobileTabsSelector from '../common/MobileTabsSelector';

interface InstalacionesTabsProps {
  tabActiva: string;
  setTabActiva: (tab: string) => void;
}

export default function InstalacionesTabs({
  tabActiva,
  setTabActiva,
}: InstalacionesTabsProps) {
  const tabs = [
    { key: 'diario', label: 'Diario', icon: '📅' },
    { key: 'semanal', label: 'Semanal', icon: '📊' },
    { key: 'mensual', label: 'Mensual', icon: '📈' },
    { key: 'anual', label: 'Anual', icon: '📋' },
  ];

  return (
    <MobileTabsSelector
      tabs={tabs}
      activeTab={tabActiva}
      onTabChange={setTabActiva}
    />
  );
}
