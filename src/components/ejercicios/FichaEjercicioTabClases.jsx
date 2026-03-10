export default function FichaEjercicioTabClases({ clasesAsignadas }) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          📅 Clases que usan este ejercicio
        </h3>
        <span className='text-sm text-gray-500'>
          {clasesAsignadas.length} clase
          {clasesAsignadas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {clasesAsignadas.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>📅</div>
          <p className='text-gray-500'>
            Este ejercicio no está asignado a ninguna clase
          </p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {clasesAsignadas.map(item => (
            <div key={item.id} className='bg-gray-50 rounded-lg p-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <h4 className='font-semibold text-gray-900'>
                    {item.clases.nombre}
                  </h4>
                  <p className='text-sm text-gray-600'>
                    {item.clases.nivel_clase} • {item.clases.tipo_clase}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {item.clases.dia_semana} • {item.clases.hora_inicio} -{' '}
                    {item.clases.hora_fin}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.clases.tipo_clase === 'particular'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.clases.tipo_clase === 'particular'
                    ? '🎯 Particular'
                    : '👥 Grupal'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
