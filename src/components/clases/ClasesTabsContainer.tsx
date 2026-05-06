import MobileTabsSelector from '../common/MobileTabsSelector';

interface ClasesTabsContainerProps {
  tabActiva: string;
  setTabActiva: (tab: string) => void;
  eventosProximos: unknown[];
  eventosImpartidos: unknown[];
  eventosCancelados: unknown[];
}

export default function ClasesTabsContainer({
  tabActiva,
  setTabActiva,
  eventosProximos,
  eventosImpartidos,
  eventosCancelados,
}: ClasesTabsContainerProps) {
  const tabs = [
    { key: 'proximas', label: `Próximas Clases (${eventosProximos.length})`, icon: '📅' },
    { key: 'impartidas', label: `Clases Impartidas (${eventosImpartidos.length})`, icon: '✅' },
    { key: 'canceladas', label: `Clases Canceladas (${eventosCancelados.length})`, icon: '❌' },
    { key: 'asignar', label: 'Asignar Alumnos', icon: '👥' },
    { key: 'nueva', label: 'Nueva Clase', icon: '➕' },
  ];

  return <MobileTabsSelector tabs={tabs} activeTab={tabActiva} onTabChange={setTabActiva} />;
}
