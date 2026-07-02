import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Authorizations Pass 8 — role menus", () => {
  it("ROLE_MENUS.authorization_manager exists with an Authorizations section", () => {
    const menu = ROLE_MENUS.authorization_manager;
    expect(menu).toBeTruthy();
    const paths = menu!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).toContain("/authorizations");
    expect(paths).toContain("/auth-workspace");
    expect(paths).toContain("/authorizations/handoff");
    expect(paths).toContain("/reports");
  });

  it("coordinator + manager menus do not use legacy /ops/authorizations|/ops/approved-authorizations|/ops/denials", () => {
    for (const role of ["authorization_coordinator", "authorization_manager"] as const) {
      const paths = ROLE_MENUS[role]!.sections.flatMap((s) => s.items.map((i) => i.path));
      for (const bad of ["/ops/authorizations", "/ops/approved-authorizations", "/ops/denials"]) {
        expect(paths, `${role} should not include ${bad}`).not.toContain(bad);
      }
    }
  });

  it("both menus point Approved → stage=approved and Denials → stage=denied", () => {
    for (const role of ["authorization_coordinator", "authorization_manager"] as const) {
      const paths = ROLE_MENUS[role]!.sections.flatMap((s) => s.items.map((i) => i.path));
      expect(paths).toContain("/authorizations?stage=approved");
      expect(paths).toContain("/authorizations?stage=denied");
    }
  });

  it("no coming-soon paths in the manager menu", () => {
    const paths = ROLE_MENUS.authorization_manager!.sections.flatMap((s) => s.items.map((i) => i.path));
    for (const p of paths) expect(p).not.toContain("/coming-soon");
  });
});

describe("Authorizations Pass 8 — Super Admin sidebar canonical routes", () => {
  const sb = read("src/components/layout/AppSidebar.tsx");
  it("Super Admin Authorizations entries use canonical /authorizations routes", () => {
    // Legacy /ops/{authorizations,approved-authorizations,denials} must be gone from the sidebar.
    expect(sb).not.toMatch(/path:\s*"\/ops\/authorizations"/);
    expect(sb).not.toMatch(/path:\s*"\/ops\/approved-authorizations"/);
    expect(sb).not.toMatch(/path:\s*"\/ops\/denials"/);
    expect(sb).toMatch(/path:\s*"\/authorizations\?stage=approved"/);
    expect(sb).toMatch(/path:\s*"\/authorizations\?stage=denied"/);
  });
});

describe("Authorizations Pass 8 — /authorizations honors stage + preserves other params", () => {
  const a = read("src/pages/os/OSAuthorizations.tsx");
  it("STAGE_TO_VIEW covers approved, denied, submitted, qa, and missing_docs", () => {
    expect(a).toMatch(/approved:\s*"approved"/);
    expect(a).toMatch(/denied:\s*"denied"/);
    expect(a).toMatch(/submitted:\s*"submitted"/);
    expect(a).toMatch(/qa:\s*"qa"/);
    expect(a).toMatch(/missing_docs:\s*"missing"/);
  });
  it("still supports authId, overlayId, payor/payer, state, coordinator", () => {
    expect(a).toMatch(/searchParams\.get\("authId"\)\s*\?\?\s*searchParams\.get\("overlayId"\)/);
    expect(a).toMatch(/searchParams\.get\("payor"\)\s*\?\?\s*searchParams\.get\("payer"\)/);
    expect(a).toMatch(/searchParams\.get\("state"\)/);
    expect(a).toMatch(/searchParams\.get\("coordinator"\)/);
  });
});

describe("Authorizations Pass 8 — OpsRecordsWorkspace remote actions are awaitable", () => {
  const ws = read("src/pages/os/operations/OpsRecordsWorkspace.tsx");
  it("rowActions ctx uses Promise-compatible signatures", () => {
    expect(ws).toMatch(/update:\s*\(id: string, patch: Partial<OpsRecord>\)\s*=>\s*Promise<void>\s*\|\s*void/);
    expect(ws).toMatch(/remove:\s*\(id: string\)\s*=>\s*Promise<void>\s*\|\s*void/);
  });
  it("remote create/update/remove no longer use fire-and-forget .catch()", () => {
    expect(ws).not.toMatch(/remote\.create\([^)]+\)\.catch/);
    expect(ws).not.toMatch(/remote\.update\([^)]+\)\.catch/);
    expect(ws).not.toMatch(/remote\.remove\([^)]+\)\.catch/);
    expect(ws).toMatch(/await remote\.create/);
    expect(ws).toMatch(/await remote\.update/);
    expect(ws).toMatch(/await remote\.remove/);
  });
});

describe("Authorizations Pass 8 — MissingDocs + PayerRequirements await before success", () => {
  const md = read("src/pages/os/operations/MissingDocs.tsx");
  const pr = read("src/pages/os/operations/PayerRequirements.tsx");
  it("MissingDocs awaits update/remove before toasting success", () => {
    expect(md).toMatch(/await Promise\.resolve\(update\(/);
    expect(md).toMatch(/await Promise\.resolve\(remove\(/);
  });
  it("PayerRequirements awaits remove before toasting success", () => {
    expect(pr).toMatch(/await Promise\.resolve\(remove\(/);
    expect(pr).toMatch(/toast\.success\("Payer requirement deleted"\)/);
  });
});

describe("Authorizations Pass 8 — /authorizations no coming-soon actions", () => {
  const a = read("src/pages/os/OSAuthorizations.tsx");
  it("Export is not coming soon and does a real CSV download", () => {
    expect(a).not.toMatch(/Export — coming soon/);
    expect(a).toMatch(/text\/csv/);
    expect(a).toMatch(/authorizations-\$\{new Date\(\)\.toISOString/);
    // Reasonable field coverage
    for (const key of ["clientName", "payor", "requestType", "coordinator", "bcba", "expirationDate", "missingDocsCount", "source"]) {
      expect(a).toContain(`key: "${key}"`);
    }
  });
  it("Try asking prompts are real links, not assistant-coming-soon toasts", () => {
    expect(a).not.toMatch(/assistant coming soon/);
    expect(a).toMatch(/to=\{`\/ai\/assistant\?context=authorizations&q=\$\{encodeURIComponent\(p\)\}`\}/);
  });
});

describe("Authorizations Pass 8 — external send queue honest + actionable", () => {
  const h = read("src/hooks/useAuthorizationActions.ts");
  const a = read("src/pages/os/OSAuthorizations.tsx");
  it("queueExternalSend still logs an audit activity and does not claim delivered", () => {
    expect(h).toMatch(/activityType:\s*"external_send_pending"/);
    expect(h).toMatch(/integration pending/i);
  });
  it("queueExternalSend also creates a manual follow-up task", () => {
    expect(h).toMatch(/Manual follow-up:/);
    expect(h).toMatch(/createTask\(/);
  });
  it("button copy is honest — not 'Message BCBA' as if sent", () => {
    expect(a).toMatch(/Queue Message Follow-Up/);
    expect(a).not.toMatch(/>\s*Message BCBA\s*</);
  });
});

describe("Authorizations Pass 8 — CentralReach readiness honest", () => {
  const cr = read("src/components/authorizations/AuthorizationActionUI.tsx");
  it("readiness UI does not claim CentralReach is connected", () => {
    expect(cr).not.toMatch(/CentralReach connected/i);
    expect(cr).toMatch(/CentralReach/);
    // Honest language present somewhere in the readiness surface.
    expect(/integration pending|not connected|CentralReach-ready|import\/API-ready|ready for CentralReach/i.test(cr)).toBe(true);
  });
});
