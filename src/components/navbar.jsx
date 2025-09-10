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

  // Cerrar sidebar móvil al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  //URL FOTO PERFIL
  const fotoUrl = userData?.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.nombre || 'U')}&background=random&color=fff&size=128`;

  return (
    <>
      {/* Navbar superior - Solo visible en móvil */}
      <nav className="md:hidden bg-white dark:bg-dark-surface shadow-sm border-b border-gray-200 dark:border-dark-border fixed w-full top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Botón menú (solo móvil) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 dark:text-dark-text2 hover:text-gray-700 dark:hover:text-dark-text"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className={`flex items-center space-x-2 ml-4 md:ml-0 ${sidebarOpen ? 'hidden' : 'flex'} md:hidden`}>
                <img
                  src="https://sherpacampus.com/wp-content/uploads/2024/09/Shopify_logo.svg-768x228.png"
                  alt="CRM Pádel Logo"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.marginLeft = '0';
                  }}
                />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">CRM Pádel</h2>
              </div>
            </div>

            {/*Avatar + menu */}
            <div className="flex items-center space-x-3">
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
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
                    <Link
                      to="/perfil"
                      onClick={closeProfileMenu}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-dark-text2 hover:bg-gray-100 dark:hover:bg-dark-surface2 transition-colors"
                    >
                      👤 Mi Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-surface2 transition-colors"
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
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Espaciador para contenido principal */}
      <div className="md:hidden h-16"></div>
    </>
  );
}