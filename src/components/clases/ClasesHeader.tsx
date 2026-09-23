import { Link } from 'react-router-dom';

export default function ClasesHeader() {
  return (
    <div className="border-b border-[#2a332c] pb-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Gestión de Clases
            </h1>
            <p className="text-gray-600 dark:text-dark-text2 mb-4 text-sm sm:text-base">
              Programa y gestiona las clases de tu academia.{' '}
              <Link to="/grupos" className="text-emerald-700 dark:text-emerald-400 underline">
                Calendario de grupos y huecos
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border-l-4 border-[#d8d2c4] bg-[#121810]" />
                <span className="text-[#d8d2c4]">Particular</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border border-[#2a332c] bg-[#121810]" />
                <span className="text-[#d8d2c4]">Interna</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-[#c9a658]" />
                <span className="text-[#d8d2c4]">Escuela</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border border-[#c9a658]" />
                <span className="text-[#d8d2c4]">Grupal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
