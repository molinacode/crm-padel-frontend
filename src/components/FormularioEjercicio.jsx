import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function FormularioEjercicio() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Técnica',
    dificultad: 'Intermedio',
    duracion_minutos: '',
    tipo: 'Individual',
    material_necesario: '',
    instrucciones: '',
    variaciones: '',
    observaciones: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      cargarEjercicio();
    }
  }, [id]);

  const cargarEjercicio = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('ejercicios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          categoria: data.categoria || 'Técnica',
          dificultad: data.dificultad || 'Intermedio',
          duracion_minutos: data.duracion_minutos || '',
          tipo: data.tipo || 'Individual',
          material_necesario: data.material_necesario || '',
          instrucciones: data.instrucciones || '',
          variaciones: data.variaciones || '',
          observaciones: data.observaciones || ''
        });
      }
    } catch (error) {
      console.error('Error cargando ejercicio:', error);
      alert('Error al cargar los datos del ejercicio');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('ejercicios')
          .update(formData)
          .eq('id', id);

        if (error) throw error;
        alert('Ejercicio actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('ejercicios')
          .insert([formData]);

        if (error) throw error;
        alert('Ejercicio creado correctamente');
      }

      navigate('/ejercicios');
    } catch (error) {
      console.error('Error guardando ejercicio:', error);
      alert('Error al guardar el ejercicio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text2">Cargando datos del ejercicio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            {isEditing ? '✏️ Editar Ejercicio' : '➕ Nuevo Ejercicio'}
          </h2>
          <p className="text-gray-600 dark:text-dark-text2 mt-1">
            {isEditing ? 'Modifica los datos del ejercicio' : 'Completa la información del nuevo ejercicio'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">💪 Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                >
                  <option value="Técnica">Técnica</option>
                  <option value="Físico">Físico</option>
                  <option value="Táctico">Táctico</option>
                  <option value="Mental">Mental</option>
                  <option value="Coordinación">Coordinación</option>
                  <option value="Calentamiento">Calentamiento</option>
                  <option value="Estiramiento">Estiramiento</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Dificultad *
                </label>
                <select
                  name="dificultad"
                  value={formData.dificultad}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                >
                  <option value="Fácil">Fácil</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Profesional">Profesional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  name="duracion_minutos"
                  value={formData.duracion_minutos}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Tipo de Ejercicio
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                >
                  <option value="Individual">Individual</option>
                  <option value="Parejas">Parejas</option>
                  <option value="Grupal">Grupal</option>
                  <option value="Competitivo">Competitivo</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Describe brevemente el ejercicio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Instrucciones Detalladas */}
          <div className="bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Instrucciones</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Instrucciones Paso a Paso *
                </label>
                <textarea
                  name="instrucciones"
                  value={formData.instrucciones}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Describe detalladamente cómo realizar el ejercicio..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Variaciones
                </label>
                <textarea
                  name="variaciones"
                  value={formData.variaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe posibles variaciones del ejercicio..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>
          </div>

          {/* Material y Observaciones */}
          <div className="bg-gray-50 dark:bg-dark-surface2 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎾 Material y Observaciones</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Material Necesario
                </label>
                <textarea
                  name="material_necesario"
                  value={formData.material_necesario}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Lista el material necesario (pelotas, conos, redes, etc.)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notas adicionales, precauciones, consejos..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/ejercicios')}
              className="btn-secondary px-6 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
