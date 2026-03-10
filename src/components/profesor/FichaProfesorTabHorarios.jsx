export default function FichaProfesorTabHorarios({ proximasClases }) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          ⏰ Próximas Clases
        </h3>
        <span className='text-sm text-gray-500'>
          {proximasClases.length} clase{proximasClases.length !== 1 ? 's' : ''}
        </span>
      </div>

      {proximasClases.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>⏰</div>
          <p className='text-gray-500'>
            No hay clases programadas próximamente
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {proximasClases.slice(0, 10).map(item => (
            <div
              key={`${item.id}-${item.evento.id}`}
              className='bg-gray-50 rounded-lg p-4'
            >
              <div className='flex justify-between items-start'>
                <div>
                  <h4 className='font-semibold text-gray-900'>{item.nombre}</h4>
                  <p className='text-sm text-gray-600'>
                    {item.nivel_clase} • {item.tipo_clase}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {item.evento?.fecha
                      ? new Date(item.evento.fecha).toLocaleDateString(
                          'es-ES',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )
                      : 'Sin fecha'}{' '}
                    • {item.hora_inicio} - {item.hora_fin}
                  </p>
                </div>
                <div className='text-right'>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.tipo_clase === 'particular'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.tipo_clase === 'particular'
                      ? '🎯 Particular'
                      : '👥 Grupal'}
                  </span>
                  <p className='text-xs text-gray-500 mt-1'>
                    {item.evento.estado === 'cancelada'
                      ? '❌ Cancelada'
                      : '✅ Programada'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
