import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { linkToHref } from "@/components/escalation/EscalationLinkPicker";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

/**
 * Regression guard: every deep-link target used by CTM calls and escalation
 * link chips must resolve to a registered route AND open the matching drawer
 * against the record id in the URL. Any drift to a bare `/clients/<id>` or
 * `/authorizations/<id>` (which are NOT routed) would 404 in production.
 */
describe("Client / Authorization / Task deep-links resolve to the correct drawer", () => {
  const app = read("src/App.tsx");
  const clientsPage = read("src/pages/os/OSClientsOperations.tsx");
  const authsPage = read("src/pages/os/OSAuthorizations.tsx");
  const tasksPage = read("src/pages/tasks/TasksPage.tsx");
  const linker = read("src/components/escalation/EscalationLinkPicker.tsx");
  const deepLink = read("src/lib/deepLink.ts");

  const SAMPLE = "11111111-1111-1111-1111-111111111111";

  describe("Clients", () => {
    it("linkToHref('client', id) → /clients?client=<id>", () => {
      expect(linkToHref({ type: "client", id: SAMPLE, label: "x" }))
        .toBe(`/clients?client=${SAMPLE}`);
    });

    it("never emits a bare /clients/<id> (route is not registered)", () => {
      expect(linker).not.toMatch(/`\/clients\/\$\{v\.id\}`/);
    });

    it("registers /clients as a real route", () => {
      expect(app).toMatch(/path="\/clients"\s+element=\{<ClientsRouter\s*\/>\}/);
    });

    it("OSClientsOperations reads ?client=<id> and mounts <ClientDrawer clientId={openClientId}>", () => {
      expect(clientsPage).toMatch(/searchParams\.get\("client"\)/);
      expect(clientsPage).toMatch(/<ClientDrawer\s+clientId=\{openClientId\}/);
    });
  });

  describe("Authorizations", () => {
    it("linkToHref('authorization', id) → /authorizations?authId=<id>", () => {
      expect(linkToHref({ type: "authorization", id: SAMPLE, label: "x" }))
        .toBe(`/authorizations?authId=${SAMPLE}`);
    });

    it("never emits a bare /authorizations/<id> (route is not registered)", () => {
      expect(linker).not.toMatch(/`\/authorizations\/\$\{v\.id\}`/);
    });

    it("registers /authorizations as a real route", () => {
      expect(app).toMatch(/path="\/authorizations"/);
    });

    it("OSAuthorizations reads ?authId=<id> and mounts <AuthDrawer> for that id", () => {
      expect(authsPage).toMatch(/searchParams\.get\("authId"\)/);
      expect(authsPage).toMatch(/<AuthDrawer/);
    });
  });

  describe("Tasks", () => {
    it("registers /tasks as a real route", () => {
      // /tasks is mounted inside the OS shell and renders the universal
      // TasksPage wrapper so every role (with a valid session) can reach it
      // from the pinned bottom-nav "Tasks" entry.
      expect(app).toMatch(/path="\/tasks"\s+element=\{<OSShellPage><TasksPage\s*\/><\/OSShellPage>\}/);
    });

    it("deepLink schema exposes a `task` param", () => {
      expect(deepLink).toMatch(/task\?:\s*string/);
    });

    it("universal TasksPage renders the shared IntakeTasks list in universal mode", () => {
      // Every role hits the same list surface — no intake-only "Add Lead"
      // framing, no lead-only header.
      expect(tasksPage).toMatch(/IntakeTasks\s+variant="universal"/);
    });
  });

  describe("Every builder URL matches a registered route", () => {
    it("client / auth / task deep-link URLs land on routed pathnames with the correct id param", () => {
      const cases = [
        { url: linkToHref({ type: "client", id: SAMPLE, label: "x" }),        pathname: "/clients",         key: "client", expected: SAMPLE },
        { url: linkToHref({ type: "authorization", id: SAMPLE, label: "x" }), pathname: "/authorizations",  key: "authId", expected: SAMPLE },
        { url: `/tasks?task=${SAMPLE}`,                                       pathname: "/tasks",           key: "task",   expected: SAMPLE },
      ];
      for (const c of cases) {
        const [pathname, search] = c.url.split("?");
        expect(pathname).toBe(c.pathname);
        expect(new URLSearchParams(search).get(c.key)).toBe(c.expected);
        expect(app).toContain(`path="${c.pathname}"`);
      }
    });
  });
});