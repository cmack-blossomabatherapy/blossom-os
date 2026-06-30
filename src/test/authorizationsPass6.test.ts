import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pass 6 guardrails — deep-link resolution, drawer truth, working filters,
 * non-silent error handling, single Reports page, and honest empty states.
 */
function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Authorizations Pass 6 — deep links, drawer truth, working filters", () => {
  it("/authorizations supports both authId and overlayId query params on init and via effect", () => {
    const src = read("src/pages/os/OSAuthorizations.tsx");
    expect(src).toMatch(/searchParams\.get\("authId"\)\s*\?\?\s*searchParams\.get\("overlayId"\)/);
    expect(src).toMatch(/resolveAuthId/);
    expect(src).toMatch(/overlayIdByAuthId/);
  });

  it("/authorizations drawer close removes both authId and overlayId", () => {
    const src = read("src/pages/os/OSAuthorizations.tsx");
    expect(src).toMatch(/next\.delete\("authId"\)/);
    expect(src).toMatch(/next\.delete\("overlayId"\)/);
  });

  it("Missing Docs uses overlay-aware deep linking (overlayId param present)", () => {
    const md = read("src/pages/os/operations/MissingDocs.tsx");
    expect(md).toMatch(/overlayId=/);
  });

  it("No .catch(() => undefined) anywhere in active Authorizations write paths", () => {
    const files = [
      "src/components/authorizations/AuthorizationActionUI.tsx",
      "src/pages/os/OSAuthorizations.tsx",
      "src/pages/os/OSAuthWorkspace.tsx",
      "src/hooks/useAuthorizationActions.ts",
    ];
    for (const f of files) {
      const txt = read(f);
      expect(txt, `${f} must not contain .catch(() => undefined)`).not.toMatch(/\.catch\(\(\)\s*=>\s*undefined\)/);
    }
  });

  it("/auth-workspace filter chips are backed by real filter state (wsFilters)", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(ws).toMatch(/wsFilters/);
    expect(ws).toMatch(/FilterDropdown[\s\S]*label=\"State\"/);
    expect(ws).toMatch(/FilterDropdown[\s\S]*label=\"Risk\"/);
    expect(ws).toMatch(/FilterDropdown[\s\S]*label=\"Expiring\"/);
    expect(ws).toMatch(/FilterDropdown[\s\S]*label=\"PR\"/);
    expect(ws).toMatch(/FilterDropdown[\s\S]*label=\"QA\"/);
    expect(ws).toMatch(/FilterDropdown[\s\S]*label=\"Assigned\"/);
    // visible memo references wsFilters
    expect(ws).toMatch(/visible[\s\S]{0,400}wsFilters/);
  });

  it("/auth-workspace does not show stale 'sample queue layout' copy", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(ws).not.toMatch(/showing sample queue layout/);
    expect(ws).toMatch(/No live authorizations found yet/);
  });

  it("/auth-workspace drawer does not render hardcoded fake timeline entries", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(ws).not.toMatch(/text:\s*"PR requested from BCBA"/);
    expect(ws).not.toMatch(/text:\s*"Escalated to State Director"/);
    expect(ws).not.toMatch(/RowKv label="BCBA contacted">3 pings/);
    // Real timeline source path:
    expect(ws).toMatch(/liveAuth\?\.\s*timeline/);
  });

  it("/auth-workspace drawer has a real note save path through actions.addNote", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(ws).toMatch(/onSaveNote/);
    expect(ws).toMatch(/actions\.addNote\(buildOverlay\(openAuth\),\s*text\)/);
    expect(ws).toMatch(/Add Note/);
  });

  it("Reports catalog does not link to /os/authorizations (use /authorizations)", () => {
    const catalog = read("src/lib/os/reportsCatalog.ts");
    expect(catalog).not.toMatch(/\/os\/authorizations/);
  });

  it("The Authorizations Team role menu keeps /reports as the only reports route", () => {
    // Authorizations menu items are defined either in OSShell or a routing file.
    // Whichever file references both 'Authorization Reports' and a route,
    // that route must be exactly /reports.
    const candidates = [
      "src/pages/os/OSShell.tsx",
      "src/lib/os/menus.ts",
      "src/lib/os/navigation.ts",
      "src/components/AppSidebar.tsx",
    ];
    let found = false;
    for (const c of candidates) {
      try {
        const t = read(c);
        if (/Authorization Reports|Authorizations Reports|Reports/.test(t) && /\/reports/.test(t)) {
          found = true;
          expect(t).not.toMatch(/path:\s*["']\/authorizations\/reports["']/);
        }
      } catch { /* ignore missing */ }
    }
    expect(found).toBe(true);
  });

  it("AuthSubnav relates main list, focused queue, expiring, missing docs, payer requirements, and reports", () => {
    const ws = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(ws).toMatch(/AuthSubnav/);
    expect(ws).toMatch(/Focused Queue/);
    expect(ws).toMatch(/Main List/);
  });
});