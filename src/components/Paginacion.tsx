interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
  elementosPorPagina?: number;
  totalElementos?: number;
}

export default function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  elementosPorPagina = 10,
  totalElementos = 0,
}: PaginacionProps) {
  const getRangoPaginas = () => {
    const delta = 2;
    const inicio = Math.max(1, paginaActual - delta);
    const fin = Math.min(totalPaginas, paginaActual + delta);

    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  const paginas = getRangoPaginas();
  const inicioElemento = (paginaActual - 1) * elementosPorPagina + 1;
  const finElemento = Math.min(paginaActual * elementosPorPagina, totalElementos);

  if (totalPaginas <= 1) return null;

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-6'>
      <div className='text-sm text-gray-700 dark:text-dark-text2'>
        Mostrando {inicioElemento} a {finElemento} de {totalElementos} elementos
      </div>

      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-surface2 dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface'
        >
          Anterior
        </button>

        {paginas[0] > 1 && (
          <>
            <button
              type='button'
              onClick={() => onCambiarPagina(1)}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-dark-surface2 dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface'
            >
              1
            </button>
            {paginas[0] > 2 && <span className='px-2 text-gray-500'>...</span>}
          </>
        )}

        {paginas.map(pagina => (
          <button
            type='button'
            key={pagina}
            onClick={() => onCambiarPagina(pagina)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              pagina === paginaActual
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-dark-surface2 dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface'
            }`}
          >
            {pagina}
          </button>
        ))}

        {paginas[paginas.length - 1] < totalPaginas && (
          <>
            {paginas[paginas.length - 1] < totalPaginas - 1 && (
              <span className='px-2 text-gray-500'>...</span>
            )}
            <button
              type='button'
              onClick={() => onCambiarPagina(totalPaginas)}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-dark-surface2 dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface'
            >
              {totalPaginas}
            </button>
          </>
        )}

        <button
          type='button'
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-surface2 dark:border-dark-border dark:text-dark-text2 dark:hover:bg-dark-surface'
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
