export default function ProfesorHistorial({ eventos }) {
  const items = (eventos || []).slice(0, 20);
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
        Historial reciente
      </h2>
      {items.length === 0 ? (
        <p className='text-gray-500 dark:text-dark-text2 text-sm'>
          Sin historial reciente.
        </p>
      ) : (
        <div className='space-y-2'>
          {items.map(ev => (
            <div
              key={ev.id}
              className='p-3 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface'
            >
              <p className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                {ev.title || 'Clase'} —{' '}
                {new Date(ev.start).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
