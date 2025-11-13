import MobileTabsSelector from '../common/MobileTabsSelector';

export default function SeguimientoTabs({
  activeTab,
  setActiveTab,
  clasesCount,
  asistenciasCount,
}) {
  const tabs = [
    { key: 'seguimiento', label: 'Seguimiento', icon: '📝' },
    {
      key: 'clases',
      label: `Clases${clasesCount > 0 ? ` (${clasesCount})` : ''}`,
      icon: '📅',
    },
    {
      key: 'asistencias',
      label: `Asistencias${asistenciasCount > 0 ? ` (${asistenciasCount})` : ''}`,
      icon: '✅',
    },
  ];

  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
      <MobileTabsSelector
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
