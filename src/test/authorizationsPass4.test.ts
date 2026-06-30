import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Pass 4 guardrails — these tests fail loudly if regressions reintroduce
 * the runtime issues documented in the Authorizations Pass 4 prompt.
 */

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("Authorizations Pass 4 — runtime hardening guardrails", () => {
  it("useLiveAuthorizations queries requirement_name, not title", () => {
    const src = read("src/hooks/useLiveAuthorizations.ts");
    expect(src).toContain("requirement_name");
    expect(src).not.toMatch(/authorization_requirements[^"]*?"[^"]*\btitle\b/);
  });

  it("resolveDocs writes the exact status \"Received\" (case-sensitive)", () => {
    const src = read("src/hooks/useAuthorizationActions.ts");
    expect(src).toMatch(/status:\s*"Received"/);
    expect(src).toMatch(/\.neq\("status",\s*"Received"\)/);
    // No lowercase status updates left behind.
    expect(src).not.toMatch(/status:\s*"received"/);
  });

  it("ensureOverlay supports a direct overlay_id fast-path", () => {
    const src = read("src/hooks/useAuthorizationActions.ts");
    expect(src).toContain("overlay_id");
    expect(src).toMatch(/if \(input\.overlay_id\)/);
  });

  it("createManualAuth followed by addNote does not duplicate overlays", () => {
    const ui = read("src/components/authorizations/AuthorizationActionUI.tsx");
    // The initial note after manual create must target the inserted overlay id.
    expect(ui).toMatch(/overlay_id:\s*id/);
  });

  it("OSAuthorizations does not hardcode <SourceBadge source=\"monday\" />", () => {
    const src = read("src/pages/os/OSAuthorizations.tsx");
    expect(src).not.toMatch(/<SourceBadge\s+source=["']monday["']/);
  });

  it("OSAuthorizations does not default the current user to Priya K.", () => {
    const src = read("src/pages/os/OSAuthorizations.tsx");
    expect(src).not.toContain("Priya K.");
  });

  it("OSAuthWorkspace does not hardcode Rachel as QA reviewer", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(src).not.toMatch(/QA reviewer["']?\s*[}>]\s*Rachel/);
    expect(src).not.toMatch(/>Rachel</);
  });

  it("OSAuthWorkspace right rail does not render fake Sample activity", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(src).not.toMatch(/approved auth · Sample/);
    expect(src).not.toMatch(/denied auth · Sample/);
  });

  it("NewAuthorizationDialog is wired with onCreated → live.refresh in OSAuthorizations", () => {
    const src = read("src/pages/os/OSAuthorizations.tsx");
    expect(src).toMatch(/onCreated=\{\(\)\s*=>\s*\{\s*void\s+live\.refresh\(\)/);
  });

  it("NewAuthorizationDialog is wired with onCreated → refresh in OSAuthWorkspace", () => {
    const src = read("src/pages/os/OSAuthWorkspace.tsx");
    expect(src).toMatch(/onCreated=\{\(\)\s*=>\s*\{\s*void\s+refresh\(\)/);
  });

  it("Authorizations reports declare drilldownPath", () => {
    const src = read("src/lib/os/reportsCatalog.ts");
    expect(src).toMatch(/"auth-expiration-risk"[\s\S]*?drilldownPath/);
    expect(src).toMatch(/"auth-workflow-bottleneck"[\s\S]*?drilldownPath/);
    expect(src).toMatch(/"auth-operational-performance"[\s\S]*?drilldownPath/);
  });

  it("marketing_reports module route points at the canonical /reports page", () => {
    const src = read("src/lib/os/permissions.ts");
    expect(src).toMatch(/marketing_reports:\s*"\/reports/);
  });

  it("metadata merging is implemented in markReviewed (no blind overwrite)", () => {
    const src = read("src/hooks/useAuthorizationActions.ts");
    // We fetch existing metadata and merge it before writing.
    expect(src).toMatch(/\.select\("metadata"\)/);
    expect(src).toMatch(/\.\.\.currentMeta/);
  });

  it("only one sendToQA implementation remains (no dead sendToQAImpl)", () => {
    const src = read("src/hooks/useAuthorizationActions.ts");
    expect(src).not.toContain("sendToQAImpl");
  });
});