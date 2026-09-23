import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NavIcon, { type NavIconName } from './NavIcon';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import useConciliacionAlertas from '../hooks/useConciliacionAlertas';
import { APP_LOGO_SRC, APP_NAME } from '../lib/branding';
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
  const [profesoresMenuOpen, setProfesoresMenuOpen] = useState(false);
  const [alumnosMenuOpen, setAlumnosMenuOpen] = useState(false);
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
      <div className='flex min-h-14 shrink-0 items-center border-b border-[#2a332c] px-4 md:justify-center md:px-0 lg:justify-start lg:px-4'>
        <img
          src={APP_LOGO_SRC}
          alt={APP_NAME}
          className='h-8 w-8 rounded-md object-contain'
        />
        <h2 className='ml-3 truncate text-base font-semibold md:hidden lg:block'>
          {APP_NAME}
        </h2>
        <button
          type='button'
          onClick={cerrar}
          className='ml-auto p-2 text-[#d8d2c4] md:hidden'
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

        <NavLink
          to='/alumnos'
          title='Alumnos'
          onClick={cerrar}
          className={({ isActive }) =>
            `${itemClass({ isActive })} max-md:hidden lg:hidden`
          }
        >
          <NavIcon name='alumnos' />
        </NavLink>
        <button
          type='button'
          onClick={() => setAlumnosMenuOpen(open => !open)}
          className='flex min-h-12 w-full items-center gap-3 border-l-[3px] border-transparent px-4 text-[#d8d2c4] hover:bg-[#1c241e] md:hidden lg:flex lg:px-4'
          title='Alumnos'
        >
          <NavIcon name='alumnos' />
          <Etiqueta>Alumnos</Etiqueta>
        </button>
        {alumnosMenuOpen && (
          <div className='bg-[#0e1410] md:hidden lg:block'>
            <NavLink to='/alumnos' className={itemClass} onClick={cerrar}>
              <Etiqueta>Todos los alumnos</Etiqueta>
            </NavLink>
            <NavLink to='/alumnos-escuela' className={itemClass} onClick={cerrar}>
              <Etiqueta>Alumnos escuela</Etiqueta>
            </NavLink>
            <NavLink to='/alumnos-escuela-interna' className={itemClass} onClick={cerrar}>
              <Etiqueta>Escuela interna</Etiqueta>
            </NavLink>
          </div>
        )}

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

        <NavLink
          to='/profesores'
          title='Profesores'
          onClick={cerrar}
          className={({ isActive }) =>
            `${itemClass({ isActive })} max-md:hidden lg:hidden`
          }
        >
          <NavIcon name='profesores' />
        </NavLink>
        <button
          type='button'
          onClick={() => setProfesoresMenuOpen(open => !open)}
          className='flex min-h-12 w-full items-center gap-3 border-l-[3px] border-transparent px-4 text-[#d8d2c4] hover:bg-[#1c241e] md:hidden lg:flex lg:px-4'
          title='Profesores'
        >
          <NavIcon name='profesores' />
          <Etiqueta>Profesores</Etiqueta>
        </button>
        {profesoresMenuOpen && (
          <div className='bg-[#0e1410] md:hidden lg:block'>
            <NavLink to='/profesores' className={itemClass} onClick={cerrar}>
              <Etiqueta>Lista de profesores</Etiqueta>
            </NavLink>
            <NavLink to='/vista-profesor' className={itemClass} onClick={cerrar}>
              <Etiqueta>Vista profesor</Etiqueta>
            </NavLink>
          </div>
        )}

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
          <span className='text-[#c9a658]'>{isDarkMode ? '☀' : '☾'}</span>
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
