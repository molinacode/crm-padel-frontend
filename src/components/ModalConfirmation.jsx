export default function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  titulo = '¿Estás seguro?',
  mensaje = 'Esta acción no se puede deshacer.',
}) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-gray-900 dark:bg-black bg-opacity-60 dark:bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-800 overflow-hidden'>
        <div className='p-8'>
          <h3 className='text-2xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight'>
            {titulo}
          </h3>
          <p className='text-base text-gray-600 dark:text-gray-400 mb-8 font-medium'>
            {mensaje}
          </p>
          <div className='flex justify-end gap-3'>
            <button
              onClick={onClose}
              className='bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[48px]'
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className='bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[48px]'
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
