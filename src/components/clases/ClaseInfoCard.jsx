/**
 * Componente para mostrar información de una clase
 */
export default function ClaseInfoCard({ clase, esClaseParticular }) {
  if (!clase) return null;

  return (
    <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl'>
            <svg
              className='w-6 h-6 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
              {clase.nombre}
            </h3>
            <p className='text-sm text-gray-500 dark:text-dark-text2'>
              {esClaseParticular ? 'Clase particular' : 'Clase grupal'} • {clase.nivel_clase}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              esClaseParticular
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
          </span>
        </div>
      </div>

      {/* Información de la clase */}
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>📅</span>
          <div>
            <p className='text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Día
            </p>
            <p className='text-gray-900 dark:text-dark-text'>
              {clase.dia_semana}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>🎯</span>
          <div>
            <p className='text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Nivel
            </p>
            <p className='text-gray-900 dark:text-dark-text'>
              {clase.nivel_clase}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>👨‍🏫</span>
          <div>
            <p className='text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Profesor
            </p>
            <p className='text-gray-900 dark:text-dark-text'>
              {clase.profesor || 'Sin asignar'}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>📝</span>
          <div>
            <p className='text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Observaciones
            </p>
            <p className='text-gray-900 dark:text-dark-text'>
              {clase.observaciones || 'Sin observaciones'}
            </p>
          </div>
        </div>
      </div>

      {/* Próximo evento */}
      {clase.eventos_proximos && clase.eventos_proximos.length > 0 && (
        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30'>
          <div className='flex items-center gap-3 mb-2'>
            <span className='text-xl'>⏰</span>
            <h4 className='font-semibold text-blue-800 dark:text-blue-200'>
              Próxima clase
            </h4>
          </div>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p className='text-blue-700 dark:text-blue-300 font-medium'>
                Fecha:
              </p>
              <p className='text-blue-900 dark:text-blue-100'>
                {clase.eventos_proximos[0]?.fecha
                  ? new Date(
                      clase.eventos_proximos[0].fecha
                    ).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Sin fecha'}
              </p>
            </div>
            <div>
              <p className='text-blue-700 dark:text-blue-300 font-medium'>
                Horario:
              </p>
              <p className='text-blue-900 dark:text-blue-100'>
                {clase.eventos_proximos[0].hora_inicio} -{' '}
                {clase.eventos_proximos[0].hora_fin}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

