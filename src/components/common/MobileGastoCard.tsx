import { useMemo } from 'react';
import MobileCard from './MobileCard';

interface GastoLike {
  concepto?: string | null;
  cantidad: number | string;
  categoria?: string | null;
  proveedor?: string | null;
  fecha_gasto?: string | null;
  descripcion?: string | null;
}

interface MobileGastoCardProps {
  gasto: GastoLike;
  onEditar?: (gasto: GastoLike) => void;
  onEliminar?: (gasto: GastoLike) => void;
}

export default function MobileGastoCard({
  gasto,
  onEditar,
  onEliminar,
}: MobileGastoCardProps) {
  const badges = useMemo(() => {
    const badgesArray: Array<{ label: string; colorClass: string; icon?: string }> = [
      { label: `-${gasto.cantidad}€`, colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    ];
    if (gasto.categoria) badgesArray.push({ label: gasto.categoria, colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' });
    if (gasto.proveedor) badgesArray.push({ label: gasto.proveedor, icon: '🏪', colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' });
    if (gasto.fecha_gasto) badgesArray.push({ label: new Date(gasto.fecha_gasto).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), icon: '📅', colorClass: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' });
    return badgesArray;
  }, [gasto]);

  const actions = useMemo(
    () => [
      { category: 'Acciones principales', items: [{ id: 'editar', label: 'Editar gasto', icon: '✏️', color: 'gray' as const, onClick: () => onEditar?.(gasto) }] },
      {
        category: 'Acciones peligrosas',
        items: [{
          id: 'eliminar',
          label: 'Eliminar gasto',
          icon: '🗑️',
          color: 'red' as const,
          onClick: () => {
            if (window.confirm(`¿Estás seguro de que quieres eliminar el gasto "${gasto.concepto || 'Gasto'}" de ${gasto.cantidad}€?`)) {
              onEliminar?.(gasto);
            }
          },
        }],
      },
    ],
    [gasto, onEditar, onEliminar]
  );

  return (
    <MobileCard
      title={gasto.concepto || 'Gasto'}
      subtitle={gasto.categoria || 'Sin categoría'}
      icon="🧾"
      iconBg="bg-orange-100 dark:bg-orange-900/30"
      iconColor="text-orange-700 dark:text-orange-300"
      badges={badges}
      actions={actions}
    >
      {gasto.descripcion && gasto.descripcion.trim() && (
        <p className="text-sm text-gray-600 dark:text-dark-text2">{gasto.descripcion}</p>
      )}
    </MobileCard>
  );
}
