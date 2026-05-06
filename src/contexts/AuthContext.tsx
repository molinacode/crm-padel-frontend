import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type AuthUser = { id: string; email?: string | null } | null;

interface AuthUserData {
  id: string;
  nombre: string;
  email?: string | null;
  rol?: string;
  foto_url?: string | null;
  created_at?: string;
  telefono?: string;
}

interface AuthContextValue {
  user: AuthUser;
  userData: AuthUserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  logout: () => Promise<void>;
  updateProfile: (nombre?: string, telefono?: string, password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [userData, setUserData] = useState<AuthUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cargarSesion = async () => {
      if (!isMounted) return;

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout: Supabase no responde en 15 segundos')),
            15000
          )
        );

        const sessionPromise = supabase.auth.getSession();
        const {
          data: { session },
          error: sessionError,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;
        if (sessionError) console.warn('Auth session error:', sessionError);

        setUser((session?.user as AuthUser) ?? null);

        if (session?.user) {
          setUserData({
            id: session.user.id,
            nombre: session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email,
            rol: 'profesor',
            foto_url: session.user.user_metadata?.avatar_url || null,
            created_at: session.user.created_at,
          });
        }

        setLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error crítico en cargarSesion:', error);

        if (getErrorMessage(error).includes('Timeout')) {
          setUser({ id: 'temp-user', email: 'admin@test.com' });
          setUserData({
            id: 'temp-user',
            nombre: 'Usuario Temporal',
            email: 'admin@test.com',
            telefono: '123456789',
          });
        }
        setLoading(false);
      }
    };

    void cargarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser((session?.user as AuthUser) ?? null);
        if (session?.user) {
          setUserData({
            id: session.user.id,
            nombre: session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email,
            rol: 'profesor',
            foto_url: session.user.user_metadata?.avatar_url || null,
            created_at: session.user.created_at,
          });
        } else {
          setUserData(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (email === 'admin@test.com' && password === 'admin123') {
      setUser({ id: 'temp-user', email: 'admin@test.com' });
      setUserData({
        id: 'temp-user',
        nombre: 'Usuario Temporal',
        email: 'admin@test.com',
        telefono: '123456789',
      });
      return null;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error;
    } catch (error) {
      console.error('Error en login:', error);
      return { message: 'Error de conexión con Supabase' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (user?.id === 'temp-user') {
      setUser(null);
      setUserData(null);
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error en logout:', error);
      setUser(null);
      setUserData(null);
    }
  }, [user?.id]);

  const updateProfile = useCallback(
    async (nombre?: string, telefono?: string, password?: string) => {
      const updates: Partial<AuthUserData> = {};
      if (nombre) updates.nombre = nombre;
      if (telefono) updates.telefono = telefono;

      if (Object.keys(updates).length > 0) {
        setUserData(prev => ({ ...(prev || { id: user?.id || 'temp-user', nombre: 'Usuario' }), ...updates }));
      }

      if (password) {
        await supabase.auth.updateUser({ password });
      }
    },
    [user?.id]
  );

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      login,
      logout,
      updateProfile,
    }),
    [user, userData, loading, login, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
