import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  OSRole, OSScope, OSModule, OSAction,
  ROLE_PROFILES, canAct, canSeeModule, canSeeLeadership, hasPlatformCap, scopeFor,
} from "@/lib/os/permissions";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { buildHats, type OSHat } from "@/lib/access/roleAssignments";

function mapAuthRoleToOS(appRoles: AppRole[]): OSRole | null {
  // Allow checking against role identifiers that are not yet part of the
  // AppRole union (e.g. credentialing_team, business_development).
  const has = (r: string) => (appRoles as string[]).includes(r);
  if (has("admin") || has("super_admin")) return "super_admin";
  if (has("systems_admin")) return "systems_admin";
  if (appRoles.includes("coo")) return "coo";
  if (appRoles.includes("executive")) return "executive_leadership";
  if (appRoles.includes("director_of_operations") || appRoles.includes("operations_manager")) return "operations_leadership";
  if (appRoles.includes("assistant_state_director")) return "assistant_state_director";
  if (has("state_va") || has("virtual_assistant") || has("state_virtual_assistant")) return "state_va";
  if (has("regional_state_director") || has("regional_director") || has("state_director_mentor")) return "regional_state_director";
  if (appRoles.includes("state_director")) return "state_director";
  if (appRoles.includes("exec")) return "executive_leadership";
  if (appRoles.includes("ops_manager")) return "operations_leadership";
  if (appRoles.includes("intake")) return "intake_coordinator";
  if (appRoles.includes("auth_team")) return "authorization_coordinator";
  if (appRoles.includes("scheduling")) return "scheduling_team";
  if (appRoles.includes("staffing_lead")) return "staffing_lead";
  if (appRoles.includes("staffing_coordinator")) return "staffing_coordinator";
  if (appRoles.includes("staffing")) return "staffing_team";
  if (has("recruiting_team")) return "recruiting_team";
  if (appRoles.includes("recruiting_lead")) return "recruiting_lead";
  if (appRoles.includes("recruiting_coordinator")) return "recruiting_coordinator";
  if (appRoles.includes("recruiting_assistant")) return "recruiting_team";
  if (appRoles.includes("credentialing_lead")) return "credentialing_lead";
  if (has("credentialing_team") || has("credentialing") || has("credentialing_coordinator")) return "credentialing_team";
  // HR Lead / Admin / Manager get the HR Lead OS experience (User Management Admin).
  if (
    appRoles.includes("hr_lead") ||
    appRoles.includes("hr_admin") ||
    appRoles.includes("hr_manager")
  ) return "hr_lead";
  // Plain HR Team members get the standard HR Team menu (User Management without admin).
  if (appRoles.includes("hr") || has("hr_team")) return "hr_team";
  // HR Admin Assistant is a trainee — must NOT inherit full HR Team access.
  // Drop them to a minimal Viewer experience (Training + Resources + Reports only).
  if (appRoles.includes("hr_admin_assistant")) return "viewer";
  if (
    appRoles.includes("finance") ||
    has("director_of_rcm") ||
    has("rcm_director") ||
    has("rcm_lead") ||
    has("billing_finance") ||
    has("billing_lead") ||
    has("rcm_team") ||
    has("finance_benefits_lead") ||
    has("finance_benefits_team")
  ) return "billing_finance";
  if (appRoles.includes("qa_director")) return "qa_director";
  if (appRoles.includes("qa_specialist")) return "qa_specialist";
  if (appRoles.includes("qa")) return "qa_team";
  if (appRoles.includes("payroll_admin")) return "payroll_coordinator";
  if (appRoles.includes("bcba")) return "bcba";
  if (appRoles.includes("rbt")) return "rbt";
  if (has("business_development")) return "business_development";
  if (appRoles.includes("marketing_growth_lead")) return "marketing_growth_lead";
  if (appRoles.includes("marketing") || appRoles.includes("marketing_team")) return "marketing_team";
  if (appRoles.includes("behavioral_support")) return "behavioral_support";
  // The Clinical Director OS role covers three DB app_role aliases:
  //   - clinical_director (canonical, added 2026-07)
  //   - clinic_director   (legacy alias kept for existing users)
  //   - clinical_lead     (older label)
  // Use the string-based `has` helper because the AppRole union type may
  // trail the DB enum (types.ts regenerates independently).
  if (has("clinical_director") || has("clinic_director") || has("clinical_lead")) {
    return "clinical_director";
  }
  if (has("training_manager") || has("training_lead") || has("enablement") || has("enablement_lead") || has("training_enablement")) {
    return "training_manager";
  }
  if (has("office_manager") || has("office_admin") || has("hr_assistant") || has("office_coordinator")) {
    return "office_manager";
  }
  if (has("clinic_growth") || has("director_of_clinics") || has("clinic_launch") || has("growth_to_launch")) {
    return "clinic_growth";
  }
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
  /** Multi-hat: hats this user can switch into. Empty for legacy single-role users. */
  hats: OSHat[];
  /** Multi-hat: currently active hat (null when user has no assignments). */
  activeHat: OSHat | null;
  /** Multi-hat: switch the active hat by id. */
  setActiveHat: (id: string) => void;
  /** Multi-hat: active department from the current hat, if any. */
  activeDepartment: string | null;
  /**
   * Profile-assigned state code for state-scoped roles. Null when the
   * signed-in user has no profiles.state row. UI uses this to show the
   * "assigned state required" setup state instead of silently defaulting
   * to another state.
   */
  profileState: OSState | null;
  /** True when the current role is state-scoped and profileState is set. */
  hasAssignedState: boolean;
  /**
   * Admin-only preview subject. When set, super/systems-admins previewing an
   * RBT/BCBA experience act as this employee for READ queries only. Writes
   * must be blocked at each call site via `isPreviewing`.
   */
  previewSubjectEmployeeId: string | null;
  setPreviewSubjectEmployeeId: (id: string | null) => void;
  /** True when the current session is impersonating another employee. */
  isPreviewing: boolean;
}

const OSRoleContext = createContext<OSRoleContextValue | null>(null);
const STORAGE_KEY = "os.demo.role";
const STATE_KEY = "os.demo.state";
const PREVIEW_SUBJECT_KEY = "os.preview.subjectEmployeeId";
const HAT_KEY_BASE = "os.activeHatId";
const hatStorageKey = (userId: string | null | undefined) =>
  userId ? `${HAT_KEY_BASE}.${userId}` : HAT_KEY_BASE;

export function OSRoleProvider({ children }: { children: ReactNode }) {
  const { roles: appRoles, user, activeAssignments, primaryAssignment } = useAuth();
  const [roleOverride, setRoleState] = useState<OSRole | null>(() => {
    if (typeof window === "undefined") return null;
    return (window.localStorage.getItem(STORAGE_KEY) as OSRole) || null;
  });
  const [previewSubjectId, setPreviewSubjectIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(PREVIEW_SUBJECT_KEY); } catch { return null; }
  });
  // Fall back to the lowest-privilege OS role if none of the user's app roles
  // map to a known OS role — never silently elevate to State Director.
  const derivedRole = mapAuthRoleToOS(appRoles) ?? "rbt";
  const isSuperAdmin = derivedRole === "super_admin" || derivedRole === "systems_admin";

  // Multi-hat: build the list of hats from active assignments.
  const hats = useMemo(() => buildHats(activeAssignments), [activeAssignments]);

  const [activeHatId, setActiveHatIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(hatStorageKey(user?.id)); } catch { return null; }
  });
  // Whenever the hat list changes, make sure the active hat id is still valid.
  useEffect(() => {
    if (hats.length === 0) { setActiveHatIdState(null); return; }
    if (!activeHatId || !hats.some((h) => h.id === activeHatId)) {
      const fallback = hats.find((h) => h.isPrimary)?.id ?? hats[0].id;
      setActiveHatIdState(fallback);
    }
  }, [hats, activeHatId]);
  useEffect(() => {
    try {
      const key = hatStorageKey(user?.id);
      if (activeHatId) window.localStorage.setItem(key, activeHatId);
      else window.localStorage.removeItem(key);
    } catch { /* ignore */ }
  }, [activeHatId, user?.id]);

  // When the signed-in user changes, re-read their per-user active hat.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(hatStorageKey(user?.id));
      setActiveHatIdState(stored);
    } catch { /* ignore */ }
  }, [user?.id]);
  const activeHat = useMemo<OSHat | null>(
    () => hats.find((h) => h.id === activeHatId) ?? hats[0] ?? null,
    [hats, activeHatId],
  );

  // Role resolution order:
  //   1. Super-admin override (View As Role)
  //   2. Active hat's OS role (multi-hat users)
  //   3. Legacy derived role from user_roles
  const role: OSRole = isSuperAdmin && roleOverride
    ? roleOverride
    : activeHat?.osRole ?? derivedRole;

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
  const setActiveHat = useCallback((id: string) => setActiveHatIdState(id), []);
  const setPreviewSubjectEmployeeId = useCallback((id: string | null) => {
    setPreviewSubjectIdState(id);
    try {
      if (id) window.localStorage.setItem(PREVIEW_SUBJECT_KEY, id);
      else window.localStorage.removeItem(PREVIEW_SUBJECT_KEY);
    } catch { /* ignore */ }
  }, []);
  const setActiveState = useCallback((s: OSState) => {
    // State Directors AND Assistant State Directors stay pinned to their
    // profile state. Multi-hat users with a state-scoped active hat stay
    // pinned to that hat's state.
    const isStateScopedRole =
      derivedRole === "state_director" || derivedRole === "assistant_state_director";
    if (!isSuperAdmin && isStateScopedRole && profileState) return;
    if (!isSuperAdmin && activeHat?.stateCode && activeHat.scope !== "company") return;
    setActiveStateInternal(s);
  }, [isSuperAdmin, derivedRole, profileState, activeHat]);

  // Effective state precedence:
  //   1. Super-admin can pick freely.
  //   2. Active hat with a state_code wins over everything else.
  //   3. State Director pinned to profile state.
  //   4. Otherwise: user's stored selection.
  const effectiveState: OSState = (() => {
    if (isSuperAdmin) return activeState;
    if (activeHat?.stateCode) return activeHat.stateCode as OSState;
    if (
      (derivedRole === "state_director" || derivedRole === "assistant_state_director")
      && profileState
    ) return profileState;
    return activeState;
  })();

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
    hats,
    activeHat,
    setActiveHat,
    activeDepartment: activeHat?.departmentKey ?? null,
    profileState,
    hasAssignedState: Boolean(profileState),
    previewSubjectEmployeeId: isSuperAdmin ? previewSubjectId : null,
    setPreviewSubjectEmployeeId,
    isPreviewing: Boolean(isSuperAdmin && previewSubjectId),
  }), [role, effectiveState, setRole, setActiveState, hats, activeHat, setActiveHat, profileState, isSuperAdmin, previewSubjectId, setPreviewSubjectEmployeeId]);

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