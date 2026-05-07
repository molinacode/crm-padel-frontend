import NotificacionesProfesor from '../NotificacionesProfesor';

interface ProfesorNotificacionesProps {
  profesor: string;
}

export default function ProfesorNotificaciones({
  profesor,
}: ProfesorNotificacionesProps) {
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
        Notificaciones
      </h2>
      <div className='rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface p-4'>
        <NotificacionesProfesor profesor={profesor} />
      </div>
    </div>
  );
}
