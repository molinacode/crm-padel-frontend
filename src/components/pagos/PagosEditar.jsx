import { useState, useEffect } from 'react';

export default function PagosEditar({
  onClose,
  onSuccess,
  pagoEditar = null,
  alumnos = [],
}) {
  const [formData, setFormData] = useState({
    alumno_id: '',
    cantidad: '',
    tipo_pago: 'mensual',
    mes_cubierto: '',
    fecha_inicio: '',
    fecha_fin: '',
    clases_cubiertas: '',
    metodo: 'transferencia',
    fecha_pago: new Date().toISOString().split('T')[0],
  });

  // Si estamos editando, cargar los datos del pago
  useEffect(() => {
    if (pagoEditar) {
      setFormData({
        alumno_id: pagoEditar.alumno_id || '',
        cantidad: pagoEditar.cantidad || '',
        tipo_pago: pagoEditar.tipo_pago || 'mensual',
        mes_cubierto: pagoEditar.mes_cubierto || '',
        fecha_inicio: pagoEditar.fecha_inicio
          ? pagoEditar.fecha_inicio.split('T')[0]
          : '',
        fecha_fin: pagoEditar.fecha_fin
          ? pagoEditar.fecha_fin.split('T')[0]
          : '',
        clases_cubiertas: pagoEditar.clases_cubiertas || '',
        metodo: pagoEditar.metodo || 'transferencia',
        fecha_pago: pagoEditar.fecha_pago
          ? pagoEditar.fecha_pago.split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    }
  }, [pagoEditar]);

  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.alumno_id) {
      alert('❌ Debe seleccionar un alumno');
      return;
    }

    if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
      alert('❌ La cantidad debe ser mayor a 0');
      return;
    }

    if (
      formData.tipo_pago === 'mensual' &&
      !formData.mes_cubierto.trim()
    ) {
      alert('❌ Debe especificar el mes cubierto');
      return;
    }

    if (formData.tipo_pago === 'clases') {
      if (!formData.fecha_inicio || !formData.fecha_fin) {
        alert('❌ Debe especificar fecha de inicio y fin');
        return;
      }
      if (!formData.clases_cubiertas || parseInt(formData.clases_cubiertas) <= 0) {
        alert('❌ Debe especificar el número de clases cubiertas');
        return;
      }
    }

    setLoading(true);

    try {
      const pagoData = {
        alumno_id: formData.alumno_id,
        cantidad: parseFloat(formData.cantidad),
        tipo_pago: formData.tipo_pago,
        mes_cubierto:
          formData.tipo_pago === 'mensual' ? formData.mes_cubierto : null,
        fecha_inicio:
          formData.tipo_pago === 'clases'
            ? new Date(formData.fecha_inicio).toISOString()
            : null,
        fecha_fin:
          formData.tipo_pago === 'clases'
            ? new Date(formData.fecha_fin).toISOString()
            : null,
        clases_cubiertas:
          formData.tipo_pago === 'clases'
            ? parseInt(formData.clases_cubiertas)
            : null,
        metodo: formData.metodo,
        fecha_pago: new Date(formData.fecha_pago).toISOString(),
      };

      await onSuccess(pagoData);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al actualizar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-xl'>
              <svg
                className='w-6 h-6 text-green-600 dark:text-green-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div>
              <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                Editar Pago
              </h3>
              <p className='text-sm text-gray-500 dark:text-dark-text2'>
                Modifica los datos del pago
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Alumno */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Alumno *
            </label>
            <select
              name='alumno_id'
              value={formData.alumno_id}
              onChange={handleChange}
              className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
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
            {/* Cantidad */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Cantidad (€) *
              </label>
              <input
                type='number'
                name='cantidad'
                step='0.01'
                className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                value={formData.cantidad}
                onChange={handleChange}
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Tipo *
              </label>
              <select
                name='tipo_pago'
                className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                value={formData.tipo_pago}
                onChange={e => {
                  const nuevoTipo = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    tipo_pago: nuevoTipo,
                    // Limpiar campos según el tipo anterior
                    ...(nuevoTipo === 'mensual'
                      ? { fecha_inicio: '', fecha_fin: '', clases_cubiertas: '' }
                      : { mes_cubierto: '' }),
                  }));
                }}
                required
              >
                <option value='mensual'>Mensual</option>
                <option value='clases'>Clases</option>
              </select>
            </div>

            {/* Método */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Método *
              </label>
              <select
                name='metodo'
                className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                value={formData.metodo}
                onChange={handleChange}
                required
              >
                <option value='transferencia'>Transferencia</option>
                <option value='efectivo'>Efectivo</option>
                <option value='bizum'>Bizum</option>
              </select>
            </div>
          </div>

          {/* Fecha de pago */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Fecha de Pago *
            </label>
            <input
              type='date'
              name='fecha_pago'
              className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
              value={formData.fecha_pago}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campos condicionales según el tipo de pago */}
          {formData.tipo_pago === 'mensual' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Mes Cubierto *
              </label>
              <input
                type='text'
                name='mes_cubierto'
                className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                value={formData.mes_cubierto}
                onChange={handleChange}
                placeholder='Ej: Enero 2024'
                required
              />
            </div>
          )}

          {formData.tipo_pago === 'clases' && (
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Fecha Inicio *
                </label>
                <input
                  type='date'
                  name='fecha_inicio'
                  className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Fecha Fin *
                </label>
                <input
                  type='date'
                  name='fecha_fin'
                  className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Clases Cubiertas *
                </label>
                <input
                  type='number'
                  name='clases_cubiertas'
                  className='w-full px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
                  value={formData.clases_cubiertas}
                  onChange={handleChange}
                  placeholder='Número de clases'
                  required
                />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className='flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-dark-border'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200'
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className='w-4 h-4 animate-spin'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  Actualizar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

