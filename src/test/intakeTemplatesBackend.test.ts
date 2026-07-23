import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Intake Templates backend + admin manager", () => {
  it("Super Admin nav retires 'Lead to Ready-to-Start Pipeline' and adds a plain Leads entry", () => {
    const src = read("src/lib/os/superAdminMenu.ts");
    expect(src).not.toMatch(/Lead to Ready-to-Start Pipeline/);
    expect(src).not.toMatch(/\/leads\?view=pipeline/);
    expect(src).toMatch(/label:\s*"Leads",\s*to:\s*"\/leads"/);
    // Both admin backends are still present, no other intake-facing menu items
    expect(src).toMatch(/\/admin\/intake-templates/);
    expect(src).toMatch(/\/admin\/benefits-knowledge/);
  });

  it("dedicated IntakeTemplatesManager is mounted under an admin guard and legacy page is retired", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/IntakeTemplatesManager/);
    expect(app).toMatch(
      /path="\/admin\/intake-templates"\s+element=\{<AdminRoute><IntakeTemplatesManager \/><\/AdminRoute>\}/,
    );
    // /admin/automated-emails now redirects rather than mounting the retired page
    expect(app).toMatch(
      /path="\/admin\/automated-emails"\s+element=\{<Navigate to="\/admin\/intake-templates"/,
    );
    expect(app).not.toMatch(/AutomatedEmailsPage/);

    // The manager itself is branded and exposes the required admin controls
    const mgr = read("src/pages/admin/IntakeTemplatesManager.tsx");
    expect(mgr).toMatch(/title="Intake Templates"/);
    // Filters: search + channel + team + stage + active
    expect(mgr).toMatch(/channelFilter/);
    expect(mgr).toMatch(/teamFilter/);
    expect(mgr).toMatch(/stageFilter/);
    expect(mgr).toMatch(/activeFilter/);
    // Merge fields + inspect/edit + copy + activate/deactivate controls
    expect(mgr).toMatch(/Merge fields/);
    expect(mgr).toMatch(/toggleActive/);
    expect(mgr).toMatch(/copyBody/);
    // Composite conflict target — never bare template_key
    expect(mgr).toMatch(/onConflict:\s*"channel,template_key"/);
    // No sending / no automation triggers wired into this admin page
    expect(mgr).not.toMatch(/functions\.invoke\("send-/);
  });

  it("resolver loads persisted rows by channel+template_key with registry fallback and blocks inactive automation", () => {
    const src = read("src/lib/integrations/communications/templateRegistry.ts");
    expect(src).toMatch(/export async function resolveTemplate/);
    expect(src).toMatch(/from\("intake_communication_templates"/);
    // Composite lookup by both channel and template_key
    expect(src).toMatch(/\.eq\("channel", channel\)/);
    expect(src).toMatch(/\.eq\("template_key", key\)/);
    // Registry fallback path
    expect(src).toMatch(/source: "registry"/);
    // Approval flag mirrors is_active — inactive rows are not approved for automation
    expect(src).toMatch(/approvedForAutomation:\s*row\.is_active === true/);
  });

  it("Blossom AI live retrieval targets the new table and cites channel + template_key", () => {
    const src = read("supabase/functions/blossom-ai-chat/index.ts");
    expect(src).toMatch(/from\("intake_communication_templates"\)/);
    // Only active rows surface for approved drafting guidance
    expect(src).toMatch(/\.eq\("is_active", true\)/);
    // Citation shape includes [channel:template_key]
    expect(src).toMatch(/\[\$\{r\.channel\}:\$\{r\.template_key\}\]/);
    // Explicitly instruct the model to never auto-send
    expect(src).toMatch(/never auto-send/);
  });
});

describe("Intake Templates DB contract", () => {
  it("migration renames table, adds composite unique, and seeds the 13-row registry", () => {
    const files = require("node:fs").readdirSync("supabase/migrations");
    const migration = files
      .filter((f: string) => f.endsWith(".sql"))
      .map((f: string) => read(`supabase/migrations/${f}`))
      .find((sql: string) =>
        /RENAME TO intake_communication_templates/i.test(sql)
        && /UNIQUE\s*\(\s*channel\s*,\s*template_key\s*\)/i.test(sql),
      );
    expect(migration, "expected a migration that renames email_templates and adds the composite unique key").toBeTruthy();
    // Access rules: authenticated read active only; super admin / systems admin write
    expect(migration).toMatch(/Authenticated can view active templates/);
    expect(migration).toMatch(/Super admins can insert templates/);
    expect(migration).toMatch(/Super admins can update templates/);
    expect(migration).toMatch(/Super admins can delete templates/);
    // Seed count: 9 email rows + 4 sms rows from the registry
    expect(migration).toMatch(/'intake-packet',\s*'email'/);
    expect(migration).toMatch(/'appointment-confirmation',\s*'sms'/);
    expect(migration).toMatch(/'general-follow-up',\s*'sms'/);
    expect(migration).toMatch(/'missing-info-reminder',\s*'sms'/);
    // Composite conflict target on seed
    expect(migration).toMatch(/ON CONFLICT \(channel, template_key\) DO NOTHING/);
  });
});