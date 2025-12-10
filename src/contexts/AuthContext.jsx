import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const cargarSesion = async () => {
      if (!isMounted) return;

      console.log('🔍 Iniciando carga de sesión...');

      try {
        // Agregar timeout para evitar que se cuelgue
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error('Timeout: Supabase no responde en 15 segundos')),
            15000
          )
        );

        const sessionPromise = supabase.auth.getSession();

        const {
          data: { session },
          error: sessionError,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;

        // Debug opcional: detalles de sesión
        if (sessionError) {
          console.warn('Auth session error:', sessionError);
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          // Crear datos de usuario temporal basados en la sesión de Supabase Auth
          const userData = {
            id: session.user.id,
            nombre: session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email,
            rol: 'profesor',
            foto_url: session.user.user_metadata?.avatar_url || null,
            created_at: session.user.created_at,
          };
          setUserData(userData);
        } else {
          // sin usuario
        }
        setLoading(false);
      } catch (error) {
        if (!isMounted) return;
        console.error('💥 Error crítico en cargarSesion:', error);

        // Si es un timeout, activar modo de desarrollo temporal
        if (error.message.includes('Timeout')) {
          // Simular datos de usuario temporal
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

    cargarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Crear datos de usuario temporal basados en la sesión de Supabase Auth
          const userData = {
            id: session.user.id,
            nombre: session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email,
            rol: 'profesor',
            foto_url: session.user.user_metadata?.avatar_url || null,
            created_at: session.user.created_at,
          };

          setUserData(userData);
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

  const login = useCallback(async (email, password) => {
      // Credenciales temporales para desarrollo
      if (email === 'admin@test.com' && password === 'admin123') {
        setUser({ id: 'temp-user', email: 'admin@test.com' });
        setUserData({
          id: 'temp-user',
          nombre: 'Usuario Temporal',
          email: 'admin@test.com',
          telefono: '123456789',
        });
        return null; // Sin error
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error;
      } catch (error) {
        console.error('💥 Error en login:', error);
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
        console.error('💥 Error en logout:', error);
        // Forzar logout local si falla Supabase
        setUser(null);
        setUserData(null);
      }
    }, [user?.id]);

  const updateProfile = useCallback(async (nombre, telefono, password) => {
      const updates = {};
      if (nombre) updates.nombre = nombre;
      if (telefono) updates.telefono = telefono;

      // Actualizar datos locales
      if (Object.keys(updates).length > 0) {
        setUserData(prev => ({ ...prev, ...updates }));
      }

      // Actualizar contraseña en Supabase Auth
      if (password) {
        try {
          await supabase.auth.updateUser({ password });
        } catch (error) {
          console.error('Error actualizando contraseña:', error);
          throw error;
        }
      }
    }, []);

  const value = useMemo(() => ({
    user,
    userData,
    loading,
    login,
    logout,
    updateProfile,
  }), [user, userData, loading, login, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
