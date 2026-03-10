/**
 * Componente específico para tarjetas de ejercicios en móvil
 * Usa MobileCard internamente con configuración específica para ejercicios
 */

import { useMemo } from 'react';
import MobileCard from './MobileCard';

export default function MobileEjercicioCard({
  ejercicio,
  onActionClick,
}) {
  const badges = useMemo(() => {
    const badgesArray = [
      {
        label: ejercicio.categoria || 'General',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      },
      {
        label: ejercicio.dificultad || 'Intermedio',
        colorClass:
          ejercicio.dificultad === 'Fácil'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : ejercicio.dificultad === 'Intermedio'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      },
    ];

    if (ejercicio.duracion_minutos) {
      badgesArray.push({
        label: `${ejercicio.duracion_minutos} min`,
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      });
    }

    return badgesArray;
  }, [ejercicio]);

  return (
    <MobileCard
      title={ejercicio.nombre}
      subtitle={ejercicio.tipo || 'Ejercicio'}
      icon='💪'
      iconBg='bg-green-100 dark:bg-green-900/30'
      iconColor='text-green-600 dark:text-green-400'
      badges={badges}
      onActionClick={onActionClick}
    >
      {ejercicio.description && (
        <p className='text-sm text-gray-600 dark:text-dark-text2 mt-2 line-clamp-2'>
          {ejercicio.description}
        </p>
      )}
    </MobileCard>
  );
}

