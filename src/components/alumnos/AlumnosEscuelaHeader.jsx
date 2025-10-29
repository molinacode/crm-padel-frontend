export default function AlumnosEscuelaHeader({
  totalAlumnos,
  mostrarFormulario,
  onNuevoAlumno,
}) {
  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-dark-text mb-2'>
            🏫 Alumnos Escuela
          </h1>
          <p className='text-gray-600 dark:text-dark-text2 text-lg'>
            Alumnos asignados a clases de escuela que requieren pago directo
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='text-right'>
            <p className='text-sm text-gray-500 dark:text-dark-text2'>
              Total alumnos
            </p>
            <p className='text-2xl font-semibold text-gray-900 dark:text-dark-text'>
              {totalAlumnos}
            </p>
          </div>
          {!mostrarFormulario && (
            <button
              onClick={onNuevoAlumno}
              className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Nuevo Alumno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
