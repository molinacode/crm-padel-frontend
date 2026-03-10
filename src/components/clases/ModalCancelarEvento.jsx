export default function ModalCancelarEvento({
  eventoACancelar,
  onCancel,
  onCancelarIndividual,
  onCancelarSerie,
}) {
  if (!eventoACancelar) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-dark-text mb-4'>
          Cancelar Evento
        </h3>

        <div className='mb-6'>
          <p className='text-gray-700 dark:text-dark-text2 mb-2'>
            ¿Cómo quieres cancelar el evento{' '}
            <strong>"{eventoACancelar.title}"</strong>?
          </p>
          <p className='text-sm text-gray-500 dark:text-dark-text2'>
            Fecha:{' '}
            {eventoACancelar.start.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={onCancelarIndividual}
            className='flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base'
          >
            Solo este evento
          </button>
          <button
            onClick={onCancelarSerie}
            className='flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base'
          >
            Toda la serie
          </button>
          <button
            onClick={onCancel}
            className='flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base'
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
