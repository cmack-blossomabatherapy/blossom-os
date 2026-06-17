import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("User Management invite delivery tools", () => {
  const page = read("src/pages/os/OSUserManagement.tsx");
  const inviteFunction = read("supabase/functions/admin-invite-user/index.ts");
  const checkFunction = read("supabase/functions/admin-check-welcome-email/index.ts");

  it("lets admins edit a user's display name and sync the employee name", () => {
    expect(page).toMatch(/Field label="Display name"/);
    expect(page).toMatch(/display_name: form\.display_name/);
    expect(page).toMatch(/first_name:/);
    expect(page).toMatch(/last_name:/);
  });

  it("surfaces welcome email delivery status and resend controls", () => {
    expect(page).toMatch(/Check delivery/);
    expect(page).toMatch(/Resend welcome/);
    expect(page).toMatch(/admin-check-welcome-email/);
    expect(page).toMatch(/admin-resend-welcome-email/);
    expect(page).toMatch(/last_event/);
  });

  it("records welcome_sent_at when a new invite email is accepted", () => {
    expect(inviteFunction).toMatch(/welcomeEmailResult\.status === "sent"/);
    expect(inviteFunction).toMatch(/welcome_sent_at/);
  });

  it("checks the provider message event through the protected admin function", () => {
    expect(checkFunction).toMatch(/has_role/);
    expect(checkFunction).toMatch(/connector-gateway\.lovable\.dev\/resend\/emails/);
    expect(checkFunction).toMatch(/last_event/);
  });
});