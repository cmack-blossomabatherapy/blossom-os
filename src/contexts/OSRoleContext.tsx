import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  OSRole, OSScope, OSModule, OSAction,
  ROLE_PROFILES, canAct, canSeeModule, canSeeLeadership, hasPlatformCap, scopeFor,
} from "@/lib/os/permissions";

/** Mock list of states (would come from backend). */
export const OS_STATES = ["FL", "GA", "NC", "TX", "VA"] as const;
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
  const [role, setRoleState] = useState<OSRole>(() => {
    if (typeof window === "undefined") return "super_admin";
    return (window.localStorage.getItem(STORAGE_KEY) as OSRole) || "super_admin";
  });
  const [activeState, setActiveStateInternal] = useState<OSState>(() => {
    if (typeof window === "undefined") return "FL";
    return (window.localStorage.getItem(STATE_KEY) as OSState) || "FL";
  });

  useEffect(() => { try { window.localStorage.setItem(STORAGE_KEY, role); } catch { /* ignore */ } }, [role]);
  useEffect(() => { try { window.localStorage.setItem(STATE_KEY, activeState); } catch { /* ignore */ } }, [activeState]);

  const setRole = useCallback((r: OSRole) => setRoleState(r), []);
  const setActiveState = useCallback((s: OSState) => setActiveStateInternal(s), []);

  const value = useMemo<OSRoleContextValue>(() => ({
    role,
    scope: scopeFor(role),
    activeState,
    assignedIds: ["c-101", "c-102", "c-103", "l-201", "l-202"],
    setRole,
    setActiveState,
    canSee: (m) => canSeeModule(role, m),
    can: (m, a) => canAct(role, m, a),
    leadership: ROLE_PROFILES[role].leadership,
    platform: (cap) => hasPlatformCap(role, cap),
  }), [role, activeState, setRole, setActiveState]);

  return <OSRoleContext.Provider value={value}>{children}</OSRoleContext.Provider>;
}

export function useOSRole() {
  const ctx = useContext(OSRoleContext);
  if (!ctx) throw new Error("useOSRole must be used within <OSRoleProvider>");
  return ctx;
}