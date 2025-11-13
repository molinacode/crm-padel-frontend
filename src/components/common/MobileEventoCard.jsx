/**
 * Componente específico para tarjetas de eventos/clases en móvil
 * Usa MobileCard internamente con configuración específica para eventos
 */

import { useMemo } from 'react';
import MobileCard from './MobileCard';

export default function MobileEventoCard({
  evento,
  getClassColors,
  onActionClick,
}) {
  const classColors = getClassColors(
    evento.resource.clases,
    evento.resource.estado === 'cancelada'
  );

  const badges = useMemo(() => {
    const badgesArray = [
      {
        label: evento.resource.clases.nivel_clase,
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      },
      {
        label: classColors.label,
        colorClass: classColors.badgeClass,
      },
    ];

    if (evento.resource.clases.profesor) {
      badgesArray.push({
        label: evento.resource.clases.profesor,
        icon: '👨‍🏫',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      });
    }

    if (evento.huecosDisponibles > 0) {
      badgesArray.push({
        label: `${evento.huecosDisponibles} hueco${evento.huecosDisponibles !== 1 ? 's' : ''}`,
        icon: '🕳️',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      });
    }

    if (evento.alumnosJustificados > 0) {
      badgesArray.push({
        label: `${evento.alumnosJustificados} justificado${evento.alumnosJustificados !== 1 ? 's' : ''}`,
        icon: '⚠️',
        colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      });
    }

    return badgesArray;
  }, [evento, classColors]);

  const fechaHora = useMemo(() => {
    const fecha = evento.start.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
    const hora = `${evento.start.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${evento.end.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    return { fecha, hora };
  }, [evento]);

  return (
    <MobileCard
      title={evento.resource.clases.nombre}
      subtitle={`${fechaHora.fecha} • ${fechaHora.hora}`}
      icon='📅'
      iconBg={classColors.iconBg || 'bg-blue-100 dark:bg-blue-900/30'}
      iconColor={classColors.iconColor || 'text-blue-600 dark:text-blue-400'}
      badges={badges}
      onActionClick={onActionClick}
    >
      <div className='mt-2 text-xs text-gray-600 dark:text-dark-text2'>
        {evento.resource.clases.nivel_clase}
        {evento.resource.clases.tipo_clase && ` • ${evento.resource.clases.tipo_clase}`}
      </div>
    </MobileCard>
  );
}

