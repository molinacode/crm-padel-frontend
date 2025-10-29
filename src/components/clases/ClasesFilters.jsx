export default function ClasesFilters({ values, onChange, onClear }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
      <input
        className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
        placeholder='Buscar por nombre'
        value={values.q || ''}
        onChange={e => onChange({ ...values, q: e.target.value })}
      />
      <select
        className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
        value={values.tipo || ''}
        onChange={e => onChange({ ...values, tipo: e.target.value })}
      >
        <option value=''>Todos los tipos</option>
        <option value='grupal'>Grupal</option>
        <option value='particular'>Particular</option>
        <option value='interna'>Interna</option>
        <option value='escuela'>Escuela</option>
      </select>
      <input
        className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
        placeholder='Nivel'
        value={values.nivel || ''}
        onChange={e => onChange({ ...values, nivel: e.target.value })}
      />
      <select
        className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
        value={values.dia || ''}
        onChange={e => onChange({ ...values, dia: e.target.value })}
      >
        <option value=''>Todos los días</option>
        <option value='Lunes'>Lunes</option>
        <option value='Martes'>Martes</option>
        <option value='Miércoles'>Miércoles</option>
        <option value='Jueves'>Jueves</option>
        <option value='Viernes'>Viernes</option>
        <option value='Sábado'>Sábado</option>
        <option value='Domingo'>Domingo</option>
      </select>
      <div className='col-span-full flex justify-end'>
        <button
          className='px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm'
          onClick={onClear}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
