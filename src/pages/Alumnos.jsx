import FormularioAlumno from '../components/FormularioAlumno';
import ListaAlumnos from '../components/ListaAlumnos';
import { useState } from 'react';

export default function Alumnos() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  const handleNuevoAlumno = () => {
      setMostrarFormulario(true);
  };

  const handleFormularioCerrado = () => {
    setMostrarFormulario(false);
    window.location.reload();
  };

  return (
    <div>
      {/* Solo un botón: Nuevo Alumno */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">👥 Gestión de Alumnos</h2>
        {!mostrarFormulario && (
          <button
            onClick={handleNuevoAlumno}
            className="btn-primary">
            ➕ Nuevo Alumno
          </button>
        )}
      </div>

      {/*Mostra formulario o listado */}
      {mostrarFormulario ? (
        <FormularioAlumno
          onCancel={handleFormularioCerrado}
        />
      ) : (
        <ListaAlumnos />
      )}  
      
    </div>
  );
}
