export default function FichaProfesorTabs({
  activeTab,
  setActiveTab,
  clasesCount,
  proximasCount,
}) {
  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 px-6'>
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
            }`}
          >
            📋 Información
          </button>
          <button
            onClick={() => setActiveTab('clases')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clases'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
            }`}
          >
            📅 Clases ({clasesCount})
          </button>
          <button
            onClick={() => setActiveTab('horarios')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'horarios'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
            }`}
          >
            ⏰ Horarios ({proximasCount})
          </button>
        </nav>
      </div>
    </div>
  );
}
