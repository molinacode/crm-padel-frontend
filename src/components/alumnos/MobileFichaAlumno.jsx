import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFichaAlumnoData } from '../../hooks/useFichaAlumnoData';
import { LoadingSpinner } from '@shared';
import MobileTabsSelector from '../common/MobileTabsSelector';
import { supabase } from '../../lib/supabase';

export default function MobileFichaAlumno({ alumnoId, isOpen, onClose }) {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState('datos');
  
  const {
    alumno,
    clases,
    pagos,
    asistencias,
    recuperaciones,
    loading,
    error,
    recargar,
  } = useFichaAlumnoData(alumnoId);

  const fotoUrl = useMemo(() => {
    if (!alumno) return null;
    return (
      alumno.foto_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(alumno.nombre || 'Alumno')}&background=random&color=fff&size=128`
    );
  }, [alumno]);

  const tabs = useMemo(() => [
    {
      key: 'datos',
      label: 'Datos Personales',
      icon: '👤',
    },
    {
      key: 'clases',
      label: `Clases (${Array.isArray(clases) ? clases.length : 0})`,
      icon: '📚',
    },
    {
      key: 'pagos',
      label: `Pagos (${Array.isArray(pagos) ? pagos.length : 0})`,
      icon: '💸',
    },
    {
      key: 'asistencias',
      label: `Asistencias (${Array.isArray(asistencias) ? asistencias.length : 0})`,
      icon: '📅',
    },
    {
      key: 'recuperaciones',
      label: `Recuperaciones (${Array.isArray(recuperaciones) ? recuperaciones.length : 0})`,
      icon: '🔄',
    },
  ], [clases, pagos, asistencias, recuperaciones]);

  const handleDesasignarClase = async (claseId) => {
    if (!confirm('¿Estás seguro de que quieres desasignar este alumno de la clase?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('alumnos_clases')
        .delete()
        .eq('alumno_id', alumnoId)
        .eq('clase_id', claseId);

      if (error) throw error;
      alert('✅ Alumno desasignado de la clase correctamente');
      recargar();
    } catch (err) {
      console.error('Error desasignando clase:', err);
      alert('❌ Error al desasignar la clase: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300'
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* Modal Full Screen */}
      <div
        className='fixed inset-0 bg-white dark:bg-dark-surface z-[9999] overflow-y-auto'
        style={{ zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='sticky top-0 bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border z-10'>
          <div className='flex items-center justify-between p-4'>
            <button
              onClick={onClose}
              className='p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
            <h2 className='text-lg font-bold text-gray-900 dark:text-dark-text'>
              Ficha del Alumno
            </h2>
            <button
              onClick={() => navigate(`/editar-alumno/${alumnoId}`)}
              className='p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4'>
          {loading ? (
            <div className='flex items-center justify-center min-h-[400px]'>
              <LoadingSpinner size='large' text='Cargando datos del alumno...' />
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>❌</div>
              <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                Error al cargar datos
              </h3>
              <p className='text-gray-600 dark:text-dark-text2 mb-6'>{error}</p>
              <button
                onClick={recargar}
                className='px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium'
              >
                🔄 Reintentar
              </button>
            </div>
          ) : !alumno ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>❓</div>
              <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                Alumno no encontrado
              </h3>
            </div>
          ) : (
            <>
              {/* Header del Alumno */}
              <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-6 mb-4'>
                <div className='flex items-center gap-4'>
                  {fotoUrl && (
                    <img
                      src={fotoUrl}
                      alt={alumno.nombre || 'Alumno'}
                      className='w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700'
                    />
                  )}
                  <div className='flex-1'>
                    <h3 className='text-2xl font-bold text-gray-900 dark:text-dark-text mb-1'>
                      {alumno.nombre || 'Sin nombre'}
                    </h3>
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {alumno.nivel && (
                        <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium'>
                          🎯 {alumno.nivel}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          alumno.activo === false
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}
                      >
                        {alumno.activo === false ? '❌ Inactivo' : '✅ Activo'}
                      </span>
                    </div>
                    {alumno.email && (
                      <p className='text-sm text-gray-600 dark:text-dark-text2 mt-2'>
                        📧 {alumno.email}
                      </p>
                    )}
                    {alumno.telefono && (
                      <p className='text-sm text-gray-600 dark:text-dark-text2'>
                        📱 {alumno.telefono}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Selector */}
              <MobileTabsSelector
                tabs={tabs}
                activeTab={tabActiva}
                onTabChange={setTabActiva}
                className='mb-4'
              />

              {/* Tab Content */}
              <div className='mt-4'>
                {tabActiva === 'datos' && (
                  <div className='space-y-4'>
                    <div className='bg-white dark:bg-dark-surface2 rounded-xl p-4 border border-gray-200 dark:border-dark-border'>
                      <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-3'>
                        Información Personal
                      </h4>
                      <div className='space-y-2 text-sm'>
                        {alumno.email && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-dark-text2'>Email:</span>
                            <span className='text-gray-900 dark:text-dark-text font-medium'>{alumno.email}</span>
                          </div>
                        )}
                        {alumno.telefono && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-dark-text2'>Teléfono:</span>
                            <span className='text-gray-900 dark:text-dark-text font-medium'>{alumno.telefono}</span>
                          </div>
                        )}
                        {alumno.nivel && (
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-dark-text2'>Nivel:</span>
                            <span className='text-gray-900 dark:text-dark-text font-medium'>{alumno.nivel}</span>
                          </div>
                        )}
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-dark-text2'>Estado:</span>
                          <span className={`font-medium ${alumno.activo === false ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {alumno.activo === false ? 'Inactivo' : 'Activo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {alumno.dias_disponibles && Array.isArray(alumno.dias_disponibles) && alumno.dias_disponibles.length > 0 && (
                      <div className='bg-white dark:bg-dark-surface2 rounded-xl p-4 border border-gray-200 dark:border-dark-border'>
                        <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-3'>
                          📅 Disponibilidad
                        </h4>
                        <div className='space-y-2 text-sm'>
                          <div>
                            <span className='text-gray-600 dark:text-dark-text2'>Días: </span>
                            <span className='text-gray-900 dark:text-dark-text font-medium'>
                              {alumno.dias_disponibles.join(', ')}
                            </span>
                          </div>
                          {alumno.horarios_disponibles && Array.isArray(alumno.horarios_disponibles) && alumno.horarios_disponibles.length > 0 && (
                            <div>
                              <span className='text-gray-600 dark:text-dark-text2'>Horarios:</span>
                              <ul className='list-disc list-inside ml-2 mt-1 space-y-1'>
                                {alumno.horarios_disponibles.map((horario, index) => (
                                  <li key={index} className='text-gray-900 dark:text-dark-text'>
                                    {horario?.hora_inicio || ''} - {horario?.hora_fin || ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tabActiva === 'clases' && (
                  <div className='space-y-3'>
                    {Array.isArray(clases) && clases.length === 0 ? (
                      <div className='text-center py-12 bg-white dark:bg-dark-surface2 rounded-xl border border-gray-200 dark:border-dark-border'>
                        <div className='text-6xl mb-4'>📚</div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                          No hay clases asignadas
                        </h3>
                        <p className='text-gray-500 dark:text-dark-text2 mb-6'>
                          Este alumno no tiene clases asignadas actualmente
                        </p>
                        <button
                          onClick={() => {
                            onClose();
                            navigate('/clases?tab=asignar');
                          }}
                          className='px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium'
                        >
                          ➕ Asignar primera clase
                        </button>
                      </div>
                    ) : (
                      Array.isArray(clases) && clases.map((clase) => (
                        <div
                          key={clase.id}
                          className='bg-white dark:bg-dark-surface2 rounded-xl p-4 border border-gray-200 dark:border-dark-border'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                                {clase.nombre || 'Clase sin nombre'}
                              </h4>
                              <div className='flex flex-wrap gap-2 mt-2'>
                                {clase.nivel_clase && (
                                  <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs'>
                                    {clase.nivel_clase}
                                  </span>
                                )}
                                {clase.tipo_clase && (
                                  <span className='px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs'>
                                    {clase.tipo_clase}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDesasignarClase(clase.id)}
                              className='p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg'
                              title='Desasignar clase'
                            >
                              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tabActiva === 'pagos' && (
                  <div className='space-y-3'>
                    {Array.isArray(pagos) && pagos.length === 0 ? (
                      <div className='text-center py-12 bg-white dark:bg-dark-surface2 rounded-xl border border-gray-200 dark:border-dark-border'>
                        <div className='text-6xl mb-4'>💸</div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                          No hay pagos registrados
                        </h3>
                        <p className='text-gray-500 dark:text-dark-text2'>
                          Este alumno no tiene pagos registrados
                        </p>
                      </div>
                    ) : (
                      Array.isArray(pagos) && pagos.map((pago) => (
                        <div
                          key={pago.id}
                          className='bg-white dark:bg-dark-surface2 rounded-xl p-4 border border-gray-200 dark:border-dark-border'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center'>
                                <span className='text-green-600 dark:text-green-400 text-xl'>💰</span>
                              </div>
                              <div>
                                <p className='font-semibold text-gray-900 dark:text-dark-text text-lg'>
                                  €{pago.cantidad || 0}
                                </p>
                                <p className='text-sm text-gray-600 dark:text-dark-text2'>
                                  {pago.mes_cubierto || 'Sin mes'}
                                </p>
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className='text-sm text-gray-500 dark:text-dark-text2'>
                                {pago.fecha_pago
                                  ? new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                    })
                                  : 'Sin fecha'}
                              </p>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mt-1'>
                                ✅ Pagado
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tabActiva === 'asistencias' && (
                  <div className='space-y-3'>
                    {Array.isArray(asistencias) && asistencias.length === 0 ? (
                      <div className='text-center py-12 bg-white dark:bg-dark-surface2 rounded-xl border border-gray-200 dark:border-dark-border'>
                        <div className='text-6xl mb-4'>📅</div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                          No hay asistencias registradas
                        </h3>
                        <p className='text-gray-500 dark:text-dark-text2'>
                          Este alumno no tiene asistencias registradas
                        </p>
                      </div>
                    ) : (
                      Array.isArray(asistencias) && asistencias.map((asistencia) => (
                        <div
                          key={asistencia.id}
                          className='bg-white dark:bg-dark-surface2 rounded-xl p-4 border border-gray-200 dark:border-dark-border'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <p className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                                {asistencia.fecha
                                  ? new Date(asistencia.fecha).toLocaleDateString('es-ES', {
                                      weekday: 'long',
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                    })
                                  : 'Sin fecha'}
                              </p>
                              <p className='text-sm text-gray-600 dark:text-dark-text2 mb-2'>
                                {asistencia.clases?.nombre || 'Clase eliminada'}
                              </p>
                              <div className='flex flex-wrap gap-2'>
                                {asistencia.presente ? (
                                  <span className='px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium'>
                                    ✅ Presente
                                  </span>
                                ) : asistencia.justificada ? (
                                  <span className='px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium'>
                                    ⚠️ Justificada
                                  </span>
                                ) : (
                                  <span className='px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium'>
                                    ❌ Falta
                                  </span>
                                )}
                                {asistencia.esRecuperacion && (
                                  <span className='px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium'>
                                    🔄 Recuperación
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tabActiva === 'recuperaciones' && (
                  <div className='space-y-3'>
                    {Array.isArray(recuperaciones) && recuperaciones.length === 0 ? (
                      <div className='text-center py-12 bg-white dark:bg-dark-surface2 rounded-xl border border-gray-200 dark:border-dark-border'>
                        <div className='text-6xl mb-4'>🔄</div>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-dark-text mb-2'>
                          No hay recuperaciones pendientes
                        </h3>
                        <p className='text-gray-500 dark:text-dark-text2'>
                          Este alumno no tiene clases pendientes de recuperación
                        </p>
                      </div>
                    ) : (
                      Array.isArray(recuperaciones) && recuperaciones.map((recuperacion) => (
                        <div
                          key={recuperacion.id || Math.random()}
                          className='bg-white dark:bg-dark-surface2 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800'
                        >
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex-1'>
                              <h4 className='font-semibold text-gray-900 dark:text-dark-text mb-1'>
                                {recuperacion.clases?.nombre || 'Clase eliminada'}
                              </h4>
                              <p className='text-sm text-gray-600 dark:text-dark-text2'>
                                Falta: {recuperacion.fecha_falta
                                  ? new Date(recuperacion.fecha_falta).toLocaleDateString('es-ES')
                                  : 'Sin fecha'}
                              </p>
                              {recuperacion.fecha_recuperacion && (
                                <p className='text-sm text-green-600 dark:text-green-400 mt-1'>
                                  ✅ Recuperada: {new Date(recuperacion.fecha_recuperacion).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                            {recuperacion.estado === 'pendiente' && (
                              <span className='px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium'>
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

