export default function EjerciciosFilters({
  searchTerm,
  setSearchTerm,
  filterCategoria,
  setFilterCategoria,
  categorias,
}) {
  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='relative'>
          <input
            type='text'
            placeholder='Buscar por nombre o descripción...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
          <svg
            className='absolute left-3 top-2.5 h-5 w-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
        <div>
          <select
            value={filterCategoria}
            onChange={e => setFilterCategoria(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value=''>Todas las categorías</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
