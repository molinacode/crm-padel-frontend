import { Link } from 'react-router-dom';

export default function ProfesoresTable({
  profesores,
  onEliminar,
  searchTerm,
}) {
  if (profesores.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-4'>👨‍🏫</div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {searchTerm
              ? 'No se encontraron profesores'
              : 'No hay profesores registrados'}
          </h3>
          <p className='text-gray-500 mb-6'>
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza agregando tu primer profesor'}
          </p>
          {!searchTerm && (
            <Link to='/profesores/nuevo' className='btn-primary px-6 py-3'>
              ➕ Agregar Primer Profesor
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
      <div className='overflow-x-auto'>
        <table className='w-full table-hover-custom'>
          <thead className='bg-gray-50 dark:bg-dark-surface2'>
            <tr>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Profesor
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Contacto
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Especialidad
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Estado
              </th>
              <th className='text-left py-4 px-6 font-semibold text-gray-700 dark:text-dark-text'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-dark-border'>
            {profesores.map(profesor => (
              <tr key={profesor.id} className='transition-colors'>
                <td className='py-4 px-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 font-semibold text-lg'>
                        {profesor.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>
                        {profesor.nombre}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {profesor.apellidos}
                      </div>
                    </div>
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <div className='space-y-1'>
                    <div className='text-sm text-gray-900'>
                      {profesor.email}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {profesor.telefono}
                    </div>
                  </div>
                </td>
                <td className='py-4 px-6'>
                  <span className='inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
                    {profesor.especialidad || 'Pádel'}
                  </span>
                </td>
                <td className='py-4 px-6'>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      profesor.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {profesor.activo ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </td>
                <td className='py-4 px-6'>
                  <div className='flex space-x-2'>
                    <Link
                      to={`/profesor/${profesor.id}`}
                      className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                    >
                      Ver
                    </Link>
                    <Link
                      to={`/profesor/${profesor.id}/editar`}
                      className='text-yellow-600 hover:text-yellow-800 text-sm font-medium'
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => onEliminar(profesor.id)}
                      className='text-red-600 hover:text-red-800 text-sm font-medium'
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
