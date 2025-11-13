/**
 * Componente específico para tarjetas de pago en móvil
 * Usa MobileCard internamente con configuración específica para pagos
 */

import { useMemo } from 'react';
import MobileCard from './MobileCard';
import { formatearMesLegible } from '../../utils/calcularDeudas';

export default function MobilePagoCard({
  pago,
  onEditar,
  onEliminar,
}) {
  const badges = useMemo(() => {
    const badgesArray = [
      {
        label: `€${pago.cantidad}`,
        colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      },
    ];

    if (pago.mes_cubierto) {
      badgesArray.push({
        label: formatearMesLegible(pago.mes_cubierto),
        icon: '📅',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      });
    }

    if (pago.tipo_pago) {
      badgesArray.push({
        label: pago.tipo_pago === 'mensual' ? 'Mensual' : 'Clases',
        icon: pago.tipo_pago === 'mensual' ? '📆' : '🎯',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      });
    }

    if (pago.metodo) {
      badgesArray.push({
        label: pago.metodo,
        colorClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      });
    }

    return badgesArray;
  }, [pago]);

  const actions = useMemo(
    () => [
      {
        category: 'Acciones principales',
        items: [
          {
            id: 'editar',
            label: 'Editar pago',
            icon: '✏️',
            color: 'gray',
            onClick: () => {
              onEditar?.(pago);
            },
          },
        ],
      },
      {
        category: 'Acciones peligrosas',
        items: [
          {
            id: 'eliminar',
            label: 'Eliminar pago',
            icon: '🗑️',
            color: 'red',
            onClick: () => {
              if (
                window.confirm(
                  `¿Estás seguro de que quieres eliminar este pago de €${pago.cantidad}?`
                )
              ) {
                onEliminar?.(pago.id);
              }
            },
          },
        ],
      },
    ],
    [pago, onEditar, onEliminar]
  );

  return (
    <MobileCard
      title={pago.alumnos?.nombre || 'Alumno eliminado'}
      subtitle={
        pago.fecha_pago
          ? new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Sin fecha'
      }
      icon='💰'
      iconBg='bg-green-100 dark:bg-green-900/30'
      iconColor='text-green-600 dark:text-green-400'
      badges={badges}
      actions={actions}
    />
  );
}

