import { useState, useMemo } from 'react';
import { normalizeText } from '../utils/text';
import { LoadingSpinner } from '../components/shared';
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
    return profesores.filter((p: { nombre?: string; email?: string; telefono?: string | number | null }) => {
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

  const profesoresTabla = useMemo(
    () => profesoresFiltrados.map(p => ({ ...p, activo: p.activo ?? undefined })),
    [profesoresFiltrados]
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
        profesores={profesoresTabla}
        onEliminar={eliminarProfesor}
        searchTerm={searchTerm}
      />
    </div>
  );
}
