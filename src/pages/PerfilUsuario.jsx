import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function PerfilUsuario() {
  const { userData, updateProfile } = useAuth();
  const [nombre, setNombre] = useState(userData?.nombre || '');
  const [telefono, setTelefono] = useState(userData?.telefono || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    await updateProfile(nombre, telefono, password);
    setLoading(false);
    alert('✅ Perfil actualizado');
  };

  if (!userData) return <p>Cargando...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">👤 Mi Perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Nombre *</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Teléfono</label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Correo</label>
          <input
            type="email"
            value={userData.email}
            disabled
            className="input w-full bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Rol</label>
          <input
            type="text"
            value={userData.rol}
            disabled
            className="input w-full bg-gray-100"
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}