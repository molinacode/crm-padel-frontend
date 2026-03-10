export default function FichaEjercicioTabInfo({ ejercicio }) {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            💪 Información Básica
          </h3>
          <div className='space-y-3'>
            <div>
              <span className='text-sm font-medium text-gray-500'>Nombre:</span>
              <p className='text-gray-900'>{ejercicio.nombre}</p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Categoría:
              </span>
              <p className='text-gray-900'>{ejercicio.categoria}</p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>Tipo:</span>
              <p className='text-gray-900'>{ejercicio.tipo}</p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Dificultad:
              </span>
              <span
                className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                  ejercicio.dificultad === 'Fácil'
                    ? 'bg-green-100 text-green-800'
                    : ejercicio.dificultad === 'Intermedio'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {ejercicio.dificultad}
              </span>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Duración:
              </span>
              <p className='text-gray-900'>
                {ejercicio.duracion_minutos
                  ? `${ejercicio.duracion_minutos} minutos`
                  : 'No especificada'}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            🎾 Material y Descripción
          </h3>
          <div className='space-y-3'>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Descripción:
              </span>
              <p className='text-gray-900'>
                {ejercicio.description || 'Sin descripción'}
              </p>
            </div>
            <div>
              <span className='text-sm font-medium text-gray-500'>
                Material necesario:
              </span>
              <p className='text-gray-900'>
                {ejercicio.material_necesario || 'No especificado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {ejercicio.observaciones && (
        <div className='bg-gray-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            📝 Observaciones
          </h3>
          <p className='text-gray-700 whitespace-pre-wrap'>
            {ejercicio.observaciones}
          </p>
        </div>
      )}
    </div>
  );
}
