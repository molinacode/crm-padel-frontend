export default function FichaAlumnoTabAsistencias({ asistencias }) {
  const asistenciasArray = Array.isArray(asistencias) ? asistencias : [];

  if (asistenciasArray.length === 0) {
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
          {asistenciasArray.map(asistencia => (
            <tr
              key={asistencia?.id || Math.random()}
              className='border-b border-gray-100 dark:border-dark-border'
            >
              <td className='py-3 text-gray-900 dark:text-dark-text'>
                {asistencia?.fecha
                  ? new Date(asistencia.fecha).toLocaleDateString('es-ES')
                  : 'Sin fecha'}
              </td>
              <td className='py-3 text-gray-600 dark:text-dark-text2'>
                {asistencia?.clases?.nombre || 'Clase eliminada'}
              </td>
              <td className='py-3'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      asistencia?.estado === 'asistio'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : asistencia?.estado === 'falta'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {asistencia?.estado === 'asistio'
                      ? '✅ Asistió'
                      : asistencia?.estado === 'falta'
                        ? '❌ Falta'
                        : '⚠️ Justificada'}
                  </span>
                  {asistencia?.esRecuperacion && asistencia?.recuperacion && (
                    <span
                      className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      title={`Recuperación de falta del ${new Date(asistencia.recuperacion.fecha_falta).toLocaleDateString('es-ES')}`}
                    >
                      🔄 Recuperación
                      <span className='text-[10px] opacity-75'>
                        (Falta: {new Date(asistencia.recuperacion.fecha_falta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})
                      </span>
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
