import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListaAlumnos,
  FormularioAlumno,
  useOtrosAlumnos,
} from '@features/alumnos';
import { LoadingSpinner } from '@shared';

export default function OtrosAlumnos() {
  const navigate = useNavigate();
  const { alumnos, loading, error, cargar, eliminarAlumno } = useOtrosAlumnos();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const handleVerFicha = alumnoId => {
    navigate(`/ficha-alumno/${alumnoId}`);
  };

  const handleEditar = alumnoId => {
    navigate(`/editar-alumno/${alumnoId}`);
  };

  const handleEliminar = async alumnoId => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
      try {
        await eliminarAlumno(alumnoId);
        alert('Alumno eliminado correctamente');
        cargar();
      } catch (err) {
        console.error('Error eliminando alumno:', err);
        alert('Error al eliminar el alumno: ' + err.message);
      }
    }
  };

  const handleNuevoAlumno = () => {
    setMostrarFormulario(true);
  };

  const handleFormularioCerrado = () => {
    setMostrarFormulario(false);
    cargar();
  };

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando alumnos...' />;
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='text-red-500 text-6xl mb-4'>⚠️</div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-dark-text mb-2'>
            Error
          </h2>
          <p className='text-gray-600 dark:text-dark-text2 mb-4'>{error}</p>
          <button
            onClick={cargar}
            className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800/30'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-4xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              🏫 Alumnos Escuela Interna
            </h1>
            <p className='text-gray-600 dark:text-dark-text2 text-lg'>
              Alumnos asignados a clases internas de la escuela
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <div className='text-right'>
              <p className='text-sm text-gray-500 dark:text-dark-text2'>
                Total alumnos
              </p>
              <p className='text-2xl font-semibold text-gray-900 dark:text-dark-text'>
                {alumnos.length}
              </p>
            </div>
            {!mostrarFormulario && (
              <button
                onClick={handleNuevoAlumno}
                className='bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2'
              >
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
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                Nuevo Alumno
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className='bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/30'>
        <div className='flex items-start gap-3'>
          <div className='bg-green-100 dark:bg-green-900/30 p-2 rounded-lg'>
            <svg
              className='w-5 h-5 text-green-600 dark:text-green-400'
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
            <h3 className='font-semibold text-green-900 dark:text-green-100 mb-1'>
              Información sobre otros alumnos
            </h3>
            <p className='text-sm text-green-800 dark:text-green-200'>
              Estos alumnos están asignados a clases internas y no requieren
              pago directo. Sus clases están cubiertas por otros medios de pago.
            </p>
          </div>
        </div>
      </div>

      {/* Mostrar formulario o listado */}
      {mostrarFormulario ? (
        <FormularioAlumno onCancel={handleFormularioCerrado} />
      ) : (
        <ListaAlumnos
          alumnos={alumnos}
          onVerFicha={handleVerFicha}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
          mostrarClasesInternas={true}
        />
      )}
    </div>
  );
}
