import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { supabase, fetchAuthProfile, patchAuthProfile } from '../lib/supabase';

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
  login: (email?: string, password?: string) => Promise<unknown>;
  logout: () => Promise<void>;
  updateProfile: (nombre?: string, telefono?: string, password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

    const apply = (session: { user?: AuthUser } | null, profile?: AuthUserData | null) => {
      if (!isMounted) return;
      const nextUser = (session?.user as AuthUser) ?? null;
      setUser(nextUser);
      if (profile) setUserData(profile);
      else if (!nextUser) setUserData(null);
      setLoading(false);
    };

    void (async () => {
      try {
        const me = await fetchAuthProfile();
        apply(me.session, me.userData);
      } catch (error) {
        console.error('Error cargando sesión:', error);
        if (isMounted) setLoading(false);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') {
        apply(null, null);
        return;
      }
      try {
        const me = await fetchAuthProfile();
        apply((me.session || session) as { user?: AuthUser } | null, me.userData);
      } catch {
        apply(session as { user?: AuthUser } | null, null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async () => {
    window.location.assign('/api/auth/login');
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (nombre?: string, telefono?: string, password?: string) => {
      if (nombre || telefono) {
        const json = await patchAuthProfile(nombre, telefono);
        if (json.userData) setUserData(json.userData);
      }
      if (password) {
        alert('La contraseña se cambia en la cuenta de Zitadel (auth.v3sports.es), no aquí.');
      }
    },
    []
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
