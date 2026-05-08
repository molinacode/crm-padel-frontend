import { useState } from 'react';
import type { TablesInsert } from '../../types/supabase';
import {
  parseMovimientosCsv,
  sugerirAlumno,
  type MovimientoBancario,
} from '../../utils/importarPagosCsv';

interface FilaConciliacion {
  movimiento: MovimientoBancario;
  alumnoId: string;
  score: number;
  seleccionado: boolean;
}

interface PagosImportarCsvProps {
  alumnos: Array<{ id: string; nombre: string }>;
  onCrearPagos: (pagos: TablesInsert<'pagos'>[]) => Promise<void>;
}

export default function PagosImportarCsv({
  alumnos,
  onCrearPagos,
}: PagosImportarCsvProps) {
  const [filas, setFilas] = useState<FilaConciliacion[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    const content = await file.text();
    const movimientos = parseMovimientosCsv(content);
    if (movimientos.length === 0) {
      setError('No se encontraron movimientos validos en el CSV');
      setFilas([]);
      return;
    }

    const next = movimientos.map(mov => {
      const match = sugerirAlumno(mov, alumnos);
      return {
        movimiento: mov,
        alumnoId: match?.alumnoId || '',
        score: match?.score || 0,
        seleccionado: Boolean(match),
      };
    });
    setFilas(next);
  };

  const toggle = (id: string) => {
    setFilas(prev =>
      prev.map(f =>
        f.movimiento.id === id ? { ...f, seleccionado: !f.seleccionado } : f
      )
    );
  };

  const updateAlumno = (id: string, alumnoId: string) => {
    setFilas(prev =>
      prev.map(f =>
        f.movimiento.id === id
          ? { ...f, alumnoId, seleccionado: Boolean(alumnoId) }
          : f
      )
    );
  };

  const confirmar = async () => {
    const seleccionados = filas.filter(f => f.seleccionado && f.alumnoId);
    if (!seleccionados.length) {
      alert('No hay movimientos seleccionados para crear pagos.');
      return;
    }

    const pagos: TablesInsert<'pagos'>[] = seleccionados.map(f => {
      const fecha = new Date(f.movimiento.fechaOperacion).toISOString();
      const mesCubierto = f.movimiento.fechaOperacion.slice(0, 7);
      return {
        alumno_id: f.alumnoId,
        cantidad: Math.abs(f.movimiento.importe),
        tipo_pago: 'mensual',
        mes_cubierto: mesCubierto,
        metodo: 'transferencia',
        fecha_pago: fecha,
      };
    });

    try {
      setProcesando(true);
      await onCrearPagos(pagos);
      setFilas([]);
      alert(`✅ Se importaron ${pagos.length} pagos desde CSV.`);
    } catch (e) {
      console.error(e);
      alert('❌ Error importando pagos.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='rounded-xl border border-gray-200 dark:border-dark-border p-4 bg-white dark:bg-dark-surface'>
        <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2'>
          Subir extracto CSV del banco
        </label>
        <input
          type='file'
          accept='.csv,text/csv'
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className='block w-full text-sm'
        />
        <p className='mt-2 text-xs text-gray-500 dark:text-dark-text2'>
          Campos recomendados: fecha, importe, concepto, referencia, ordenante.
        </p>
        {error && <p className='mt-2 text-sm text-red-500'>{error}</p>}
      </div>

      {filas.length > 0 && (
        <div className='rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden'>
          <div className='p-3 bg-gray-50 dark:bg-dark-surface2 text-sm font-semibold'>
            Conciliacion ({filas.length} movimientos)
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 dark:bg-dark-surface2'>
                <tr>
                  <th className='p-2 text-left'>OK</th>
                  <th className='p-2 text-left'>Fecha</th>
                  <th className='p-2 text-left'>Importe</th>
                  <th className='p-2 text-left'>Concepto</th>
                  <th className='p-2 text-left'>Alumno</th>
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
                      />
                    </td>
                    <td className='p-2'>{f.movimiento.fechaOperacion}</td>
                    <td className='p-2'>{f.movimiento.importe.toFixed(2)} EUR</td>
                    <td className='p-2 max-w-[420px] truncate' title={f.movimiento.concepto}>
                      {f.movimiento.concepto || '-'}
                    </td>
                    <td className='p-2'>
                      <select
                        value={f.alumnoId}
                        onChange={e => updateAlumno(f.movimiento.id, e.target.value)}
                        className='border rounded px-2 py-1 bg-white dark:bg-dark-surface'
                      >
                        <option value=''>Sin asignar</option>
                        {alumnos.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
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
              Seleccionados: {filas.filter(f => f.seleccionado && f.alumnoId).length}
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
