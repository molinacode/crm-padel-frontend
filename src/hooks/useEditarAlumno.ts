import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';
import type { Tables, TablesUpdate } from '../types/supabase';

type Alumno = Tables<'alumnos'>;
type AlumnoForm = Pick<Alumno, 'nombre' | 'email' | 'telefono' | 'nivel' | 'activo' | 'foto_url'>;

export function useEditarAlumno(alumnoId: string) {
  const [alumno, setAlumno] = useState<AlumnoForm>({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)',
    activo: true,
    foto_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoNombre, setFotoNombre] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', alumnoId)
        .single();
      if (error) throw error;
      const alumnoData = data as Alumno;
      setAlumno({
        nombre: alumnoData.nombre || '',
        email: alumnoData.email || '',
        telefono: alumnoData.telefono || '',
        nivel: alumnoData.nivel || 'Iniciación (1)',
        activo: alumnoData.activo !== false,
        foto_url: alumnoData.foto_url || '',
      });
      setVistaPrevia(data?.foto_url || null);
      setError('');
    } catch (e) {
      setError('No se pudo cargar el alumno');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [alumnoId]);

  useEffect(() => {
    if (!alumnoId) return undefined;
    return scheduleEffectWork(() => {
      void cargar();
    });
  }, [alumnoId, cargar]);

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match('image/(jpeg|jpg|png|gif)')) {
      alert('Solo se permiten imágenes (JPG, PNG, GIF)');
      return;
    }
    setFoto(file);
    setVistaPrevia(URL.createObjectURL(file));
    setFotoNombre(file.name);
  };

  const subirFotoSiNecesario = useCallback(
    async (fotoFile: File | null, alumnoActual: AlumnoForm) => {
      if (!fotoFile) return alumnoActual.foto_url;
      const fileName = `alumno_${alumnoId}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('fotos-alumnos')
        .upload(fileName, fotoFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from('fotos-alumnos')
        .getPublicUrl(fileName);
      const nuevaUrl = data.publicUrl;
      if (alumnoActual.foto_url) {
        const oldPath = alumnoActual.foto_url.split('/fotos-alumnos/')[1];
        if (oldPath)
          await supabase.storage.from('fotos-alumnos').remove([oldPath]);
      }
      return nuevaUrl;
    },
    [alumnoId]
  );

  const guardar = useCallback(async (): Promise<{ success: boolean; error?: unknown }> => {
    setLoading(true);
    setError('');
    try {
      const fotoUrl = await subirFotoSiNecesario(foto, alumno);
      const payload: TablesUpdate<'alumnos'> = { ...alumno, foto_url: fotoUrl };
      const { error: updateError } = await supabase
        .from('alumnos')
        .update(payload)
        .eq('id', alumnoId);
      if (updateError) throw updateError;
      return { success: true };
    } catch (e) {
      console.error('Update error:', e);
      setError('Error al actualizar el alumno');
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  }, [alumnoId, alumno, foto, subirFotoSiNecesario]);

  return {
    alumno,
    setAlumno,
    loading,
    error,
    fotoNombre,
    vistaPrevia,
    handleFotoChange,
    guardar,
  };
}


