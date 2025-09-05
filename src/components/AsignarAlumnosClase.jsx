import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AsignarAlumnosClase({ claseId, tipoClase = 'grupal' }) {
  const [alumnos, setAlumnos] = useState([]);
  const [asignados, setAsignados] = useState(new Set());
  const [maxAlcanzado, setMaxAlcanzado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const esClaseParticular = tipoClase === 'particular';
  const maxAlumnos = esClaseParticular ? 1 : 4;

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [alumnosRes, asignadosRes] = await Promise.all([
          supabase.from('alumnos').select('*'),
          supabase.from('alumnos_clases').select('*')
        ]);

        if (alumnosRes.error) throw alumnosRes.error;
        if (asignadosRes.error) throw asignadosRes.error;

        setAlumnos(alumnosRes.data);

        const asignadosSet = new Set(
          asignadosRes.data
            .filter(ac => ac.clase_id === claseId)
            .map(ac => ac.alumno_id)
        );

        setAsignados(asignadosSet);
        setMaxAlcanzado(asignadosSet.size >= maxAlumnos);
      } catch (err) {
        console.error('Error cargando datos:', err);
        alert('No se pudieron cargar los alumnos');
      } finally {
        setLoading(false);
      }
    };

    if (claseId) cargarDatos();
  }, [claseId]);

  const toggleAlumno = async (alumnoId) => {
    const estaAsignado = asignados.has(alumnoId);
    const nuevaCantidad = estaAsignado ? asignados.size - 1 : asignados.size + 1;

    if (!estaAsignado && nuevaCantidad > maxAlumnos) {
      alert(`❌ Máximo ${maxAlumnos} alumno${maxAlumnos > 1 ? 's' : ''} por clase ${esClaseParticular ? 'particular' : 'grupal'}`);
      return;
    }

    try {
      let error;
      if (estaAsignado) {
        // Desasignar
        const { error: deleteError } = await supabase
          .from('alumnos_clases')
          .delete()
          .eq('alumno_id', alumnoId)
          .eq('clase_id', claseId);
        error = deleteError;
      } else {
        // Asignar
        const { error: insertError } = await supabase
          .from('alumnos_clases')
          .insert([{ alumno_id: alumnoId, clase_id: claseId }]);
        error = insertError;
      }

      if (error) {
        console.error('Error en asignación:', error);
        alert('❌ Error al actualizar asignación');
        return;
      }

      // Actualiza estado local
      const nuevosAsignados = new Set(asignados);
      estaAsignado ? nuevosAsignados.delete(alumnoId) : nuevosAsignados.add(alumnoId);
      setAsignados(nuevosAsignados);
      setMaxAlcanzado(nuevosAsignados.size >= maxAlumnos);
    } catch (err) {
      console.error('Error inesperado:', err);
      alert('❌ Error de conexión');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Cargando alumnos...</p>;

  return (
    <div className="card mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">👥 Asignar Alumnos</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {asignados.size}/{maxAlumnos} alumno{maxAlumnos > 1 ? 's' : ''} asignado{maxAlumnos > 1 ? 's' : ''}
          </span>
          {esClaseParticular && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              🎯 Particular
            </span>
          )}
          <button
            onClick={() => setShowModal(!showModal)}
            className="btn-secondary text-sm"
          >
            {showModal ? '📋 Ocultar Lista' : '📋 Ver Lista'}
          </button>
        </div>
      </div>

      {/* Resumen de alumnos asignados */}
      <div className="mb-4">
        {asignados.size > 0 ? (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Alumnos asignados ({asignados.size}/{maxAlumnos}):
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(asignados).map(alumnoId => {
                const alumno = alumnos.find(a => a.id === alumnoId);
                return (
                  <span
                    key={alumnoId}
                    className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1"
                  >
                    <span>{alumno?.nombre}</span>
                    <button
                      onClick={() => toggleAlumno(alumnoId)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay alumnos asignados a esta clase.</p>
        )}
      </div>

      {/* Lista desplegable de alumnos */}
      {showModal && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Seleccionar Alumnos</h4>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Cerrar
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {alumnos.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay alumnos registrados.</p>
            ) : (
              alumnos.map(alumno => (
                <label
                  key={alumno.id}
                  className={`flex items-center space-x-2 cursor-pointer p-2 rounded ${
                    asignados.has(alumno.id) 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={asignados.has(alumno.id)}
                    onChange={() => toggleAlumno(alumno.id)}
                    disabled={!asignados.has(alumno.id) && asignados.size >= maxAlumnos}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="flex-1">{alumno.nombre}</span>
                  {asignados.has(alumno.id) && (
                    <span className="text-xs text-blue-600 font-medium">✓ Asignado</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Estado de la clase */}
      <div className="mt-4">
        {maxAlcanzado ? (
          <div className={`border rounded-lg p-3 ${
            esClaseParticular 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <p className={`text-sm flex items-center ${
              esClaseParticular 
                ? 'text-purple-700' 
                : 'text-green-700'
            }`}>
              ✅ <span className="ml-2">
                {esClaseParticular 
                  ? 'Clase particular completa (1/1 alumno)' 
                  : `Clase completa (${maxAlumnos}/${maxAlumnos} alumnos)`
                }
              </span>
            </p>
          </div>
        ) : (
          <div className={`border rounded-lg p-3 ${
            esClaseParticular 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-sm ${
              esClaseParticular 
                ? 'text-purple-700' 
                : 'text-yellow-700'
            }`}>
              ⚠️ <span className="ml-2">
                {esClaseParticular 
                  ? 'Clase particular disponible (0/1 alumno)' 
                  : `Clase disponible (${asignados.size}/${maxAlumnos} alumnos)`
                }
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}