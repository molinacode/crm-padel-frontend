import { useState } from 'react';
import { LoadingSpinner } from '@shared';
import { useAuth } from '../contexts/AuthContext';

export default function PerfilUsuario() {
  const { userData, updateProfile } = useAuth();
  const [nombre, setNombre] = useState(userData?.nombre || '');
  const [telefono, setTelefono] = useState(userData?.telefono || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
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

  if (!userData)
    return <LoadingSpinner size='large' text='Cargando perfil de usuario...' />;

  return (
    <div className='max-w-2xl mx-auto space-y-8'>
      {/* Header estandarizado */}
      <div className='bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30'>
        <div className='flex items-center gap-4'>
          <div className='bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-2xl'>
            <svg
              className='w-8 h-8 text-indigo-600 dark:text-indigo-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-dark-text mb-2'>
              👤 Mi Perfil
            </h1>
            <p className='text-gray-600 dark:text-dark-text2'>
              Gestiona tu información personal y configuración
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Nombre *
            </label>
            <input
              type='text'
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Teléfono
            </label>
            <input
              type='tel'
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Correo
            </label>
            <input
              type='email'
              value={userData.email}
              disabled
              className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2'>
              Rol
            </label>
            <input
              type='text'
              value={userData.rol}
              disabled
              className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400'
            />
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text'>
              Cambiar Contraseña
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2'>
                  Nueva contraseña
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-dark-text2'>
                  Confirmar contraseña
                </label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 dark:border-dark-border dark:bg-dark-surface2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-dark-text'
                />
              </div>
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2'
          >
            {loading ? (
              <>
                <svg
                  className='animate-spin w-5 h-5'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                Guardar Cambios
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
