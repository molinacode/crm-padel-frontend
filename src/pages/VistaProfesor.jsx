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
  const { eventos, profesores, loading } = useVistaProfesorData();
  const [profesorSeleccionado, setProfesorSeleccionado] = useState('');
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

      {/* Filtro por profesor */}
      <div className='bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-4'>
        <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-1'>
          Profesor
        </label>
        <select
          className='w-full max-w-sm px-3 py-2 border rounded-lg bg-white dark:bg-dark-surface'
          value={profesorSeleccionado}
          onChange={e => setProfesorSeleccionado(e.target.value)}
        >
          <option value=''>Todos</option>
          {(profesores || []).map(p => (
            <option key={p.id} value={p.nombre}>
              {p.nombre}
            </option>
          ))}
        </select>
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
        <ProfesorHistorial
          eventos={eventosFiltrados}
          onSelectEvento={evt => {
            setClaseSeleccionadaParaTematica(evt);
            setMostrarGestionTematicas(true);
          }}
        />
      )}

      {vistaActual === 'notificaciones' && (
        <ProfesorNotificaciones profesor={profesorSeleccionado} />
      )}

      {mostrarGestionTematicas && (
        <GestionTematicasEjercicios
          evento={claseSeleccionadaParaTematica}
          onClose={() => setMostrarGestionTematicas(false)}
        />
      )}
    </div>
  );
}
