import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS, ROLE_PREVIEW_LIST, DEFAULT_ROLE_MENU } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

/**
 * Blossom OS — Role Release-Readiness Manifest.
 *
 * This suite is the release gate for every selectable OS role. It proves,
 * without booting the app, that:
 *
 *   1. Every role in the Super Admin "View as Role" switcher has a valid
 *      landing route wired up (either an explicit ROLE_HOME entry or the
 *      default /dashboard fallback).
 *   2. Every menu path defined for every role in ROLE_MENUS resolves to
 *      a real, mounted <Route> in App.tsx — no dead menu items.
 *   3. No operator role menu exposes diagnostic surfaces (integrations,
 *      CTM ops, admin AI configuration, audit log viewer, systems tools).
 *      Diagnostics may exist ONLY behind super_admin / systems_admin /
 *      admin route guards.
 *   4. Super Admin retains diagnostic access — verified against the
 *      superAdminMenu source.
 *   5. Every diagnostic route in App.tsx is protected by AdminRoute (or
 *      an equivalent super_admin PermissionRoute) so direct URL access
 *      cannot bypass menu-level gating.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const appSrc = read("src/App.tsx");
const superAdminMenuSrc = read("src/lib/os/superAdminMenu.ts");

/** Paths that are considered technical diagnostic surfaces per the
 *  OperatorDiagnosticsGate contract. Operators never see these. */
const DIAGNOSTIC_PATH_PATTERNS: RegExp[] = [
  /^\/admin\/integrations(\/|$|\?)/,
  /^\/admin\/ctm(\/|$|\?)/,
  /^\/admin\/ctm-ops(\/|$|\?)/,
  /^\/admin\/ai\//,
  /^\/admin\/system(\/|$|\?)/,
  /^\/system\/tools(\/|$|\?)/,
  /^\/system\/audit-log(\/|$|\?)/,
];

const isDiagnostic = (path: string) =>
  DIAGNOSTIC_PATH_PATTERNS.some((re) => re.test(path));

/** Extract every concrete "path" string from a role menu. */
function menuPaths(role: string): string[] {
  const menu = ROLE_MENUS[role as keyof typeof ROLE_MENUS] ?? DEFAULT_ROLE_MENU;
  const paths: string[] = [];
  for (const section of menu.sections) {
    for (const item of section.items) paths.push(item.path);
  }
  return paths;
}

/** Extract every `<Route path="…">` pattern from App.tsx. */
const APP_ROUTE_PATTERNS: string[] = (() => {
  const set = new Set<string>();
  const re = /<Route\s+path="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(appSrc))) set.add(m[1]);
  return [...set];
})();

/** Match a concrete path against a React Router pattern with :params and trailing *. */
function matchesRoute(path: string, pattern: string): boolean {
  if (pattern === path) return true;
  if (pattern === "*") return true;
  const pParts = pattern.split("/");
  const aParts = path.split("/");
  if (pParts[pParts.length - 1] === "*") {
    if (aParts.length < pParts.length - 1) return false;
    for (let i = 0; i < pParts.length - 1; i++) {
      const pp = pParts[i];
      const ap = aParts[i];
      if (pp.startsWith(":")) continue;
      if (pp !== ap) return false;
    }
    return true;
  }
  if (pParts.length !== aParts.length) return false;
  for (let i = 0; i < pParts.length; i++) {
    const pp = pParts[i];
    const ap = aParts[i];
    if (pp.startsWith(":")) continue;
    if (pp !== ap) return false;
  }
  return true;
}

function routeExists(path: string): boolean {
  const clean = path.split("?")[0];
  return APP_ROUTE_PATTERNS.some((pat) => matchesRoute(clean, pat));
}

/** Every role advertised in the View As switcher must be covered here. */
const PREVIEW_ROLES = ROLE_PREVIEW_LIST.map((r) => r.role);

describe("Release readiness — every selectable role has a landing route", () => {
  it.each(PREVIEW_ROLES)("role %s has a valid landing route", (role) => {
    const home = ROLE_HOME[role] ?? "/dashboard";
    expect(home).toMatch(/^\/[a-z]/i);
    expect(routeExists(home), `landing route ${home} for ${role} not mounted in App.tsx`).toBe(true);
  });
});

describe("Release readiness — every role menu path routes somewhere real", () => {
  it.each(PREVIEW_ROLES)("role %s has no dead menu items", (role) => {
    const dead = menuPaths(role).filter((p) => !routeExists(p));
    expect(dead, `role ${role} has dead menu paths:\n  ${dead.join("\n  ")}`).toEqual([]);
  });
});

describe("Release readiness — operator menus contain no diagnostic surfaces", () => {
  const OPERATOR_ROLES = PREVIEW_ROLES.filter(
    (r) => r !== "super_admin" && r !== "systems_admin",
  );

  it.each(OPERATOR_ROLES)("role %s never advertises a diagnostic path", (role) => {
    const leaks = menuPaths(role).filter(isDiagnostic);
    expect(leaks, `role ${role} advertises diagnostic surfaces:\n  ${leaks.join("\n  ")}`).toEqual([]);
  });
});

describe("Release readiness — Super Admin retains diagnostic access", () => {
  it("Super Admin menu still exposes Integrations, CTM Operations, and the Audit Log", () => {
    expect(superAdminMenuSrc).toContain('"/admin/integrations"');
    expect(superAdminMenuSrc).toContain('"/admin/ctm"');
    expect(superAdminMenuSrc).toContain('"/system/audit-log"');
  });
});

describe("Release readiness — diagnostic routes are AdminRoute-guarded", () => {
  // Extract every <Route path="/admin/…" or "/system/audit-log"> and prove the
  // element is either AdminRoute or a super_admin-only PermissionRoute.
  const ADMIN_ROUTE_PATTERN = /<Route\s+path="([^"]+)"\s+element=\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;

  it("no operator-visible role guard protects a diagnostic surface", () => {
    const violations: Array<{ path: string; guard: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = ADMIN_ROUTE_PATTERN.exec(appSrc))) {
      const path = m[1];
      const element = m[2];
      if (!isDiagnostic(path)) continue;
      // Acceptable guards: <AdminRoute … or PermissionRoute allowedRoles={["super_admin"…
      const isAdminRoute = /<AdminRoute/.test(element);
      const isSuperAdminOnly =
        /<PermissionRoute[^>]*allowedRoles=\{\[\s*"super_admin"\s*(?:,\s*"systems_admin"\s*)?\]/.test(element);
      if (!isAdminRoute && !isSuperAdminOnly) {
        violations.push({ path, guard: element.slice(0, 200) });
      }
    }
    expect(
      violations,
      `Diagnostic routes with insufficient guards:\n${violations
        .map((v) => `  ${v.path} → ${v.guard}`)
        .join("\n")}`,
    ).toEqual([]);
  });
});

describe("Release readiness — operator surfaces do not leak vendor/webhook copy in header/empty states", () => {
  // The operator subtitle and empty state for AfterHoursAIBoard must not
  // reference Retell or webhooks. Sync/routing UI is only reachable via
  // OperatorDiagnosticsGate.
  const board = read("src/components/phone/AfterHoursAIBoard.tsx");
  it("After-Hours AI header/empty copy is vendor-neutral for operators", () => {
    expect(board).not.toContain("Retell AI captures inbound calls outside business hours");
    expect(board).not.toMatch(/No calls yet\. Calls will appear here as Retell sends webhooks/);
    expect(board).toContain("Inbound calls captured after business hours. Intake reviews and follows up here.");
  });
});