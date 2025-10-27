import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ isOpen, onClose }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profesoresMenuOpen, setProfesoresMenuOpen] = useState(false);
  const [alumnosMenuOpen, setAlumnosMenuOpen] = useState(false);
  const { userData, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

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

      // Forzar comprobación de actualización
      await registration.update();

      // Si ya hay una actualización esperando, aplicarla
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        alert('Actualización instalada. Recargando...');
        setTimeout(() => window.location.reload(), 300);
        return;
      }

      // Esperar brevemente por updatefound/installed
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

      // Timeout si no hay actualización
      setTimeout(() => {
        if (!handled) {
          alert('No hay nueva actualización disponible.');
        }
      }, 1200);
    } catch (e) {
      alert('Error comprobando actualización.');
    }
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

  //URL FOTO PERFIL
  const fotoUrl =
    userData?.foto_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.nombre || 'U')}&background=random&color=fff&size=128`;
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-dark-surface dark:to-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:z-40 backdrop-blur-sm`}
    >
      <div className='flex items-center justify-center h-18 border-b border-gray-100 dark:border-gray-800 px-4'>
        <div className='flex items-center space-x-3'>
          <img
            src='./src/assets/logo1copy.png'
            alt='CRM Pádel Logo'
            className='w-9 h-9 object-contain'
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.marginLeft = '0';
            }}
          />
          <h2 className='text-xl font-bold text-gray-900 dark:text-white tracking-tight'>
            CRM Pádel
          </h2>
        </div>
      </div>
      <nav className='mt-4'>
        <Link
          to='/'
          className='flex items-center px-6 py-3.5 text-gray-800 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 border-r-3 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all duration-200 relative z-10 min-h-[48px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-r-lg'
          onClick={e => {
            console.log('Dashboard link clicked');
            onClose && onClose();
          }}
        >
          <svg
            className='w-5 h-5 mr-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
            />
          </svg>
          Dashboard
        </Link>
        {/* Submenú Alumnos */}
        <div>
          <button
            onClick={() => setAlumnosMenuOpen(!alumnosMenuOpen)}
            className='w-full flex items-center justify-between px-6 py-3.5 text-gray-800 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 border-r-3 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all duration-200 relative z-10 min-h-[48px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-r-lg'
          >
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
              Alumnos
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${alumnosMenuOpen ? 'rotate-180' : ''}`}
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
          </button>

          {/* Submenú desplegable */}
          {alumnosMenuOpen && (
            <div className='bg-gray-50 dark:bg-gray-900 border-l-3 border-blue-600 dark:border-blue-500'>
              <Link
                to='/alumnos'
                className='flex items-center px-6 py-2.5 pl-12 text-gray-700 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-150 relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 font-medium'
                onClick={() => {
                  onClose && onClose();
                  setAlumnosMenuOpen(false);
                }}
              >
                <svg
                  className='w-4 h-4 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
                Todos los alumnos
              </Link>
              <Link
                to='/alumnos-escuela'
                className='flex items-center px-6 py-3 pl-12 text-gray-600 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 transition relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                onClick={() => {
                  onClose && onClose();
                  setAlumnosMenuOpen(false);
                }}
              >
                <svg
                  className='w-4 h-4 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
                Alumnos Escuela
              </Link>
              <Link
                to='/alumnos-escuela-interna'
                className='flex items-center px-6 py-3 pl-12 text-gray-600 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 transition relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                onClick={() => {
                  onClose && onClose();
                  setAlumnosMenuOpen(false);
                }}
              >
                <svg
                  className='w-4 h-4 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                  />
                </svg>
                Alumnos Escuela Interna
              </Link>
            </div>
          )}
        </div>
        <Link
          to='/pagos'
          className='flex items-center px-6 py-4 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition relative z-10 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          onClick={() => onClose && onClose()}
        >
          <svg
            className='w-5 h-5 mr-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
            />
          </svg>
          Pagos
        </Link>
        <Link
          to='/clases'
          className='flex items-center px-6 py-4 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition relative z-10 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          onClick={() => onClose && onClose()}
        >
          <svg
            className='w-5 h-5 mr-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          Clases
        </Link>
        <Link
          to='/asistencias'
          className='flex items-center px-6 py-4 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition relative z-10 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          onClick={() => onClose && onClose()}
        >
          <svg
            className='w-5 h-5 mr-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          Asistencias
        </Link>
        {/* Submenú Profesores */}
        <div>
          <button
            onClick={() => setProfesoresMenuOpen(!profesoresMenuOpen)}
            className='w-full flex items-center justify-between px-6 py-4 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition relative z-10 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 mr-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
              Profesores
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${profesoresMenuOpen ? 'rotate-180' : ''}`}
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
          </button>

          {/* Submenú desplegable */}
          {profesoresMenuOpen && (
            <div className='bg-gray-50 dark:bg-gray-800 border-l-4 border-blue-500 dark:border-blue-400'>
              <Link
                to='/profesores'
                className='flex items-center px-6 py-3 pl-12 text-gray-600 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 transition relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                onClick={() => {
                  onClose && onClose();
                  setProfesoresMenuOpen(false);
                }}
              >
                <svg
                  className='w-4 h-4 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
                Lista de Profesores
              </Link>
              <Link
                to='/vista-profesor'
                className='flex items-center px-6 py-3 pl-12 text-gray-600 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 transition relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                onClick={() => {
                  onClose && onClose();
                  setProfesoresMenuOpen(false);
                }}
              >
                <svg
                  className='w-4 h-4 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  />
                </svg>
                Vista Profesor
              </Link>
            </div>
          )}
        </div>
        <Link
          to='/ejercicios'
          className='flex items-center px-6 py-4 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition relative z-10 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          onClick={() => onClose && onClose()}
        >
          <svg
            className='w-5 h-5 mr-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M13 10V3L4 14h7v7l9-11h-7z'
            />
          </svg>
          Ejercicios
        </Link>
        <Link
          to='/instalaciones'
          className='flex items-center px-6 py-4 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition relative z-10 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          onClick={() => onClose && onClose()}
        >
          <svg
            className='w-5 h-5 mr-3'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <rect
              x='3'
              y='3'
              width='18'
              height='18'
              rx='2'
              strokeWidth='2'
              stroke='currentColor'
              fill='none'
            />
            <line
              x1='3'
              y1='12'
              x2='21'
              y2='12'
              stroke='currentColor'
              strokeWidth='1'
              strokeDasharray='4 4'
            />
            <line
              x1='12'
              y1='3'
              y2='21'
              x2='12'
              stroke='currentColor'
              strokeWidth='1'
            />
            <circle
              cx='12'
              cy='12'
              r='1.5'
              stroke='currentColor'
              strokeWidth='1'
            />
          </svg>
          Instalaciones
        </Link>
      </nav>

      {/* Toggle de tema - Solo visible en desktop */}
      <div className='hidden md:block px-6 py-4 border-t border-gray-200 dark:border-dark-border'>
        <button
          onClick={toggleTheme}
          className='w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-surface2 flex items-center justify-center'>
            {isDarkMode ? (
              <svg
                className='w-4 h-4 text-yellow-500'
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
                className='w-4 h-4 text-gray-600'
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
          </div>
          <div className='flex-1 text-left'>
            <div className='text-sm font-medium text-gray-900 dark:text-dark-text'>
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </div>
            <div className='text-xs text-gray-500 dark:text-dark-text2'>
              {isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            </div>
          </div>
        </button>
      </div>

      {/* Sección de perfil - Solo visible en desktop */}
      <div className='hidden md:block absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-dark-border bg-blue-50 dark:bg-blue-900/20'>
        <div className='p-4'>
          <div className='relative' ref={profileMenuRef}>
            <button
              onClick={toggleProfileMenu}
              className='w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer min-h-[44px]'
            >
              <img
                src={fotoUrl}
                alt='Perfil'
                className='w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-400 transition'
                title='Mi perfil'
              />
              <div className='flex-1 text-left'>
                <div className='text-sm font-medium text-gray-900 dark:text-dark-text truncate'>
                  {userData?.nombre || 'Usuario'}
                </div>
                <div className='text-xs text-gray-500 dark:text-dark-text2 truncate'>
                  {userData?.email || 'usuario@ejemplo.com'}
                </div>
              </div>
              <svg
                className='w-4 h-4 text-gray-400 dark:text-dark-text2'
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
            </button>

            {/* Menú desplegable */}
            {profileMenuOpen && (
              <div className='absolute bottom-full left-0 right-0 mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-lg border dark:border-blue-700/30 overflow-hidden z-50'>
                <Link
                  to='/perfil'
                  onClick={closeProfileMenu}
                  className='block px-4 py-3 text-sm text-gray-700 dark:text-dark-text2 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors'
                >
                  👤 Mi Perfil
                </Link>
                <button
                  onClick={buscarActualizacion}
                  className='block w-full text-left px-4 py-3 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors'
                >
                  🔄 Buscar actualización
                </button>
                <button
                  onClick={handleLogout}
                  className='block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors'
                >
                  🔐 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
