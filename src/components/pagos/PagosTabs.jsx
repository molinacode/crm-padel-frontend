import MobileTabsSelector from '../common/MobileTabsSelector';

export default function PagosTabs({ tabActivo, setTabActivo, counts = {} }) {
  const tabs = [
    { key: 'historial', label: 'Historial de Pagos', icon: '📋' },
    { key: 'nuevo', label: 'Nuevos Pagos', icon: '➕' },
    {
      key: 'deudas',
      label: `Alumnos con Deuda${counts.deudas ? ` (${counts.deudas})` : ''}`,
      icon: '⚠️',
    },
    { key: 'internas', label: 'Clases internas (mes)', icon: '🏫' },
  ];

  return (
    <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden'>
      <MobileTabsSelector
        tabs={tabs}
        activeTab={tabActivo}
        onTabChange={setTabActivo}
      />
    </div>
  );
}
