import { useState } from 'react';
import {
  diagnosticarBaseDeDatos,
  probarConsultasPaginas,
} from '../utils/diagnostico';

export default function Diagnostico() {
  const [ejecutando, setEjecutando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const ejecutarDiagnostico = async () => {
    setEjecutando(true);
    setResultados(null);

    try {
      console.log('🚀 Iniciando diagnóstico completo...');

      // Ejecutar diagnóstico de base de datos
      const diagnostico = await diagnosticarBaseDeDatos();

      // Ejecutar pruebas de consultas
      await probarConsultasPaginas();

      setResultados(diagnostico);
      console.log('✅ Diagnóstico completado');
    } catch (error) {
      console.error('❌ Error ejecutando diagnóstico:', error);
      setResultados({
        errores: [`Error ejecutando diagnóstico: ${error.message}`],
      });
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <div className='p-6 bg-white dark:bg-dark-surface rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-dark-text'>
        🔍 Diagnóstico de la Aplicación
      </h2>

      <p className='text-gray-600 dark:text-dark-text2 mb-6'>
        Este diagnóstico verificará el estado de la base de datos y las
        consultas principales. Abre la consola del navegador (F12) para ver los
        resultados detallados.
      </p>

      <button
        onClick={ejecutarDiagnostico}
        disabled={ejecutando}
        className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2'
      >
        {ejecutando ? (
          <>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
            Ejecutando diagnóstico...
          </>
        ) : (
          <>
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
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            Ejecutar Diagnóstico
          </>
        )}
      </button>

      {resultados && (
        <div className='mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <h3 className='text-lg font-semibold mb-3 text-gray-900 dark:text-dark-text'>
            📊 Resultados del Diagnóstico
          </h3>

          {resultados.errores && resultados.errores.length > 0 && (
            <div className='mb-4'>
              <h4 className='font-semibold text-red-600 dark:text-red-400 mb-2'>
                ❌ Errores Encontrados ({resultados.errores.length})
              </h4>
              <ul className='list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400'>
                {resultados.errores.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {resultados.advertencias && resultados.advertencias.length > 0 && (
            <div className='mb-4'>
              <h4 className='font-semibold text-yellow-600 dark:text-yellow-400 mb-2'>
                ⚠️ Advertencias ({resultados.advertencias.length})
              </h4>
              <ul className='list-disc list-inside space-y-1 text-sm text-yellow-600 dark:text-yellow-400'>
                {resultados.advertencias.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {resultados.tablas && (
            <div className='mb-4'>
              <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-2'>
                📋 Estado de las Tablas
              </h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                {Object.entries(resultados.tablas).map(([tabla, info]) => (
                  <div key={tabla} className='flex justify-between'>
                    <span className='text-gray-700 dark:text-dark-text2'>
                      {tabla}:
                    </span>
                    <span
                      className={
                        info.existe ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {info.existe ? '✅' : '❌'} ({info.registros})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultados.campos && (
            <div>
              <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-2'>
                🔍 Estado de los Campos
              </h4>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                {Object.entries(resultados.campos).map(([campo, info]) => (
                  <div key={campo} className='flex justify-between'>
                    <span className='text-gray-700 dark:text-dark-text2'>
                      {campo}:
                    </span>
                    <span
                      className={
                        info.existe ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {info.existe ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className='mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
        <h4 className='font-semibold text-blue-800 dark:text-blue-200 mb-2'>
          💡 Instrucciones
        </h4>
        <ol className='list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300'>
          <li>Abre la consola del navegador (F12 → Console)</li>
          <li>Haz clic en "Ejecutar Diagnóstico"</li>
          <li>Revisa los mensajes en la consola</li>
          <li>Comparte cualquier error que aparezca</li>
        </ol>
      </div>
    </div>
  );
}
