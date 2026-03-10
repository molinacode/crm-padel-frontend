import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LoadingSpinner } from '@shared';
import {
  useFichaProfesorData,
  FichaProfesorHeader,
  FichaProfesorTabs,
  FichaProfesorTabInfo,
  FichaProfesorTabClases,
  FichaProfesorTabHorarios,
} from '@features/profesor';

export default function FichaProfesor() {
  const { id } = useParams();
  const { profesor, clases, proximasClases, loading } =
    useFichaProfesorData(id);
  const [activeTab, setActiveTab] = useState('info');

  const calcularEdad = fechaNacimiento => {
    if (!fechaNacimiento) return 'No especificada';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };


  if (loading) {
    return (
      <LoadingSpinner size='large' text='Cargando datos del profesor...' />
    );
  }

  if (!profesor) {
    return (
      <div className='text-center py-12'>
        <div className='text-6xl mb-4'>❌</div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
          Profesor no encontrado
        </h3>
        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
          El profesor que buscas no existe o ha sido eliminado
        </p>
        <Link to='/profesores' className='btn-primary px-6 py-3'>
          Volver a Profesores
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <FichaProfesorHeader profesor={profesor} id={id} />

      <FichaProfesorTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clasesCount={clases.length}
        proximasCount={proximasClases.length}
      />

      <div className='p-6 bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border'>
        {/* Tab Información */}
        {activeTab === 'info' && (
          <FichaProfesorTabInfo profesor={profesor} calcularEdad={calcularEdad} />
        )}

        {/* Tab Clases */}
        {activeTab === 'clases' && <FichaProfesorTabClases clases={clases} />}

        {/* Tab Horarios */}
        {activeTab === 'horarios' && (
          <FichaProfesorTabHorarios proximasClases={proximasClases} />
        )}
      </div>
    </div>
  );
}
