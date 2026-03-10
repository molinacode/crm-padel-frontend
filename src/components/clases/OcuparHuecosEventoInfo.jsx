/**
 * Información del evento en el modal de ocupar huecos
 */
export default function OcuparHuecosEventoInfo({
  evento,
  huecosDisponibles,
  maxAlumnos,
  alumnosSeleccionados,
  procesando,
  onClose,
  onOcuparHuecos,
}) {
  return (
    <div className='p-6 border-b border-gray-200 dark:border-dark-border'>
      <div className='bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800/30'>
        <div className='grid grid-cols-2 gap-4 text-sm mb-4'>
          <div>
            <p className='font-medium text-orange-800 dark:text-orange-200'>
              Clase:
            </p>
            <p className='text-orange-900 dark:text-orange-100'>
              {evento.nombre}
            </p>
          </div>
          <div>
            <p className='font-medium text-orange-800 dark:text-orange-200'>
              Fecha:
            </p>
            <p className='text-orange-900 dark:text-orange-100'>
              {evento.fecha
                ? new Date(evento.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })
                : 'Sin fecha'}
            </p>
          </div>
          <div>
            <p className='font-medium text-orange-800 dark:text-orange-200'>
              Huecos disponibles:
            </p>
            <p className='text-orange-900 dark:text-orange-100'>
              {huecosDisponibles} (máximo {maxAlumnos} por clase)
            </p>
          </div>
          <div>
            <p className='font-medium text-orange-800 dark:text-orange-200'>
              Alumnos justificados:
            </p>
            <p className='text-orange-900 dark:text-orange-100'>
              {evento.alumnosJustificados?.map(j => j.nombre).join(', ') || 'Ninguno'}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className='flex justify-end gap-3 pt-3 border-t border-orange-200 dark:border-orange-800/30'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            Cancelar
          </button>
          <button
            onClick={onOcuparHuecos}
            disabled={procesando || alumnosSeleccionados.size === 0}
            className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {procesando
              ? 'Procesando...'
              : `Ocupar ${alumnosSeleccionados.size} hueco${alumnosSeleccionados.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

