import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/shared';
import PageHeader from '../components/shared/PageHeader';
import { useMiProfesor } from '../hooks/useMiProfesor';

interface AlumnoClase {
  id: string;
  nombre: string;
  nivel: string;
  clase: string;
}

export default function ProfesorAlumnos() {
  const { nombres, propio, loading: cargandoProfesor } = useMiProfesor();
  const [alumnos, setAlumnos] = useState<AlumnoClase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cargandoProfesor) return;
    if (!propio || nombres.length === 0) {
      setAlumnos([]);
      setLoading(false);
      return;
    }
    let activo = true;
    void (async () => {
      setLoading(true);
      const { data: clases } = await supabase.from('clases').select('id, nombre, nivel_clase, profesor');
      const suyas = (clases || []).filter(clase => nombres.includes(String(clase.profesor || '')));
      const ids = suyas.map(clase => clase.id);
      if (ids.length === 0) {
        if (activo) {
          setAlumnos([]);
          setLoading(false);
        }
        return;
      }
      const { data: asignaciones } = await supabase
        .from('alumnos_clases')
        .select('clase_id, alumnos (id, nombre, nivel)')
        .in('clase_id', ids);
      const vistos = new Set<string>();
      const filas: AlumnoClase[] = [];
      for (const fila of asignaciones || []) {
        const alumno = fila.alumnos;
        if (!alumno || vistos.has(`${alumno.id}-${fila.clase_id}`)) continue;
        vistos.add(`${alumno.id}-${fila.clase_id}`);
        const clase = suyas.find(item => item.id === fila.clase_id);
        filas.push({
          id: `${alumno.id}-${fila.clase_id}`,
          nombre: alumno.nombre,
          nivel: alumno.nivel || clase?.nivel_clase || '',
          clase: clase?.nombre || '',
        });
      }
      filas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      if (activo) {
        setAlumnos(filas);
        setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [cargandoProfesor, propio, nombres]);

  if (cargandoProfesor || loading) {
    return <LoadingSpinner size='large' text='Cargando tus alumnos...' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader title='Mis alumnos' subtitle='Solo los de tus clases. Sin pagos ni edición.' />
      {alumnos.length === 0 ? (
        <p className='text-[#8c8678]'>No hay alumnos en tus clases.</p>
      ) : (
        <div className='overflow-x-auto rounded-lg border border-[#2a332c]'>
          <table className='w-full text-left text-sm'>
            <thead className='text-[#8c8678]'>
              <tr>
                <th className='px-4 py-3 font-medium'>Alumno</th>
                <th className='px-4 py-3 font-medium'>Nivel</th>
                <th className='px-4 py-3 font-medium'>Clase</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map(alumno => (
                <tr key={alumno.id} className='border-t border-[#2a332c] text-[#f5f1e8]'>
                  <td className='px-4 py-3'>{alumno.nombre}</td>
                  <td className='px-4 py-3'>{alumno.nivel || '—'}</td>
                  <td className='px-4 py-3'>{alumno.clase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
