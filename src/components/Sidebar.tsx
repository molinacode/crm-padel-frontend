import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NavIcon, { type NavIconName } from './NavIcon';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import useConciliacionAlertas from '../hooks/useConciliacionAlertas';
import AvatarIniciales from './AvatarIniciales';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-12 items-center gap-3 border-l-[3px] px-4 md:justify-center md:px-0 lg:justify-start lg:px-4 ${
    isActive
      ? 'border-[#c9a658] bg-[#1c241e] text-[#c9a658]'
      : 'border-transparent text-[#d8d2c4] hover:bg-[#1c241e] hover:text-[#f5f1e8]'
  }`;

function Etiqueta({ children }: { children: string }) {
  return <span className='truncate md:hidden lg:inline'>{children}</span>;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
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
      className={itemClass}
      title={label}
      onClick={cerrar}
    >
      <NavIcon name={icon} />
      <Etiqueta>{label}</Etiqueta>
    </NavLink>
  );

  return (
    <aside
      className={`fixed top-16 bottom-16 left-0 z-50 flex w-64 flex-col border-r border-[#2a332c] bg-[#121810] text-[#f5f1e8] transition-transform duration-200 md:bottom-0 md:w-16 lg:w-64 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
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
        {enlace('/alumnos-escuela', 'alumnos', 'Escuela')}
        {enlace('/alumnos-escuela-interna', 'grupos', 'Escuela interna')}

        <NavLink to='/pagos' className={itemClass} title='Pagos' onClick={cerrar}>
          <NavIcon name='pagos' />
          <Etiqueta>Pagos</Etiqueta>
          {totalAlertasConciliacion > 0 && (
            <span className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c9a658] px-1 text-[11px] font-bold text-[#0e1410] md:hidden lg:inline-flex'>
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

      <div className='shrink-0 border-t border-[#2a332c] p-2'>
        <button
          type='button'
          onClick={toggleTheme}
          className='flex min-h-11 w-full items-center gap-3 px-2 text-sm text-[#d8d2c4] md:justify-center lg:justify-start'
          title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          <svg viewBox='0 0 24 24' className='h-5 w-5 text-[#c9a658]' fill='none' stroke='currentColor' strokeWidth='1.5'>
            {isDarkMode ? (
              <path strokeLinecap='round' d='M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' />
            ) : (
              <path strokeLinecap='round' d='M16 13.5A6 6 0 0 1 10.5 8 6 6 0 1 0 16 13.5Z' />
            )}
          </svg>
          <span className='md:hidden lg:inline'>
            {isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          </span>
        </button>

        <div className='relative' ref={profileMenuRef}>
          <button
            type='button'
            onClick={() => setProfileMenuOpen(open => !open)}
            className='flex min-h-12 w-full items-center gap-3 px-2 md:justify-center lg:justify-start'
          >
            <AvatarIniciales
              nombre={userData?.nombre}
              fotoUrl={userData?.foto_url}
              className='h-9 w-9 rounded-full border border-[#2a332c]'
              textoClassName='text-sm'
            />
            <span className='truncate text-sm md:hidden lg:inline'>
              {userData?.nombre || 'Usuario'}
            </span>
          </button>
          {profileMenuOpen && (
            <div className='absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-md border border-[#2a332c] bg-[#1c241e]'>
              <Link
                to='/perfil'
                onClick={() => setProfileMenuOpen(false)}
                className='block px-4 py-3 text-sm text-[#f5f1e8] hover:bg-[#121810]'
              >
                Mi perfil
              </Link>
              <button
                type='button'
                onClick={buscarActualizacion}
                className='block w-full px-4 py-3 text-left text-sm text-[#d8d2c4] hover:bg-[#121810]'
              >
                Buscar actualización
              </button>
              <button
                type='button'
                onClick={handleLogout}
                className='block w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-[#121810]'
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
