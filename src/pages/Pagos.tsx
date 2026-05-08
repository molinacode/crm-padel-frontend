/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import {
  PagosInternasHoy,
  PagosTabs,
  PagosHistorial,
  PagosNuevo,
  PagosEditar,
  PagosDeudas,
  PagosImportarCsv,
} from '@features/pagos';
import { usePagosData } from '../hooks/usePagosData';
import { useInternasMes } from '../hooks/useInternasMes';
import Paginacion from '../components/Paginacion';
import { calcularAlumnosConDeuda } from '../utils/calcularDeudas';
import { migrarOrigenesAsignacionesTemporales } from '../utils/migrarOrigenesTemporales';
import { PageHeader } from '../components/shared';
import { exportarPagosCsv } from '../utils/exportarCsv';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { TablesInsert } from '../types/supabase';

export default function Pagos() {
  const {
    alumnos: alumnosHook,
    pagos: pagosHook,
    loading: loadingHook,
    reload: reloadPagos,
  } = usePagosData();
  const { items: internasMes, reload: reloadInternas } = useInternasMes();
  const [pagos, setPagos] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
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
  const [alumnosConDeuda, setAlumnosConDeuda] = useState<any[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;
  const [tabActivo, setTabActivo] = useState('historial');
  const [pagoEditar, setPagoEditar] = useState<any | null>(null);
  const [migrando, setMigrando] = useState(false);
  const [creandoNotificaciones, setCreandoNotificaciones] = useState(false);

  useEffect(() => {
    if (loadingHook) return undefined;
    return scheduleEffectWork(() => {
      setAlumnos(alumnosHook || []);
      setPagos(pagosHook || []);
    });
  }, [alumnosHook, pagosHook, loadingHook]);

  const togglePagoInterna = useCallback(
    async (
      claseId: string | null | undefined,
      fecha: string | null | undefined,
      estadoActual: string
    ) => {
      if (!claseId || !fecha) return;
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

  const handleNuevoPago = async (e: FormEvent<HTMLFormElement>) => {
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
            nuevoPago.tipo_pago === 'clases' && nuevoPago.fecha_inicio
              ? new Date(nuevoPago.fecha_inicio).toISOString()
              : null,
          fecha_fin:
            nuevoPago.tipo_pago === 'clases' && nuevoPago.fecha_fin
              ? new Date(nuevoPago.fecha_fin).toISOString()
              : null,
          clases_cubiertas:
            nuevoPago.tipo_pago === 'clases'
              ? nuevoPago.clases_cubiertas
                ? parseInt(nuevoPago.clases_cubiertas)
                : null
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
      reloadPagos();
    } catch (err) {
      console.error('Error creando pago:', err);
      alert('❌ Error al crear pago');
    }
  };

  const handleEditarPago = (pago: any) => {
    setPagoEditar(pago);
  };

  const handleCrearPagosDesdeImportacion = async (
    pagosImportados: TablesInsert<'pagos'>[]
  ) => {
    const { error } = await supabase.from('pagos').insert(pagosImportados as any);
    if (error) throw error;
    await reloadPagos();
  };

  const handleActualizarPago = async (pagoData: any) => {
    try {
      const { error } = await supabase
        .from('pagos')
        .update({
          alumno_id: pagoData.alumno_id,
          cantidad: pagoData.cantidad,
          tipo_pago: pagoData.tipo_pago,
          mes_cubierto: pagoData.mes_cubierto,
          fecha_inicio: pagoData.fecha_inicio,
          fecha_fin: pagoData.fecha_fin,
          clases_cubiertas: pagoData.clases_cubiertas,
          metodo: pagoData.metodo,
          fecha_pago: pagoData.fecha_pago,
        })
        .eq('id', pagoEditar.id);
      if (error) throw error;
      alert('✅ Pago actualizado');
      setPagoEditar(null);
      reloadPagos();
    } catch (err) {
      console.error('Error actualizando pago:', err);
      alert('❌ Error al actualizar pago');
    }
  };

  const handleEliminarPago = async (pagoId: string) => {
    if (!confirm('¿Eliminar este pago?')) return;
    try {
      const { error } = await supabase.from('pagos').delete().eq('id', pagoId);
      if (error) throw error;
      alert('✅ Pago eliminado');
      reloadPagos();
    } catch (err) {
      console.error('Error eliminando pago:', err);
      alert('❌ Error al eliminar pago');
    }
  };

  useEffect(() => {
    if (!(alumnos.length > 0 && pagos.length > 0)) return undefined;
    return scheduleEffectWork(() => {
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
      void cargarAlumnosConDeuda();
    });
  }, [alumnos, pagos]);

  const pagosFiltrados = useMemo(
    () => pagos.filter((p: any) => !filtroAlumnoId || p.alumno_id === filtroAlumnoId),
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
    return scheduleEffectWork(() => {
      if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
      if (paginaActual < 1) setPaginaActual(1);
    });
  }, [paginaActual, totalPaginas]);

  useEffect(() => {
    if (tabActivo !== 'historial') return undefined;
    return scheduleEffectWork(() => {
      setPaginaActual(1);
    });
  }, [tabActivo]);

  const ejecutarMigracion = async () => {
    const confirmar = window.confirm(
      '⚠️ ¿Estás seguro de que quieres ejecutar la migración de orígenes?\n\n' +
      'Esto actualizará todas las asignaciones temporales existentes basándose en el origen de las asignaciones permanentes de cada alumno.\n\n' +
      'Esta acción puede tardar unos minutos.'
    );
    
    if (!confirmar) return;
    
    setMigrando(true);
    try {
      const resultado = await migrarOrigenesAsignacionesTemporales();
      if (resultado.success) {
        alert(
          `✅ Migración completada:\n\n` +
          `• Actualizadas: ${resultado.actualizadas}\n` +
          `• Sin cambios: ${resultado.sinCambio}\n` +
          `• Alumnos con permanentes: ${resultado.conPermanentes}\n` +
          `• Alumnos sin permanentes: ${resultado.sinPermanentes}\n\n` +
          `Total procesadas: ${resultado.total}`
        );
        // Recargar datos de deudas
        const { alumnos: lista } = await calcularAlumnosConDeuda(
          alumnos,
          pagos,
          false
        );
        setAlumnosConDeuda(lista || []);
      } else {
        alert('❌ Error en la migración: ' + resultado.error);
      }
    } catch (error) {
      alert(
        '❌ Error: ' + (error instanceof Error ? error.message : 'desconocido')
      );
    } finally {
      setMigrando(false);
    }
  };

  const crearNotificacionesDeudas = async () => {
    if (!alumnosConDeuda.length) return;
    const confirmar = window.confirm(
      `Se crearán notificaciones internas de pago pendiente para ${alumnosConDeuda.length} alumno(s). ¿Continuar?`
    );
    if (!confirmar) return;
    setCreandoNotificaciones(true);
    try {
      const { crearNotificacionPagoPendiente } = await import(
        '../services/notificacionesService'
      );
      for (const alumno of alumnosConDeuda) {
        await crearNotificacionPagoPendiente({
          alumnoId: alumno.id,
          importe: alumno.deudaTotal,
          mes: alumno.mesReferencia,
        });
      }
      alert('✅ Notificaciones de pagos pendientes registradas');
    } catch (error) {
      console.error('Error creando notificaciones de deudas:', error);
      alert('❌ Error al crear notificaciones');
    } finally {
      setCreandoNotificaciones(false);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Pagos'
        subtitle='Gestiona historial, nuevas entradas, deudas e internas'
      />
      {tabActivo === 'historial' && pagosFiltrados.length > 0 && (
        <div className='flex justify-end'>
          <button
            type='button'
            onClick={() => exportarPagosCsv(pagosFiltrados)}
            className='inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-800 dark:bg-dark-surface2 dark:hover:bg-dark-surface border border-gray-900/10 dark:border-dark-border transition-colors shadow-sm'
          >
            📤 Exportar CSV
          </button>
        </div>
      )}
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

      {tabActivo === 'importar' && (
        <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6'>
          <PagosImportarCsv
            alumnos={alumnos}
            onCrearPagos={handleCrearPagosDesdeImportacion}
          />
        </div>
      )}

      {tabActivo === 'deudas' && (
        <div className='bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-dark-text'>
              Alumnos con Deuda
            </h2>
            <button
              onClick={ejecutarMigracion}
              disabled={migrando}
              className='px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center gap-2'
              title='Migrar orígenes de asignaciones temporales'
            >
              {migrando ? (
                <>
                  <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                  </svg>
                  Migrando...
                </>
              ) : (
                <>
                  🔄 Migrar Orígenes
                </>
              )}
            </button>
            <button
              onClick={crearNotificacionesDeudas}
              disabled={creandoNotificaciones || alumnosConDeuda.length === 0}
              className='ml-3 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 flex items-center gap-2'
              title='Crear notificaciones internas de pagos pendientes'
            >
              {creandoNotificaciones ? 'Creando notificaciones...' : '🔔 Notif. pagos pendientes'}
            </button>
          </div>
          <PagosDeudas
            items={alumnosConDeuda}
            onAlumnoClick={alumno => {
              setNuevoPago(p => ({
                ...p,
                alumno_id: alumno.id,
                tipo_pago: 'mensual',
              }));
              setTabActivo('nuevo');
            }}
          />
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
                (item.estado || item.estado_pago || 'pendiente') as string
              )
            }
          />
        </div>
      )}

      {pagoEditar && (
        <PagosEditar
          pagoEditar={pagoEditar}
          alumnos={alumnos}
          onClose={() => setPagoEditar(null)}
          onSuccess={handleActualizarPago}
        />
      )}
    </div>
  );
}
