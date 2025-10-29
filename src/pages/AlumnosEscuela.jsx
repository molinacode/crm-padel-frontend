import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ListaAlumnos from '../components/ListaAlumnos';
import FormularioAlumno from '../components/FormularioAlumno';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAlumnosEscuela } from '../hooks/useAlumnosEscuela';
import AlumnosEscuelaHeader from '../components/alumnos/AlumnosEscuelaHeader';
import AlumnosEscuelaInfo from '../components/alumnos/AlumnosEscuelaInfo';

export default function AlumnosEscuela() {
  const navigate = useNavigate();
  const { alumnos, loading, error, recargar } = useAlumnosEscuela();
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
        recargar(); // Recargar la lista
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
    recargar(); // Recargar la lista
  };

  if (loading) {
    return (
      <LoadingSpinner size='large' text='Cargando alumnos de escuela...' />
    );
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
            onClick={recargar}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <AlumnosEscuelaHeader
        totalAlumnos={alumnos.length}
        mostrarFormulario={mostrarFormulario}
        onNuevoAlumno={handleNuevoAlumno}
      />

      <AlumnosEscuelaInfo />

      {/* Mostrar formulario o listado */}
      {mostrarFormulario ? (
        <FormularioAlumno onCancel={handleFormularioCerrado} />
      ) : (
        <ListaAlumnos
          alumnos={alumnos}
          onVerFicha={handleVerFicha}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
          mostrarClasesEscuela={true}
        />
      )}
    </div>
  );
}
