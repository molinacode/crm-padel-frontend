import { useCallback, useState } from 'react';
import { buscarGlobal } from '../services/busquedaService';

export function useBusquedaGlobal() {
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState({
    alumnos: [],
    clases: [],
    pagos: [],
    profesores: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarBusqueda = useCallback(
    async valor => {
      const q = typeof valor === 'string' ? valor : termino;
      if (!q.trim()) {
        setResultados({
          alumnos: [],
          clases: [],
          pagos: [],
          profesores: [],
        });
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await buscarGlobal(q);
        if (res.error) {
          setError('No se pudo completar la búsqueda');
          setResultados({
            alumnos: [],
            clases: [],
            pagos: [],
            profesores: [],
          });
        } else {
          setResultados({
            alumnos: res.alumnos || [],
            clases: res.clases || [],
            pagos: res.pagos || [],
            profesores: res.profesores || [],
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [termino]
  );

  return {
    termino,
    setTermino,
    resultados,
    loading,
    error,
    buscar: ejecutarBusqueda,
  };
}

