import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const { userData, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

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

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
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

  // Removido el useEffect que interfería con los links del sidebar
  // El cierre del sidebar se maneja solo a través del overlay

  //URL FOTO PERFIL
  const fotoUrl =
    userData?.foto_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.nombre || 'U')}&background=random&color=fff&size=128`;

  return (
    <>
      {/* Navbar superior - visible en todas las resoluciones */}
      {/* Navbar superior - Solo visible en móvil */}
      <nav className='bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border fixed w-full top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-dark-surface/95'>
        <div className='px-4 sm:px-6'>
          <div
            className={`flex justify-between items-center ${navCollapsed ? 'h-12' : 'h-16'} transition-all`}
          >
            <div className='flex items-center'>
              {/* Botón menú (abre drawer en móvil, ancla en desktop) */}
              <button
                onClick={() => {
                  if (window.matchMedia('(min-width: 1024px)').matches) {
                    window.dispatchEvent(
                      new CustomEvent('sidebar:desktop', { detail: true })
                    );
                  } else {
                    setSidebarOpen(true);
                  }
                }}
                className='p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                aria-label='Abrir menú'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
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
                  src='./src/assets/logo1copy.png'
                  alt='CRM Pádel Logo'
                  className={`object-contain ${navCollapsed ? 'w-7 h-7' : 'w-9 h-9'} transition-all`}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.marginLeft = '0';
                  }}
                />
                <h2
                  className={`${navCollapsed ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white tracking-tight transition-all`}
                >
                  CRM Pádel
                </h2>
              </div>
            </div>

            {/*Toggle tema + Avatar + menu */}
            <div className='flex items-center space-x-2'>
              {/* Toggle colapsar navbar (desktop) */}
              <button
                onClick={() => {
                  const next = !navCollapsed;
                  setNavCollapsed(next);
                  window.dispatchEvent(
                    new CustomEvent('navbar:collapsed', { detail: next })
                  );
                }}
                className='hidden md:inline-flex p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200'
                title={navCollapsed ? 'Expandir barra' : 'Colapsar barra'}
              >
                {navCollapsed ? (
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 15l7-7 7 7'
                    />
                  </svg>
                ) : (
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                )}
              </button>
              {/* Toggle de tema - Solo visible en móvil */}
              <button
                onClick={toggleTheme}
                className='p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                title={
                  isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
                }
              >
                {isDarkMode ? (
                  <svg
                    className='w-5 h-5 text-yellow-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                  </svg>
                ) : (
                  <svg
                    className='w-5 h-5 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
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
                  onClick={toggleProfileMenu}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200'
                >
                  <img
                    src={fotoUrl}
                    alt='Perfil'
                    className='w-9 h-9 rounded-full border-2 border-gray-200 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-400 cursor-pointer transition-all duration-200 shadow-sm'
                    title='Mi perfil'
                  />
                </button>

                {/* Menú desplegable */}
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
                      👤 Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='block w-full text-left px-5 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150'
                    >
                      🔐 Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay para sidebar móvil */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 md:hidden bg-black bg-opacity-50'
          onClick={e => {
            // Solo cerrar si se hace clic directamente en el overlay
            if (e.target === e.currentTarget) {
              setSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Espaciador para contenido principal */}
      <div className='md:hidden h-16'></div>
    </>
  );
}
