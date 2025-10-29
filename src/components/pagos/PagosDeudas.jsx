export default function PagosDeudas({ items }) {
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
        <div
          key={a.id}
          className='p-3 rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800/50'
        >
          <div className='font-medium text-gray-900 dark:text-gray-100'>
            {a.nombre}
          </div>
          <div className='text-xs text-gray-600 dark:text-gray-300'>
            Días sin pagar: {a.diasSinPagar}
          </div>
        </div>
      ))}
    </div>
  );
}
