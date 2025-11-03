import { useState, useMemo } from 'react';
import { normalizeText } from '../utils/text';
import { LoadingSpinner } from '@shared';
import {
  ProfesoresHeader,
  ProfesoresFilters,
  ProfesoresTable,
  useProfesores,
} from '@features/profesores';

export default function Profesores() {
  const { profesores, loading, eliminarProfesor } = useProfesores();
  const [searchTerm, setSearchTerm] = useState('');

  const profesoresFiltrados = useMemo(() => {
    const query = normalizeText(searchTerm);
    if (!query) return profesores;
    return profesores.filter(p => {
      const nombre = normalizeText(p?.nombre);
      const email = normalizeText(p?.email);
      const telefono = String(p?.telefono || '');
      return (
        nombre.includes(query) ||
        email.includes(query) ||
        telefono.includes(searchTerm)
      );
    });
  }, [profesores, searchTerm]);

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
