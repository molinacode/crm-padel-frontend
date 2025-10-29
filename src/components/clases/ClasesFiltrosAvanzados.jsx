export default function ClasesFiltrosAvanzados({
  filtroNivel,
  setFiltroNivel,
  filtroTipoClase,
  setFiltroTipoClase,
  filtroFechaInicio,
  setFiltroFechaInicio,
  filtroFechaFin,
  setFiltroFechaFin,
}) {
  const tieneFiltros =
    filtroNivel || filtroTipoClase || filtroFechaInicio || filtroFechaFin;

  const limpiarFiltros = () => {
    setFiltroNivel('');
    setFiltroTipoClase('');
    setFiltroFechaInicio('');
    setFiltroFechaFin('');
  };

  return (
    <div className='bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <div className='bg-blue-50 dark:bg-blue-950/30 p-3 rounded-2xl'>
            <svg
              className='w-6 h-6 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
              />
            </svg>
          </div>
          <div>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-1'>
              Filtros
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Refina tu búsqueda
            </p>
          </div>
        </div>
        {tieneFiltros && (
          <button
            onClick={limpiarFiltros}
            className='px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-all duration-200 border border-red-200 dark:border-red-800 whitespace-nowrap'
          >
            Limpiar
          </button>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div>
          <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-2'>
            Nivel
          </label>
          <select
            value={filtroNivel}
            onChange={e => setFiltroNivel(e.target.value)}
            className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-dark-surface2 text-gray-900 dark:text-white font-medium'
          >
            <option value=''>Todos los niveles</option>
            <option value='Iniciación (1)'>Iniciación (1)</option>
            <option value='Iniciación (2)'>Iniciación (2)</option>
            <option value='Medio (3)'>Medio (3)</option>
            <option value='Medio (4)'>Medio (4)</option>
            <option value='Avanzado (5)'>Avanzado (5)</option>
            <option value='Infantil (1)'>Infantil (1)</option>
            <option value='Infantil (2)'>Infantil (2)</option>
            <option value='Infantil (3)'>Infantil (3)</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-2'>
            Tipo
          </label>
          <select
            value={filtroTipoClase}
            onChange={e => setFiltroTipoClase(e.target.value)}
            className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-dark-surface2 text-gray-900 dark:text-white font-medium'
          >
            <option value=''>Todos los tipos</option>
            <option value='grupal'>👥 Grupal</option>
            <option value='particular'>🎯 Particular</option>
            <option value='interna'>🏠 Interna</option>
            <option value='escuela'>🏫 Escuela</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-2'>
            Desde
          </label>
          <input
            type='date'
            value={filtroFechaInicio}
            onChange={e => setFiltroFechaInicio(e.target.value)}
            className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-dark-surface2 text-gray-900 dark:text-white font-medium'
          />
        </div>

        <div>
          <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-2'>
            Hasta
          </label>
          <input
            type='date'
            value={filtroFechaFin}
            onChange={e => setFiltroFechaFin(e.target.value)}
            className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-dark-surface2 text-gray-900 dark:text-white font-medium'
          />
        </div>
      </div>
    </div>
  );
}
