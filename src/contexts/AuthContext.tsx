import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";
import {
  clearRememberPreference,
  enforceRememberPolicyOnBoot,
  touchSessionMarker,
} from "@/lib/rememberSession";
import { startOnboardingSync, stopOnboardingSync } from "@/lib/onboarding/sync";
import { setOnboardingPath, getOnboardingState } from "@/lib/onboarding/storage";
import { clearMfaVerified } from "@/lib/mfa";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  permissions: Set<string>;
  ownedClientStages: Set<string>;
  ownedLeadStages: Set<string>;
  avatarUrl: string | null;
  displayName: string;
  hasPerm: (key: string) => boolean;
  ownsClientStage: (stage: string) => boolean;
  ownsLeadStage: (stage: string) => boolean;
  isAdmin: boolean;
  canEdit: boolean;
  mustChangePassword: boolean;
  partOfLeadership: boolean;
  dashboardAccess: string | null;
  newStateEmployee: boolean;
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
  const [partOfLeadership, setPartOfLeadership] = useState(false);
  const [dashboardAccess, setDashboardAccess] = useState<string | null>(null);
  const [newStateEmployee, setNewStateEmployee] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    // Subscribe FIRST to avoid missing the initial event
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Defer Supabase calls outside the callback to avoid deadlocks
      if (s?.user) {
        touchSessionMarker();
        setLoading(true);
        setTimeout(() => {
          Promise.all([loadRolesAndAccess(s.user.id), loadProfileFlag(s.user.id)]).finally(() =>
            setLoading(false),
          );
          if (event === "SIGNED_IN") {
            void supabase.rpc("log_sign_in").then(() => undefined, () => undefined);
          }
        }, 0);
      } else {
        setRoles([]);
        setPermissions(new Set());
        setOwnedClientStages(new Set());
        setOwnedLeadStages(new Set());
        setMustChangePassword(false);
        setPartOfLeadership(false);
        setDashboardAccess(null);
        setNewStateEmployee(false);
        setAvatarUrl(null);
        setDisplayName("");
        setLoading(false);
      }
    });

    // Enforce "Remember me" policy before reading the persisted session.
    enforceRememberPolicyOnBoot().finally(() => {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          touchSessionMarker();
          Promise.all([loadRolesAndAccess(s.user.id), loadProfileFlag(s.user.id)]).finally(() =>
            setLoading(false),
          );
        } else setLoading(false);
      });
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
      .select("must_change_password, part_of_leadership, dashboard_access, new_state_employee, avatar_url, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error && data) {
      setMustChangePassword(!!data.must_change_password);
      setPartOfLeadership(!!data.part_of_leadership);
      setDashboardAccess(data.dashboard_access ?? null);
      setAvatarUrl(data.avatar_url ?? null);
      setDisplayName(data.display_name ?? "");
      const nse = !!(data as { new_state_employee?: boolean }).new_state_employee;
      setNewStateEmployee(nse);
      // Authoritative: align onboarding path with the profile flag.
      try {
        const desired = nse ? "new_state" : "existing_state";
        if (getOnboardingState().path !== desired) setOnboardingPath(desired);
      } catch { /* no-op */ }
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    // Quiet, throttled background refresh. Returning to the tab must not
    // visibly reload the app, reset menus, or flash a loading state.
    // Real auth state changes still flow through supabase.auth.onAuthStateChange
    // and the "profile:updated" event below.
    let lastBackgroundRefreshAt = 0;
    let backgroundRefreshInFlight = false;
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
    const refreshAccessQuietly = () => {
      if (!user?.id || backgroundRefreshInFlight) return;
      const now = Date.now();
      if (now - lastBackgroundRefreshAt < REFRESH_INTERVAL_MS) return;
      backgroundRefreshInFlight = true;
      void Promise.all([loadRolesAndAccess(user.id), loadProfileFlag(user.id)])
        .then(() => { lastBackgroundRefreshAt = now; })
        .catch(() => { /* transient: keep current session/state */ })
        .finally(() => { backgroundRefreshInFlight = false; });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshAccessQuietly();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: string; avatarUrl?: string | null } | undefined;
      if (detail && detail.userId && detail.userId !== user.id) return;
      if (detail && "avatarUrl" in detail) setAvatarUrl(detail.avatarUrl ?? null);
      void loadProfileFlag(user.id);
    };
    window.addEventListener("profile:updated", onProfileUpdated as EventListener);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("profile:updated", onProfileUpdated as EventListener);
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    stopOnboardingSync();
    await supabase.auth.signOut();
    clearRememberPreference();
    if (user?.id) clearMfaVerified(user.id);
    setRoles([]);
    setMustChangePassword(false);
    setPartOfLeadership(false);
    setDashboardAccess(null);
    setNewStateEmployee(false);
    setAvatarUrl(null);
    setDisplayName("");
  };

  // Start (or restart) onboarding sync whenever the signed-in user changes.
  useEffect(() => {
    if (user?.id) {
      void startOnboardingSync(user.id);
    } else {
      stopOnboardingSync();
    }
  }, [user?.id]);

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
    session, user, loading, roles, permissions, ownedClientStages, ownedLeadStages,
    avatarUrl,
    displayName: displayName || (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there",
    mustChangePassword, partOfLeadership, dashboardAccess,
    newStateEmployee,
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
  }), [session, user, loading, roles, permissions, ownedClientStages, ownedLeadStages, avatarUrl, displayName, mustChangePassword, partOfLeadership, dashboardAccess, newStateEmployee]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
