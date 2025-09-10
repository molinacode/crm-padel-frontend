import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Sidebar({ isOpen, onClose }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
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
  const fotoUrl = userData?.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.nombre || 'U')}&background=random&color=fff&size=128`;
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-surface shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-dark-border">
        <div className="flex items-center space-x-2">
          <img 
            src="https://sherpacampus.com/wp-content/uploads/2024/09/Shopify_logo.svg-768x228.png" 
            alt="CRM Pádel Logo" 
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.marginLeft = '0';
            }}
          />
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">CRM Pádel</h1>
        </div>
      </div>
      <nav className="mt-6">
        <Link
          to="/"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
        <Link
          to="/alumnos"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Alumnos
        </Link>
        <Link
          to="/pagos"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Pagos
        </Link>
        <Link
          to="/clases"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Clases
        </Link>
        <Link
          to="/asistencias"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Asistencias
        </Link>
        <Link
          to="/profesores"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profesores
        </Link>
        <Link
          to="/ejercicios"
          className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Ejercicios
        </Link>
        <Link
            to="/instalaciones"
            className="flex items-center px-6 py-3 text-gray-700 dark:text-dark-text2 hover:bg-blue-50 dark:hover:bg-dark-surface2 hover:text-blue-600 dark:hover:text-blue-400 border-r-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition"
            onClick={() => onClose && onClose()}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="12" y1="3" y2="21" x2="12" stroke="currentColor" strokeWidth="1" />
              <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1" />
            </svg>
            Instalaciones
        </Link>
      </nav>

      {/* Toggle de tema - Solo visible en desktop */}
      <div className="hidden md:block px-6 py-4 border-t border-gray-200 dark:border-dark-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-surface2 flex items-center justify-center">
            {isDarkMode ? (
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </div>
            <div className="text-xs text-gray-500 dark:text-dark-text2">
              {isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            </div>
          </div>
        </button>
      </div>

      {/* Sección de perfil - Solo visible en desktop */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="p-4">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={toggleProfileMenu}
              className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-surface2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <img
                src={fotoUrl}
                alt="Perfil"
                className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-400 transition"
                title="Mi perfil"
              />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                  {userData?.nombre || 'Usuario'}
                </div>
                <div className="text-xs text-gray-500 dark:text-dark-text2 truncate">
                  {userData?.email || 'usuario@ejemplo.com'}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400 dark:text-dark-text2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menú desplegable */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-surface rounded-lg shadow-lg border dark:border-dark-border overflow-hidden z-50">
                <Link
                  to="/perfil"
                  onClick={closeProfileMenu}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-dark-text2 hover:bg-gray-100 dark:hover:bg-dark-surface2 transition-colors"
                >
                  👤 Mi Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-surface2 transition-colors"
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