export type NavIconName =
  | 'hoy'
  | 'alumnos'
  | 'clases'
  | 'asistencia'
  | 'pagos'
  | 'profesores'
  | 'grupos'
  | 'ejercicios'
  | 'instalaciones'
  | 'avisos'
  | 'reportes';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export default function NavIcon({
  name,
  className = 'h-5 w-5 shrink-0',
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg viewBox='0 0 24 24' className={className} aria-hidden='true'>
      {name === 'hoy' && (
        <>
          <rect x='4' y='5' width='16' height='15' rx='1.5' {...stroke} />
          <path d='M8 3.5v3M16 3.5v3M4 9h16' {...stroke} />
          <circle cx='12' cy='14' r='1.4' fill='currentColor' stroke='none' />
        </>
      )}
      {name === 'alumnos' && (
        <path d='M8 19v-1.2a3.2 3.2 0 0 1 3.2-3.2h.2M16.5 19v-1a2.6 2.6 0 0 0-2-2.5M9.2 8.2a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0ZM16.8 7.6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z' {...stroke} />
      )}
      {name === 'clases' && (
        <>
          <rect x='3.5' y='5' width='17' height='14' rx='1' {...stroke} />
          <path d='M3.5 12h17' {...stroke} />
        </>
      )}
      {name === 'asistencia' && (
        <>
          <circle cx='12' cy='12' r='8' {...stroke} />
          <path d='M8.5 12.2 11 14.5 15.5 9.5' {...stroke} />
        </>
      )}
      {name === 'pagos' && (
        <path d='M7 4.5h8.5L19 8v11.5H7V4.5Z M15 4.5V8h4' {...stroke} />
      )}
      {name === 'profesores' && (
        <path d='M5 16.5c2.2-4 5-6.2 7-6.2 1.2 0 2.3.6 3.4 1.6 1.6-1 3.2-.4 4.2.8-2 .2-3.2 1.4-3.6 3.2' {...stroke} />
      )}
      {name === 'grupos' && (
        <>
          <circle cx='8' cy='8' r='1.4' fill='currentColor' stroke='none' />
          <circle cx='16' cy='8' r='1.4' fill='currentColor' stroke='none' />
          <circle cx='8' cy='16' r='1.4' fill='currentColor' stroke='none' />
          <circle cx='16' cy='16' r='1.4' fill='currentColor' stroke='none' />
        </>
      )}
      {name === 'ejercicios' && (
        <>
          <rect x='5' y='4' width='14' height='16' rx='1.5' {...stroke} />
          <path d='M8 9h8M8 12.5h8M8 16h5' {...stroke} />
        </>
      )}
      {name === 'instalaciones' && (
        <>
          <rect x='3.5' y='5' width='17' height='14' rx='1' {...stroke} />
          <path d='M3.5 12h17' {...stroke} />
          <path d='M16 7.2h3.2v2.4H16z' {...stroke} />
        </>
      )}
      {name === 'avisos' && (
        <path d='M7 16.5h10l-1.2-1.6V11a3.8 3.8 0 0 0-7.6 0v3.9L7 16.5Z M10 16.5a2 2 0 0 0 4 0' {...stroke} />
      )}
      {name === 'reportes' && (
        <path d='M5 19V5h10l4 4v10H5Z M15 5v4h4 M8 13h8M8 16h5' {...stroke} />
      )}
    </svg>
  );
}
