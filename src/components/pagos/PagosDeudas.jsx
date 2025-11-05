export default function PagosDeudas({ items, onAlumnoClick }) {
  if (!items || items.length === 0) {
    return (
      <div className='p-6 text-sm text-gray-500 dark:text-dark-text2'>
        Todos al día.
      </div>
    );
  }
  return (
    <div className='space-y-3'>
      {items.map(a => (
        <button
          key={a.id}
          type='button'
          onClick={() => onAlumnoClick?.(a)}
          className='w-full text-left p-3 rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors dark:bg-yellow-900/20 dark:border-yellow-800/50 dark:hover:bg-yellow-900/30 cursor-pointer'
        >
          <div className='font-medium text-gray-900 dark:text-gray-100'>
            {a.nombre}
          </div>
          <div className='text-xs text-gray-600 dark:text-gray-300'>
            Días sin pagar: {a.diasSinPagar}
          </div>
        </button>
      ))}
    </div>
  );
}
