import MobileTabsSelector from '../common/MobileTabsSelector';

interface FichaEjercicioTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clasesCount: number;
}

export default function FichaEjercicioTabs({
  activeTab,
  setActiveTab,
  clasesCount,
}: FichaEjercicioTabsProps) {
  const tabs = [
    { key: 'info', label: 'Información', icon: '📋' },
    { key: 'instrucciones', label: 'Instrucciones', icon: '📖' },
    { key: 'clases', label: `Clases (${clasesCount})`, icon: '📅' },
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
