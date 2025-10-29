export default function AlumnosEscuelaInfo() {
  return (
    <div className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30'>
      <div className='flex items-start gap-3'>
        <div className='bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg'>
          <svg
            className='w-5 h-5 text-blue-600 dark:text-blue-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <div>
          <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-1'>
            Información sobre alumnos de escuela
          </h3>
          <p className='text-sm text-blue-800 dark:text-blue-200'>
            Estos alumnos están asignados a clases de escuela y requieren pago
            directo. Puedes gestionar sus pagos desde la sección de Pagos.
          </p>
        </div>
      </div>
    </div>
  );
}
