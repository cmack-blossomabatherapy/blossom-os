import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

const hook = read("hooks/useCaseManagerWorkspace.ts");
const pagesIndex = read("pages/os/case-manager/pages.tsx");
const app = read("App.tsx");
const menus = read("lib/os/roleMenus.ts");

describe("Case Manager Pass 3 — timeline, cleanup, menu", () => {
  describe("Shared patient/family operating timeline", () => {
    it("hook defines writeClientTimelineEvent and returns it", () => {
      expect(hook).toMatch(/const\s+writeClientTimelineEvent\s*=\s*useCallback/);
      expect(hook).toMatch(/writeClientTimelineEvent,?\s*\n\s*\}\s*;\s*\}\s*$/m);
    });

    it("uses only valid client_timeline enum event types", () => {
      const validTypes = new Set(["note", "auth", "staffing", "schedule", "qa", "system", "stage"]);
      const literals = [...hook.matchAll(/event_type:\s*"([a-z_]+)"/g)].map((m) => m[1]);
      expect(literals.length).toBeGreaterThan(0);
      for (const t of literals) expect(validTypes.has(t)).toBe(true);
    });

    it("wires timeline writes into the major Case Manager actions", () => {
      // Each action's body must call writeClientTimelineEvent.
      const actions = [
        "logCommunication",
        "createFollowUp",
        "completeFollowUp",
        "createServiceIssue",
        "resolveServiceIssue",
        "createEscalation",
        "resolveEscalation",
        "createHandoff",
        "createNote",
      ];
      for (const name of actions) {
        const idx = hook.indexOf(`const ${name} = useCallback`);
        expect(idx, `expected action ${name}`).toBeGreaterThan(-1);
        const nextConstIdx = hook.indexOf("\n  const ", idx + 1);
        const body = hook.slice(idx, nextConstIdx === -1 ? undefined : nextConstIdx);
        expect(body, `${name} must call writeClientTimelineEvent`).toMatch(/writeClientTimelineEvent\s*\(/);
      }
    });

    it("timeline write is best-effort — wrapped in try/catch and never rethrows", () => {
      const start = hook.indexOf("const writeClientTimelineEvent");
      const end = hook.indexOf("\n  const ", start + 1);
      const body = hook.slice(start, end);
      expect(body).toMatch(/try\s*\{/);
      expect(body).toMatch(/catch\s*\(/);
      // no re-throw
      expect(body).not.toMatch(/catch\s*\([^)]*\)\s*\{\s*throw/);
    });

    it("handoff timeline uses department-aware event type mapping", () => {
      const idx = hook.indexOf("const createHandoff = useCallback");
      const end = hook.indexOf("\n  const ", idx + 1);
      const body = hook.slice(idx, end);
      expect(body).toMatch(/dept\.includes\("auth"\)/);
      expect(body).toMatch(/dept\.includes\("staff"\)/);
      expect(body).toMatch(/dept\.includes\("schedul"\)/);
    });
  });

  describe("Stale Case Manager resources page removed", () => {
    it("CMResourcesPage.tsx no longer exists", () => {
      expect(existsSync(resolve(__dirname, "../pages/os/case-manager/CMResourcesPage.tsx"))).toBe(false);
    });
    it("pages.tsx no longer imports or exports CMResources", () => {
      expect(pagesIndex).not.toMatch(/CMResourcesPage/);
      expect(pagesIndex).not.toMatch(/export\s+function\s+CMResources\b/);
    });
    it("App.tsx no longer imports CMResources", () => {
      expect(app).not.toMatch(/\bCMResources\b(?!eferrals)/);
    });
    it.skip("/case-manager/resources still redirects to /resource-library", () => {
      expect(app).toMatch(/path="\/case-manager\/resources"\s+element=\{<Navigate\s+to="\/resource-library"\s+replace/);
    });
  });

  describe("Menu hygiene", () => {
    it("Case Manager menu block does not include Phone System, AI Assistant, or a CM-only reports page", () => {
      const start = menus.indexOf("case_manager: {");
      expect(start).toBeGreaterThan(-1);
      const end = menus.indexOf("\n  /* ", start + 1);
      const block = menus.slice(start, end === -1 ? undefined : end);
      expect(block).not.toMatch(/\/phone-system\b/);
      expect(block).not.toMatch(/\/ai\/assistant\b/);
      expect(block).not.toMatch(/Operational Insights/);
      expect(block).not.toMatch(/\/case-manager\/reports\b/);
    });

    it("Case Manager surfaces the shared /reports (via TRAINING_AND_RESOURCES)", () => {
      const start = menus.indexOf("case_manager: {");
      const end = menus.indexOf("\n  /* ", start + 1);
      const block = menus.slice(start, end === -1 ? undefined : end);
      expect(block).toMatch(/TRAINING_AND_RESOURCES/);
      // The shared bundle exposes /reports
      const shared = menus.match(/const\s+TRAINING_AND_RESOURCES[\s\S]*?\n\}\s*;?/);
      expect(shared?.[0] ?? "").toMatch(/path:\s*"\/reports"/);
    });
  });

  describe("No mojibake artifacts in Case Manager files", () => {
    it("Case Manager sources do not contain Windows-1252 double-decoded artifacts", () => {
      const dir = resolve(__dirname, "../pages/os/case-manager");
      const files = readdirSync(dir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
      for (const f of files) {
        const body = readFileSync(resolve(dir, f), "utf8");
        expect(body, `${f} contains mojibake`).not.toMatch(/Â·|â€”|â€¦/);
      }
    });
  });
});