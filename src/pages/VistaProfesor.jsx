import { useState } from 'react';
import { LoadingSpinner } from '@shared';
import { GestionTematicasEjercicios } from '@features/ejercicios';
import {
  useEventosSemanaProfesor,
  useVistaProfesorData,
} from '@features/profesor';
import {
  ProfesorHeader,
  ProfesorTabs,
  ProfesorHorarios,
  ProfesorHistorial,
  ProfesorNotificaciones,
} from '@features/profesor';

export default function VistaProfesor() {
  const { eventos, loading } = useVistaProfesorData();
  const [profesorSeleccionado] = useState('');
  const [mostrarGestionTematicas, setMostrarGestionTematicas] = useState(false);
  const [claseSeleccionadaParaTematica, setClaseSeleccionadaParaTematica] =
    useState(null);
  const [vistaActual, setVistaActual] = useState('horarios');
  const [filtroSemana] = useState('actual');

  const { eventosFiltrados, eventosPorDia, infoSemana } =
    useEventosSemanaProfesor(eventos, filtroSemana, profesorSeleccionado);

  if (loading)
    return (
      <LoadingSpinner size='large' text='Cargando vista del profesor...' />
    );

  return (
    <div className='space-y-8'>
      <ProfesorHeader />
      <div className='flex justify-between items-center'>
        <ProfesorTabs
          vistaActual={vistaActual}
          setVistaActual={setVistaActual}
        />
      </div>

      {vistaActual === 'horarios' && (
        <ProfesorHorarios
          eventosPorDia={eventosPorDia}
          infoSemana={infoSemana}
          onAbrirTematica={evt => {
            setClaseSeleccionadaParaTematica(evt);
            setMostrarGestionTematicas(true);
          }}
        />
      )}

      {vistaActual === 'historial' && (
        <ProfesorHistorial eventos={eventosFiltrados} />
      )}

      {vistaActual === 'notificaciones' && <ProfesorNotificaciones />}

      {mostrarGestionTematicas && (
        <GestionTematicasEjercicios
          evento={claseSeleccionadaParaTematica}
          onClose={() => setMostrarGestionTematicas(false)}
        />
      )}
    </div>
  );
}
