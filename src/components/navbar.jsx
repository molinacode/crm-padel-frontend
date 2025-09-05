// src/components/Navbar.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Navbar({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Navbar superior */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Botón menú (solo móvil) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-800 ml-4 md:ml-0">CRM Pádel</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition"
              >
                🔐 Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}