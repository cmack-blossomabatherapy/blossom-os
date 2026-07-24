import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";
import { ROLE_HOME } from "@/lib/os/roleHome";

const CLINICAL_ROLES = [
  "clinical_director",
  "bcba",
  "case_manager",
  "rbt",
  "behavioral_support",
  "qa_team",
  "qa_director",
  "qa_specialist",
  "authorization_coordinator",
  "authorization_manager",
] as const;

function menuPathsFor(role: string): string[] {
  const menu = (ROLE_MENUS as any)[role];
  if (!menu) return [];
  const out: string[] = [];
  for (const s of menu.sections ?? []) {
    for (const it of s.items ?? []) if (it.path) out.push(String(it.path).split("?")[0]);
  }
  return out;
}

const APP = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("Clinical cluster release manifest", () => {
  it("every clinical role has a landing route", () => {
    for (const r of CLINICAL_ROLES) {
      expect((ROLE_HOME as any)[r], `ROLE_HOME missing for ${r}`).toBeTruthy();
    }
  });

  it("every unique clinical menu path is mounted in App.tsx", () => {
    const paths = new Set<string>();
    for (const r of CLINICAL_ROLES) menuPathsFor(r).forEach((p) => paths.add(p));
    const missing: string[] = [];
    for (const p of paths) {
      if (!APP.includes(`"${p}"`) && !APP.includes(`'${p}'`)) missing.push(p);
    }
    expect(missing, `unmounted clinical routes: ${missing.join(", ")}`).toEqual([]);
  });

  it("BCBA Caseload uses proper dialogs (no window.prompt/confirm)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/pages/bcba/caseload/CaseloadPage.tsx"),
      "utf8",
    );
    expect(/\bprompt\(/.test(src), "CaseloadPage still uses prompt()").toBe(false);
    expect(/\bconfirm\(/.test(src), "CaseloadPage still uses confirm()").toBe(false);
    expect(src).toMatch(/AlertDialog/);
    expect(src).toMatch(/DialogTitle/);
  });

  it("BCBA mapping diagnostic hides admin link from operators", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/pages/bcba/BcbaMappingDiagnostic.tsx"),
      "utf8",
    );
    expect(src).toMatch(/OperatorDiagnosticsGate/);
    // The admin-only link must be inside the gate.
    const gateIdx = src.indexOf("OperatorDiagnosticsGate");
    const linkIdx = src.indexOf("/admin/centralreach-sync");
    expect(gateIdx).toBeGreaterThan(-1);
    expect(linkIdx).toBeGreaterThan(gateIdx);
  });
});