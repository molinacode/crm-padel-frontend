import { useState, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NavIcon from './NavIcon';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import BusquedaGlobal from './BusquedaGlobal';
import { APP_LOGO_SRC, APP_NAME } from '../lib/branding';
import AvatarIniciales from './AvatarIniciales';

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const { userData, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
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


  return (
    <>
      <nav className='fixed top-0 z-40 w-full border-b border-[#2a332c] bg-[#121810] text-[#f5f1e8]'>
        <div className='px-4 sm:px-6'>
          <div
            className='flex h-16 items-center justify-between'
          >
            <div className='flex items-center'>
              <button
                type='button'
                onClick={() => setSidebarOpen(true)}
                className='md:hidden p-2.5 text-[#d8d2c4] hover:text-[#f5f1e8]'
                aria-label='Abrir menú'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </button>
              <div className='flex items-center space-x-3 ml-3'>
                <img
                  src={APP_LOGO_SRC}
                  alt={APP_NAME}
                  className='h-9 w-9 rounded-lg object-contain'
                />
                <h2
                  className='text-xl font-bold tracking-tight text-[#f5f1e8]'
                >
                  {APP_NAME}
                </h2>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <BusquedaGlobal />
              <button
                type='button'
                onClick={toggleTheme}
                className='p-2.5 text-[#d8d2c4] hover:text-[#f5f1e8]'
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? (
                  <svg className='w-5 h-5 text-[#c9a658]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                  </svg>
                ) : (
                  <svg className='w-5 h-5 text-[#d8d2c4]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                    />
                  </svg>
                )}
              </button>

              <div className='relative' ref={profileMenuRef}>
                <button
                  type='button'
                  onClick={toggleProfileMenu}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200'
                >
                  <AvatarIniciales
                    nombre={userData?.nombre}
                    fotoUrl={userData?.foto_url}
                    className='w-9 h-9 rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-sm'
                    textoClassName='text-xs'
                  />
                </button>

                {profileMenuOpen && (
                  <div className='absolute right-0 mt-2 w-52 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 backdrop-blur-sm'>
                    <div className='px-5 py-3.5 border-b border-gray-100 dark:border-gray-800'>
                      <div className='text-sm font-bold text-gray-900 dark:text-white truncate'>
                        {userData?.nombre || 'Usuario'}
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400 truncate font-medium mt-0.5'>
                        {userData?.email || 'usuario@ejemplo.com'}
                      </div>
                    </div>
                    <Link
                      to='/perfil'
                      onClick={closeProfileMenu}
                      className='block px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150'
                    >
                       Mi Perfil
                    </Link>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className='block w-full text-left px-5 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150'
                    >
                       Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 md:hidden'
          onClick={(e: ReactMouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) {
              setSidebarOpen(false);
            }
          }}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        collapsed={navCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => {
          const next = !navCollapsed;
          setNavCollapsed(next);
          window.dispatchEvent(new CustomEvent('navbar:collapsed', { detail: next }));
        }}
        rol={userData?.rol}
      />
      <nav className='fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t border-[#2a332c] bg-[#121810] text-[#8c8678] md:hidden'>
        <NavLink
          to={userData?.rol === 'profesor' ? '/vista-profesor' : '/'}
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'text-[#c9a658]' : ''}`
          }
        >
          <NavIcon name='hoy' />
          Hoy
        </NavLink>
        {userData?.rol === 'profesor' ? (
          <NavLink
            to='/vista-profesor/lista'
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'text-[#c9a658]' : ''}`
            }
          >
            <NavIcon name='asistencia' />
            Lista
          </NavLink>
        ) : (
          <NavLink
            to='/alumnos'
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'text-[#c9a658]' : ''}`
            }
          >
            <NavIcon name='alumnos' />
            Alumnos
          </NavLink>
        )}
        {userData?.rol === 'profesor' ? (
          <NavLink
            to='/vista-profesor/alumnos'
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'text-[#c9a658]' : ''}`
            }
          >
            <NavIcon name='alumnos' />
            Alumnos
          </NavLink>
        ) : (
          <NavLink
            to='/clases'
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'text-[#c9a658]' : ''}`
            }
          >
            <NavIcon name='clases' />
            Clases
          </NavLink>
        )}
        {userData?.rol === 'profesor' ? (
          <NavLink
            to='/vista-profesor/ejercicios'
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'text-[#c9a658]' : ''}`
            }
          >
            <NavIcon name='ejercicios' />
            Ejercicios
          </NavLink>
        ) : (
        <button
          type='button'
          onClick={() => setSidebarOpen(true)}
          className='flex flex-col items-center justify-center gap-1 text-[11px]'
        >
          <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='1.5'>
            <circle cx='6' cy='12' r='1' fill='currentColor' />
            <circle cx='12' cy='12' r='1' fill='currentColor' />
            <circle cx='18' cy='12' r='1' fill='currentColor' />
          </svg>
          Más
        </button>
        )}
      </nav>
    </>
  );
}
