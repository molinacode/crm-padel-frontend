import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg flex items-center justify-center px-4'>
      <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8 text-white'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-dark-text'>
            Iniciar sesión
          </h2>
          <p className='text-gray-500 dark:text-dark-text2 mt-2'>
            Acceso staff con la cuenta de la escuela (Zitadel).
          </p>
        </div>

        <button
          type='button'
          onClick={() => void login()}
          className='w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium'
        >
          Entrar
        </button>

        <p className='text-center text-sm text-gray-500 dark:text-dark-text2 mt-6'>
          Te redirigimos a auth.v3sports.es. La contraseña y el 2FA viven ahí.
        </p>
      </div>
    </div>
  );
}
