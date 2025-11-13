import { FormularioAlumno, ListaAlumnos } from '@features/alumnos';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Alumnos() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNuevoAlumno = () => {
    setMostrarFormulario(true);
  };

  const handleFormularioCerrado = () => {
    setMostrarFormulario(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleVerFicha = alumnoId => {
    navigate(`/ficha-alumno/${alumnoId}`);
  };

  const handleEditar = alumnoId => {
    navigate(`/editar-alumno/${alumnoId}`);
  };

  const handleEliminar = async alumnoId => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
      try {
        // Eliminar asignaciones primero
        const { error: asignacionesError } = await supabase
          .from('alumnos_clases')
          .delete()
          .eq('alumno_id', alumnoId);

        if (asignacionesError) throw asignacionesError;

        // Eliminar pagos
        const { error: pagosError } = await supabase
          .from('pagos')
          .delete()
          .eq('alumno_id', alumnoId);

        if (pagosError) throw pagosError;

        // Eliminar asistencias
        const { error: asistenciasError } = await supabase
          .from('asistencias')
          .delete()
          .eq('alumno_id', alumnoId);

        if (asistenciasError) throw asistenciasError;

        // Finalmente, eliminar el alumno
        const { error: alumnoError } = await supabase
          .from('alumnos')
          .delete()
          .eq('id', alumnoId);

        if (alumnoError) throw alumnoError;

        alert('Alumno eliminado correctamente');
        setRefreshTrigger(prev => prev + 1); // Recargar la lista
      } catch (err) {
        console.error('Error eliminando alumno:', err);
        alert('Error al eliminar el alumno: ' + err.message);
      }
    }
  };

  return (
    <div className='space-y-8'>
      {/* Header mejorado con Refactoring UI */}
      <div className='bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6'>
          <div className='flex items-center gap-5'>
            <div className='bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl'>
              <svg
                className='w-9 h-9 text-blue-600 dark:text-blue-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            </div>
            <div>
              <h1 className='text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight'>
                Alumnos
              </h1>
              <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium'>
                Gestiona tu base de alumnos
              </p>
            </div>
          </div>
          {!mostrarFormulario && (
            <button
              onClick={handleNuevoAlumno}
              className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-7 rounded-xl transition-all duration-200 flex items-center gap-2.5 shadow-sm hover:shadow-md min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
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
                  strokeWidth='2.5'
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Nuevo Alumno
            </button>
          )}
        </div>
      </div>

      {/*Mostra formulario o listado */}
      {mostrarFormulario ? (
        <FormularioAlumno onCancel={handleFormularioCerrado} />
      ) : (
        <ListaAlumnos
          refreshTrigger={refreshTrigger}
          onVerFicha={handleVerFicha}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
        />
      )}
    </div>
  );
}
