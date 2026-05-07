import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { scheduleEffectWork } from '../utils/scheduleEffectWork';

interface NotificacionesProfesorProps {
  profesor?: string | null;
}

interface NotificacionRow {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  estado?: string | null;
  leida: boolean;
  fecha_creacion: string;
  clase_id?: string | null;
  cambios_planificados?: unknown;
  cambios_aplicados?: unknown;
}

interface FormState {
  tipo: 'recordatorio' | 'anotacion';
  titulo: string;
  mensaje: string;
  alcance: 'fecha' | 'general';
  fechaObjetivo: string;
}

const getInitialFormState = (): FormState => ({
  tipo: 'recordatorio',
  titulo: '',
  mensaje: '',
  alcance: 'fecha',
  fechaObjetivo: '',
});

export default function NotificacionesProfesor({ profesor }: NotificacionesProfesorProps) {
  const [notificaciones, setNotificaciones] = useState<NotificacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [formData, setFormData] = useState<FormState>(getInitialFormState);
  const [enviandoManual, setEnviandoManual] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const cargarNotificaciones = useCallback(async () => {
    if (!profesor) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificaciones_profesor')
        .select('*')
        .eq('profesor', profesor)
        .eq('leida', false)
        .order('fecha_creacion', { ascending: false })
        .limit(mostrarTodas ? 50 : 5);
      if (error) throw error;
      setNotificaciones((data || []) as NotificacionRow[]);
    } finally {
      setLoading(false);
    }
  }, [profesor, mostrarTodas]);

  useEffect(() => {
    if (!profesor) {
      return scheduleEffectWork(() => {
        setNotificaciones([]);
        setLoading(false);
      });
    }
    const cancelLoad = scheduleEffectWork(() => {
      void cargarNotificaciones();
    });
    const subscription = supabase
      .channel('notificaciones_profesor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones_profesor', filter: `profesor=eq.${profesor}` },
        () => {
          void cargarNotificaciones();
        }
      )
      .subscribe();
    return () => {
      cancelLoad();
      subscription.unsubscribe();
    };
  }, [profesor, cargarNotificaciones]);

  const updateFormField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
    if (formSuccess) setFormSuccess('');
  };

  const crearNotificacionManual = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profesor) return;
    const mensajePlano = formData.mensaje.trim();
    if (!mensajePlano) return setFormError('Escribe un mensaje para el recordatorio.');
    if (formData.alcance === 'fecha' && !formData.fechaObjetivo) {
      return setFormError('Selecciona una fecha o marca el recordatorio como general.');
    }

    setEnviandoManual(true);
    setFormError('');
    setFormSuccess('');
    try {
      const tituloFinal = formData.titulo.trim() || (formData.tipo === 'recordatorio' ? 'Recordatorio manual' : 'Anotación manual');
      const { error } = await supabase.from('notificaciones_profesor').insert([
        {
          profesor,
          titulo: tituloFinal,
          mensaje: mensajePlano,
          tipo: formData.tipo === 'recordatorio' ? 'recordatorio_manual' : 'anotacion_manual',
          estado: 'pendiente',
          leida: false,
        },
      ]);
      if (error) throw error;
      setFormSuccess('✅ Notificación creada correctamente');
      setFormData(getInitialFormState());
      void cargarNotificaciones();
    } catch {
      setFormError('No se pudo crear la anotación. Inténtalo de nuevo.');
    } finally {
      setEnviandoManual(false);
    }
  };

  const marcarComoLeida = async (notificacionId: string) => {
    const { error } = await supabase
      .from('notificaciones_profesor')
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq('id', notificacionId);
    if (!error) setNotificaciones(prev => prev.filter(n => n.id !== notificacionId));
  };

  const marcarTodasComoLeidas = async () => {
    if (!profesor) return;
    const { error } = await supabase
      .from('notificaciones_profesor')
      .update({ leida: true, fecha_lectura: new Date().toISOString() })
      .eq('profesor', profesor)
      .eq('leida', false);
    if (!error) setNotificaciones([]);
  };

  if (!profesor) {
    return <div className='p-8 text-center'>Selecciona un profesor</div>;
  }
  if (loading) {
    return <div className='p-8 text-center'>Cargando notificaciones...</div>;
  }

  const puedeCrearNotificacion =
    formData.mensaje.trim().length > 0 &&
    (formData.alcance === 'general' || formData.fechaObjetivo.length > 0);

  return (
    <div className='space-y-4'>
      <div className='rounded-2xl border p-4'>
        <form onSubmit={crearNotificacionManual} className='space-y-3'>
          <input
            value={formData.titulo}
            onChange={e => updateFormField('titulo', e.target.value)}
            placeholder='Título'
            className='w-full border rounded-lg px-3 py-2'
          />
          <textarea
            value={formData.mensaje}
            onChange={e => updateFormField('mensaje', e.target.value)}
            rows={3}
            placeholder='Mensaje'
            className='w-full border rounded-lg px-3 py-2'
          />
          {formError && <p className='text-sm text-red-600'>{formError}</p>}
          {formSuccess && <p className='text-sm text-green-600'>{formSuccess}</p>}
          <button
            type='submit'
            disabled={!puedeCrearNotificacion || enviandoManual}
            className='px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 disabled:opacity-60'
          >
            {enviandoManual ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>

      <div className='flex items-center justify-between'>
        <h3 className='font-semibold'>Notificaciones ({notificaciones.length})</h3>
        {notificaciones.length > 0 && (
          <div className='flex gap-2'>
            <button type='button' onClick={() => setMostrarTodas(!mostrarTodas)} className='px-3 py-1 text-sm bg-blue-100 rounded-lg'>
              {mostrarTodas ? 'Ver menos' : 'Ver todas'}
            </button>
            <button type='button' onClick={marcarTodasComoLeidas} className='px-3 py-1 text-sm bg-gray-100 rounded-lg'>
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <div className='rounded-2xl border p-8 text-center'>No hay notificaciones</div>
      ) : (
        <div className='space-y-3'>
          {notificaciones.map(notificacion => (
            <div key={notificacion.id} className='p-4 rounded-xl border bg-blue-50 dark:bg-blue-900/20'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h4 className='font-medium'>{notificacion.titulo}</h4>
                  <p className='text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line'>{notificacion.mensaje}</p>
                </div>
                <button type='button' onClick={() => marcarComoLeida(notificacion.id)} className='text-sm px-2 py-1 rounded bg-white border'>
                  Marcar leída
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
