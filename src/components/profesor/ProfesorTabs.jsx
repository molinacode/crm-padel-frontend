export default function ProfesorTabs({ vistaActual, setVistaActual }) {
  return (
    <div className='flex gap-2'>
      <button
        onClick={() => setVistaActual('horarios')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          vistaActual === 'horarios'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        📅 Horarios
      </button>
      <button
        onClick={() => setVistaActual('historial')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          vistaActual === 'historial'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        🗂️ Historial
      </button>
      <button
        onClick={() => setVistaActual('notificaciones')}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          vistaActual === 'notificaciones'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        🔔 Notificaciones
      </button>
    </div>
  );
}
