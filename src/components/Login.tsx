import { useAuth } from '../contexts/AuthContext';
import { APP_LOGO_SRC, APP_NAME } from '../lib/branding';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg flex items-center justify-center px-4'>
      <div className='bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl w-full max-w-md'>
        <div className='text-center mb-8'>
          <img
            src={APP_LOGO_SRC}
            alt={APP_NAME}
            className='w-16 h-16 rounded-xl object-contain mx-auto mb-4 shadow-sm'
          />
          <h2 className='text-2xl font-bold text-gray-800 dark:text-dark-text'>
            Iniciar sesión
          </h2>
          <p className='text-gray-500 dark:text-dark-text2 mt-2'>
            Acceso staff.
          </p>
        </div>

        <button
          type='button'
          onClick={() => void login()}
          className='w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium'
        >
          Entrar
        </button>

        <p className='text-center mt-4'>
          <a
            href='https://auth.v3sports.es/ui/v2/login/loginname'
            className='text-sm text-blue-600 dark:text-blue-400 hover:underline'
          >
            ¿Has olvidado la contraseña?
          </a>
        </p>
      </div>
    </div>
  );
}
