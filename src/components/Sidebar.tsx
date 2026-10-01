import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import NavIcon, { type NavIconName } from './NavIcon';
import useConciliacionAlertas from '../hooks/useConciliacionAlertas';

interface SidebarProps {
  isOpen: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  rol?: string;
}

const itemClass = (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex min-h-12 items-center gap-3 border-l-[3px] px-4 ${collapsed ? 'md:justify-center md:px-0' : ''} ${
      isActive
        ? 'border-[#c9a658] bg-[var(--chrome-active-bg)] text-[#c9a658]'
        : 'border-transparent text-[var(--chrome-muted)] hover:bg-[var(--chrome-hover)] hover:text-[var(--chrome-text)]'
    }`;

function Etiqueta({ children, collapsed }: { children: string; collapsed: boolean }) {
  return <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{children}</span>;
}

export default function Sidebar({ isOpen, collapsed = false, onClose, onToggleCollapse, rol }: SidebarProps) {
  const { totalAlertasConciliacion } = useConciliacionAlertas();
  const cerrar = () => onClose?.();

  const enlace = (to: string, icon: NavIconName, label: string) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={itemClass(collapsed)}
      title={label}
      onClick={cerrar}
    >
      <NavIcon name={icon} />
      <Etiqueta collapsed={collapsed}>{label}</Etiqueta>
    </NavLink>
  );

  return (
    <aside
      className={`fixed top-16 bottom-16 left-0 z-50 flex w-64 flex-col border-r transition-all duration-200 md:bottom-0 ${
        collapsed ? 'md:w-16' : 'md:w-64'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      style={{
        backgroundColor: 'var(--chrome-bg)',
        borderColor: 'var(--chrome-border)',
        color: 'var(--chrome-text)',
      }}
    >
      <div
        className='flex min-h-12 shrink-0 items-center border-b px-4 md:hidden'
        style={{ borderColor: 'var(--chrome-border)' }}
      >
        <button
          type='button'
          onClick={cerrar}
          className='ml-auto min-h-11 min-w-11 p-2'
          style={{ color: 'var(--chrome-muted)' }}
          aria-label='Cerrar menú'
        >
          <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>

      <button
        type='button'
        onClick={onToggleCollapse}
        className='absolute top-1/2 right-0 z-10 hidden h-8 w-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border md:inline-flex'
        style={{
          backgroundColor: 'var(--chrome-bg)',
          borderColor: 'var(--chrome-border)',
          color: 'var(--chrome-muted)',
        }}
        title={collapsed ? 'Desplegar menú' : 'Plegar menú'}
      >
        {collapsed ? (
          <PanelLeftOpen className='h-4 w-4' strokeWidth={1.5} />
        ) : (
          <PanelLeftClose className='h-4 w-4' strokeWidth={1.5} />
        )}
      </button>
      <nav className='min-h-0 flex-1 overflow-y-auto py-2'>
        {rol === 'profesor' ? (
          <>
            {enlace('/vista-profesor', 'hoy', 'Hoy')}
            {enlace('/vista-profesor/lista', 'asistencia', 'Pase de lista')}
            {enlace('/vista-profesor/alumnos', 'alumnos', 'Mis alumnos')}
            {enlace('/vista-profesor/ejercicios', 'ejercicios', 'Ejercicios')}
          </>
        ) : (
          <>
            {enlace('/', 'hoy', 'Hoy')}
            {enlace('/cursos', 'reportes', 'Cursos')}
            {enlace('/reportes', 'reportes', 'Reportes')}
            {enlace('/alumnos', 'alumnos', 'Alumnos')}
            <div className={collapsed ? 'md:hidden' : ''}>
              <NavLink to='/alumnos-escuela' className={itemClass(false)} title='Escuela' onClick={cerrar}>
                <span className='w-5 shrink-0' />
                <span className='truncate pl-1 text-sm'>Escuela</span>
              </NavLink>
              <NavLink to='/alumnos-escuela-interna' className={itemClass(false)} title='Escuela interna' onClick={cerrar}>
                <span className='w-5 shrink-0' />
                <span className='truncate pl-1 text-sm'>Escuela interna</span>
              </NavLink>
            </div>
            <NavLink to='/pagos' className={itemClass(collapsed)} title='Pagos' onClick={cerrar}>
              <NavIcon name='pagos' />
              <Etiqueta collapsed={collapsed}>Pagos</Etiqueta>
              {totalAlertasConciliacion > 0 && (
                <span className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c9a658] px-1 text-[11px] font-bold text-[#0e1410] ${collapsed ? 'md:hidden' : ''}`}>
                  {totalAlertasConciliacion > 99 ? '99+' : totalAlertasConciliacion}
                </span>
              )}
            </NavLink>
            {enlace('/clases', 'clases', 'Clases')}
            {enlace('/grupos', 'grupos', 'Grupos')}
            {enlace('/asistencias', 'asistencia', 'Asistencias')}
            {enlace('/profesores', 'profesores', 'Profesores')}
            {enlace('/ejercicios', 'ejercicios', 'Ejercicios')}
            {enlace('/instalaciones', 'instalaciones', 'Instalaciones')}
          </>
        )}
      </nav>
    </aside>
  );
}
