import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const getInitialFormState = () => ({
  tipo: 'recordatorio',
  titulo: '',
  mensaje: '',
  alcance: 'fecha',
  fechaObjetivo: '',
});

export default function NotificacionesProfesor({ profesor }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [formData, setFormData] = useState(getInitialFormState);
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
      setNotificaciones(data || []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [profesor, mostrarTodas]);

  useEffect(() => {
    if (!profesor) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }
    
    cargarNotificaciones();
    
    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('notificaciones_profesor')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notificaciones_profesor',
          filter: `profesor=eq.${profesor}`
        }, 
        (payload) => {
          console.log('Nueva notificación recibida:', payload);
          cargarNotificaciones();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profesor, cargarNotificaciones]);

  useEffect(() => {
    setFormData(getInitialFormState());
    setFormError('');
    setFormSuccess('');
  }, [profesor]);

  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (formError) setFormError('');
    if (formSuccess) setFormSuccess('');
  };

  const formatearFechaObjetivo = fecha => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
    } catch {
      return fecha;
    }
  };

  const crearNotificacionManual = async e => {
    e.preventDefault();
    if (!profesor) return;

    const mensajePlano = formData.mensaje.trim();
    if (!mensajePlano) {
      setFormError('Escribe un mensaje para el recordatorio.');
      return;
    }
    if (formData.alcance === 'fecha' && !formData.fechaObjetivo) {
      setFormError('Selecciona una fecha o marca el recordatorio como general.');
      return;
    }

    setEnviandoManual(true);
    setFormError('');
    setFormSuccess('');

    try {
      const descripcionAlcance =
        formData.tipo === 'recordatorio'
          ? formData.alcance === 'fecha'
            ? `📅 Recordatorio para ${formatearFechaObjetivo(formData.fechaObjetivo)}`
            : '📌 Recordatorio general'
          : formData.alcance === 'fecha'
            ? `🗓️ Nota asociada al ${formatearFechaObjetivo(formData.fechaObjetivo)}`
            : '🗒️ Anotación general';

      const mensajeFinal = [descripcionAlcance, mensajePlano].filter(Boolean).join(' · ');
      const tituloFinal =
        formData.titulo.trim() ||
        (formData.tipo === 'recordatorio'
          ? 'Recordatorio manual'
          : 'Anotación manual');

      const { error } = await supabase.from('notificaciones_profesor').insert([
        {
          profesor,
          titulo: tituloFinal,
          mensaje: mensajeFinal,
          tipo:
            formData.tipo === 'recordatorio'
              ? 'recordatorio_manual'
              : 'anotacion_manual',
          estado: 'pendiente',
          leida: false,
        },
      ]);

      if (error) throw error;

      setFormSuccess('✅ Notificación creada correctamente');
      setFormData(getInitialFormState());
      cargarNotificaciones();
    } catch (error) {
      console.error('Error creando anotación manual:', error);
      setFormError('No se pudo crear la anotación. Inténtalo de nuevo.');
    } finally {
      setEnviandoManual(false);
    }
  };

  const puedeCrearNotificacion =
    !!profesor &&
    formData.mensaje.trim().length > 0 &&
    (formData.alcance === 'general' || formData.fechaObjetivo);

  const marcarComoLeida = async notificacionId => {
    try {
      const { error } = await supabase
        .from('notificaciones_profesor')
        .update({ leida: true, fecha_lectura: new Date().toISOString() })
        .eq('id', notificacionId);

      if (error) throw error;
      
      // Actualizar estado local
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === notificacionId 
            ? { ...notif, leida: true, fecha_lectura: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const { error } = await supabase
        .from('notificaciones_profesor')
        .update({ 
          leida: true, 
          fecha_lectura: new Date().toISOString() 
        })
        .eq('profesor', profesor)
        .eq('leida', false);

      if (error) throw error;
      
      setNotificaciones([]);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'cambio_horario':
        return '🕐';
      case 'nuevo_alumno':
        return '👥';
      case 'falta_alumno':
        return '❌';
      case 'recordatorio_clase':
        return '📅';
      case 'recordatorio_manual':
        return '🗓️';
      case 'cambio_profesor':
        return '👨‍🏫';
      case 'clase_cancelada':
        return '🚫';
      case 'anotacion_manual':
        return '📝';
      default:
        return '📢';
    }
  };

  const getColorTipo = (tipo) => {
    switch (tipo) {
      case 'cambio_horario':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'nuevo_alumno':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'falta_alumno':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'recordatorio_clase':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'recordatorio_manual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'cambio_profesor':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'clase_cancelada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'anotacion_manual':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getLabelTipo = tipo => {
    switch (tipo) {
      case 'cambio_horario':
        return 'Cambio horario';
      case 'nuevo_alumno':
        return 'Nuevo alumno';
      case 'falta_alumno':
        return 'Falta alumno';
      case 'recordatorio_clase':
        return 'Recordatorio clase';
      case 'recordatorio_manual':
        return 'Recordatorio manual';
      case 'cambio_profesor':
        return 'Cambio profesor';
      case 'clase_cancelada':
        return 'Clase cancelada';
      case 'anotacion_manual':
        return 'Anotación';
      default:
        return tipo?.replaceAll('_', ' ') || 'Aviso';
    }
  };

  if (!profesor) {
    return (
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-12 text-center">
        <div className="text-6xl mb-4">👨‍🏫</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
          Selecciona un profesor
        </h3>
        <p className="text-gray-500 dark:text-dark-text2">
          Por favor, selecciona un profesor para ver sus notificaciones
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-dark-text2">Cargando notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulario para crear recordatorios/anotaciones */}
      <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-surface2 p-4">
        <form onSubmit={crearNotificacionManual} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                Crear anotación o recordatorio
              </h3>
              <p className="text-sm text-gray-500 dark:text-dark-text2">
                Se enviará al profesor <span className="font-semibold text-gray-700 dark:text-dark-text">{profesor}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {['recordatorio', 'anotacion'].map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => updateFormField('tipo', tipo)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    formData.tipo === tipo
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-dark-text border-gray-200 dark:border-dark-border hover:border-blue-400'
                  }`}
                >
                  {tipo === 'recordatorio' ? 'Recordatorio' : 'Anotación'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Alcance
              </label>
              <select
                value={formData.alcance}
                onChange={e => updateFormField('alcance', e.target.value)}
                className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fecha">Fecha concreta</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Fecha objetivo
              </label>
              <input
                type="date"
                value={formData.fechaObjetivo}
                onChange={e => updateFormField('fechaObjetivo', e.target.value)}
                disabled={formData.alcance === 'general'}
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.alcance === 'general'
                    ? 'border-gray-200 dark:border-dark-border text-gray-400 dark:text-dark-text2 cursor-not-allowed'
                    : 'border-gray-300 dark:border-dark-border'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
              Título (opcional)
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={e => updateFormField('titulo', e.target.value)}
              placeholder={formData.tipo === 'recordatorio' ? 'Ej: Recordar material extra' : 'Ej: Anotación sobre el grupo'}
              className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
              Mensaje
            </label>
            <textarea
              value={formData.mensaje}
              onChange={e => updateFormField('mensaje', e.target.value)}
              rows={3}
              placeholder="Describe el recordatorio o anotación para el profesor"
              className="w-full border border-gray-300 dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {formSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!puedeCrearNotificacion || enviandoManual}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {enviandoManual ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔔</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-dark-text">
              Notificaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text2">
              {notificaciones.length} notificaciones pendientes
            </p>
          </div>
        </div>
        
        {notificaciones.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarTodas(!mostrarTodas)}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              {mostrarTodas ? 'Ver menos' : 'Ver todas'}
            </button>
            <button
              onClick={marcarTodasComoLeidas}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>

      {/* Lista de notificaciones */}
      {notificaciones.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
            No hay notificaciones
          </h3>
          <p className="text-gray-500 dark:text-dark-text2">
            No tienes notificaciones pendientes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notificacion) => (
            <div
              key={notificacion.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                notificacion.leida 
                  ? 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-gray-900/20' 
                  : 'border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-900/20'
              }`}
              onClick={() => marcarComoLeida(notificacion.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getIconoTipo(notificacion.tipo)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-dark-text">
                      {notificacion.titulo}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getColorTipo(notificacion.tipo)}`}>
                      {getLabelTipo(notificacion.tipo)}
                    </span>
                    {!notificacion.leida && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-dark-text2 mb-2 whitespace-pre-line">
                    {notificacion.mensaje}
                  </p>
                  
                  {/* Mostrar cambios planificados vs aplicados si existen */}
                  {notificacion.cambios_planificados && (
                    <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                      <div className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                        📋 Cambios Planificados:
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-400">
                        {typeof notificacion.cambios_planificados === 'string' 
                          ? notificacion.cambios_planificados
                          : (() => {
                              try {
                                const parsed = typeof notificacion.cambios_planificados === 'object' 
                                  ? notificacion.cambios_planificados 
                                  : JSON.parse(notificacion.cambios_planificados);
                                return Object.entries(parsed).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ));
                              } catch {
                                return JSON.stringify(notificacion.cambios_planificados, null, 2);
                              }
                            })()}
                      </div>
                    </div>
                  )}
                  
                  {notificacion.cambios_aplicados && (
                    <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                      <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                        ✅ Cambios Aplicados:
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-400">
                        {typeof notificacion.cambios_aplicados === 'string'
                          ? notificacion.cambios_aplicados
                          : (() => {
                              try {
                                const parsed = typeof notificacion.cambios_aplicados === 'object'
                                  ? notificacion.cambios_aplicados
                                  : JSON.parse(notificacion.cambios_aplicados);
                                return Object.entries(parsed).map(([key, value]) => (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ));
                              } catch {
                                return JSON.stringify(notificacion.cambios_aplicados, null, 2);
                              }
                            })()}
                      </div>
                    </div>
                  )}
                  
                  {notificacion.estado === 'pendiente' && (
                    <div className="mb-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                      <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                        ⏳ Estado: Pendiente de confirmación
                      </div>
                    </div>
                  )}
                  
                  {notificacion.estado === 'aplicado' && (
                    <div className="mb-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                      <div className="text-xs font-medium text-green-800 dark:text-green-300">
                        ✅ Estado: Cambio aplicado
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-text2">
                    <span>
                      📅 {new Date(notificacion.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {notificacion.clase_id && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        Clase ID: {notificacion.clase_id}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    marcarComoLeida(notificacion.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
