import { useAuth } from '../contexts/AuthContext';
import { APP_LOGO_SRC, APP_NAME } from '../lib/branding';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className='min-h-screen bg-[#0e1410] text-[#f5f1e8] flex items-center justify-center px-4'>
      <div className='w-full max-w-md rounded-xl border border-[#2a332c] bg-[#1c241e] p-8'>
        <div className='text-center mb-8'>
          <img
            src={APP_LOGO_SRC}
            alt={APP_NAME}
            className='w-16 h-16 rounded-xl object-contain mx-auto mb-4 shadow-sm'
          />
          <h2 className='text-2xl font-bold text-[#f5f1e8]'>
            Iniciar sesión
          </h2>
          <p className='text-[#8c8678] mt-2'>
            Acceso staff.
          </p>
        </div>

        <button
          type='button'
          onClick={() => void login()}
          className='w-full bg-[#c9a658] text-[#0e1410] py-3 rounded-lg hover:bg-[#ddc07a] font-semibold'
        >
          Entrar
        </button>

        <p className='text-center mt-4'>
          <a
            href='https://auth.v3sports.es/ui/v2/login/loginname'
            className='text-sm text-[#c9a658] hover:underline'
          >
            ¿Has olvidado la contraseña?
          </a>
        </p>
      </div>
    </div>
  );
}
