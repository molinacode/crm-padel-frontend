import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusquedaGlobal } from '../hooks/useBusquedaGlobal';

interface AlumnoBusqueda {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  nivel?: string | null;
}

interface ClaseBusqueda {
  id: string;
  nombre: string;
  tipo_clase?: string | null;
  nivel_clase?: string | null;
  dia_semana?: string | null;
}

interface ProfesorBusqueda {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  especialidad?: string | null;
}

interface PagoBusqueda {
  id: string;
  fecha_pago: string;
  mes_cubierto?: string | null;
  cantidad?: number | null;
  alumnos?: { id: string; nombre?: string | null } | null;
}

interface SeccionResultadosProps<T> {
  titulo: string;
  items: T[];
  vacioText: string;
  renderItem: (item: T) => ReactNode;
}

export default function BusquedaGlobal() {
  const [abierto, setAbierto] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { termino, setTermino, resultados, loading, error, buscar } =
    useBusquedaGlobal();
  const navigate = useNavigate();

  const alumnos = resultados.alumnos as AlumnoBusqueda[];
  const clases = resultados.clases as ClaseBusqueda[];
  const profesores = resultados.profesores as ProfesorBusqueda[];
  const pagos = resultados.pagos as PagoBusqueda[];

  useEffect(() => {
    if (!abierto) return;
    const id = setTimeout(() => {
      void buscar(termino);
    }, 300);
    return () => clearTimeout(id);
  }, [abierto, termino, buscar]);

  useEffect(() => {
    if (!abierto) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [abierto]);

  useEffect(() => {
    if (abierto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [abierto]);

  const abrir = () => setAbierto(true);
  const cerrar = () => setAbierto(false);

  const irAFichaAlumno = (id: string) => {
    cerrar();
    navigate(`/alumno/${id}`);
  };

  const irAClase = (id: string) => {
    cerrar();
    navigate('/clases', { state: { claseId: id } });
  };

  const irAProfesor = (id: string) => {
    cerrar();
    navigate(`/profesor/${id}`);
  };

  const irAPago = (pago: PagoBusqueda) => {
    cerrar();
    navigate('/pagos', {
      state: { alumnoId: pago.alumnos?.id, pagoId: pago.id },
    });
  };

  return (
    <>
      <button
        type='button'
        onClick={abrir}
        className='hidden md:inline-flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-dark-surface2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-dark-border transition-colors'
        title='Buscar (Ctrl+K)'
      >
        <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
          />
        </svg>
        <span className='text-xs text-gray-500 dark:text-gray-400 mr-2'>Buscar...</span>
      </button>

      {abierto && (
        <div className='fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:px-6'>
          <div className='absolute inset-0 bg-black/40' onClick={cerrar}></div>
          <div className='relative w-full max-w-3xl bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden'>
            <div className='px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100 dark:border-dark-border'>
              <div className='flex items-center gap-3'>
                <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
                  />
                </svg>
                <input
                  ref={inputRef}
                  type='text'
                  value={termino}
                  onChange={e => setTermino(e.target.value)}
                  placeholder='Buscar alumnos, clases, pagos, profesores...'
                  className='w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-gray-500'
                />
                <button
                  type='button'
                  onClick={cerrar}
                  className='p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
              {loading && (
                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>Buscando...</p>
              )}
              {error && <p className='mt-2 text-xs text-red-500 dark:text-red-400'>{error}</p>}
            </div>

            <div className='max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border'>
              <SeccionResultados
                titulo='Alumnos'
                vacioText='Sin alumnos coincidentes'
                items={alumnos}
                renderItem={alumno => (
                  <button
                    type='button'
                    onClick={() => irAFichaAlumno(alumno.id)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {alumno.nombre}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {alumno.email || alumno.telefono || 'Sin datos de contacto'}
                    </span>
                  </button>
                )}
              />

              <SeccionResultados
                titulo='Clases'
                vacioText='Sin clases coincidentes'
                items={clases}
                renderItem={clase => (
                  <button
                    type='button'
                    onClick={() => irAClase(clase.id)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-green-50 dark:hover:bg-green-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {clase.nombre}
                    </span>
                  </button>
                )}
              />

              <SeccionResultados
                titulo='Profesores'
                vacioText='Sin profesores coincidentes'
                items={profesores}
                renderItem={prof => (
                  <button
                    type='button'
                    onClick={() => irAProfesor(prof.id)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {prof.nombre}
                    </span>
                  </button>
                )}
              />

              <SeccionResultados
                titulo='Pagos'
                vacioText='Sin pagos coincidentes'
                items={pagos}
                renderItem={pago => (
                  <button
                    type='button'
                    onClick={() => irAPago(pago)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {pago.alumnos?.nombre || 'Alumno'}
                    </span>
                  </button>
                )}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SeccionResultados<T extends { id?: string | number }>({
  titulo,
  items,
  vacioText,
  renderItem,
}: SeccionResultadosProps<T>) {
  const tieneResultados = Array.isArray(items) && items.length > 0;
  return (
    <div>
      <div className='px-4 sm:px-5 py-2 bg-gray-50 dark:bg-dark-surface2 border-b border-gray-100 dark:border-dark-border/60'>
        <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
          {titulo}
        </p>
      </div>
      <div>
        {tieneResultados ? (
          items.map((item, index) => (
            <div key={item.id ?? `row-${index}`}>{renderItem(item)}</div>
          ))
        ) : (
          <p className='px-4 sm:px-5 py-3 text-xs text-gray-400 dark:text-gray-500'>
            {vacioText}
          </p>
        )}
      </div>
    </div>
  );
}
