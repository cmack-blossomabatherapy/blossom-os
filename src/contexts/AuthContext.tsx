import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "staff" | "viewer";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  canEdit: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    // Subscribe FIRST to avoid missing the initial event
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Defer Supabase calls outside the callback to avoid deadlocks
      if (s?.user) {
        setTimeout(() => {
          void loadRoles(s.user.id);
          void loadProfileFlag(s.user.id);
        }, 0);
      } else {
        setRoles([]);
        setMustChangePassword(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        Promise.all([loadRoles(s.user.id), loadProfileFlag(s.user.id)]).finally(() =>
          setLoading(false),
        );
      } else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!error && data) setRoles(data.map((r) => r.role as AppRole));
  };

  const loadProfileFlag = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data) setMustChangePassword(!!data.must_change_password);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setMustChangePassword(false);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    // Clear the flag on the profile
    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("user_id", user.id);
      setMustChangePassword(false);
    }
    return { error: null };
  };

  const value = useMemo<AuthContextValue>(() => ({
    session, user, loading, roles, mustChangePassword,
    isAdmin: roles.includes("admin"),
    canEdit: roles.includes("admin") || roles.includes("staff"),
    signIn, signOut, updatePassword,
  }), [session, user, loading, roles, mustChangePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
