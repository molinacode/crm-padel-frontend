export default function PagosNuevo({
  alumnos,
  nuevoPago,
  setNuevoPago,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Alumno
        </label>
        <select
          className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
          value={nuevoPago.alumno_id}
          onChange={e =>
            setNuevoPago(p => ({ ...p, alumno_id: e.target.value }))
          }
          required
        >
          <option value=''>Seleccione</option>
          {(alumnos || []).map(a => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Cantidad
          </label>
          <input
            type='number'
            step='0.01'
            className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
            value={nuevoPago.cantidad}
            onChange={e =>
              setNuevoPago(p => ({ ...p, cantidad: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Tipo
          </label>
          <select
            className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
            value={nuevoPago.tipo_pago}
            onChange={e =>
              setNuevoPago(p => ({ ...p, tipo_pago: e.target.value }))
            }
          >
            <option value='mensual'>Mensual</option>
            <option value='clases'>Clases</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
            Método
          </label>
          <select
            className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
            value={nuevoPago.metodo}
            onChange={e =>
              setNuevoPago(p => ({ ...p, metodo: e.target.value }))
            }
          >
            <option value='transferencia'>Transferencia</option>
            <option value='efectivo'>Efectivo</option>
            <option value='bizum'>Bizum</option>
          </select>
        </div>
      </div>
      <button
        type='submit'
        className='px-4 py-2 rounded-lg bg-green-600 text-white'
      >
        Guardar
      </button>
    </form>
  );
}
