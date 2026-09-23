import { useMemo, useState } from 'react';
import type { AlumnoConDeuda } from '../../utils/calcularDeudas';

interface PagosDeudasProps {
  items: AlumnoConDeuda[];
  onAlumnoClick?: (item: AlumnoConDeuda) => void;
}

export default function PagosDeudas({ items, onAlumnoClick }: PagosDeudasProps) {
  const [cursoId, setCursoId] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);

  const cursos = useMemo(() => {
    const mapa = new Map<string, string>();
    items.forEach(alumno => {
      alumno.meses.forEach(mes => mapa.set(mes.cursoId, mes.cursoNombre));
    });
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [items]);

  const visibles = useMemo(
    () =>
      items
        .map(alumno => ({
          ...alumno,
          meses: cursoId ? alumno.meses.filter(mes => mes.cursoId === cursoId) : alumno.meses,
        }))
        .filter(alumno => alumno.meses.length > 0)
        .filter(alumno => !soloActivos || !alumno.baja),
    [items, cursoId, soloActivos]
  );

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <select
          value={cursoId}
          onChange={event => setCursoId(event.target.value)}
          className='input text-sm'
        >
          <option value=''>Todos los cursos</option>
          {cursos.map(curso => (
            <option key={curso.id} value={curso.id}>
              {curso.nombre}
            </option>
          ))}
        </select>
        <label className='flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text2'>
          <input
            type='checkbox'
            checked={soloActivos}
            onChange={event => setSoloActivos(event.target.checked)}
          />
          Solo activos
        </label>
      </div>

      {visibles.length === 0 ? (
        <div className='p-6 text-sm text-gray-500 dark:text-dark-text2'>Todos al día.</div>
      ) : (
        <div className='space-y-3'>
          {visibles.map(alumno => (
            <button
              key={alumno.id}
              type='button'
              onClick={() => onAlumnoClick?.(alumno)}
              className='w-full rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-left transition-colors hover:bg-yellow-100 dark:border-yellow-800/50 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
            >
              <div className='flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100'>
                {alumno.nombre}
                {alumno.baja && (
                  <span className='rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200'>
                    Baja
                  </span>
                )}
              </div>
              <div className='mt-1 text-xs text-gray-600 dark:text-gray-300'>
                {alumno.meses.map(mes => `${mes.etiqueta} · ${mes.cursoNombre}`).join(' · ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
