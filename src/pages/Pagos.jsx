import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  PagosInternasHoy,
  PagosTabs,
  PagosHistorial,
  PagosNuevo,
  PagosDeudas,
  usePagosData,
  useInternasMes,
  Paginacion,
} from '@features/pagos';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';
import { PageHeader } from '@shared';

export default function Pagos() {
  const {
    alumnos: alumnosHook,
    pagos: pagosHook,
    loading: loadingHook,
  } = usePagosData();
  const { items: internasMes, reload: reloadInternas } = useInternasMes();
  const [pagos, setPagos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState({
    alumno_id: '',
    cantidad: '',
    tipo_pago: 'mensual',
    mes_cubierto: '',
    fecha_inicio: '',
    fecha_fin: '',
    clases_cubiertas: '',
    metodo: 'transferencia',
  });
  const [filtroAlumnoId] = useState('');
  const [alumnosConDeuda, setAlumnosConDeuda] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;
  const [tabActivo, setTabActivo] = useState('historial');

  useEffect(() => {
    if (!loadingHook) {
      setAlumnos(alumnosHook || []);
      setPagos(pagosHook || []);
    }
  }, [alumnosHook, pagosHook, loadingHook]);

  const togglePagoInterna = useCallback(
    async (claseId, fecha, estadoActual) => {
      const nuevoEstado = estadoActual === 'pagada' ? 'pendiente' : 'pagada';
      try {
        const payload = { clase_id: claseId, fecha, estado: nuevoEstado };
        const { error } = await supabase
          .from('pagos_clases_internas')
          .upsert(payload, { onConflict: 'clase_id,fecha' });
        if (error) throw error;
        await reloadInternas();
      } catch (e) {
        console.error('Error actualizando estado de pago interna:', e);
        alert('❌ No se pudo actualizar el estado de pago.');
      }
    },
    [reloadInternas]
  );

  const handleNuevoPago = async e => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('pagos').insert([
        {
          alumno_id: nuevoPago.alumno_id,
          cantidad: parseFloat(nuevoPago.cantidad),
          tipo_pago: nuevoPago.tipo_pago,
          mes_cubierto:
            nuevoPago.tipo_pago === 'mensual' ? nuevoPago.mes_cubierto : null,
          fecha_inicio:
            nuevoPago.tipo_pago === 'clases' ? nuevoPago.fecha_inicio : null,
          fecha_fin:
            nuevoPago.tipo_pago === 'clases' ? nuevoPago.fecha_fin : null,
          clases_cubiertas:
            nuevoPago.tipo_pago === 'clases'
              ? nuevoPago.clases_cubiertas
              : null,
          metodo: nuevoPago.metodo,
          fecha_pago: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      alert('✅ Pago registrado');
      setNuevoPago({
        alumno_id: '',
        cantidad: '',
        tipo_pago: 'mensual',
        mes_cubierto: '',
        fecha_inicio: '',
        fecha_fin: '',
        clases_cubiertas: '',
        metodo: 'transferencia',
      });
      window.location.reload();
    } catch (err) {
      console.error('Error creando pago:', err);
      alert('❌ Error al crear pago');
    }
  };

  const handleEditarPago = pago => {
    // TODO: Implementar edición
    console.log('Editar pago:', pago);
  };

  const handleEliminarPago = async pagoId => {
    if (!confirm('¿Eliminar este pago?')) return;
    try {
      const { error } = await supabase.from('pagos').delete().eq('id', pagoId);
      if (error) throw error;
      alert('✅ Pago eliminado');
      window.location.reload();
    } catch (err) {
      console.error('Error eliminando pago:', err);
      alert('❌ Error al eliminar pago');
    }
  };

  useEffect(() => {
    const cargarAlumnosConDeuda = async () => {
      try {
        const { alumnos: lista } = await calcularAlumnosConDeuda(
          alumnos,
          pagos,
          false
        );
        setAlumnosConDeuda(lista || []);
      } catch {
        setAlumnosConDeuda([]);
      }
    };
    if (alumnos.length > 0 && pagos.length > 0) cargarAlumnosConDeuda();
  }, [alumnos, pagos]);

  const pagosFiltrados = useMemo(
    () => pagos.filter(p => !filtroAlumnoId || p.alumno_id === filtroAlumnoId),
    [pagos, filtroAlumnoId]
  );
  const totalPaginas = useMemo(
    () => Math.ceil(pagosFiltrados.length / elementosPorPagina) || 1,
    [pagosFiltrados.length, elementosPorPagina]
  );
  const startIdx = (paginaActual - 1) * elementosPorPagina;
  const currentPageItems = useMemo(
    () => pagosFiltrados.slice(startIdx, startIdx + elementosPorPagina),
    [pagosFiltrados, startIdx, elementosPorPagina]
  );

  // Asegurar rango válido de paginación y resetear al cambiar de pestaña
  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
    if (paginaActual < 1) setPaginaActual(1);
  }, [paginaActual, totalPaginas]);

  useEffect(() => {
    if (tabActivo === 'historial') setPaginaActual(1);
  }, [tabActivo]);

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Pagos'
        subtitle='Gestiona historial, nuevas entradas, deudas e internas'
      />
      <PagosTabs
        tabActivo={tabActivo}
        setTabActivo={setTabActivo}
        counts={{ deudas: alumnosConDeuda.length }}
      />

      {tabActivo === 'historial' && (
        <div className='space-y-4'>
          <PagosHistorial
            pagos={currentPageItems}
            onEditar={handleEditarPago}
            onEliminar={handleEliminarPago}
          />
          {totalPaginas > 1 && (
            <Paginacion
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              onCambiarPagina={setPaginaActual}
              elementosPorPagina={elementosPorPagina}
              totalElementos={pagosFiltrados.length}
            />
          )}
        </div>
      )}

      {tabActivo === 'nuevo' && (
        <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6'>
          <PagosNuevo
            alumnos={alumnos}
            nuevoPago={nuevoPago}
            setNuevoPago={setNuevoPago}
            onSubmit={handleNuevoPago}
          />
        </div>
      )}

      {tabActivo === 'deudas' && (
        <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6'>
          <PagosDeudas items={alumnosConDeuda} />
        </div>
      )}

      {tabActivo === 'internas' && (
        <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6'>
          <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text mb-4'>
            Clases internas (mes)
          </h2>
          <PagosInternasHoy
            items={internasMes}
            onTogglePago={item =>
              togglePagoInterna(
                item.claseId,
                item.fecha,
                item.estado || item.estado_pago
              )
            }
          />
        </div>
      )}
    </div>
  );
}
