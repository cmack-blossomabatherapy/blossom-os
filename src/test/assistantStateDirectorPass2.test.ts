import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

describe("Assistant State Director — Pass 2", () => {
  it("OSRoleContext pins state for assistant_state_director", () => {
    const ctx = read("src/contexts/OSRoleContext.tsx");
    expect(ctx).toContain("assistant_state_director");
    // setActiveState guard now considers both state-scoped roles.
    expect(ctx).toMatch(
      /isStateScopedRole[\s\S]*state_director[\s\S]*assistant_state_director/,
    );
    // effectiveState precedence also covers assistant.
    expect(ctx).toMatch(
      /derivedRole === "state_director"[\s\S]*derivedRole === "assistant_state_director"[\s\S]*profileState/,
    );
  });

  it("State Operations page uses role-aware copy and drops local-only footer", () => {
    const src = read("src/pages/os/stateDirector/StateDirectorPages.tsx");
    expect(src).not.toContain("Data source: Blossom OS local");
    expect(src).toContain("State Director Assistant · Support Center");
    expect(src).toContain("State support helps unblock work");
    // Honest CentralReach status.
    expect(src).toContain("CentralReach integration status: not connected");
  });

  it("stateDirectorStore no longer treats localStorage as source of truth", () => {
    const src = read("src/lib/os/stateDirector/stateDirectorStore.ts");
    expect(src).not.toMatch(/localStorage\.setItem\(KEY/);
    expect(src).not.toMatch(/localStorage\.getItem\(KEY/);
    expect(src).toContain("loadStateOperationsSnapshot");
  });

  it("stateOperationsService exposes Supabase-backed CRUD", async () => {
    const mod = await import("@/lib/os/stateDirector/stateOperationsService");
    for (const fn of [
      "loadStateOperationsSnapshot",
      "insertTask", "updateTaskRow",
      "insertEscalation", "updateEscalationRow",
      "insertNote", "insertActivity",
    ]) {
      expect(typeof (mod as any)[fn], `${fn} exported`).toBe("function");
    }
  });

  it("state operations migration exists with CentralReach-ready fields and RLS", () => {
    const migrations = fs.readdirSync("supabase/migrations");
    const files = migrations.map((f) => read(path.join("supabase/migrations", f)));
    const joined = files.join("\n");
    expect(joined).toMatch(/CREATE TABLE\s+public\.state_operational_tasks/i);
    expect(joined).toMatch(/CREATE TABLE\s+public\.state_operational_escalations/i);
    expect(joined).toMatch(/CREATE TABLE\s+public\.state_operational_notes/i);
    expect(joined).toMatch(/CREATE TABLE\s+public\.state_operational_activity/i);
    expect(joined).toContain("centralreach_reference_id");
    expect(joined).toContain("centralreach_sync_status");
    // Assistant State Director scoping via helper function.
    expect(joined).toContain("user_is_state_scoped_role");
    expect(joined).toMatch(/assistant_state_director/);
  });
});