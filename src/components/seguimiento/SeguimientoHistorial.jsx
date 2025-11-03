export default function SeguimientoHistorial({ seguimientos = [], onCrear }) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>📝 Historial de Seguimiento</h3>
        <span className='text-sm text-gray-500'>
          {seguimientos.length} registro{seguimientos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {seguimientos.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>📝</div>
          <p className='text-gray-500'>No hay seguimientos registrados</p>
          <button onClick={onCrear} className='mt-4 btn-primary px-6 py-3'>
            Crear Primer Seguimiento
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {seguimientos.map(seguimiento => (
            <div key={seguimiento.id} className='bg-gray-50 rounded-lg p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h4 className='font-semibold text-gray-900'>
                    {seguimiento.tipo} -{' '}
                    {seguimiento.fecha
                      ? new Date(seguimiento.fecha).toLocaleDateString('es-ES')
                      : 'Sin fecha'}
                  </h4>
                  {seguimiento.nivel_actual && (
                    <p className='text-sm text-gray-600 mt-1'>
                      Nivel actual: {seguimiento.nivel_actual}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    seguimiento.tipo === 'Progreso'
                      ? 'bg-green-100 text-green-800'
                      : seguimiento.tipo === 'Incidencia'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {seguimiento.tipo}
                </span>
              </div>

              {seguimiento.observaciones && (
                <div className='mb-4'>
                  <h5 className='font-medium text-gray-700 mb-2'>Observaciones:</h5>
                  <p className='text-gray-600 whitespace-pre-wrap'>
                    {seguimiento.observaciones}
                  </p>
                </div>
              )}

              {seguimiento.objetivos && (
                <div className='mb-4'>
                  <h5 className='font-medium text-gray-700 mb-2'>Objetivos:</h5>
                  <p className='text-gray-600 whitespace-pre-wrap'>
                    {seguimiento.objetivos}
                  </p>
                </div>
              )}

              {seguimiento.recomendaciones && (
                <div>
                  <h5 className='font-medium text-gray-700 mb-2'>Recomendaciones:</h5>
                  <p className='text-gray-600 whitespace-pre-wrap'>
                    {seguimiento.recomendaciones}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


