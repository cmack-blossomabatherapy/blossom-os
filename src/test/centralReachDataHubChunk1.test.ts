import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SUPER_ADMIN_MENU } from "@/lib/os/superAdminMenu";

const appSrc = fs.readFileSync("src/App.tsx", "utf8");

describe("CentralReach Data Hub routing", () => {
  it("mounts /system/centralreach behind AdminRoute", () => {
    expect(appSrc).toMatch(/path="\/system\/centralreach"\s+element=\{<AdminRoute><CentralReachHub \/><\/AdminRoute>\}/);
  });

  it("aliases /system/centralreach-data-hub to the hub behind AdminRoute", () => {
    expect(appSrc).toMatch(
      /path="\/system\/centralreach-data-hub"\s+element=\{<AdminRoute><Navigate to="\/system\/centralreach\?tab=overview" replace \/><\/AdminRoute>\}/,
    );
  });

  it("keeps /system/centralreach-uploads redirecting to the hub", () => {
    expect(appSrc).toMatch(/path="\/system\/centralreach-uploads"[\s\S]{0,140}\/system\/centralreach\?tab=/);
  });
});

describe("Super Admin menu label", () => {
  const items = SUPER_ADMIN_MENU.flatMap((group) => group.items);

  it("says CentralReach Data Hub and points at the hub", () => {
    const item = items.find((i) => i.label === "CentralReach Data Hub");
    expect(item).toBeTruthy();
    expect(item!.to).toBe("/system/centralreach-data-hub");
  });

  it("no longer offers a CentralReach Uploads entry", () => {
    expect(items.some((i) => i.label === "CentralReach Uploads")).toBe(false);
  });
});

describe("normalized CentralReach report tables exist in migrations", () => {
  const dir = "supabase/migrations";
  const sql = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n");

  const TABLES = [
    "cr_import_batches",
    "cr_raw_rows",
    "cr_billing_sessions",
    "cr_schedule_events",
    "cr_authorizations",
    "cr_authorization_utilization",
    "cr_claims",
    "cr_contacts",
    "cr_patient_match_links",
    "cr_provider_match_links",
    "cr_client_provider_crosswalk",
    "cr_bcba_ownership_inferred",
    "cr_report_data_freshness",
    "cr_import_backups",
  ];

  TABLES.forEach((table) => {
    it(`creates public.${table} with RLS and grants`, () => {
      expect(sql).toContain(`public.${table}`);
      expect(sql).toMatch(new RegExp(`CREATE TABLE (IF NOT EXISTS )?public\\.${table}\\b`, "i"));
      expect(sql).toMatch(new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i"));
      expect(sql).toMatch(new RegExp(`GRANT [^;]*ON public\\.${table} TO`, "i"));
    });
  });

  it("does not drop or truncate CentralReach tables in migrations", () => {
    expect(sql).not.toMatch(/DROP TABLE (IF EXISTS )?public\.cr_/i);
    expect(sql).not.toMatch(/TRUNCATE TABLE public\.cr_/i);
  });
});