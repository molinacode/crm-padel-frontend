export default function ClasesTable({
  clases,
  onAsignar,
  onHuecos,
  onRecuperaciones,
}) {
  return (
    <div className='overflow-auto rounded-2xl border border-gray-100 dark:border-dark-border'>
      <table className='min-w-full divide-y divide-gray-100 dark:divide-gray-800'>
        <thead className='bg-gray-50 dark:bg-gray-900'>
          <tr>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Nombre
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Tipo
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Nivel
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Día
            </th>
            <th className='px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400'>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className='bg-white dark:bg-dark-surface divide-y divide-gray-100 dark:divide-gray-800'>
          {(clases || []).map(c => (
            <tr key={c.id}>
              <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200'>
                {c.nombre}
              </td>
              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                {c.tipo_clase}
              </td>
              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                {c.nivel_clase || '-'}
              </td>
              <td className='px-4 py-3 text-sm text-gray-700 dark:text-gray-300'>
                {c.dia_semana || '-'}
              </td>
              <td className='px-4 py-3 text-sm text-right'>
                <div className='inline-flex gap-2'>
                  <button
                    className='px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs'
                    onClick={() => onAsignar?.(c)}
                  >
                    Asignar
                  </button>
                  <button
                    className='px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs'
                    onClick={() => onHuecos?.(c)}
                  >
                    Huecos
                  </button>
                  <button
                    className='px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs'
                    onClick={() => onRecuperaciones?.(c)}
                  >
                    Recuperaciones
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
