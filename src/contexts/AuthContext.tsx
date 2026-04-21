import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  permissions: Set<string>;
  ownedClientStages: Set<string>;
  ownedLeadStages: Set<string>;
  hasPerm: (key: string) => boolean;
  ownsClientStage: (stage: string) => boolean;
  ownsLeadStage: (stage: string) => boolean;
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
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [ownedClientStages, setOwnedClientStages] = useState<Set<string>>(new Set());
  const [ownedLeadStages, setOwnedLeadStages] = useState<Set<string>>(new Set());
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
          void loadRolesAndAccess(s.user.id);
          void loadProfileFlag(s.user.id);
        }, 0);
      } else {
        setRoles([]);
          setPermissions(new Set());
          setOwnedClientStages(new Set());
          setOwnedLeadStages(new Set());
        setMustChangePassword(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        Promise.all([loadRolesAndAccess(s.user.id), loadProfileFlag(s.user.id)]).finally(() =>
          setLoading(false),
        );
      } else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadRolesAndAccess = async (userId: string) => {
    const { data: roleRows, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roleErr || !roleRows) return;
    const userRoles = roleRows.map((r) => r.role as AppRole);
    setRoles(userRoles);
    if (userRoles.length === 0) {
      setPermissions(new Set());
      setOwnedClientStages(new Set());
      setOwnedLeadStages(new Set());
      return;
    }
    // Permissions for these roles. Admins implicitly get all (resolved by hasPerm).
    const { data: permRows } = await supabase
      .from("role_permissions")
      .select("permission_key")
      .in("role", userRoles);
    setPermissions(new Set((permRows ?? []).map((r) => r.permission_key)));

    const { data: stageRows } = await supabase
      .from("stage_ownership")
      .select("stage_kind, stage_value")
      .in("role", userRoles);
    const clientStages = new Set<string>();
    const leadStages = new Set<string>();
    (stageRows ?? []).forEach((r) => {
      if (r.stage_kind === "client") clientStages.add(r.stage_value);
      else if (r.stage_kind === "lead") leadStages.add(r.stage_value);
    });
    setOwnedClientStages(clientStages);
    setOwnedLeadStages(leadStages);
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
    session, user, loading, roles, permissions, ownedClientStages, ownedLeadStages, mustChangePassword,
    isAdmin: roles.includes("admin"),
    canEdit:
      roles.includes("admin") ||
      roles.includes("ops_manager") ||
      roles.includes("staff"),
    hasPerm: (key: string) => roles.includes("admin") || permissions.has(key),
    ownsClientStage: (stage: string) =>
      roles.includes("admin") ||
      roles.includes("exec") ||
      roles.includes("ops_manager") ||
      ownedClientStages.has(stage),
    ownsLeadStage: (stage: string) =>
      roles.includes("admin") ||
      roles.includes("exec") ||
      roles.includes("ops_manager") ||
      ownedLeadStages.has(stage),
    signIn, signOut, updatePassword,
  }), [session, user, loading, roles, permissions, ownedClientStages, ownedLeadStages, mustChangePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
