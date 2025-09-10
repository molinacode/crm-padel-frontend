import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function EditarAlumno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState({
    nombre: '',
    email: '',
    telefono: '',
    nivel: 'Iniciación (1)'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoNombre, setFotoNombre] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState(alumno.foto_url || null);

  useEffect(() => {
    const cargarAlumno = async () => {
      const { data, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError('No se pudo cargar el alumno');
        console.error(error);
      } else {
        setAlumno(data);
      }
      setLoading(false);
    };
    cargarAlumno();
  }, [id]);

  const handleChange = (e) => {
    setAlumno({
      ...alumno,
      [e.target.name]: e.target.value
    });
  };

  // Manejar el cambio de foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image/(jpeg|jpg|png|gif')) {
        alert('Solo se permiten imágenes (JPG,PNG,GIF');
        return;
      }
    }
    setFoto(file);
    setVistaPrevia(updateLocale.createObjectURL(file));
    setFotoNombre(file.name);
  };
   // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let fotoUrl = alumno.foto_url;

    // Si hay nueva foto
    if (foto) {
      const fileName = `alumno_${id}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('fotos-alumnos')
        .upload(fileName, foto, { upsert: true });

      if (uploadError) {
        setError('Error al subir la foto');
        console.error('Upload error:', uploadError);
        setLoading(false);
        return;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('fotos-alumnos')
        .getPublicUrl(fileName);

      fotoUrl = data.publicUrl;

      // Opcional: Borrar foto antigua si existe
      if (alumno.foto_url) {
        const oldPath = alumno.foto_url.split('/fotos-alumnos/')[1];
        if (oldPath) {
          await supabase.storage.from('fotos-alumnos').remove([oldPath]);
        }
      }
    }

    // Actualizar alumno
    const { error: updateError } = await supabase
      .from('alumnos')
      .update({ ...alumno, foto_url: fotoUrl })
      .eq('id', id);

    if (updateError) {
      setError('Error al actualizar el alumno');
      console.error('Update error:', updateError);
    } else {
      alert('✅ Alumno actualizado');
      navigate(`/alumno/${id}`);
    }

    setLoading(false);
  };

  // Limpiar URL temporal
  useEffect(() => {
    return () => {
      if (vistaPrevia && vistaPrevia.startsWith('blob:')) {
        URL.revokeObjectURL(vistaPrevia);
      }
    };
  }, [vistaPrevia]);

  if (loading && !alumno.nombre) return <p className="text-gray-700 dark:text-dark-text">Cargando...</p>;
  if (error && !loading) return <p className="text-red-500 dark:text-red-400">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text">✏️ Editar Alumno</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-md space-y-6">
        {/* Vista previa de la foto */}
        <div className="text-center">
          {vistaPrevia ? (
            <img
              src={vistaPrevia}
              alt="Vista previa"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 dark:border-blue-800 mx-auto"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-dark-surface2 flex items-center justify-center mx-auto text-gray-500 dark:text-dark-text2">
              Sin foto
            </div>
          )}
          <input
            id="foto"
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="sr-only"
          />
           <div className="flex flex-col items-center gap-4 mt-3">
              <label htmlFor="foto" className="btn-secondary btn-sm cursor-pointer">
                Seleccionar archivo
              </label>
              <span className="text-sm text-gray-600">
                {fotoNombre || 'Ningún archivo seleccionado'}
              </span>
            </div>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG o GIF (máx. 2MB)</p>
        </div>

        {/* Formulario */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            type="text"
            name="nombre"
            value={alumno.nombre}
            onChange={(e) => setAlumno({ ...alumno, nombre: e.target.value })}
            required
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={alumno.email}
            onChange={(e) => setAlumno({ ...alumno, email: e.target.value })}
            className="input w-full"
            placeholder="ana@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            name="telefono"
            value={alumno.telefono}
            onChange={(e) => setAlumno({ ...alumno, telefono: e.target.value })}
            className="input w-full"
            placeholder="600 123 456"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nivel</label>
          <select
            name="nivel"
            value={alumno.nivel}
            onChange={(e) => setAlumno({ ...alumno, nivel: e.target.value })}
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

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Guardando...' : '✅ Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/alumno/${id}`)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}