import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("Welcome email deliverability hotfix", () => {
  const shared = read("supabase/functions/_shared/welcome-email.ts");
  const resend = read("supabase/functions/admin-resend-welcome-email/index.ts");

  it("sets a real Reply-To address on the Resend send", () => {
    expect(shared).toMatch(/REPLY_TO_EMAIL\s*=\s*"admin@blossomabatherapy\.com"/);
    expect(shared).toMatch(/reply_to:\s*REPLY_TO_EMAIL/);
  });

  it("tags the welcome-invite send for Resend analytics", () => {
    expect(shared).toMatch(/name:\s*"type",\s*value:\s*"welcome-invite"/);
    expect(shared).toMatch(/name:\s*"app",\s*value:\s*"blossom-os"/);
  });

  it("refuses to resend into a bounced or complained address", () => {
    expect(resend).toMatch(/last_event/);
    expect(resend).toMatch(/"bounced"/);
    expect(resend).toMatch(/"complained"/);
    expect(resend).toMatch(/Resend Suppressions/);
    // Returns a 409 so the admin UI can surface the suppression message.
    expect(resend).toMatch(/}, 409\)/);
  });
});