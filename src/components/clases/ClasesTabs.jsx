export default function ClasesTabs({ tabActiva, setTabActiva }) {
  const tabs = [
    { key: 'proximas', label: 'Próximas' },
    { key: 'calendario', label: 'Calendario' },
    { key: 'historial', label: 'Historial' },
    { key: 'nueva', label: 'Nueva Clase' },
  ];

  return (
    <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden'>
      <div className='border-b border-gray-200 dark:border-dark-border'>
        <nav className='flex space-x-8 px-6 overflow-x-auto' aria-label='Tabs'>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                tabActiva === t.key
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-dark-text2 dark:hover:text-dark-text'
              }`}
              onClick={() => setTabActiva(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
