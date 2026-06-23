import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("User Management invite delivery tools", () => {
  const inviteFunction = read("supabase/functions/admin-invite-user/index.ts");
  const inviteLinkFunction = read("supabase/functions/admin-create-invite-link/index.ts");
  const checkFunction = read("supabase/functions/admin-check-welcome-email/index.ts");
  const profilePage = read("src/pages/os/users/EmployeeProfile.tsx");

  it("surfaces welcome email delivery status and resend controls on the per-user page", () => {
    expect(profilePage).toMatch(/Check delivery/);
    expect(profilePage).toMatch(/Resend welcome/);
    expect(profilePage).toMatch(/admin-check-welcome-email/);
    expect(profilePage).toMatch(/admin-resend-welcome-email/);
    expect(profilePage).toMatch(/last_event/);
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

  it("exposes Copy invite link on the per-user details page", () => {
    expect(profilePage).toMatch(/admin-create-invite-link/);
    expect(profilePage).toMatch(/employeeId: member\.uuid/);
    expect(profilePage).toMatch(/Copy invite link/);
    expect(profilePage).toMatch(/Sign-in link/);
    expect(profilePage).toMatch(/Temporary password/);
  });

  it("creates manual invite links from employee records, not stale employee ids as auth user ids", () => {
    expect(inviteLinkFunction).toMatch(/employeeId/);
    expect(inviteLinkFunction).toMatch(/\.from\("employees"\)/);
    expect(inviteLinkFunction).toMatch(/\.eq\("id", employeeId\)/);
    expect(inviteLinkFunction).toMatch(/employee\.user_id/);
    expect(inviteLinkFunction).toMatch(/findAuthUserByEmail/);
    expect(inviteLinkFunction).toMatch(/createUser/);
    expect(inviteLinkFunction).toMatch(/upsert\(\{/);
  });
});