import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ModalConfirmacion from '../components/ModalConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import EditarAlumno from '../components/EditarAlumno';
import { useSincronizacionAsignaciones } from '../hooks/useSincronizacionAsignaciones';
import { useFichaAlumnoData } from '../hooks/useFichaAlumnoData';
import FichaAlumnoHeader from '../components/ficha/FichaAlumnoHeader';
import FichaAlumnoTabs from '../components/ficha/FichaAlumnoTabs';
import FichaAlumnoTabClases from '../components/ficha/FichaAlumnoTabClases';
import FichaAlumnoTabPagos from '../components/ficha/FichaAlumnoTabPagos';
import FichaAlumnoTabAsistencias from '../components/ficha/FichaAlumnoTabAsistencias';
import FichaAlumnoTabRecuperaciones from '../components/ficha/FichaAlumnoTabRecuperaciones';

export default function FichaAlumno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState('clases');

  const {
    alumno,
    clases,
    pagos,
    asistencias,
    recuperaciones,
    loading,
    recargarAlumno,
    recargarRecuperaciones,
    setClases,
  } = useFichaAlumnoData(id);

  const { marcarRecuperacionCompletada, cancelarRecuperacion } =
    useSincronizacionAsignaciones();

  const handleAlumnoActualizado = () => {
    setEditarModalOpen(false);
    recargarAlumno();
  };

  // Función para desasignar clase
  const desasignarClase = async claseId => {
    if (
      !confirm(
        '¿Estás seguro de que quieres desasignar este alumno de la clase?'
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('alumnos_clases')
        .delete()
        .eq('alumno_id', id)
        .eq('clase_id', claseId);

      if (error) throw error;

      // Actualizar la lista de clases localmente
      setClases(prevClases => prevClases.filter(clase => clase.id !== claseId));
      alert('✅ Alumno desasignado de la clase correctamente');
    } catch (err) {
      console.error('Error desasignando clase:', err);
      alert('❌ Error al desasignar la clase: ' + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando datos del alumno...' />;
  }

  if (!alumno) {
    return (
      <p className='text-gray-700 dark:text-dark-text'>Alumno no encontrado</p>
    );
  }

  const handleCompletarRecuperacion = async recuperacion => {
    const fechaRecuperacion = prompt(
      'Fecha de recuperación (YYYY-MM-DD):',
      new Date().toISOString().split('T')[0]
    );
    if (fechaRecuperacion) {
      const observaciones = prompt(
        'Observaciones (opcional):',
        'Clase recuperada'
      );
      const resultado = await marcarRecuperacionCompletada(
        recuperacion.id,
        fechaRecuperacion,
        observaciones
      );
      if (resultado.success) {
        alert('✅ Recuperación marcada como completada');
        recargarRecuperaciones();
      } else {
        alert('❌ Error al marcar la recuperación');
      }
    }
  };

  const handleAsignarRecuperacion = recuperacion => {
    const params = new URLSearchParams({
      tab: 'proximas',
      view: 'table',
      alumno: String(id),
      preferNivel: recuperacion.clases?.nivel_clase || '',
    });
    navigate(`/clases?${params.toString()}`);
  };

  const handleCancelarRecuperacion = async recuperacion => {
    const motivo = prompt('Motivo de cancelación:', 'Recuperación cancelada');
    if (motivo !== null) {
      const resultado = await cancelarRecuperacion(recuperacion.id, motivo);
      if (resultado.success) {
        alert('✅ Recuperación cancelada');
        recargarRecuperaciones();
      } else {
        alert('❌ Error al cancelar la recuperación');
      }
    }
  };

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <FichaAlumnoHeader
          alumno={alumno}
          onEditar={() => setEditarModalOpen(true)}
          onSeguimiento={() => navigate(`/seguimiento-alumno/${id}`)}
          onEliminar={() => setModalOpen(true)}
        />

        <hr className='my-8 border-gray-200 dark:border-dark-border' />

        <div className='bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
          <FichaAlumnoTabs
            tabActiva={tabActiva}
            setTabActiva={setTabActiva}
            counts={{
              clases: clases.length,
              pagos: pagos.length,
              asistencias: asistencias.length,
              recuperaciones: recuperaciones.length,
            }}
          />

          <div className='p-6'>
            {tabActiva === 'clases' && (
              <FichaAlumnoTabClases
                clases={clases}
                alumnoId={id}
                onDesasignar={desasignarClase}
              />
            )}

            {tabActiva === 'pagos' && <FichaAlumnoTabPagos pagos={pagos} />}

            {tabActiva === 'asistencias' && (
              <FichaAlumnoTabAsistencias asistencias={asistencias} />
            )}

            {tabActiva === 'recuperaciones' && (
              <FichaAlumnoTabRecuperaciones
                recuperaciones={recuperaciones}
                alumnoId={id}
                onCompletar={handleCompletarRecuperacion}
                onAsignar={handleAsignarRecuperacion}
                onCancelar={handleCancelarRecuperacion}
              />
            )}
          </div>
        </div>
      </div>

      <ModalConfirmacion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async () => {
          try {
            await supabase.from('pagos').delete().eq('alumno_id', id);
            await supabase.from('asistencias').delete().eq('alumno_id', id);
            await supabase.from('alumnos_clases').delete().eq('alumno_id', id);
            await supabase.from('alumnos').delete().eq('id', id);

            alert('✅ Alumno eliminado correctamente');
            navigate('/alumnos');
          } catch (error) {
            console.error('Error durante la eliminación:', error);
            alert('❌ Error al eliminar: ' + error.message);
          }
        }}
        titulo='¿Eliminar alumno?'
        mensaje={`¿Estás seguro de que deseas eliminar a ${alumno.nombre}? Esta acción no se puede deshacer.`}
      />

      {editarModalOpen && (
        <EditarAlumno
          alumno={alumno}
          onCancel={() => setEditarModalOpen(false)}
          onSuccess={handleAlumnoActualizado}
        />
      )}
    </div>
  );
}
