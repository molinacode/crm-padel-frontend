import { Link } from 'react-router-dom';

export default function FichaProfesorHeader({ profesor, id }) {
  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
        <div className='flex items-center space-x-4'>
          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
            <span className='text-blue-600 font-bold text-2xl'>
              {profesor.nombre?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {profesor.nombre} {profesor.apellidos}
            </h1>
            <p className='text-gray-600'>
              {profesor.especialidad} • {profesor.nivel_experiencia}
            </p>
            <div className='flex items-center mt-2'>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  profesor.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {profesor.activo ? '✅ Activo' : '❌ Inactivo'}
              </span>
            </div>
          </div>
        </div>
        <div className='flex space-x-3'>
          <Link
            to={`/profesor/${id}/editar`}
            className='btn-secondary px-4 py-2 text-sm font-medium'
          >
            ✏️ Editar
          </Link>
          <Link
            to='/profesores'
            className='btn-primary px-4 py-2 text-sm font-medium'
          >
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
