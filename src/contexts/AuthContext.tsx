// src/contexts/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// =====================================================
// TYPES
// =====================================================
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  role:
    | "admin"
    | "super_admin"
    | "user"
    | "partner"
    | "manager"
    | "senior_auditor"
    | "auditor";
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Profile["role"];
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInDemo: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? "demo@orion.com";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "demo123456";

// =====================================================
// UTILITAIRES
// =====================================================
function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "invalidCredentials";
  }
  return "generic";
}

async function upsertProfile(
  user: User,
  firstName: string,
  lastName: string,
  role: Profile["role"] = "auditor",
) {
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      initials,
      role,
    },
    { onConflict: "id" },
  );
  if (error) console.warn("Profile upsert failed:", error.message);
}

// =====================================================
// PROVIDER
// =====================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    const stopLoading = () => {
      if (mounted) setLoading(false);
    };

    const timeout = setTimeout(() => {
      console.warn("Auth initialization timed out – falling back.");
      stopLoading();
    }, 5000); // 5 seconds timeout

    async function initSession() {
      try {
        const {
          data: { session: current },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(current);
        setUser(current?.user ?? null);
        if (current?.user) fetchProfile(current.user.id);
      } catch (err) {
        console.error("Auth session init failed:", err);
      } finally {
        clearTimeout(timeout);
        stopLoading();
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, current) => {
      setSession(current);
      setUser(current?.user ?? null);
      if (current?.user) {
        await fetchProfile(current.user.id);
      } else {
        setProfile(null);
      }
      if (!current) setIsDemo(false);
      clearTimeout(timeout);
      stopLoading();
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: mapAuthError(error.message) };
    setIsDemo(false);
    return { error: null };
  }, []);

  const signUp = useCallback(
    async ({ email, password, firstName, lastName, role }: SignUpData) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, role },
        },
      });

      if (error) return { error: mapAuthError(error.message) };
      if (data.user) {
        await upsertProfile(data.user, firstName, lastName, role);
      }
      setIsDemo(false);
      return { error: null };
    },
    [],
  );

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
      profile,
      loading,
      isDemo,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInDemo,
    }),
    [
      session,
      user,
      profile,
      loading,
      isDemo,
      signIn,
      signUp,
      signOut,
      resetPassword,
      signInDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =====================================================
// HOOK
// =====================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
