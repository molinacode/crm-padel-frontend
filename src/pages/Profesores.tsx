import { useEffect, useState, useMemo } from 'react';
import { normalizeText } from '../utils/text';
import { LoadingSpinner } from '../components/shared';
import {
  ProfesoresHeader,
  ProfesoresFilters,
  ProfesoresTable,
  useProfesores,
} from '@features/profesores';

type Aviso = { email?: string; nombre?: string };

export default function Profesores() {
  const { profesores, loading, eliminarProfesor } = useProfesores();
  const [searchTerm, setSearchTerm] = useState('');
  const [avisos, setAvisos] = useState<{ soloZitadel: Aviso[]; soloCrm: Aviso[]; sinEmail: Aviso[]; error?: string } | null>(null);

  useEffect(() => {
    let activo = true;
    void fetch('/api/profesores/conciliacion', { credentials: 'include' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo comparar con Zitadel');
        if (activo) setAvisos(data);
      })
      .catch(error => {
        if (activo) setAvisos({ soloZitadel: [], soloCrm: [], sinEmail: [], error: error.message });
      });
    return () => {
      activo = false;
    };
  }, []);

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
      {avisos?.error && (
        <p className='rounded-lg border border-red-400 bg-red-950/40 px-4 py-3 text-red-200'>{avisos.error}</p>
      )}
      {avisos && !avisos.error && (avisos.soloZitadel.length > 0 || avisos.soloCrm.length > 0 || avisos.sinEmail.length > 0) && (
        <div className='rounded-lg border border-red-400 bg-red-950/40 px-4 py-3 text-red-100'>
          <p className='font-medium'>Los profesores de Zitadel no coinciden con el CRM.</p>
          {avisos.soloZitadel.map(row => (
            <p key={row.email}>En Zitadel y no en el CRM: {row.nombre} ({row.email})</p>
          ))}
          {avisos.soloCrm.map(row => (
            <p key={row.email}>En el CRM y no en Zitadel: {row.nombre} ({row.email})</p>
          ))}
          {avisos.sinEmail.map(row => (
            <p key={row.nombre}>En el CRM sin email: {row.nombre}</p>
          ))}
        </div>
      )}

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
