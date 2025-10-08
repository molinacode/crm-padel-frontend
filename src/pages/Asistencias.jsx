import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSincronizacionAsignaciones } from '../hooks/useSincronizacionAsignaciones';

export default function Asistencias() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [clases, setClases] = useState([]);
  const [alumnosPorClase, setAlumnosPorClase] = useState({});
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(true);

  // 🆕 Hook para sincronización de asignaciones
  const {
    sincronizando,
    sincronizarAsignacionesDelDia,
    restaurarAsignacion
  } = useSincronizacionAsignaciones();

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar eventos del día seleccionado (excluyendo eliminados y cancelados)
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_clase')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            estado,
            clases (id, nombre, nivel_clase, tipo_clase, profesor)
          `)
          .eq('fecha', fecha)
          .neq('estado', 'eliminado')
          .neq('estado', 'cancelada');

        if (eventosError) throw eventosError;

        // Cargar alumnos por clase
        const { data: asignacionesData, error: asignacionesError } = await supabase
          .from('alumnos_clases')
          .select('clase_id, alumno_id, alumnos (nombre)');

        if (asignacionesError) throw asignacionesError;

        const alumnosMap = {};
        asignacionesData.forEach(ac => {
          if (!alumnosMap[ac.clase_id]) {
            alumnosMap[ac.clase_id] = [];
          }
          alumnosMap[ac.clase_id].push({
            id: ac.alumno_id,
            nombre: ac.alumnos.nombre
          });
        });

        // Cargar asistencias del día
        const { data: asistenciasData, error: asistenciasError } = await supabase
          .from('asistencias')
          .select('id, alumno_id, clase_id, estado')
          .eq('fecha', fecha);

        if (asistenciasError) throw asistenciasError;

        const asistenciasMap = {};
        asistenciasData.forEach(a => {
          if (!asistenciasMap[a.clase_id]) {
            asistenciasMap[a.clase_id] = {};
          }
          asistenciasMap[a.clase_id][a.alumno_id] = a.estado;
        });

        setClases(eventosData || []);
        setAlumnosPorClase(alumnosMap);
        setAsistencias(asistenciasMap);
      } catch (err) {
        console.error('Error:', err);
        alert('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (fecha) cargarDatos();
  }, [fecha]);

  const handleCambioEstado = async (claseId, alumnoId, nuevoEstado) => {
    try {
      // Actualizar estado local inmediatamente
      setAsistencias(prev => ({
        ...prev,
        [claseId]: {
          ...prev[claseId],
          [alumnoId]: nuevoEstado
        }
      }));

      // Verificar si ya existe
      const { data: existente, error: selectError } = await supabase
        .from('asistencias')
        .select('id')
        .eq('alumno_id', alumnoId)
        .eq('clase_id', claseId)
        .eq('fecha', fecha)
        .maybeSingle();

      if (selectError) {
        console.error('Error verificando asistencia:', selectError);
        alert('Error al verificar la asistencia');
        return;
      }

      if (existente) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from('asistencias')
          .update({ estado: nuevoEstado })
          .eq('id', existente.id);

        if (updateError) {
          console.error('Error actualizando asistencia:', updateError);
          alert('Error al actualizar la asistencia');
          return;
        }
      } else {
        // Crear nuevo registro
        const { error: insertError } = await supabase
          .from('asistencias')
          .insert([{ alumno_id: alumnoId, clase_id: claseId, fecha, estado: nuevoEstado }]);

        if (insertError) {
          console.error('Error creando asistencia:', insertError);
          alert('Error al registrar la asistencia');
          return;
        }
      }

      // 🆕 SINCRONIZACIÓN AUTOMÁTICA CON ASIGNACIONES
      if (nuevoEstado === 'justificada') {
        console.log('🔄 Sincronizando asignaciones por falta justificada...');

        // Usar el hook de sincronización
        const resultado = await sincronizarAsignacionesDelDia(fecha);

        if (resultado.success) {
          console.log('✅ Sincronización completada');
          alert('✅ Falta justificada registrada. Las asignaciones se han sincronizado automáticamente.');
        } else {
          console.error('Error en sincronización:', resultado.error);
          alert('⚠️ Falta justificada registrada, pero hubo un problema con la sincronización de asignaciones.');
        }
      } else if (nuevoEstado === 'asistio') {
        // Si el alumno vuelve a asistir, restaurar asignación
        console.log('🔄 Restaurando asignación...');

        const resultado = await restaurarAsignacion(alumnoId, claseId, fecha);

        if (resultado.success) {
          console.log('✅ Asignación restaurada');
        } else {
          console.error('Error restaurando asignación:', resultado.error);
        }
      }

      console.log('✅ Asistencia actualizada correctamente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al actualizar la asistencia');
    }
  };

  if (loading) return <p className="text-center py-8 text-gray-700 dark:text-dark-text">Cargando asistencias...</p>;

  return (
    <div className="space-y-8">
      {/* Header estandarizado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
                Asistencia Diaria
              </h1>
              <p className="text-gray-600 dark:text-dark-text2">
                Control de asistencia de alumnos por clase
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-dark-text2">Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
            />
            {sincronizando && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizando asignaciones...
              </div>
            )}
          </div>
        </div>
      </div>

      {clases.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface p-12 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border text-center">
          <div className="bg-gray-100 dark:bg-gray-800/30 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-2">No hay clases programadas</h3>
          <p className="text-gray-500 dark:text-dark-text2 text-lg mb-2">Para la fecha seleccionada</p>
          <p className="text-gray-400 dark:text-dark-text2 text-sm">Selecciona otra fecha para ver las asistencias</p>
        </div>
      ) : (
        clases.map(evento => {
          const clase = evento.clases;
          const alumnos = alumnosPorClase[clase.id] || [];
          const asistenciasClase = asistencias[clase.id] || {};
          const esClaseParticular = clase.tipo_clase === 'particular';

          return (
            <div key={evento.id} className="card mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{clase.nombre}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-600">
                      🕐 {evento.hora_inicio} - {evento.hora_fin}
                    </span>
                    <span className="text-sm text-gray-600">
                      📚 {clase.nivel_clase}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${esClaseParticular
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {esClaseParticular ? '🎯 Particular' : '👥 Grupal'}
                    </span>
                  </div>
                  {clase.profesor && (
                    <p className="text-sm text-gray-500 mt-1">👨‍🏫 {clase.profesor}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {alumnos.length}/{esClaseParticular ? '1' : '4'} alumnos
                  </p>
                </div>
              </div>

              {alumnos.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No hay alumnos asignados a esta clase</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-hover-custom">
                    <thead className="bg-gray-50 dark:bg-dark-surface2">
                      <tr>
                        <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-dark-text">Alumno</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-dark-text">Estado</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-dark-text">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map(alumno => (
                        <tr key={alumno.id} className="border-b border-gray-100 dark:border-dark-border">
                          <td className="py-3 px-2">
                            <div className="font-medium text-gray-800">{alumno.nombre}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${asistenciasClase[alumno.id] === 'asistio'
                              ? 'bg-green-100 text-green-800'
                              : asistenciasClase[alumno.id] === 'falta'
                                ? 'bg-red-100 text-red-800'
                                : asistenciasClase[alumno.id] === 'justificada'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                              {asistenciasClase[alumno.id] === 'asistio'
                                ? '✅ Asistió'
                                : asistenciasClase[alumno.id] === 'falta'
                                  ? '❌ Falta'
                                  : asistenciasClase[alumno.id] === 'justificada'
                                    ? '⚠️ Justificada'
                                    : '⏳ Pendiente'
                              }
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <select
                              value={asistenciasClase[alumno.id] || ''}
                              onChange={e => handleCambioEstado(clase.id, alumno.id, e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Seleccionar...</option>
                              <option value="asistio">✅ Asistió</option>
                              <option value="falta">❌ Falta</option>
                              <option value="justificada">⚠️ Justificada</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}