export default function FichaAlumnoTabAsistencias({ asistencias }) {
  if (asistencias.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>📅</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          No hay asistencias registradas
        </h3>
        <p className='text-gray-500 dark:text-dark-text2'>
          Este alumno no tiene asistencias registradas
        </p>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm table-hover-custom'>
        <thead className='bg-gray-50 dark:bg-dark-surface2'>
          <tr>
            <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
              Fecha
            </th>
            <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
              Clase
            </th>
            <th className='text-left py-3 font-medium text-gray-700 dark:text-dark-text'>
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {asistencias.map(asistencia => (
            <tr
              key={asistencia.id}
              className='border-b border-gray-100 dark:border-dark-border'
            >
              <td className='py-3 text-gray-900 dark:text-dark-text'>
                {asistencia.fecha
                  ? new Date(asistencia.fecha).toLocaleDateString('es-ES')
                  : 'Sin fecha'}
              </td>
              <td className='py-3 text-gray-600 dark:text-dark-text2'>
                {asistencia.clases?.nombre || 'Clase eliminada'}
              </td>
              <td className='py-3'>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    asistencia.estado === 'asistio'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : asistencia.estado === 'falta'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}
                >
                  {asistencia.estado === 'asistio'
                    ? '✅ Asistió'
                    : asistencia.estado === 'falta'
                      ? '❌ Falta'
                      : '⚠️ Justificada'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
