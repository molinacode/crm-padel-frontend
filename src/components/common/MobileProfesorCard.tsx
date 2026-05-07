import { useMemo } from 'react';
import MobileCard from './MobileCard';

interface ProfesorLike {
  nombre: string;
  apellidos?: string | null;
  email?: string | null;
  telefono?: string | null;
  especialidad?: string | null;
  activo?: boolean;
}

interface MobileProfesorCardProps {
  profesor: ProfesorLike;
  onActionClick?: () => void;
}

export default function MobileProfesorCard({
  profesor,
  onActionClick,
}: MobileProfesorCardProps) {
  const badges = useMemo(
    () => [
      { label: profesor.especialidad || 'Pádel', colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
      {
        label: profesor.activo ? 'Activo' : 'Inactivo',
        icon: profesor.activo ? '✅' : '❌',
        colorClass: profesor.activo
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      },
    ],
    [profesor]
  );

  return (
    <MobileCard
      title={`${profesor.nombre} ${profesor.apellidos || ''}`.trim()}
      subtitle={profesor.email || profesor.telefono || 'Sin contacto'}
      icon="👨‍🏫"
      iconBg="bg-blue-100 dark:bg-blue-900/30"
      iconColor="text-blue-600 dark:text-blue-400"
      badges={badges}
      onActionClick={onActionClick}
    >
      {profesor.telefono && (
        <p className="text-sm text-gray-600 dark:text-dark-text2 mt-2">
          📞 {profesor.telefono}
        </p>
      )}
    </MobileCard>
  );
}
