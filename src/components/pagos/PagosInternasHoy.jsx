export default function PagosInternasHoy({ items, onTogglePago }) {
  if (!items || items.length === 0) {
    return (
      <div className='p-4 text-sm text-gray-500 dark:text-dark-text2'>
        No hay clases internas este mes.
      </div>
    );
  }
  return (
    <div className='space-y-2'>
      {items.map(it => (
        <div
          key={it.id}
          className='flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface'
        >
          <div className='min-w-0'>
            <p className='font-medium text-gray-900 dark:text-dark-text truncate'>
              {it.nombre} — {it.hora_inicio || ''}
            </p>
            <p className='text-xs text-gray-500 dark:text-dark-text2'>
              Estado pago: {it.estado_pago || 'pendiente'}
            </p>
          </div>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg ${it.estado_pago === 'pagada' ? 'bg-green-600' : 'bg-orange-600'} text-white`}
            onClick={() => onTogglePago?.(it)}
          >
            {it.estado_pago === 'pagada' ? 'Marcar pendiente' : 'Marcar pagada'}
          </button>
        </div>
      ))}
    </div>
  );
}
