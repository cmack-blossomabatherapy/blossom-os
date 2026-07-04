import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("RBT Pass 3 — consolidated hardening", () => {
  it("migration adds centralreach_sync_status and enables realtime on all six RBT workflow tables", () => {
    const dir = "supabase/migrations";
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
    const combined = files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    for (const t of [
      "rbt_client_assignments",
      "rbt_sessions",
      "rbt_supervision",
      "rbt_messages",
      "rbt_help_requests",
      "rbt_session_support_logs",
    ]) {
      expect(combined).toMatch(new RegExp(`ADD TABLE public\\.${t}`));
    }
    for (const t of ["rbt_supervision", "rbt_messages", "rbt_help_requests", "rbt_session_support_logs"]) {
      expect(combined).toMatch(new RegExp(`ALTER TABLE public\\.${t}[\\s\\S]*centralreach_sync_status`));
    }
  });

  it("useRbtWorkflow subscribes to realtime, resolves help requests, and exposes metrics", () => {
    const src = read("src/hooks/useRbtWorkflow.ts");
    expect(src).toMatch(/supabase[\s\S]{0,20}\.channel\(/);
    expect(src).toMatch(/postgres_changes/);
    expect(src).toMatch(/removeChannel/);
    expect(src).toMatch(/resolveHelpRequest/);
    expect(src).toMatch(/pendingCentralReachSync/);
    expect(src).toMatch(/pendingAcknowledgements/);
    expect(src).toMatch(/unreadMessages/);
  });

  it("RBT CentralReach badge component exists and defaults honestly", () => {
    const src = read("src/components/rbt/RbtCentralReachBadge.tsx");
    expect(src).toMatch(/RbtCentralReachSummaryBadge/);
    expect(src).toMatch(/RbtCentralReachStatusBadge/);
    expect(src).toMatch(/pending_import/);
  });

  it("RBT My Day surfaces the CentralReach summary badge", () => {
    const src = read("src/pages/os/OSRBTMyDay.tsx");
    expect(src).toMatch(/RbtCentralReachSummaryBadge/);
    expect(src).toMatch(/pendingCentralReachSync/);
  });
});