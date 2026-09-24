import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NavIcon, { type NavIconName } from './NavIcon';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import useConciliacionAlertas from '../hooks/useConciliacionAlertas';
import AvatarIniciales from './AvatarIniciales';

interface SidebarProps {
  isOpen: boolean;
  collapsed?: boolean;
  onClose?: () => void;
}

const itemClass = (collapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `flex min-h-12 items-center gap-3 border-l-[3px] px-4 ${collapsed ? 'md:justify-center md:px-0' : ''} ${
      isActive
        ? 'border-[#c9a658] bg-[#1c241e] text-[#c9a658]'
        : 'border-transparent text-[#d8d2c4] hover:bg-[#1c241e] hover:text-[#f5f1e8]'
    }`;

function Etiqueta({ children, collapsed }: { children: string; collapsed: boolean }) {
  return <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{children}</span>;
}

export default function Sidebar({ isOpen, collapsed = false, onClose }: SidebarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { userData, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { totalAlertasConciliacion } = useConciliacionAlertas();

  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const cerrar = () => onClose?.();

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const buscarActualizacion = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        alert('Service Worker no soportado en este navegador.');
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        alert('No hay Service Worker registrado.');
        return;
      }

      await registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        alert('Actualización instalada. Recargando...');
        setTimeout(() => window.location.reload(), 300);
        return;
      }

      let handled = false;
      const onUpdateFound = () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.onstatechange = () => {
          if (newWorker.state === 'installed') {
            handled = true;
            if (navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              alert('Actualización lista. Recargando...');
              setTimeout(() => window.location.reload(), 300);
            }
          }
        };
      };

      registration.addEventListener('updatefound', onUpdateFound, {
        once: true,
      });

      setTimeout(() => {
        if (!handled) {
          alert('No hay nueva actualización disponible.');
        }
      }, 1200);
    } catch {
      alert('Error comprobando actualización.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        profileMenuRef.current &&
        target instanceof Node &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

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
      className={`fixed top-16 bottom-16 left-0 z-50 flex w-64 flex-col border-r border-[#2a332c] bg-[#121810] text-[#f5f1e8] transition-all duration-200 md:bottom-0 ${
        collapsed ? 'md:w-16' : 'md:w-64'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      <div className='flex min-h-12 shrink-0 items-center border-b border-[#2a332c] px-4 md:hidden'>
        <button
          type='button'
          onClick={cerrar}
          className='ml-auto p-2 text-[#d8d2c4]'
          aria-label='Cerrar menú'
        >
          <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>

      <nav className='min-h-0 flex-1 overflow-y-auto py-2'>
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
        {enlace('/vista-profesor', 'profesores', 'Vista profesor')}
        {enlace('/ejercicios', 'ejercicios', 'Ejercicios')}
        {enlace('/instalaciones', 'instalaciones', 'Instalaciones')}
      </nav>
    </aside>
  );
}
