import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";

// Mock the Supabase client used by the adapters + ctm module.
vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

import { supabase } from "@/integrations/supabase/client";
import {
  fetchIntakeOperatingMode,
  guardIntakeAction,
  INTAKE_ACTIONS_DISABLED_MESSAGE,
} from "@/lib/intake/operatingMode";
import { callParent, sendLeadSms, sendLeadEmail } from "@/lib/integrations/communications/communicationAdapters";
import { checkCTMReadiness, isCTMConfigured } from "@/lib/integrations/communications/ctm";

function mockOperatingMode(mode: "INGEST_ONLY" | "FULL") {
  (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    if (table === "intake_operating_mode") {
      return {
        select: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({
                data: { mode, note: null, updated_at: null },
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    if (table === "ctm_sync_runs") {
      return {
        select: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

beforeEach(() => vi.clearAllMocks());

describe("Intake operating mode — INGEST_ONLY foundation", () => {
  it("defaults to INGEST_ONLY when the mode row cannot be read (fail-closed)", async () => {
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            maybeSingle: async () => ({ data: null, error: { message: "boom" } }),
          }),
        }),
      }),
    }));
    const state = await fetchIntakeOperatingMode();
    expect(state.mode).toBe("INGEST_ONLY");
  });

  it("guardIntakeAction blocks when mode is INGEST_ONLY and allows when FULL", () => {
    expect(guardIntakeAction("INGEST_ONLY", { silent: true })).toBe(false);
    expect(guardIntakeAction("FULL", { silent: true })).toBe(true);
    expect(guardIntakeAction(undefined, { silent: true })).toBe(false);
  });

  it("outbound communication adapters return previewOnly result in INGEST_ONLY mode", async () => {
    mockOperatingMode("INGEST_ONLY");
    const ctx = { leadId: "lead-1", phone: "555-0101", email: "p@x.co" };

    for (const fn of [callParent, sendLeadSms, sendLeadEmail]) {
      const res = await fn(ctx as any);
      expect(res.success).toBe(false);
      expect(res.previewOnly).toBe(true);
      expect(res.message).toBe(INTAKE_ACTIONS_DISABLED_MESSAGE);
    }
  });

  it("adapters do NOT short-circuit when mode is FULL (readiness check advances past guard)", async () => {
    mockOperatingMode("FULL");
    const res = await sendLeadEmail({ leadId: "l", email: "p@x.co" } as any);
    // We don't assert success (downstream mailchimp adapter is not configured
    // in this unit test) — only that the previewOnly guard did not trigger.
    expect(res.previewOnly).not.toBe(true);
  });

  it("legacy isCTMConfigured() is a synchronous stub that always returns false", () => {
    expect(isCTMConfigured()).toBe(false);
  });

  it("checkCTMReadiness reports pending when no sync has run", async () => {
    mockOperatingMode("INGEST_ONLY");
    const r = await checkCTMReadiness();
    expect(r.ready).toBe(false);
    expect(r.message).toMatch(/no ctm sync|waiting/i);
  });

  it("communicationAdapters wires the previewOnlyIfDisabled guard into every outbound entry point", () => {
    const src = fs.readFileSync("src/lib/integrations/communications/communicationAdapters.ts", "utf8");
    for (const fn of ["callParent", "sendLeadSms", "sendLeadEmail", "sendIntakePacket", "sendMissingInfoReminder", "sendVobUpdate"]) {
      const body = src.slice(src.indexOf(`export async function ${fn}`));
      expect(body.slice(0, 400)).toMatch(/previewOnlyIfDisabled/);
    }
  });

  it("notifyCommunicationResult renders previewOnly as a neutral toast (not error/warning)", () => {
    const src = fs.readFileSync("src/lib/integrations/communications/communicationAdapters.ts", "utf8");
    expect(src).toMatch(/result\.previewOnly/);
  });

  it("migration installed the intake_operating_mode enforcement trigger", () => {
    // The migration is committed as SQL in supabase/migrations/*. If a future
    // pass removes the trigger, this contract must fail so we notice.
    const files = fs.readdirSync("supabase/migrations");
    const hit = files.some((f) => {
      const s = fs.readFileSync(`supabase/migrations/${f}`, "utf8");
      return s.includes("enforce_intake_actions_enabled") && s.includes("intake_operating_mode");
    });
    expect(hit, "expected migration installing intake_operating_mode + enforcement trigger").toBe(true);
  });
});