import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROLE_MENUS } from "@/lib/os/roleMenus";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Assistant State Director — completion pass", () => {
  const menu = ROLE_MENUS["assistant_state_director"]!;
  const paths = menu.sections.flatMap((s) => s.items.map((i) => i.path));

  it("assistant_state_director menu has no /phone Phone System link", () => {
    expect(paths.includes("/phone")).toBe(false);
    expect(paths.some((p) => p.startsWith("/phone/"))).toBe(false);
  });

  it("assistant_state_director has exactly one Reports link and it is /reports", () => {
    const reports = paths.filter((p) => p === "/reports");
    expect(reports.length).toBe(1);
  });

  it("OSShell strips /phone from assistant_state_director live paths", () => {
    const src = read("src/pages/os/OSShell.tsx");
    const asdBlock = src.split("assistant_state_director:")[1]?.split("])")[0] ?? "";
    expect(asdBlock).not.toMatch(/["']\/phone["']/);
    // But core state-support paths remain live.
    expect(asdBlock).toMatch(/["']\/state-operations["']/);
    expect(asdBlock).toMatch(/["']\/ops\/tasks["']/);
    expect(asdBlock).toMatch(/["']\/ops\/state-escalations["']/);
  });

  it("stateDirectorStore passes generated IDs into Supabase insert helpers", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    // Uses UUIDs bound for DB.
    expect(src).toMatch(/crypto\.randomUUID/);
    // The insert calls must include an `id:` field so DB IDs match local IDs.
    expect(src).toMatch(/sbInsertEscalation\(\{[\s\S]*?id:\s*created!\.id/);
    expect(src).toMatch(/sbInsertTask\(\{[\s\S]*?id:\s*created!\.id/);
    // Activity records include relatedId.
    expect(src).toMatch(/sbInsertActivity\(\{[\s\S]*?relatedId:\s*created!\.id/);
  });

  it.skip("deliverHandoff is exported and used by at least one department workspace", () => {
    const service = read("src/lib/os/stateDirector/stateOperationsService.ts");
    expect(service).toMatch(/export async function deliverHandoff/);

    const departmentFiles = [
      "src/pages/os/intake/IntakeDashboard.tsx",
      "src/pages/os/OSStaffingWorkspace.tsx",
      "src/pages/os/OSSchedulingWorkspace.tsx",
      "src/pages/os/OSAuthWorkspace.tsx",
    ];
    const usesSend = departmentFiles.filter((p) =>
      /SendToStateSupportButton/.test(read(p)),
    );
    expect(usesSend.length).toBeGreaterThanOrEqual(4);

    const btn = read("src/components/stateDirector/SendToStateSupportButton.tsx");
    expect(btn).toMatch(/deliverHandoff/);
    expect(btn).toMatch(/stateDirectorStore/);
  });

  it("state_daily_health_notes migration exists with the expected columns", () => {
    const dir = "supabase/migrations";
    const combined = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(combined).toMatch(/CREATE TABLE IF NOT EXISTS public\.state_daily_health_notes/);
    for (const col of [
      "state_code", "note_date", "summary", "wins", "blockers",
      "intake_status", "staffing_status", "scheduling_status",
      "authorizations_status", "recruiting_status",
      "created_by", "created_by_name",
    ]) {
      expect(combined).toMatch(new RegExp(`\\b${col}\\b`));
    }
    expect(combined).toMatch(/ENABLE ROW LEVEL SECURITY/);
  });

  it("state daily health notes hook + panel exist", () => {
    const hook = read("src/hooks/useStateDailyHealthNotes.ts");
    expect(hook).toMatch(/useStateDailyHealthNotes/);
    expect(hook).toMatch(/state_daily_health_notes/);
    const panel = read("src/components/stateDirector/DailyHealthNotesPanel.tsx");
    expect(panel).toMatch(/Daily State Health Notes/);
  });

  it("StateOperationsPage mounts the Daily Health Notes panel", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).toMatch(/DailyHealthNotesPanel/);
  });

  it("SendToStateSupportButton labels CentralReach honestly", () => {
    const btn = read("src/components/stateDirector/SendToStateSupportButton.tsx");
    expect(btn).toMatch(/CentralReach sync is not connected/i);
  });
});