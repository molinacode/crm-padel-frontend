export default function SeguimientoAsistenciasTable({ asistencias = [] }) {
  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>✅ Historial de Asistencias</h3>
        <span className='text-sm text-gray-500'>
          {asistencias.length} registro{asistencias.length !== 1 ? 's' : ''}
        </span>
      </div>

      {asistencias.length === 0 ? (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>✅</div>
          <p className='text-gray-500'>No hay asistencias registradas</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Fecha</th>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Clase</th>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Estado</th>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Observaciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {asistencias.map(asistencia => (
                <tr key={asistencia.id} className='hover:bg-gray-50'>
                  <td className='py-3 px-4'>
                    {asistencia.fecha ? new Date(asistencia.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                  </td>
                  <td className='py-3 px-4'>
                    <div>
                      <div className='font-medium text-gray-900'>{asistencia.clases.nombre}</div>
                      <div className='text-sm text-gray-500'>{asistencia.clases.nivel_clase}</div>
                    </div>
                  </td>
                  <td className='py-3 px-4'>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        asistencia.presente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {asistencia.presente ? '✅ Presente' : '❌ Ausente'}
                    </span>
                  </td>
                  <td className='py-3 px-4'>
                    <div className='text-sm text-gray-600'>{asistencia.observaciones || 'Sin observaciones'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


