import { describe, it, expect } from "vitest";
import {
  deriveIntegrationStatus,
  type LiveConnectionForOverlay,
} from "@/lib/os/integrations/statusOverlay";

const base = (o: Partial<LiveConnectionForOverlay> = {}): LiveConnectionForOverlay => ({
  status: "connected",
  credential_mode: "secret",
  secret_names: ["API_KEY"],
  last_tested_at: null,
  last_success_at: null,
  ...o,
});

describe("deriveIntegrationStatus", () => {
  it("no live row + registry disconnected → disconnected (never inherits 'connected')", () => {
    expect(deriveIntegrationStatus(null, "other")).toBe("disconnected");
    expect(deriveIntegrationStatus(null, "disconnected")).toBe("disconnected");
  });

  it("no live row + registry coming_soon → coming_soon", () => {
    expect(deriveIntegrationStatus(null, "coming_soon")).toBe("coming_soon");
  });

  it("secrets required but missing → credentials_required (overrides row status)", () => {
    const live = base({ status: "connected", secret_names: [] });
    expect(deriveIntegrationStatus(live, "other")).toBe("credentials_required");
  });

  it("credential_mode 'none' does not gate on secrets", () => {
    const live = base({ credential_mode: "none", secret_names: [], status: "connected", last_success_at: "2026-07-07T00:00:00Z", last_tested_at: "2026-07-07T00:00:00Z" });
    expect(deriveIntegrationStatus(live, "other")).toBe("connected");
  });

  it("row 'connected' but never probed at all → probe_pending", () => {
    expect(deriveIntegrationStatus(base({ status: "connected" }), "other")).toBe("probe_pending");
  });

  it("row 'connected' tested but never succeeded → configured (proven creds, unproven flow)", () => {
    const live = base({ status: "connected", last_tested_at: "2026-07-07T00:00:00Z", last_success_at: null });
    expect(deriveIntegrationStatus(live, "other")).toBe("configured");
  });

  it("row 'connected' with last_success_at → connected", () => {
    const live = base({ status: "connected", last_success_at: "2026-07-07T00:00:00Z", last_tested_at: "2026-07-07T00:00:00Z" });
    expect(deriveIntegrationStatus(live, "other")).toBe("connected");
  });

  it("maps row states: syncing / error / needs_attention / pending / probing", () => {
    expect(deriveIntegrationStatus(base({ status: "syncing" }), "other")).toBe("syncing");
    expect(deriveIntegrationStatus(base({ status: "error" }), "other")).toBe("error");
    expect(deriveIntegrationStatus(base({ status: "needs_attention" }), "other")).toBe("reauth");
    expect(deriveIntegrationStatus(base({ status: "pending" }), "other")).toBe("probe_pending");
    expect(deriveIntegrationStatus(base({ status: "probing" }), "other")).toBe("probe_pending");
  });

  it("row 'not_configured' with secrets → configured; without → disconnected", () => {
    expect(deriveIntegrationStatus(base({ status: "not_configured" }), "other")).toBe("configured");
    // secrets missing already triggers credentials_required (secret required)
    expect(
      deriveIntegrationStatus(base({ status: "not_configured", secret_names: [], credential_mode: "none" }), "other"),
    ).toBe("disconnected");
  });

  it("unknown row status → disconnected", () => {
    expect(deriveIntegrationStatus(base({ status: "wat" }), "other")).toBe("disconnected");
  });
});
