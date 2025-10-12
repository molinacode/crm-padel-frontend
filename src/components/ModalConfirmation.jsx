export default function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  titulo = '¿Estás seguro?',
  mensaje = 'Esta acción no se puede deshacer.',
}) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-dark-surface p-6 rounded-xl shadow-xl max-w-sm w-full'>
        <h3 className='text-lg font-semibold mb-4 text-gray-800 dark:text-dark-text'>
          {titulo}
        </h3>
        <p className='text-gray-600 dark:text-dark-text2 mb-6'>{mensaje}</p>
        <div className='flex justify-end space-x-3'>
          <button
            onClick={onClose}
            className='bg-gray-300 dark:bg-dark-surface2 hover:bg-gray-400 dark:hover:bg-dark-surface text-gray-800 dark:text-dark-text px-4 py-2 rounded transition'
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition'
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
