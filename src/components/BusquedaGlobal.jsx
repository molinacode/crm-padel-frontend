import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusquedaGlobal } from '../hooks/useBusquedaGlobal';

export default function BusquedaGlobal() {
  const [abierto, setAbierto] = useState(false);
  const inputRef = useRef(null);
  const { termino, setTermino, resultados, loading, error, buscar } =
    useBusquedaGlobal();
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) return;
    const id = setTimeout(() => {
      buscar(termino);
    }, 300);
    return () => clearTimeout(id);
  }, [abierto, termino, buscar]);

  useEffect(() => {
    if (!abierto) return;
    const handleKey = e => {
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

  const abrir = () => {
    setAbierto(true);
  };

  const cerrar = () => {
    setAbierto(false);
  };

  const irAFichaAlumno = id => {
    cerrar();
    navigate(`/alumno/${id}`);
  };

  const irAClase = id => {
    cerrar();
    navigate('/clases', { state: { claseId: id } });
  };

  const irAProfesor = id => {
    cerrar();
    navigate(`/profesor/${id}`);
  };

  const irAPago = pago => {
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
        <svg
          className='w-4 h-4 mr-2'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z'
          />
        </svg>
        <span className='text-xs text-gray-500 dark:text-gray-400 mr-2'>
          Buscar...
        </span>
        <kbd className='hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded'>
          Ctrl
        </kbd>
        <span className='hidden lg:inline text-[10px] text-gray-500 dark:text-gray-400 mx-0.5'>
          +
        </span>
        <kbd className='hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded'>
          K
        </kbd>
      </button>

      {abierto && (
        <div className='fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:px-6'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={cerrar}
          ></div>
          <div className='relative w-full max-w-3xl bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden'>
            <div className='px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100 dark:border-dark-border'>
              <div className='flex items-center gap-3'>
                <svg
                  className='w-5 h-5 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
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
                  <span className='sr-only'>Cerrar</span>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
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
                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                  Buscando...
                </p>
              )}
              {error && (
                <p className='mt-2 text-xs text-red-500 dark:text-red-400'>
                  {error}
                </p>
              )}
            </div>

            <div className='max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border'>
              <SeccionResultados
                titulo='Alumnos'
                vacioText='Sin alumnos coincidentes'
                items={resultados.alumnos}
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
                    {alumno.nivel && (
                      <span className='text-[11px] inline-flex mt-0.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800'>
                        {alumno.nivel}
                      </span>
                    )}
                  </button>
                )}
              />

              <SeccionResultados
                titulo='Clases'
                vacioText='Sin clases coincidentes'
                items={resultados.clases}
                renderItem={clase => (
                  <button
                    type='button'
                    onClick={() => irAClase(clase.id)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-green-50 dark:hover:bg-green-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {clase.nombre}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {clase.tipo_clase || 'Clase'} · {clase.nivel_clase || 'Nivel'}
                      {clase.dia_semana ? ` · ${clase.dia_semana}` : ''}
                    </span>
                  </button>
                )}
              />

              <SeccionResultados
                titulo='Profesores'
                vacioText='Sin profesores coincidentes'
                items={resultados.profesores}
                renderItem={prof => (
                  <button
                    type='button'
                    onClick={() => irAProfesor(prof.id)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {prof.nombre}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {prof.email || prof.telefono || 'Sin datos de contacto'}
                    </span>
                    {prof.especialidad && (
                      <span className='text-[11px] inline-flex mt-0.5 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 border border-purple-100 dark:border-purple-800'>
                        {prof.especialidad}
                      </span>
                    )}
                  </button>
                )}
              />

              <SeccionResultados
                titulo='Pagos'
                vacioText='Sin pagos coincidentes'
                items={resultados.pagos}
                renderItem={pago => (
                  <button
                    type='button'
                    onClick={() => irAPago(pago)}
                    className='w-full text-left px-4 sm:px-5 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex flex-col gap-0.5'
                  >
                    <span className='text-sm font-medium text-gray-900 dark:text-dark-text'>
                      {pago.alumnos?.nombre || 'Alumno'}
                    </span>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {pago.mes_cubierto || 'Pago puntual'} ·{' '}
                      {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
                    </span>
                    <span className='text-[11px] inline-flex mt-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border border-amber-100 dark:border-amber-800'>
                      {pago.cantidad?.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
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

function SeccionResultados({ titulo, items, vacioText, renderItem }) {
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
          items.map(item => (
            <div key={item.id || item.mes_cubierto || Math.random()}>
              {renderItem(item)}
            </div>
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

