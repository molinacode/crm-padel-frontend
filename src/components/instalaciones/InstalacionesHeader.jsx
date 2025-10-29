import { verificarTablaGastos } from '../../utils/verificarTablaGastos';

export default function InstalacionesHeader({ onAgregarGasto }) {
  const handleDiagnostico = async () => {
    console.log('🔍 Ejecutando diagnóstico de gastos...');
    const verificacion = await verificarTablaGastos();
    if (verificacion.success) {
      alert(
        `✅ Diagnóstico exitoso\n\nGastos encontrados: ${verificacion.data?.length || 0}\n\nRevisa la consola para más detalles.`
      );
    } else {
      alert(
        `❌ Problema detectado\n\nError: ${verificacion.error?.message || 'Error desconocido'}\n\nRevisa la consola para más detalles.`
      );
    }
  };

  return (
    <div className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 sm:p-6 border border-green-100 dark:border-green-800/30'>
      <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6'>
        <div className='flex items-center gap-4'>
          <div className='bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl'>
            <svg
              className='w-8 h-8 text-green-600 dark:text-green-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              Gestión de Instalaciones
            </h1>
            <p className='text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base'>
              Control de gastos e ingresos por períodos
            </p>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
          <button
            onClick={handleDiagnostico}
            className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
          >
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
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            Diagnosticar Gastos
          </button>
          <button
            onClick={onAgregarGasto}
            className='bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2'
          >
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
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
            Agregar Gasto Material
          </button>
        </div>
      </div>
    </div>
  );
}
