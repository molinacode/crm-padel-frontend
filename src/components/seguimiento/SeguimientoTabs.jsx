export default function SeguimientoTabs({
  activeTab,
  setActiveTab,
  clasesCount,
  asistenciasCount,
}) {
  const tabs = [
    { key: 'seguimiento', label: '📝 Seguimiento' },
    {
      key: 'clases',
      label: `📅 Clases ${clasesCount > 0 ? `(${clasesCount})` : ''}`,
    },
    { key: 'asistencias', label: '✅ Asistencias' },
  ];

  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 px-6'>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === t.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:border-gray-300 dark:hover:border-dark-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
