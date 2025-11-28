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
  // Validación defensiva
  if (!evento || !evento.resource || !evento.resource.clases) {
    return (
      <div className='bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4 shadow-sm'>
        <div className='text-sm text-gray-500 dark:text-dark-text2'>
          ⚠️ Datos de evento incompletos
        </div>
      </div>
    );
  }

  const clase = evento.resource.clases;
  const classColors = getClassColors(
    clase,
    evento.resource.estado === 'cancelada'
  );

  const badges = useMemo(() => {
    const badgesArray = [
      {
        label: clase.nivel_clase || 'Sin nivel',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      },
      {
        label: classColors.label,
        colorClass: classColors.badgeClass,
      },
    ];

    if (clase.profesor) {
      badgesArray.push({
        label: clase.profesor,
        icon: '👨‍🏫',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      });
    }

    if ((evento.huecosDisponibles ?? 0) > 0) {
      badgesArray.push({
        label: `${evento.huecosDisponibles} hueco${evento.huecosDisponibles !== 1 ? 's' : ''}`,
        icon: '🕳️',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      });
    }

    const justificadosCount = evento.alumnosJustificados
      ? evento.alumnosJustificados.length || evento.alumnosJustificados
      : 0;

    if (justificadosCount > 0) {
      badgesArray.push({
        label: `${justificadosCount} justificado${justificadosCount !== 1 ? 's' : ''}`,
        icon: '⚠️',
        colorClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      });
    }

    return badgesArray;
  }, [clase, classColors]);

  const fechaHora = useMemo(() => {
    const startDate = evento.start instanceof Date 
      ? evento.start 
      : evento.start 
        ? new Date(evento.start) 
        : null;
    const endDate = evento.end instanceof Date 
      ? evento.end 
      : evento.end 
        ? new Date(evento.end) 
        : null;

    if (!startDate || isNaN(startDate.getTime())) {
      return { fecha: 'Fecha inválida', hora: '' };
    }

    const fecha = startDate.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
    
    const hora = endDate && !isNaN(endDate.getTime())
      ? `${startDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${endDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : startDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
    
    return { fecha, hora };
  }, [evento]);

  return (
    <MobileCard
      title={clase.nombre || 'Clase sin nombre'}
      subtitle={`${fechaHora.fecha} • ${fechaHora.hora}`}
      icon='📅'
      iconBg={classColors.iconBg || 'bg-blue-100 dark:bg-blue-900/30'}
      iconColor={classColors.iconColor || 'text-blue-600 dark:text-blue-400'}
      badges={badges}
      onActionClick={onActionClick}
    >
      <div className='mt-2 text-xs text-gray-600 dark:text-dark-text2'>
        {clase.nivel_clase || 'Sin nivel'}
        {clase.tipo_clase && ` • ${clase.tipo_clase}`}
      </div>
    </MobileCard>
  );
}

