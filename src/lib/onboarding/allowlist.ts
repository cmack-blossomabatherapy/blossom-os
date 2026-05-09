import type { AppRole } from "@/lib/roles";

const STORAGE_KEY = "blossom.onboarding.allowlist.v1";
const EVENT = "blossom:onboarding-allowlist-change";

/** Map of role -> array of route patterns (string).
 *  Patterns support:
 *   - exact match: "/profile"
 *   - prefix glob: "/training/*"  (matches "/training" and "/training/...")
 */
export type RoleAllowlist = Partial<Record<AppRole, string[]>>;

/** Sensible starter list — admins can extend per role. */
export const DEFAULT_ALLOWLIST: RoleAllowlist = {
  rbt: ["/my-learning", "/announcements"],
  bcba: ["/my-learning", "/announcements"],
  staff: ["/announcements"],
};

function read(): RoleAllowlist {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ALLOWLIST };
    const parsed = JSON.parse(raw) as RoleAllowlist;
    return parsed ?? {};
  } catch {
    return { ...DEFAULT_ALLOWLIST };
  }
}

function write(value: RoleAllowlist) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getAllowlist(): RoleAllowlist {
  return read();
}

export function setAllowlistForRole(role: AppRole, patterns: string[]) {
  const all = read();
  const cleaned = Array.from(new Set(patterns.map((p) => p.trim()).filter(Boolean)));
  all[role] = cleaned;
  write(all);
}

export function resetAllowlist() {
  write({ ...DEFAULT_ALLOWLIST });
}

export function subscribeAllowlist(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Returns true if `pathname` matches any of the user's role-derived patterns. */
export function isAllowedForRoles(pathname: string, roles: AppRole[]): boolean {
  if (roles.length === 0) return false;
  const map = read();
  for (const role of roles) {
    const patterns = map[role];
    if (!patterns) continue;
    if (patterns.some((p) => matches(pathname, p))) return true;
  }
  return false;
}

export function matches(pathname: string, pattern: string): boolean {
  if (!pattern) return false;
  if (pattern === pathname) return true;
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(base + "/");
  }
  if (pattern.endsWith("*")) {
    return pathname.startsWith(pattern.slice(0, -1));
  }
  return false;
}
