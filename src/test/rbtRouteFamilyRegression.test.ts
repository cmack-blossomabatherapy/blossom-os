import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";
import { resolveRbtCrumb, RBT_PRIMARY_PATHS, RBT_SUBPAGES } from "@/pages/rbt/app/RbtSubpageNav";

const APP = fs.readFileSync("src/App.tsx", "utf8");
const MOUNTED = Array.from(APP.matchAll(/path="([^"]+)"/g)).map((m) => m[1]);

function isMounted(p: string): boolean {
  const b = p.split("?")[0].split("#")[0];
  if (MOUNTED.includes(b)) return true;
  const parts = b.replace(/^\//, "").split("/");
  return MOUNTED.some((r) => {
    const rp = r.replace(/^\//, "").split("/");
    return rp.length === parts.length && rp.every((s, i) => s.startsWith(":") || s === "*" || s === parts[i]);
  });
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name) && !/__tests__/.test(p)) out.push(p);
  }
  return out;
}

const RBT_FILES = walk("src/pages/rbt");

describe("RBT route family — links, shell, and navigation", () => {
  it("View as RBT lands on /rbt/app/home", () => {
    expect(ROLE_HOME.rbt).toBe("/rbt/app/home");
    expect(isMounted("/rbt/app/home")).toBe(true);
  });

  it("every static in-app link inside the RBT tree resolves to a mounted route", () => {
    const dead: string[] = [];
    for (const f of RBT_FILES) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/(?:to|href)=["'](\/[^"'`\s]*)["']/g)) {
        if (!isMounted(m[1])) dead.push(`${f} -> ${m[1]}`);
      }
      for (const m of src.matchAll(/navigate\(\s*["'](\/[^"'`\s]*)["']/g)) {
        if (!isMounted(m[1])) dead.push(`${f} -> ${m[1]}`);
      }
    }
    expect(dead, `Dead RBT links: ${dead.join(", ")}`).toEqual([]);
  });

  it("no RBT page links to a legacy /rbt/* page (outside /rbt/app/*)", () => {
    const offenders: string[] = [];
    for (const f of RBT_FILES) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/(?:to|href)=["'](\/rbt\/(?!app\/)[^"']*)["']/g)) {
        offenders.push(`${f} -> ${m[1]}`);
      }
    }
    expect(offenders, `Legacy /rbt/* links: ${offenders.join(", ")}`).toEqual([]);
  });

  it("every mounted /rbt/app/* route is either a primary tab or has a back destination", () => {
    const missing: string[] = [];
    for (const r of MOUNTED.filter((p) => p.startsWith("/rbt/app/"))) {
      const sample = r.replace(/:[A-Za-z]+/g, "sample-id");
      if (RBT_PRIMARY_PATHS.includes(sample)) continue;
      if (!resolveRbtCrumb(sample)) missing.push(r);
    }
    expect(missing, `RBT routes with no back action: ${missing.join(", ")}`).toEqual([]);
  });

  it("every back destination is itself a mounted route", () => {
    for (const [, crumb] of Object.entries(RBT_SUBPAGES)) {
      expect(isMounted(crumb.parent), `${crumb.parent} not mounted`).toBe(true);
    }
  });

  it("the RBT menu keeps five primary items and all are mounted", () => {
    const paths = ROLE_MENUS.rbt!.sections.flatMap((s) => s.items.map((i) => i.path));
    expect(paths).toEqual(RBT_PRIMARY_PATHS);
    for (const p of paths) expect(isMounted(p)).toBe(true);
  });

  it("the RBT app shell renders inside the standard Blossom OS shell", () => {
    const shell = fs.readFileSync("src/pages/rbt/app/shell.tsx", "utf8");
    expect(shell).toMatch(/<OSShell>/);
    expect(shell).toMatch(/RbtSubpageNav/);
  });

  it("every important journey destination is reachable from a primary tab", () => {
    const reachable = new Set<string>();
    const primaryFiles = RBT_FILES.filter((f) => !/__tests__/.test(f));
    for (const f of primaryFiles) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/["'`](\/rbt\/app\/[^"'`$\s]*)["'`]/g)) reachable.add(m[1]);
      for (const m of src.matchAll(/["'`](\/rbt\/app\/[^"'`$\s]*)\$\{/g)) reachable.add(m[1]);
    }
    const required = [
      "/rbt/app/welcome", "/rbt/app/preboarding", "/rbt/app/journey", "/rbt/app/program",
      "/rbt/app/readiness", "/rbt/app/staffing", "/rbt/app/first-case", "/rbt/app/clients",
      "/rbt/app/hours", "/rbt/app/supervision", "/rbt/app/credentials", "/rbt/app/performance",
      "/rbt/app/growth", "/rbt/app/growth/fellowship", "/rbt/app/passport",
      "/rbt/app/settings/notifications", "/rbt/app/support",
    ];
    const unreachable = required.filter((p) => !reachable.has(p));
    expect(unreachable, `Unreachable RBT destinations: ${unreachable.join(", ")}`).toEqual([]);
  });
});

describe("RBT training program matches the authoritative Blossom program", () => {
  it("defines exactly four experience paths and Welcome is first for all", async () => {
    const mod = await import("@/lib/training/rbtAcademy");
    const paths = (mod as any).RBT_PATHS ?? (mod as any).default;
    const list = Array.isArray(paths) ? paths : Object.values(paths ?? {});
    expect(list.length).toBe(4);
    for (const p of list as any[]) {
      expect(p.phases[0].title).toMatch(/Welcome to Blossom/i);
    }
  });

  it("models all 19 BACB competency tasks", async () => {
    const { COMPETENCY_TASKS } = await import("@/lib/training/rbtCompetency");
    expect(COMPETENCY_TASKS.length).toBe(19);
  });

  it("the learner readiness page surfaces the competency tasks read-only", () => {
    const src = fs.readFileSync("src/pages/rbt/app/readiness/RbtReadiness.tsx", "utf8");
    expect(src).toMatch(/CompetencyPanel/);
    expect(src).toMatch(/readOnly/);
  });
});
