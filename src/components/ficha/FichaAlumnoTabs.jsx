export default function FichaAlumnoTabs({ tabActiva, setTabActiva, counts }) {
  return (
    <div className='border-b border-gray-200 dark:border-dark-border'>
      <nav className='flex space-x-8 px-6'>
        <button
          onClick={() => setTabActiva('clases')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            tabActiva === 'clases'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          📚 Clases Asignadas ({counts.clases})
        </button>
        <button
          onClick={() => setTabActiva('pagos')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            tabActiva === 'pagos'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          💸 Pagos ({counts.pagos})
        </button>
        <button
          onClick={() => setTabActiva('asistencias')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            tabActiva === 'asistencias'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          📅 Asistencias ({counts.asistencias})
        </button>
        <button
          onClick={() => setTabActiva('recuperaciones')}
          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            tabActiva === 'recuperaciones'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
          }`}
        >
          🔄 Recuperaciones ({counts.recuperaciones})
        </button>
      </nav>
    </div>
  );
}
