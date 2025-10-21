import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NotificacionesProfesor({ profesor }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  useEffect(() => {
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
  }, [profesor]);

  const cargarNotificaciones = async () => {
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
  };

  const marcarComoLeida = async (notificacionId) => {
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
      case 'cambio_profesor':
        return '👨‍🏫';
      case 'clase_cancelada':
        return '🚫';
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
      case 'cambio_profesor':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'clase_cancelada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

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
                      {notificacion.tipo.replace('_', ' ')}
                    </span>
                    {!notificacion.leida && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-dark-text2 mb-2">
                    {notificacion.mensaje}
                  </p>
                  
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
