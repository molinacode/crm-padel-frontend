import { useState, useEffect } from 'react';

export default function FormularioGastoMaterial({
  onClose,
  onSuccess,
  gastoEditar = null,
}) {
  const [formData, setFormData] = useState({
    concepto: '',
    descripcion: '',
    cantidad: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    categoria: 'material_deportivo',
    proveedor: '',
    observaciones: '',
  });

  // Si estamos editando, cargar los datos del gasto
  useEffect(() => {
    if (gastoEditar) {
      setFormData({
        concepto: gastoEditar.concepto || '',
        descripcion: gastoEditar.descripcion || '',
        cantidad: gastoEditar.cantidad || '',
        fecha_gasto:
          gastoEditar.fecha_gasto || new Date().toISOString().split('T')[0],
        categoria: gastoEditar.categoria || 'material_deportivo',
        proveedor: gastoEditar.proveedor || '',
        observaciones: gastoEditar.observaciones || '',
      });
    }
  }, [gastoEditar]);

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

    if (!formData.concepto.trim()) {
      alert('❌ El concepto es obligatorio');
      return;
    }

    if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
      alert('❌ La cantidad debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const gastoData = {
        ...formData,
        cantidad: parseFloat(formData.cantidad),
      };

      await onSuccess(gastoData);
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-dark-surface p-6 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl'>
              <svg
                className='w-6 h-6 text-orange-600 dark:text-orange-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                />
              </svg>
            </div>
            <div>
              <h3 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
                {gastoEditar
                  ? 'Editar Gasto de Material'
                  : 'Nuevo Gasto de Material'}
              </h3>
              <p className='text-sm text-gray-500 dark:text-dark-text2'>
                {gastoEditar
                  ? 'Modifica los datos del gasto'
                  : 'Registra un gasto de material deportivo'}
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

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Concepto */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Concepto *
              </label>
              <input
                type='text'
                name='concepto'
                value={formData.concepto}
                onChange={handleChange}
                placeholder='Ej: Pelotas de pádel, Red nueva...'
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text'
                required
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Cantidad (€) *
              </label>
              <input
                type='number'
                name='cantidad'
                value={formData.cantidad}
                onChange={handleChange}
                placeholder='0.00'
                step='0.01'
                min='0.01'
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text'
                required
              />
            </div>

            {/* Fecha */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Fecha del gasto *
              </label>
              <input
                type='date'
                name='fecha_gasto'
                value={formData.fecha_gasto}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text'
                required
              />
            </div>

            {/* Categoría */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Categoría *
              </label>
              <select
                name='categoria'
                value={formData.categoria}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text'
                required
              >
                <option value='material_deportivo'>
                  🏓 Material Deportivo
                </option>
                <option value='mantenimiento'>🔧 Mantenimiento</option>
                <option value='limpieza'>🧽 Limpieza</option>
                <option value='seguridad'>🛡️ Seguridad</option>
                <option value='otros'>📦 Otros</option>
              </select>
            </div>

            {/* Proveedor */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Proveedor
              </label>
              <input
                type='text'
                name='proveedor'
                value={formData.proveedor}
                onChange={handleChange}
                placeholder='Ej: Deportes Pádel, Amazon...'
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text'
              />
            </div>

            {/* Descripción */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Descripción
              </label>
              <textarea
                name='descripcion'
                value={formData.descripcion}
                onChange={handleChange}
                placeholder='Descripción detallada del gasto...'
                rows='3'
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text resize-none'
              />
            </div>

            {/* Observaciones */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
                Observaciones
              </label>
              <textarea
                name='observaciones'
                value={formData.observaciones}
                onChange={handleChange}
                placeholder='Observaciones adicionales...'
                rows='2'
                className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-dark-surface2 text-gray-900 dark:text-dark-text resize-none'
              />
            </div>
          </div>

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
              className='flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2'
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
                  Guardando...
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
                  {gastoEditar ? 'Actualizar Gasto' : 'Registrar Gasto'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
