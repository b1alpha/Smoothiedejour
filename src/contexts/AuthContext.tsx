import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@jsr/supabase__supabase-js';
import { supabase } from '../utils/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  nickname: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<{ error: Error | null }>;
  changePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState<string | null>(null);

  const updateNicknameFromUser = (userData: User | null) => {
    if (userData?.user_metadata?.nickname) {
      setNickname(userData.user_metadata.nickname);
    } else {
      setNickname(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      updateNicknameFromUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      updateNicknameFromUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      // Handle connection refused errors gracefully
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        const isLocalhost = supabaseUrl.includes('localhost');
        if (isLocalhost && import.meta.env.DEV) {
          console.warn('⚠️ Local Supabase instance not running. Cannot sign in.');
          console.warn('💡 Start Supabase with: supabase start');
          return { error: new Error('Local Supabase instance is not running. Please start it with "supabase start"') };
        }
      }
      return { error: err instanceof Error ? err : new Error('Failed to sign in') };
    }
  };

  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: nickname.trim(),
          },
        },
      });
      return { error };
    } catch (err) {
      // Handle connection refused errors gracefully
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        const isLocalhost = supabaseUrl.includes('localhost');
        if (isLocalhost && import.meta.env.DEV) {
          console.warn('⚠️ Local Supabase instance not running. Cannot sign up.');
          console.warn('💡 Start Supabase with: supabase start');
          return { error: new Error('Local Supabase instance is not running. Please start it with "supabase start"') };
        }
      }
      return { error: err instanceof Error ? err : new Error('Failed to sign up') };
    }
  };

  const updateNickname = async (newNickname: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase.auth.updateUser({
      data: {
        nickname: newNickname.trim(),
      },
    });
    
    if (!error) {
      // Update local state
      setNickname(newNickname.trim());
      // Refresh user data
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
    
    return { error };
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setNickname(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, nickname, signIn, signUp, signOut, updateNickname, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

