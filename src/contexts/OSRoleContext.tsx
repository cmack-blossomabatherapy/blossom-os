import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  OSRole, OSScope, OSModule, OSAction,
  ROLE_PROFILES, canAct, canSeeModule, canSeeLeadership, hasPlatformCap, scopeFor,
} from "@/lib/os/permissions";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";

function mapAuthRoleToOS(appRoles: AppRole[]): OSRole | null {
  if (appRoles.includes("admin")) return "super_admin";
  if (appRoles.includes("state_director")) return "state_director";
  if (appRoles.includes("exec")) return "executive_leadership";
  if (appRoles.includes("ops_manager")) return "operations_leadership";
  if (appRoles.includes("intake")) return "intake_coordinator";
  if (appRoles.includes("auth_team")) return "authorization_coordinator";
  if (appRoles.includes("scheduling")) return "scheduling_team";
  if (appRoles.includes("staffing_lead")) return "staffing_lead";
  if (appRoles.includes("staffing_coordinator")) return "staffing_coordinator";
  if (appRoles.includes("staffing")) return "staffing_team";
  if (appRoles.includes("recruiting_assistant")) return "recruiting_team";
  if (
    appRoles.includes("hr") ||
    appRoles.includes("hr_admin") ||
    appRoles.includes("hr_manager") ||
    appRoles.includes("hr_admin_assistant")
  ) return "hr_team";
  if (appRoles.includes("finance")) return "billing_finance";
  if (appRoles.includes("qa")) return "qa_team";
  if (appRoles.includes("payroll_admin")) return "payroll_coordinator";
  if (appRoles.includes("bcba")) return "bcba";
  if (appRoles.includes("rbt")) return "rbt";
  if (appRoles.includes("marketing")) return "marketing_team";
  if (appRoles.includes("behavioral_support")) return "behavioral_support";
  return null;
}

/** Mock list of states (would come from backend). */
export const OS_STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;
export type OSState = typeof OS_STATES[number];

interface OSRoleContextValue {
  role: OSRole;
  scope: OSScope;
  /** Currently active state filter (only meaningful when scope === 'state'). */
  activeState: OSState;
  /** Mock assigned record ids (clients, leads) for assigned-scope roles. */
  assignedIds: string[];
  setRole: (r: OSRole) => void;
  setActiveState: (s: OSState) => void;
  canSee: (m: OSModule) => boolean;
  can: (m: OSModule, a: OSAction) => boolean;
  leadership: (typeof ROLE_PROFILES)[OSRole]["leadership"];
  platform: (cap: "managePermissions" | "impersonate" | "accessOldVersion" | "configureWorkflows") => boolean;
}

const OSRoleContext = createContext<OSRoleContextValue | null>(null);
const STORAGE_KEY = "os.demo.role";
const STATE_KEY = "os.demo.state";

export function OSRoleProvider({ children }: { children: ReactNode }) {
  const { roles: appRoles, user } = useAuth();
  const [roleOverride, setRoleState] = useState<OSRole | null>(() => {
    if (typeof window === "undefined") return null;
    return (window.localStorage.getItem(STORAGE_KEY) as OSRole) || null;
  });
  // Fall back to the lowest-privilege OS role if none of the user's app roles
  // map to a known OS role — never silently elevate to State Director.
  const derivedRole = mapAuthRoleToOS(appRoles) ?? "rbt";
  // Only super_admins can override their role via the demo switcher.
  const role: OSRole = derivedRole === "super_admin" && roleOverride ? roleOverride : derivedRole;
  const isSuperAdmin = derivedRole === "super_admin";
  const [profileState, setProfileState] = useState<OSState | null>(null);
  const [activeState, setActiveStateInternal] = useState<OSState>(() => {
    if (typeof window === "undefined") return "GA";
    const stored = window.localStorage.getItem(STATE_KEY) as OSState | null;
    return stored && (OS_STATES as readonly string[]).includes(stored) ? stored : "GA";
  });

  // Load the signed-in user's profile state and seed/lock activeState for non-admins.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) { setProfileState(null); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const s = (data?.state ?? null) as string | null;
      if (s && (OS_STATES as readonly string[]).includes(s)) {
        setProfileState(s as OSState);
        setActiveStateInternal(s as OSState);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    try {
      if (roleOverride) window.localStorage.setItem(STORAGE_KEY, roleOverride);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, [roleOverride]);
  useEffect(() => { try { window.localStorage.setItem(STATE_KEY, activeState); } catch { /* ignore */ } }, [activeState]);

  const setRole = useCallback((r: OSRole) => setRoleState(r), []);
  const setActiveState = useCallback((s: OSState) => {
    // Only State Directors are locked to their profile state.
    // Every other role operates company-wide, so the state selector is a no-op for them.
    if (!isSuperAdmin && derivedRole === "state_director" && profileState) return;
    setActiveStateInternal(s);
  }, [isSuperAdmin, derivedRole, profileState]);

  // Only State Directors get pinned to their profile state. Everyone else uses the
  // currently-selected state (which they can change freely, or ignore — their scope
  // is company-wide so it has no effect on the data they see).
  const effectiveState: OSState =
    !isSuperAdmin && derivedRole === "state_director" && profileState
      ? profileState
      : activeState;

  const value = useMemo<OSRoleContextValue>(() => ({
    role,
    scope: scopeFor(role),
    activeState: effectiveState,
    assignedIds: ["c-101", "c-102", "c-103", "l-201", "l-202"],
    setRole,
    setActiveState,
    canSee: (m) => canSeeModule(role, m),
    can: (m, a) => canAct(role, m, a),
    leadership: ROLE_PROFILES[role].leadership,
    platform: (cap) => hasPlatformCap(role, cap),
  }), [role, effectiveState, setRole, setActiveState]);

  return <OSRoleContext.Provider value={value}>{children}</OSRoleContext.Provider>;
}

export function useOSRole() {
  const ctx = useContext(OSRoleContext);
  if (!ctx) throw new Error("useOSRole must be used within <OSRoleProvider>");
  return ctx;
}

/** Returns the OS role context or null if not within an OSRoleProvider. */
export function useOSRoleSafe() {
  return useContext(OSRoleContext);
}