// src/components/Sidebar.jsx
import { Link } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">🎾 CRM Pádel</h1>
      </div>
      <nav className="mt-6">
        <Link
          to="/"
          className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-4 border-transparent hover:border-blue-500 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
        <Link
          to="/alumnos"
          className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-4 border-transparent hover:border-blue-500 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Alumnos
        </Link>
        <Link
          to="/pagos"
          className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-4 border-transparent hover:border-blue-500 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Pagos
        </Link>
        <Link
          to="/clases"
          className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-4 border-transparent hover:border-blue-500 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Clases
        </Link>
        <Link
          to="/asistencias"
          className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-4 border-transparent hover:border-blue-500 transition"
          onClick={() => onClose && onClose()}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Asistencias
        </Link>
        <Link
            to="/instalaciones"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-4 border-transparent hover:border-blue-500 transition"
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
    </aside>
  );
}