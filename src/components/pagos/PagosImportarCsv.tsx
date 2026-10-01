import { useState } from 'react';
import {
  parseMovimientosArchivo,
  sugerirAlumno,
  huellaMovimiento,
} from '../../utils/importarPagosCsv';
import {
  buscarHuellasExistentes,
  confirmarImportacionBanco,
  type FilaImportacionPago,
} from '../../services/importacionBancoService';
import {
  crearNotificacionAdminConciliacion,
} from '../../services/notificacionesAdminService';
import { actualizarPendientesConciliacionLocal } from '../../hooks/useConciliacionAlertas';

interface PagosImportarCsvProps {
  alumnos: Array<{ id: string; nombre: string }>;
  onImportacionCompletada: () => Promise<void> | void;
}

export default function PagosImportarCsv({
  alumnos,
  onImportacionCompletada,
}: PagosImportarCsvProps) {
  const [filas, setFilas] = useState<FilaImportacionPago[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState('');
  const [avisoRevolut, setAvisoRevolut] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setAvisoRevolut('');
    setNombreArchivo(file.name || 'extracto');
    setLeyendo(true);
    try {
      const movimientos = await parseMovimientosArchivo(file);
      if (movimientos.length === 0) {
        setError(
          'No se encontraron movimientos válidos. Prueba CSV/Excel de Revolut o el PDF del extracto.'
        );
        actualizarPendientesConciliacionLocal(0);
        setFilas([]);
        return;
      }

      const ingresosSinOrdenante = movimientos.filter(
        m =>
          m.bancoOrigen === 'revolut' &&
          m.tipoMovimiento === 'ingreso' &&
          !m.ordenante &&
          /bizum|recarga|dinero anadido|dinero añadido/i.test(m.concepto)
      ).length;
      if (ingresosSinOrdenante > 0) {
        setAvisoRevolut(
          `Revolut trae ${ingresosSinOrdenante} ingresos (p. ej. Bizum) sin el nombre del pagador: así viene el extracto. Asigna el alumno a mano.`
        );
      }

      let huellasPrevias = new Set<string>();
      try {
        huellasPrevias = await buscarHuellasExistentes(
          movimientos
            .filter(m => m.tipoMovimiento === 'ingreso')
            .map(huellaMovimiento)
        );
      } catch (e) {
        console.warn('No se pudieron comprobar duplicados previos:', e);
      }

      const next: FilaImportacionPago[] = movimientos.map(mov => {
        const match = sugerirAlumno(mov, alumnos);
        const esIngreso = mov.tipoMovimiento === 'ingreso';
        const huella = huellaMovimiento(mov);
        const esDuplicado = esIngreso && huellasPrevias.has(huella);
        let estadoConciliacion: FilaImportacionPago['estadoConciliacion'] = 'pendiente';
        if (!esIngreso) {
          estadoConciliacion = 'gasto';
        } else if (esDuplicado) {
          estadoConciliacion = 'duplicado';
        } else if ((match?.score || 0) >= 80) {
          estadoConciliacion = 'auto_match';
        } else if ((match?.score || 0) >= 50) {
          estadoConciliacion = 'conflicto';
        }
        return {
          movimiento: mov,
          alumnoId: match?.alumnoId || '',
          alumnoId2: '',
          score: match?.score || 0,
          seleccionado: esIngreso && !esDuplicado && (match?.score || 0) >= 80,
          estadoConciliacion,
        };
      });
      const pendientes = next.filter(
        f => f.estadoConciliacion === 'pendiente' || f.estadoConciliacion === 'conflicto'
      ).length;
      const conflictos = next.filter(f => f.estadoConciliacion === 'conflicto').length;
      actualizarPendientesConciliacionLocal(pendientes);
      void crearNotificacionAdminConciliacion(pendientes, conflictos);
      setFilas(next);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo leer el archivo. Prueba CSV, Excel o PDF de Revolut.'
      );
      setFilas([]);
    } finally {
      setLeyendo(false);
    }
  };

  const toggle = (id: string) => {
    setFilas(prev =>
      prev.map(f => {
        if (f.movimiento.id !== id) return f;
        if (f.movimiento.tipoMovimiento !== 'ingreso') return f;
        if (f.estadoConciliacion === 'duplicado') return f;
        return { ...f, seleccionado: !f.seleccionado };
      })
    );
  };

  const updateAlumno = (id: string, alumnoId: string) => {
    setFilas(prev =>
      prev.map(f =>
        f.movimiento.id === id
          ? {
              ...f,
              alumnoId,
              alumnoId2: f.alumnoId2 === alumnoId ? '' : f.alumnoId2,
              seleccionado:
                f.estadoConciliacion !== 'duplicado' &&
                f.movimiento.tipoMovimiento === 'ingreso' &&
                Boolean(alumnoId),
            }
          : f
      )
    );
  };

  const updateAlumno2 = (id: string, alumnoId2: string) => {
    setFilas(prev =>
      prev.map(f =>
        f.movimiento.id === id
          ? {
              ...f,
              alumnoId2: alumnoId2 === f.alumnoId ? '' : alumnoId2,
            }
          : f
      )
    );
  };

  const confirmar = async () => {
    try {
      setProcesando(true);
      setError('');
      const resultado = await confirmarImportacionBanco({
        nombreArchivo,
        filas,
      });
      actualizarPendientesConciliacionLocal(0);
      setFilas([]);
      setNombreArchivo('');
      await onImportacionCompletada();
      alert(
        `Importación guardada.\n` +
          `Pagos creados: ${resultado.creados}\n` +
          `Duplicados omitidos: ${resultado.duplicados}\n` +
          `Gastos detectados (sin importar): ${resultado.gastosDetectados}`
      );
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Error importando pagos.';
      setError(msg);
      alert(msg);
    } finally {
      setProcesando(false);
    }
  };

  const disabledFila = (f: FilaImportacionPago) =>
    f.movimiento.tipoMovimiento !== 'ingreso' || f.estadoConciliacion === 'duplicado';

  return (
    <div className='space-y-4'>
      <div className='rounded-xl border border-gray-200 dark:border-dark-border p-4 bg-white dark:bg-dark-surface'>
        <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
          Subir extracto del banco (CSV, Excel o PDF)
        </label>
        <input
          type='file'
          accept='.csv,.pdf,.xlsx,.xls,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
          disabled={leyendo || procesando}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className='block w-full text-sm'
        />
        <p className='mt-2 text-xs text-gray-500 dark:text-dark-text2'>
          ING: CSV. Revolut: CSV/Excel o PDF. Tras asignar un alumno puedes
          añadir un segundo pagador (el importe se reparte a partes iguales).
          Los gastos no se importan.
        </p>
        {leyendo && (
          <p className='mt-2 text-sm text-blue-600 dark:text-blue-300'>
            Leyendo archivo…
          </p>
        )}
        {avisoRevolut && (
          <p className='mt-2 text-sm text-amber-700 dark:text-amber-300'>
            {avisoRevolut}
          </p>
        )}
        {error && <p className='mt-2 text-sm text-red-500 whitespace-pre-wrap'>{error}</p>}
      </div>

      {filas.length > 0 && (
        <div className='rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden'>
          <div className='p-3 bg-gray-50 dark:bg-dark-surface2 text-sm font-semibold'>
            Conciliacion ({filas.length} movimientos)
            {nombreArchivo ? ` · ${nombreArchivo}` : ''}
          </div>
          <div className='px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-y border-blue-100 dark:border-blue-900/40'>
            Ingresos: {filas.filter(f => f.movimiento.tipoMovimiento === 'ingreso').length}{' '}
            · Gastos: {filas.filter(f => f.movimiento.tipoMovimiento === 'gasto').length}{' '}
            · Duplicados: {filas.filter(f => f.estadoConciliacion === 'duplicado').length}{' '}
            · Conjuntos:{' '}
            {filas.filter(f => f.alumnoId && f.alumnoId2 && f.alumnoId2 !== f.alumnoId).length}
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 dark:bg-dark-surface2'>
                <tr>
                  <th className='p-2 text-left'>OK</th>
                  <th className='p-2 text-left'>Estado</th>
                  <th className='p-2 text-left'>Tipo</th>
                  <th className='p-2 text-left'>Fecha</th>
                  <th className='p-2 text-left'>Importe</th>
                  <th className='p-2 text-left'>Concepto</th>
                  <th className='p-2 text-left'>Alumno / 2º pagador</th>
                  <th className='p-2 text-left'>Score</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(f => (
                  <tr key={f.movimiento.id} className='border-t border-gray-100 dark:border-dark-border'>
                    <td className='p-2'>
                      <input
                        type='checkbox'
                        checked={f.seleccionado}
                        onChange={() => toggle(f.movimiento.id)}
                        disabled={disabledFila(f)}
                      />
                    </td>
                    <td className='p-2'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          f.estadoConciliacion === 'auto_match'
                            ? 'bg-emerald-100 text-emerald-700'
                            : f.estadoConciliacion === 'conflicto'
                              ? 'bg-orange-100 text-orange-700'
                              : f.estadoConciliacion === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-700'
                                : f.estadoConciliacion === 'duplicado'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {f.estadoConciliacion}
                      </span>
                    </td>
                    <td className='p-2'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          f.movimiento.tipoMovimiento === 'ingreso'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.movimiento.tipoMovimiento}
                      </span>
                    </td>
                    <td className='p-2'>{f.movimiento.fechaOperacion}</td>
                    <td className='p-2'>
                      {f.movimiento.importe.toFixed(2)} EUR
                      {f.alumnoId && f.alumnoId2 && f.alumnoId2 !== f.alumnoId ? (
                        <div className='text-[11px] text-gray-500'>
                          ½ + ½
                        </div>
                      ) : null}
                    </td>
                    <td className='p-2 max-w-[420px] truncate' title={f.movimiento.concepto}>
                      {f.movimiento.concepto || '-'}
                    </td>
                    <td className='p-2 min-w-[220px]'>
                      <select
                        value={f.alumnoId}
                        onChange={e => updateAlumno(f.movimiento.id, e.target.value)}
                        disabled={disabledFila(f)}
                        className='w-full border rounded px-2 py-1 bg-white dark:bg-dark-surface'
                      >
                        <option value=''>Sin asignar</option>
                        {alumnos.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                      {f.alumnoId && !disabledFila(f) ? (
                        <select
                          value={f.alumnoId2}
                          onChange={e => updateAlumno2(f.movimiento.id, e.target.value)}
                          className='mt-1 w-full border rounded px-2 py-1 bg-white dark:bg-dark-surface text-xs'
                          aria-label='Segundo pagador'
                        >
                          <option value=''>+ Segundo pagador (opcional)</option>
                          {alumnos
                            .filter(a => a.id !== f.alumnoId)
                            .map(a => (
                              <option key={a.id} value={a.id}>
                                {a.nombre}
                              </option>
                            ))}
                        </select>
                      ) : null}
                    </td>
                    <td className='p-2'>
                      {f.score > 0 ? (
                        <span className='px-2 py-1 rounded bg-blue-100 text-blue-700'>
                          {f.score}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='p-3 bg-gray-50 dark:bg-dark-surface2 flex items-center justify-between'>
            <span className='text-xs text-gray-500 dark:text-dark-text2'>
              Seleccionados:{' '}
              {
                filas.filter(
                  f =>
                    f.seleccionado &&
                    f.alumnoId &&
                    f.estadoConciliacion !== 'duplicado'
                ).length
              }
            </span>
            <button
              type='button'
              onClick={() => void confirmar()}
              disabled={procesando}
              className='px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            >
              {procesando ? 'Importando...' : 'Confirmar importacion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
