import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LoadingSpinner } from '@shared';
import {
  useFichaEjercicioData,
  FichaEjercicioHeader,
  FichaEjercicioTabs,
  FichaEjercicioTabInfo,
  FichaEjercicioTabInstrucciones,
  FichaEjercicioTabClases,
} from '@features/ejercicios';

export default function FichaEjercicio() {
  const { id } = useParams();
  const { ejercicio, clasesAsignadas, loading } = useFichaEjercicioData(id);
  const [activeTab, setActiveTab] = useState('info');

  if (loading) {
    return (
      <LoadingSpinner size='large' text='Cargando datos del ejercicio...' />
    );
  }

  if (!ejercicio) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>❌</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          Ejercicio no encontrado
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
          El ejercicio que buscas no existe o ha sido eliminado
        </p>
        <Link to='/ejercicios' className='btn-primary px-6 py-3'>
          Volver a Ejercicios
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <FichaEjercicioHeader ejercicio={ejercicio} id={id} />

      <FichaEjercicioTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clasesCount={clasesAsignadas.length}
      />

      <div className='p-6 bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
        {/* Tab Información */}
        {activeTab === 'info' && (
          <FichaEjercicioTabInfo ejercicio={ejercicio} />
        )}

        {/* Tab Instrucciones */}
        {activeTab === 'instrucciones' && (
          <FichaEjercicioTabInstrucciones ejercicio={ejercicio} />
        )}

        {/* Tab Clases */}
        {activeTab === 'clases' && (
          <FichaEjercicioTabClases clasesAsignadas={clasesAsignadas} />
        )}
      </div>
    </div>
  );
}
