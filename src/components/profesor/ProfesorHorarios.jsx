export default function ProfesorHorarios({
  eventosPorDia,
  infoSemana,
  onAbrirTematica,
}) {
  const dias = Object.keys(eventosPorDia || {});
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
          Horarios ({infoSemana?.inicio} - {infoSemana?.fin}) ·{' '}
          {infoSemana?.mes}
        </h2>
      </div>
      {dias.length === 0 ? (
        <p className='text-gray-500 dark:text-dark-text2 text-sm'>
          No hay clases en esta semana.
        </p>
      ) : (
        dias.map(fecha => (
          <div
            key={fecha}
            className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-4'
          >
            <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3'>
              {fecha}
            </h3>
            <div className='space-y-3'>
              {(eventosPorDia[fecha] || []).map(evt => (
                <div
                  key={evt.id}
                  className='flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-gray-900'
                >
                  <div className='min-w-0'>
                    <p className='font-medium text-gray-900 dark:text-dark-text truncate'>
                      {evt.title || 'Clase'}
                    </p>
                    <p className='text-xs text-gray-500 dark:text-dark-text2'>
                      {evt.start.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {onAbrirTematica && (
                    <button
                      className='px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700'
                      onClick={() => onAbrirTematica(evt)}
                    >
                      Temática
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
