import MobileTabsSelector from '../common/MobileTabsSelector';

interface FichaProfesorTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clasesCount: number;
  proximasCount: number;
}

export default function FichaProfesorTabs({
  activeTab,
  setActiveTab,
  clasesCount,
  proximasCount,
}: FichaProfesorTabsProps) {
  const tabs = [
    { key: 'info', label: 'Información', icon: '📋' },
    { key: 'clases', label: `Clases (${clasesCount})`, icon: '📅' },
    { key: 'horarios', label: `Horarios (${proximasCount})`, icon: '⏰' },
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
