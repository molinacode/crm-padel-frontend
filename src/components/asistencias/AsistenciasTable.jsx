export default function AsistenciasTable({
  alumnos,
  asistenciasClase,
  recuperacionesMarcadas,
  claseId,
  onCambioEstado,
}) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm table-hover-custom'>
        <thead className='bg-gray-50 dark:bg-dark-surface2'>
          <tr>
            <th className='text-left py-3 px-2 font-medium text-gray-700 dark:text-dark-text'>
              Alumno
            </th>
            <th className='text-left py-3 px-2 font-medium text-gray-700 dark:text-dark-text'>
              Estado
            </th>
            <th className='text-left py-3 px-2 font-medium text-gray-700 dark:text-dark-text'>
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map(alumno => (
            <tr
              key={alumno.id}
              className='border-b border-gray-100 dark:border-dark-border'
            >
              <td className='py-3 px-2'>
                <div className='flex items-center gap-2'>
                  <div className='font-medium text-gray-800'>{alumno.nombre}</div>
                  {alumno.tipo === 'temporal' && (
                    <span
                      className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      title='Asignación temporal (ocupó hueco o recuperación)'
                    >
                      ⏰ Temporal
                    </span>
                  )}
                </div>
              </td>
              <td className='py-3 px-2'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      asistenciasClase[alumno.id] === 'asistio'
                        ? 'bg-green-100 text-green-800'
                        : asistenciasClase[alumno.id] === 'falta'
                          ? 'bg-red-100 text-red-800'
                          : asistenciasClase[alumno.id] === 'justificada'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {asistenciasClase[alumno.id] === 'asistio'
                      ? '✅ Asistió'
                      : asistenciasClase[alumno.id] === 'falta'
                        ? '❌ Falta'
                        : asistenciasClase[alumno.id] === 'justificada'
                          ? '⚠️ Justificada'
                          : '⏳ Pendiente'}
                  </span>
                  {asistenciasClase[alumno.id] === 'asistio' &&
                    recuperacionesMarcadas[claseId]?.[alumno.id] && (
                      <div className='flex items-center gap-2'>
                        <span
                          className='inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
                          title={`Falta: ${new Date(recuperacionesMarcadas[claseId][alumno.id]).toLocaleDateString('es-ES')}`}
                        >
                          🔄 Recuperación
                        </span>
                        <span className='text-[11px] text-purple-700 dark:text-purple-300'>
                          Falta:{' '}
                          {new Date(
                            recuperacionesMarcadas[claseId][alumno.id]
                          ).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                </div>
              </td>
              <td className='py-3 px-2'>
                <select
                  value={asistenciasClase[alumno.id] || ''}
                  onChange={e => onCambioEstado(claseId, alumno.id, e.target.value)}
                  className='border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Seleccionar...</option>
                  <option value='asistio'>✅ Asistió</option>
                  <option value='falta'>❌ Falta</option>
                  <option value='justificada'>⚠️ Justificada</option>
                  <option value='recuperacion'>🔄 Recuperación</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

