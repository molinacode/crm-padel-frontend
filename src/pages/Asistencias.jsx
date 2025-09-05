import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Asistencias() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [clases, setClases] = useState([]);
  const [alumnosPorClase, setAlumnosPorClase] = useState({});
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar eventos del día seleccionado
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos_clase')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            clases (id, nombre, nivel_clase, tipo_clase, profesor)
          `)
          .eq('fecha', fecha);

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

      console.log('✅ Asistencia actualizada correctamente');
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al actualizar la asistencia');
    }
  };

  if (loading) return <p className="text-center py-8">Cargando asistencias...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📋 Asistencia Diaria</h2>
      <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input mb-6" />

      {clases.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No hay clases programadas para esta fecha</p>
          <p className="text-gray-400 text-sm mt-2">Selecciona otra fecha para ver las asistencias</p>
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
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      esClaseParticular
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Alumno</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Estado</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map(alumno => (
                        <tr key={alumno.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="font-medium text-gray-800">{alumno.nombre}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              asistenciasClase[alumno.id] === 'asistio'
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