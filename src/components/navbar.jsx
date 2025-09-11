import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Removido el useEffect que interfería con los links del sidebar
  // El cierre del sidebar se maneja solo a través del overlay

  //URL FOTO PERFIL
  const fotoUrl = userData?.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.nombre || 'U')}&background=random&color=fff&size=128`;

  return (
    <>
      {/* Navbar superior - Solo visible en móvil */}
      <nav className="md:hidden bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border fixed w-full top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Botón menú (solo móvil) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2 ml-3">
                <img
                  src="./src/assets/logo1copy.png"
                  alt="CRM Pádel Logo"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.marginLeft = '0';
                  }}
                />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text">CRM Pádel</h2>
              </div>
            </div>

            {/*Toggle tema + Avatar + menu */}
            <div className="flex items-center space-x-2">
              {/* Toggle de tema - Solo visible en móvil */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={fotoUrl}
                    alt="Perfil"
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-400 cursor-pointer transition"
                    title="Mi perfil"
                  />
                </button>

                {/* Menú desplegable */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-lg shadow-lg border dark:border-dark-border overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border">
                      <div className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                        {userData?.nombre || 'Usuario'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-text2 truncate">
                        {userData?.email || 'usuario@ejemplo.com'}
                      </div>
                    </div>
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
        </div>
      </nav>

      {/* Overlay para sidebar móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50"
          onClick={(e) => {
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
      <div className="md:hidden h-16"></div>
    </>
  );
}