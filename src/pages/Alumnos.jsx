import FormularioAlumno from '../components/FormularioAlumno';
import ListaAlumnos from '../components/ListaAlumnos';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Alumnos() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNuevoAlumno = () => {
    setMostrarFormulario(true);
  };

  const handleFormularioCerrado = () => {
    setMostrarFormulario(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleVerFicha = (alumnoId) => {
    navigate(`/ficha-alumno/${alumnoId}`);
  };

  return (
    <div className="space-y-8">
      {/* Header estandarizado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Gestión de Alumnos
              </h1>
              <p className="text-gray-600 dark:text-dark-text2">
                Administra los alumnos de tu academia
              </p>
            </div>
          </div>
          {!mostrarFormulario && (
            <button
              onClick={handleNuevoAlumno}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Alumno
            </button>
          )}
        </div>
      </div>

      {/*Mostra formulario o listado */}
      {mostrarFormulario ? (
        <FormularioAlumno
          onCancel={handleFormularioCerrado}
        />
      ) : (
        <ListaAlumnos refreshTrigger={refreshTrigger} onVerFicha={handleVerFicha} />
      )}

    </div>
  );
}
