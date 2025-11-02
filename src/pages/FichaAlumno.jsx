import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ModalConfirmacion, LoadingSpinner } from '@shared';
import {
  EditarAlumno,
  useSincronizacionAsignaciones,
  useFichaAlumnoData,
} from '@features/alumnos';
import {
  FichaAlumnoHeader,
  FichaAlumnoTabs,
  FichaAlumnoTabClases,
  FichaAlumnoTabPagos,
  FichaAlumnoTabAsistencias,
  FichaAlumnoTabRecuperaciones,
} from '@features/alumnos';

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
    error,
    recargarAlumno,
    recargarRecuperaciones,
    setClases,
    recargar,
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

  // Mostrar spinner mientras se carga o si no hay datos aún
  if (loading || (!alumno && id)) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner size='large' text='Cargando datos del alumno...' />
      </div>
    );
  }

  // Si terminó de cargar y no hay alumno, mostrar mensaje de error
  if (!loading && !alumno) {
    return (
      <div className='max-w-6xl mx-auto p-6'>
        <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border text-center'>
          <div className='text-6xl mb-4'>
            {error && error.includes('conexión') ? '📡' : '❌'}
          </div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-dark-text mb-2'>
            {error && error.includes('conexión')
              ? 'Error de conexión'
              : 'Alumno no encontrado'}
          </h2>
          <p className='text-gray-600 dark:text-dark-text2 mb-6'>
            {error ||
              'No se pudo cargar la información del alumno. Por favor, intenta de nuevo.'}
          </p>
          <div className='flex gap-4 justify-center'>
            <button
              onClick={() => recargar()}
              className='px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200'
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => navigate('/alumnos')}
              className='px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200'
            >
              Volver a Alumnos
            </button>
          </div>
        </div>
      </div>
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
              clases: Array.isArray(clases) ? clases.length : 0,
              pagos: Array.isArray(pagos) ? pagos.length : 0,
              asistencias: Array.isArray(asistencias) ? asistencias.length : 0,
              recuperaciones: Array.isArray(recuperaciones)
                ? recuperaciones.length
                : 0,
            }}
          />

          <div className='p-6'>
            {tabActiva === 'clases' && (
              <FichaAlumnoTabClases
                clases={Array.isArray(clases) ? clases : []}
                alumnoId={id}
                onDesasignar={desasignarClase}
              />
            )}

            {tabActiva === 'pagos' && (
              <FichaAlumnoTabPagos pagos={Array.isArray(pagos) ? pagos : []} />
            )}

            {tabActiva === 'asistencias' && (
              <FichaAlumnoTabAsistencias
                asistencias={Array.isArray(asistencias) ? asistencias : []}
              />
            )}

            {tabActiva === 'recuperaciones' && (
              <FichaAlumnoTabRecuperaciones
                recuperaciones={
                  Array.isArray(recuperaciones) ? recuperaciones : []
                }
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
