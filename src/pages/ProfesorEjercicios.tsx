import { useState } from 'react';
import { LoadingSpinner } from '../components/shared';
import PageHeader from '../components/shared/PageHeader';
import { GestionTematicasEjercicios } from '@features/ejercicios';
import ProfesorHorarios from '../components/profesor/ProfesorHorarios';
import { useEventosSemanaProfesor } from '../hooks/useEventosSemanaProfesor';
import { useMiProfesor } from '../hooks/useMiProfesor';

export default function ProfesorEjercicios() {
  const { propio, nombres, eventos, loading } = useMiProfesor();
  const [eventoTematica, setEventoTematica] = useState<(typeof eventos)[number] | null>(null);
  const eventosConTitulo = eventos
    .filter(evento => nombres.includes(evento.profesor || ''))
    .map(evento => ({
      ...evento,
      title: evento.resource?.clase?.nombre || 'Clase',
    }));
  const { eventosPorDia, infoSemana } = useEventosSemanaProfesor(eventosConTitulo, 'actual', '');

  if (loading) return <LoadingSpinner size='large' text='Cargando ejercicios...' />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Ejercicios'
        subtitle='Elige la temática de tus clases. El catálogo de la escuela lo gestiona administración.'
      />
      <ProfesorHorarios
        eventosPorDia={eventosPorDia as Record<string, Array<{ id: string; title?: string; start: Date }>>}
        infoSemana={infoSemana}
        onAbrirTematica={evento => {
          const encontrado = eventos.find(item => item.id === evento.id) || null;
          setEventoTematica(encontrado);
        }}
      />
      {eventoTematica && (
        <GestionTematicasEjercicios
          evento={eventoTematica}
          claseId={eventoTematica.resource?.clase_id}
          profesor={propio?.nombre || ''}
          onClose={() => setEventoTematica(null)}
        />
      )}
    </div>
  );
}
