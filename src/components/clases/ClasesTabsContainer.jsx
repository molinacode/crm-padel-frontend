export default function ClasesTabsContainer({
  tabActiva,
  setTabActiva,
  eventosProximos,
  eventosImpartidos,
  eventosCancelados,
}) {
  return (
    <div className='border-b border-gray-200 dark:border-dark-border'>
      <nav className='flex space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide'>
        <button
          onClick={() => setTabActiva('proximas')}
          className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            tabActiva === 'proximas'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          📅 Próximas Clases ({eventosProximos.length})
        </button>
        <button
          onClick={() => setTabActiva('impartidas')}
          className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            tabActiva === 'impartidas'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          ✅ Clases Impartidas ({eventosImpartidos.length})
        </button>
        <button
          onClick={() => setTabActiva('canceladas')}
          className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            tabActiva === 'canceladas'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          ❌ Clases Canceladas ({eventosCancelados.length})
        </button>
        <button
          onClick={() => setTabActiva('asignar')}
          className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            tabActiva === 'asignar'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          👥 Asignar Alumnos
        </button>
        <button
          onClick={() => setTabActiva('nueva')}
          className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            tabActiva === 'nueva'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          ➕ Nueva Clase
        </button>
      </nav>
    </div>
  );
}
