import { useState } from 'react';
import { supabase } from '../lib/supabase';
import GestorHorarios from './GestorHorarios';
import { InlineLoadingButton } from './LoadingSpinner';
import '../index.css';

export default function FormularioAlumno({ onCancel }) {
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)',
    dias_disponibles: [],
    horarios_disponibles: []
  });

  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Funciones de validación
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!nuevoAlumno.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (nuevoAlumno.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar teléfono
    if (!nuevoAlumno.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^[+]?[0-9\s\-()]{9,}$/.test(nuevoAlumno.telefono.trim())) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    // Validar email si se proporciona
    if (nuevoAlumno.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoAlumno.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validar días disponibles
    if (nuevoAlumno.dias_disponibles.length === 0) {
      newErrors.dias_disponibles = 'Debe seleccionar al menos un día disponible';
    }

    // Validar horarios disponibles
    if (nuevoAlumno.horarios_disponibles.length === 0) {
      newErrors.horarios_disponibles = 'Debe agregar al menos un horario disponible';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    if (name === 'nivel') {
      setNuevoAlumno(prev => ({
        ...prev, nivel: value,
      }));
      return;
    }
    if (name === 'dias_disponibles') {
      const dias = Array.from(selectedOptions, option => option.value);
      setNuevoAlumno(prev => ({ ...prev, [name]: dias }));
      return;
    }
    setNuevoAlumno(prev => ({ ...prev, [name]: value }));
  };

  const handleHorariosChange = (horarios) => {
    setNuevoAlumno(prev => ({ ...prev, horarios_disponibles: horarios }));
  };
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setVistaPrevia(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar errores previos
    setErrors({});

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let fotoUrl = null;

      if (foto) {
        const fileName = `alumno_${Date.now()}`;
        const { error: uploadError } = await supabase
          .storage
          .from('fotos-alumnos')
          .upload(fileName, foto);

        if (uploadError) {
          throw new Error('Error al subir la foto: ' + uploadError.message);
        }
        const { data } = supabase.storage.from('fotos-alumnos').getPublicUrl(fileName);
        fotoUrl = data.publicUrl;
      }

      const payload = {
        ...nuevoAlumno,
        foto_url: fotoUrl,
        nombre: nuevoAlumno.nombre.trim(),
        telefono: nuevoAlumno.telefono.trim(),
        email: nuevoAlumno.email?.trim() || null,
        observaciones: nuevoAlumno.observaciones || null,
        disponibilidad: {
          dias: nuevoAlumno.dias_disponibles,
          horarios: nuevoAlumno.horarios_disponibles
        }
      };

      // Eliminar campos que no existen en la BD
      delete payload.dias_disponibles;
      delete payload.horarios_disponibles;

      const { error: insertError } = await supabase.from('alumnos').insert([payload]);
      if (insertError) throw insertError;

      alert('✅ Alumno creado correctamente');
      setNuevoAlumno({
        nombre: '',
        email: '',
        telefono: '',
        nivel: 'Iniciación (1)',
        dias_disponibles: [],
        horarios_disponibles: []
      });
      setFoto(null);
      setVistaPrevia(null);
      setErrors({});
      onCancel?.();
    } catch (err) {
      console.error('Error creando alumno:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      {/* Vista previa foto - Full width */}
      {vistaPrevia && (
        <div className="text-center mb-6">
          <img
            src={vistaPrevia}
            alt="Vista previa"
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-gray-200 dark:border-dark-border"
          />
        </div>
      )}

      {/* Grid responsive: una columna en móviles, dos en desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-4">
          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text2 mb-2">📷 Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="text-sm w-full"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2">👤 Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={nuevoAlumno.nombre}
              onChange={handleChange}
              required
              className={`input w-full ${errors.nombre ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Ej: Ana López"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2">📱 Teléfono *</label>
            <input
              type="text"
              name="telefono"
              value={nuevoAlumno.telefono}
              onChange={handleChange}
              required
              className={`input w-full ${errors.telefono ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Ej: +54 9 11 1234 5678"
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2">📧 Email</label>
            <input
              type="email"
              name="email"
              value={nuevoAlumno.email}
              onChange={handleChange}
              className={`input w-full ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="ana@ejemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Nivel */}
          <div>
            <label className="block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2">🎯 Nivel</label>
            <select
              name="nivel"
              value={nuevoAlumno.nivel}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="Iniciación (1)" data-grupo="1">Iniciación (1)</option>
              <option value="Iniciación (2)" data-grupo="2">Iniciación (2)</option>
              <option value="Medio (3)" data-grupo="3">Medio (3)</option>
              <option value="Medio (4)" data-grupo="4">Medio (4)</option>
              <option value="Avanzado (5)">Avanzado (5)</option>
              <option value="Infantil (1)" data-grupo="1">Infantil (1)</option>
              <option value="Infantil (2)" data-grupo="2">Infantil (2)</option>
              <option value="Infantil (3)" data-grupo="3">Infantil (3)</option>
            </select>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="space-y-4">
          {/* Título de Disponibilidad */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-4">📅 Disponibilidad</h3>
          </div>

          {/* Días Disponibles */}
          <div>
            <label className="block text-base font-medium mb-1 text-gray-700 dark:text-dark-text2">📆 Días Disponibles</label>
            <select
              name="dias_disponibles"
              value={nuevoAlumno.dias_disponibles}
              onChange={handleChange}
              multiple
              className={`input w-full ${errors.dias_disponibles ? 'border-red-500 focus:ring-red-500' : ''}`}
              size="6"
            >
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-dark-text2 mt-1">Mantén presionado Ctrl para seleccionar múltiples días</p>
            {errors.dias_disponibles && (
              <p className="text-red-500 text-sm mt-1">{errors.dias_disponibles}</p>
            )}
          </div>

          {/* Gestor de múltiples horarios */}
          <div>
            <GestorHorarios
              horarios={nuevoAlumno.horarios_disponibles}
              onChange={handleHorariosChange}
            />
            {errors.horarios_disponibles && (
              <p className="text-red-500 text-sm mt-1">{errors.horarios_disponibles}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones - Centrados y compactos */}
      <div className="mt-8 flex justify-center gap-6">
        <InlineLoadingButton
          type="submit"
          loading={loading}
          className="btn-primary px-6 py-2"
        >
          ➕ Agregar Alumno
        </InlineLoadingButton>
        <button
          type="button"
          className="btn-secondary px-6 py-2"
          onClick={onCancel}
          disabled={loading}
        >
          ✖ Cancelar
        </button>
      </div>
    </form>
  );
}