import { Link } from 'react-router-dom';

export default function FichaEjercicioHeader({ ejercicio, id }) {
  return (
    <div className='bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
        <div className='flex items-center space-x-4'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
            <span className='text-green-600 font-bold text-2xl'>
              {ejercicio.nombre?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {ejercicio.nombre}
            </h1>
            <p className='text-gray-600'>
              {ejercicio.categoria} • {ejercicio.tipo}
            </p>
            <div className='flex items-center mt-2 space-x-2'>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  ejercicio.dificultad === 'Fácil'
                    ? 'bg-green-100 text-green-800'
                    : ejercicio.dificultad === 'Intermedio'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {ejercicio.dificultad}
              </span>
              {ejercicio.duracion_minutos && (
                <span className='inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                  {ejercicio.duracion_minutos} min
                </span>
              )}
            </div>
          </div>
        </div>
        <div className='flex space-x-3'>
          <Link
            to={`/ejercicio/${id}/editar`}
            className='btn-secondary px-4 py-2 text-sm font-medium'
          >
            ✏️ Editar
          </Link>
          <Link
            to='/ejercicios'
            className='btn-primary px-4 py-2 text-sm font-medium'
          >
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  );
}
