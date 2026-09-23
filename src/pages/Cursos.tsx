import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/shared';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import {
  abrirCurso,
  cerrarCurso,
  clasesDelCurso,
  listarCursos,
  resumenCierre,
  type ClaseCopiable,
  type Curso,
  type ResumenCierre,
} from '../services/cursoService';

export default function Cursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [resumen, setResumen] = useState<ResumenCierre | null>(null);
  const [clases, setClases] = useState<ClaseCopiable[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const lista = await listarCursos();
    setCursos(lista);
    const abierto = lista.find(curso => curso.estado === 'abierto') || null;
    if (abierto) {
      setResumen(await resumenCierre(abierto.id));
      setClases([]);
      return;
    }
    setResumen(null);
    const cerrado = lista.find(curso => curso.estado === 'cerrado');
    if (!cerrado) {
      setClases([]);
      return;
    }
    const copiables = await clasesDelCurso(cerrado.id);
    setClases(copiables);
    setElegidas(copiables.map(clase => clase.id));
  }, []);

  useEffect(() => {
    return scheduleEffectWork(() => {
      void cargar().catch(err => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los cursos');
      });
    });
  }, [cargar]);

  const abierto = cursos.find(curso => curso.estado === 'abierto') || null;

  const onCerrar = async () => {
    if (!abierto) return;
    const confirmar = window.confirm(
      `Se cierra «${abierto.nombre}». Las deudas siguen visibles y se pueden seguir registrando pagos de esos meses.`
    );
    if (!confirmar) return;
    setOcupado(true);
    setError('');
    try {
      await cerrarCurso(abierto.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar el curso');
    } finally {
      setOcupado(false);
    }
  };

  const onAbrir = async () => {
    setOcupado(true);
    setError('');
    try {
      await abrirCurso({
        nombre,
        fechaInicio,
        fechaFin,
        claseIds: elegidas,
      });
      setNombre('');
      setFechaInicio('');
      setFechaFin('');
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el curso');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Cursos'
        subtitle='Cierra el curso cuando los pagos estén al día y abre el siguiente'
      />

      {error && <p className='text-sm text-red-600'>{error}</p>}

      <div className='space-y-3'>
        {cursos.map(curso => (
          <div
            key={curso.id}
            className='rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface'
          >
            <div className='font-semibold text-gray-900 dark:text-dark-text'>{curso.nombre}</div>
            <div className='text-sm text-gray-600 dark:text-dark-text2'>
              {curso.fecha_inicio} → {curso.fecha_fin} · {curso.estado}
            </div>
          </div>
        ))}
        {cursos.length === 0 && !error && (
          <p className='text-sm text-gray-600 dark:text-dark-text2'>No hay cursos todavía.</p>
        )}
      </div>

      {abierto && resumen && (
        <section className='space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-dark-text'>
            Cerrar {abierto.nombre}
          </h2>
          <p className='text-sm text-gray-600 dark:text-dark-text2'>
            {resumen.clases} clases. Último evento: {resumen.ultimoEvento || 'ninguno'}. Alumnos
            activos que pasarían al siguiente: {resumen.alumnosQueSiguen}.
          </p>
          {resumen.porMes.length === 0 ? (
            <p className='text-sm text-gray-600 dark:text-dark-text2'>
              No hay meses de escuela sin pago en este curso.
            </p>
          ) : (
            <ul className='space-y-1 text-sm text-gray-800 dark:text-dark-text'>
              {resumen.porMes.map(mes => (
                <li key={mes.mes}>
                  {mes.etiqueta}: {mes.alumnos} sin pago
                </li>
              ))}
            </ul>
          )}
          <button
            type='button'
            onClick={() => void onCerrar()}
            disabled={ocupado}
            className='rounded-lg bg-[#0e1410] px-4 py-2 text-sm font-semibold text-[#f5f1e8] disabled:opacity-50'
          >
            Cerrar curso
          </button>
        </section>
      )}

      {!abierto && (
        <section className='space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-dark-text'>
            Abrir curso
          </h2>
          <p className='text-sm text-gray-600 dark:text-dark-text2'>
            No hay curso abierto. Las deudas del curso cerrado siguen en Pagos.
          </p>
          <input
            className='input w-full'
            placeholder='Nombre, por ejemplo Curso 2026-2027'
            value={nombre}
            onChange={event => setNombre(event.target.value)}
          />
          <div className='grid gap-3 sm:grid-cols-2'>
            <input
              type='date'
              className='input w-full'
              value={fechaInicio}
              onChange={event => setFechaInicio(event.target.value)}
            />
            <input
              type='date'
              className='input w-full'
              value={fechaFin}
              onChange={event => setFechaFin(event.target.value)}
            />
          </div>
          {clases.length > 0 && (
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-800 dark:text-dark-text'>
                Clases que se copian, con sus alumnos activos
              </p>
              {clases.map(clase => (
                <label key={clase.id} className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={elegidas.includes(clase.id)}
                    onChange={event => {
                      setElegidas(actual =>
                        event.target.checked
                          ? [...actual, clase.id]
                          : actual.filter(id => id !== clase.id)
                      );
                    }}
                  />
                  <span>
                    {clase.nombre || 'Sin nombre'} · {clase.dia_semana} {clase.hora_inicio}
                  </span>
                </label>
              ))}
            </div>
          )}
          <button
            type='button'
            onClick={() => void onAbrir()}
            disabled={ocupado}
            className='rounded-lg bg-[#c9a658] px-4 py-2 text-sm font-semibold text-[#0e1410] disabled:opacity-50'
          >
            Abrir curso
          </button>
        </section>
      )}
    </div>
  );
}
