import MobileTabsSelector from '../common/MobileTabsSelector';

export default function ClasesTabsContainer({
  tabActiva,
  setTabActiva,
  eventosProximos,
  eventosImpartidos,
  eventosCancelados,
}) {
  const tabs = [
    {
      key: 'proximas',
      label: `Próximas Clases (${eventosProximos.length})`,
      icon: '📅',
    },
    {
      key: 'impartidas',
      label: `Clases Impartidas (${eventosImpartidos.length})`,
      icon: '✅',
    },
    {
      key: 'canceladas',
      label: `Clases Canceladas (${eventosCancelados.length})`,
      icon: '❌',
    },
    {
      key: 'asignar',
      label: 'Asignar Alumnos',
      icon: '👥',
    },
    {
      key: 'nueva',
      label: 'Nueva Clase',
      icon: '➕',
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
