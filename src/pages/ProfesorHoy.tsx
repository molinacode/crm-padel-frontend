import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared';
import PageHeader from '../components/shared/PageHeader';
import ProfesorHorarios from '../components/profesor/ProfesorHorarios';
import { useEventosSemanaProfesor } from '../hooks/useEventosSemanaProfesor';
import { useMiProfesor } from '../hooks/useMiProfesor';

export default function ProfesorHoy() {
  const navigate = useNavigate();
  const { propio, nombres, eventos, loading } = useMiProfesor();
  const eventosConTitulo = eventos
    .filter(evento => nombres.includes(evento.profesor || ''))
    .map(evento => ({
      ...evento,
      title: evento.resource?.clase?.nombre || 'Clase',
    }));
  const { eventosPorDia, infoSemana } = useEventosSemanaProfesor(eventosConTitulo, 'actual', '');

  if (loading) return <LoadingSpinner size='large' text='Cargando tus clases...' />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Hoy'
        subtitle={propio?.nombre || 'Tu usuario no está vinculado a un profesor del CRM'}
      />
      {propio ? (
        <ProfesorHorarios
          eventosPorDia={eventosPorDia as Record<string, Array<{ id: string; title?: string; start: Date }>>}
          infoSemana={infoSemana}
          onPasarLista={evento => {
            const fecha = [
              evento.start.getFullYear(),
              String(evento.start.getMonth() + 1).padStart(2, '0'),
              String(evento.start.getDate()).padStart(2, '0'),
            ].join('-');
            navigate(`/vista-profesor/lista?fecha=${fecha}`);
          }}
        />
      ) : (
        <p className='text-[#8c8678]'>Avisa a administración para vincular tu email.</p>
      )}
    </div>
  );
}
