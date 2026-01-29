import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual de Supabase
    const checkSession = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          role: session.user.user_metadata?.role || 'partner',

          avatar: session.user.user_metadata?.avatar
        };
        setUser(userData);
      }
      setIsLoading(false);
    };

    checkSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          role: session.user.user_metadata?.role || 'partner',

          avatar: session.user.user_metadata?.avatar
        };
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    if (!supabase) return false;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('Error de login:', error);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuario',
          role: data.user.user_metadata?.role || 'partner',

          avatar: data.user.user_metadata?.avatar
        };
        setUser(userData);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
