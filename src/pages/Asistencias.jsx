import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSincronizacionAsignaciones } from '../hooks/useSincronizacionAsignaciones';
import { useAsistenciasData } from '../hooks/useAsistenciasData';
import { useAsistenciasHandlers } from '../hooks/useAsistenciasHandlers';
import AsistenciasHeader from '../components/asistencias/AsistenciasHeader';
import AsistenciasEmptyState from '../components/asistencias/AsistenciasEmptyState';
import AsistenciasClaseCard from '../components/asistencias/AsistenciasClaseCard';

export default function Asistencias() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const { sincronizando } = useSincronizacionAsignaciones();

  const {
    clases,
    alumnosPorClase,
    asistencias,
    recuperacionesMarcadas,
    loading,
    proximaFechaConClases,
    setAsistencias,
  } = useAsistenciasData(fecha);

  const { handleCambioEstado } = useAsistenciasHandlers(fecha, setAsistencias);

  if (loading) {
    return <LoadingSpinner size='large' text='Cargando asistencias...' />;
  }

  return (
    <div className='space-y-8'>
      <AsistenciasHeader
        fecha={fecha}
        setFecha={setFecha}
        sincronizando={sincronizando}
      />

      {clases.length === 0 ? (
        <AsistenciasEmptyState
          fecha={fecha}
          proximaFechaConClases={proximaFechaConClases}
          setFecha={setFecha}
        />
      ) : (
        clases.map(evento => (
          <AsistenciasClaseCard
            key={evento.id}
            evento={evento}
            clase={evento.clases}
            alumnos={alumnosPorClase[evento.clases.id] || []}
            asistenciasClase={asistencias[evento.clases.id] || {}}
            recuperacionesMarcadas={
              recuperacionesMarcadas[evento.clases.id] || {}
            }
            onCambioEstado={handleCambioEstado}
          />
        ))
      )}
    </div>
  );
}
