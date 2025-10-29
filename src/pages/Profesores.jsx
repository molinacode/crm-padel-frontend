import { useState, useMemo } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useProfesores } from '../hooks/useProfesores';
import ProfesoresHeader from '../components/profesores/ProfesoresHeader';
import ProfesoresFilters from '../components/profesores/ProfesoresFilters';
import ProfesoresTable from '../components/profesores/ProfesoresTable';

export default function Profesores() {
  const { profesores, loading, eliminarProfesor } = useProfesores();
  const [searchTerm, setSearchTerm] = useState('');

  const profesoresFiltrados = useMemo(
    () =>
      profesores.filter(
        profesor =>
          profesor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profesor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profesor.telefono.includes(searchTerm)
      ),
    [profesores, searchTerm]
  );

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando profesores...' />;
  }

  return (
    <div className='space-y-6'>
      <ProfesoresHeader />

      <ProfesoresFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <ProfesoresTable
        profesores={profesoresFiltrados}
        onEliminar={eliminarProfesor}
        searchTerm={searchTerm}
      />
    </div>
  );
}
