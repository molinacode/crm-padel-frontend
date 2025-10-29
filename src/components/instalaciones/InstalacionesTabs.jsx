export default function InstalacionesTabs({ tabActiva, setTabActiva }) {
  const tabs = [
    { key: 'diario', label: '📅 Diario', color: 'blue' },
    { key: 'semanal', label: '📊 Semanal', color: 'purple' },
    { key: 'mensual', label: '📈 Mensual', color: 'orange' },
    { key: 'anual', label: '📋 Anual', color: 'indigo' },
  ];

  const colorMap = {
    blue: 'border-blue-500 text-blue-600 dark:text-blue-400',
    purple: 'border-purple-500 text-purple-600 dark:text-purple-400',
    orange: 'border-orange-500 text-orange-600 dark:text-orange-400',
    indigo: 'border-indigo-500 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className='border-b border-gray-200 dark:border-dark-border'>
      <nav className='flex space-x-2 sm:space-x-4 lg:space-x-8 px-2 sm:px-4 lg:px-6 overflow-x-auto scrollbar-hide'>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTabActiva(t.key)}
            className={`py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              tabActiva === t.key
                ? colorMap[t.color]
                : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
