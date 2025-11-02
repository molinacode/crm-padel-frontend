export default function ClasesViewToggle({ viewMode, setViewMode }) {
  return (
    <div className='flex justify-center'>
      <div className='flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 shadow-sm'>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${
            viewMode === 'calendar'
              ? 'bg-green-600 dark:bg-green-600 text-white shadow-md transform scale-105'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          📅 Calendario
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer ${
            viewMode === 'table'
              ? 'bg-green-600 dark:bg-green-600 text-white shadow-md transform scale-105'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          📋 Tabla
        </button>
      </div>
    </div>
  );
}
