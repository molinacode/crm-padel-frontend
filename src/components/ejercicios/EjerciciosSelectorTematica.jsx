export default function EjerciciosSelectorTematica({
  mostrar,
  onClose,
  clasesDisponibles,
  profesoresDisponibles,
  claseSeleccionada,
  setClaseSeleccionada,
  profesorSeleccionado,
  setProfesorSeleccionado,
  onContinuar,
}) {
  if (!mostrar) return null;

  return (
    <div className='fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800'>
        <div className='p-6'>
          <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-1'>
            Asignar temática
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-300 mb-6'>
            Selecciona la clase y el profesor para continuar.
          </p>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-2.5 tracking-tight'>
                Clase
              </label>
              <select
                value={claseSeleccionada}
                onChange={e => setClaseSeleccionada(e.target.value)}
                className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-dark-surface2 text-gray-900 dark:text-white font-medium'
              >
                <option value=''>Selecciona una clase</option>
                {clasesDisponibles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} • {c.nivel_clase} • {c.dia_semana}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-900 dark:text-white mb-2.5 tracking-tight'>
                Profesor
              </label>
              <select
                value={profesorSeleccionado}
                onChange={e => setProfesorSeleccionado(e.target.value)}
                className='w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-white dark:bg-dark-surface2 text-gray-900 dark:text-white font-medium'
              >
                <option value=''>Selecciona un profesor</option>
                {profesoresDisponibles.map(p => (
                  <option
                    key={p.id}
                    value={p.nombre + ' ' + (p.apellidos || '')}
                  >
                    {p.nombre} {p.apellidos || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='flex justify-end gap-3 mt-6'>
            <button
              onClick={onClose}
              className='bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 min-h-[44px]'
            >
              Cancelar
            </button>
            <button
              onClick={onContinuar}
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]'
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
