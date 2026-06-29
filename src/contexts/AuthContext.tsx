import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  company?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInDemo: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? 'demo@orion.com';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? 'demo123456';

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'invalidCredentials';
  }
  return 'generic';
}

async function upsertProfile(user: User, fullName: string, company?: string) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      full_name: fullName,
      department: company || null,
      role: 'auditor',
    },
    { onConflict: 'id' }
  );
  if (error) console.warn('Profile upsert failed:', error.message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => {
      setSession(current);
      setUser(current?.user ?? null);
      if (!current) setIsDemo(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error.message) };
    setIsDemo(false);
    return { error: null };
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, company }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company },
      },
    });

    if (error) return { error: mapAuthError(error.message) };
    if (data.user) await upsertProfile(data.user, fullName, company);
    setIsDemo(false);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    setIsDemo(false);
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { error: mapAuthError(error.message) };
    return { error: null };
  }, []);

  const signInDemo = useCallback(async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (error) {
      setIsDemo(true);
      return { error: null };
    }

    setIsDemo(false);
    return { error: null };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      isDemo,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInDemo,
    }),
    [session, user, loading, isDemo, signIn, signUp, signOut, resetPassword, signInDemo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
