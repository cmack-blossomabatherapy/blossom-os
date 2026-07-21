import { describe, it, expect } from "vitest";
import { normalizePhoneE164, normalizeCtmPayload, linkOrCreateLeadForCall } from "../../supabase/functions/_shared/ctm/normalizer.ts";

// Lightweight in-memory Supabase stub covering only what the linker touches.
function makeSupabase(state: {
  sourceEvents?: Array<{ integration_id: string; provider_event_id: string; lead_id: string }>;
  leads?: Array<{ id: string; phone_e164?: string | null; parent_cell_phone_e164?: string | null; home_phone_e164?: string | null }>;
  matchError?: string;
} = {}) {
  const sourceEvents = state.sourceEvents ?? [];
  const leads = state.leads ?? [];
  const inserted: Array<{ table: string; row: any }> = [];

  const api: any = {
    from(table: string) {
      const q: any = {
        _table: table,
        _filters: {} as Record<string, any>,
        _or: null as string | null,
        select() { return q; },
        eq(col: string, val: any) { q._filters[col] = val; return q; },
        or(clause: string) { q._or = clause; return q; },
        async maybeSingle() {
          if (table === "intake_lead_source_events") {
            const row = sourceEvents.find(
              (r) =>
                r.integration_id === q._filters.integration_id &&
                r.provider_event_id === q._filters.provider_event_id,
            );
            return { data: row ?? null, error: null };
          }
          return { data: null, error: null };
        },
        async single() {
          if (table === "intake_leads") {
            const row = { id: `lead-${leads.length + 1}` };
            leads.push({ id: row.id });
            inserted.push({ table, row: q._insertRow });
            return { data: row, error: null };
          }
          return { data: null, error: null };
        },
        insert(row: any) { q._insertRow = row; return q; },
        upsert(row: any) { inserted.push({ table, row }); return { async then(fn: any) { return fn({ data: null, error: null }); } }; },
      };
      // Support `.select()` after or/eq resolving as array.
      const oldOr = q.or;
      q.or = (clause: string) => {
        oldOr.call(q, clause);
        // execute immediately and return awaitable-like
        const phoneVal = /\.eq\.([^,]+)/.exec(clause)?.[1];
        const matches = phoneVal
          ? leads.filter(
              (l) =>
                l.phone_e164 === phoneVal ||
                l.parent_cell_phone_e164 === phoneVal ||
                l.home_phone_e164 === phoneVal,
            )
          : [];
        const result = state.matchError
          ? { data: null, error: { message: state.matchError } }
          : { data: matches.map((m) => ({ id: m.id })), error: null };
        return {
          then: (fn: any) => fn(result),
        } as any;
      };
      return q;
    },
  };
  return { api, inserted, leads, sourceEvents };
}

describe("Intake INGEST_ONLY hardening", () => {
  it("normalizePhoneE164 handles US 10-digit, 11-digit, formatted and international numbers", () => {
    expect(normalizePhoneE164("(555) 010-2000")).toBe("+15550102000");
    expect(normalizePhoneE164("15550102000")).toBe("+15550102000");
    expect(normalizePhoneE164("+1 555 010 2000")).toBe("+15550102000");
    expect(normalizePhoneE164("447700900123")).toBe("+447700900123");
    expect(normalizePhoneE164("")).toBeNull();
    expect(normalizePhoneE164(null)).toBeNull();
    expect(normalizePhoneE164("abc")).toBeNull();
  });

  it("normalizeCtmPayload accepts JSON, form-shape, and nested call payloads", () => {
    const nested = normalizeCtmPayload({ call: { id: "c1", caller_number: "5550102000", tracking_number: "800-000-0001", direction: "inbound" } });
    expect(nested?.ctm_call_id).toBe("c1");
    expect(nested?.from_number).toBe("5550102000");
    const flat = normalizeCtmPayload({ id: "c2", caller_number: "5550102001" });
    expect(flat?.ctm_call_id).toBe("c2");
    expect(normalizeCtmPayload({})).toBeNull();
  });

  it("linkOrCreateLeadForCall respects external-id precedence over phone matching", async () => {
    const { api } = makeSupabase({
      sourceEvents: [{ integration_id: "ctm", provider_event_id: "call-abc", lead_id: "lead-existing" }],
      leads: [{ id: "lead-existing", phone_e164: "+15550109999" }],
    });
    const call = normalizeCtmPayload({ id: "call-abc", caller_number: "5550109999" })!;
    const out = await linkOrCreateLeadForCall(api, call);
    expect(out.state).toBe("linked_existing");
    expect(out.lead_id).toBe("lead-existing");
  });

  it("returns ambiguous_review when the phone matches multiple leads (never guesses)", async () => {
    const { api } = makeSupabase({
      leads: [
        { id: "lead-a", phone_e164: "+15550102000" },
        { id: "lead-b", parent_cell_phone_e164: "+15550102000" },
      ],
    });
    const call = normalizeCtmPayload({ id: "c-x", caller_number: "5550102000" })!;
    const out = await linkOrCreateLeadForCall(api, call);
    expect(out.state).toBe("ambiguous_review");
    expect(out.lead_id).toBeNull();
  });

  it("promotes a single Lead Captured record when no candidate exists", async () => {
    const { api, inserted } = makeSupabase({});
    const call = normalizeCtmPayload({ id: "c-new", caller_number: "5550103000", caller_name: "Jane" })!;
    const out = await linkOrCreateLeadForCall(api, call);
    expect(out.state).toBe("promoted");
    expect(out.lead_id).toMatch(/^lead-/);
    const leadInsert = inserted.find((i) => i.table === "intake_leads");
    expect(leadInsert?.row.pipeline_stage).toBe("Lead Captured");
    expect(leadInsert?.row.phone).toBe("+15550103000");
    const provenance = inserted.find((i) => i.table === "intake_lead_source_events");
    expect(provenance?.row.provider_event_id).toBe("c-new");
  });

  it("returns incomplete_review when the payload has no callable number", async () => {
    const { api } = makeSupabase({});
    const call = normalizeCtmPayload({ id: "c-empty" })!;
    const out = await linkOrCreateLeadForCall(api, call);
    expect(out.state).toBe("incomplete_review");
  });

  it("idempotent replay: existing provenance short-circuits to linked_existing", async () => {
    const { api } = makeSupabase({
      sourceEvents: [{ integration_id: "ctm", provider_event_id: "replay-1", lead_id: "lead-1" }],
      leads: [{ id: "lead-1", phone_e164: "+15550100000" }],
    });
    const call = normalizeCtmPayload({ id: "replay-1", caller_number: "5550100000" })!;
    const out = await linkOrCreateLeadForCall(api, call);
    expect(out.state).toBe("linked_existing");
    expect(out.lead_id).toBe("lead-1");
  });
});