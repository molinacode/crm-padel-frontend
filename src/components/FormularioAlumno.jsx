import { useState } from 'react';
import { supabase } from '../lib/supabase';
import '../index.css';

export default function FormularioAlumno({ onCancel }) {
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)'
  });

  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    if (name === 'nivel') {
      const grupo = selectedOptions?.[0]?.dataset?.grupo ?? '';
      setNuevoAlumno(prev => ({
        ...prev, nivel: value, grupo,
      }));
      return;
    }
    setNuevoAlumno(prev => ({ ...prev, [name]: value }));
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
          alert('❌ Error al subir la foto');
          setLoading(false);
          return;
        }
        const { data } = supabase.storage.from('fotos-alumnos').getPublicUrl(`alumno_${Date.now()}`);
        fotoUrl = data.publicUrl;
      }
      const payload = { ...nuevoAlumno, foto_url: fotoUrl };
      const { error: insertError } = await supabase.from('alumnos').insert([payload]);
      if (insertError) throw insertError;

      alert('✅ Alumno creado');
      setNuevoAlumno({ nombre: '', email: '', telefono: '', nivel: 'Iniciación', grupo: '' });
      setFoto(null);
      setVistaPrevia(null);
      onCancel?.();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
      
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {/* Vista previa foto */}
      {vistaPrevia && (
        <div className="text-center">
          <img
            src={vistaPrevia}
            alt="Vista previa"
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-gray-200"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium">Foto</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFotoChange}
          className="text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input
          type="text"
          name="nombre"
          value={nuevoAlumno.nombre}
          onChange={handleChange}
          required
          className="input"
          placeholder="Ej: Ana López"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Teléfono *</label>
        <input
          type="text"
          name="telefono"
          value={nuevoAlumno.telefono}
          onChange={handleChange}
          required
          className="input"
          placeholder="Ej: +54 9 11 1234 5678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={nuevoAlumno.email}
          onChange={handleChange}
          className="input"
          placeholder="ana@ejemplo.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nivel</label>
        <select
          name="nivel"
          value={nuevoAlumno.nivel}
          onChange={handleChange}
          className="input"
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

      <div className="md:col-span-2">
        <button
          type="submit"
          className="btn-primary"
        >
          ➕ Agregar Alumno
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
        ✖ Cancelar
        </button>
      </div>
    </form>
  );
}