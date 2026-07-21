import { describe, it, expect } from "vitest";
import { displayNameFor } from "@/lib/os/clinicianIdentity";

describe("displayNameFor", () => {
  it("prefers full name", () => {
    expect(displayNameFor({ first_name: "Ada", last_name: "Lovelace" })).toBe("Ada Lovelace");
  });
  it("title-cases the email local part when no name", () => {
    expect(displayNameFor({ email: "corey.smith@blossom.com" })).toBe("Corey Smith");
  });
  it("falls back to 'Team member' when nothing usable", () => {
    expect(displayNameFor({})).toBe("Team member");
  });
  it("never returns a bare email", () => {
    const out = displayNameFor({ email: "someone@example.com" });
    expect(out).not.toContain("@");
  });
});