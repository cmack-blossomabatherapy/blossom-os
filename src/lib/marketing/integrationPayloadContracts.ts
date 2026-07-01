/**
 * Marketing integration payload contracts.
 *
 * Pure mapper helpers that normalize raw third-party payloads into insert
 * rows for the Marketing operating tables. These are used both by the
 * ingest-preview panel and by future edge-function ingesters so the same
 * mapping rules are testable in isolation.
 */

type Json = Record<string, unknown>;

export type MarketingTable =
  | "marketing_source_events"
  | "marketing_call_events"
  | "marketing_email_events"
  | "marketing_campaign_metrics"
  | "marketing_reputation_events";

export interface NormalizedInsert {
  table: MarketingTable;
  row: Json;
  warnings: string[];
}

export interface PayloadContract {
  id: string;
  displayName: string;
  targetTables: MarketingTable[];
  map: (raw: Json) => NormalizedInsert[];
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}
function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}
function iso(v: unknown): string {
  const s = str(v);
  if (!s) return new Date().toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
function pick(raw: Json, keys: string[]): unknown {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null && raw[k] !== "") return raw[k];
  }
  return null;
}

function mapCTM(raw: Json): NormalizedInsert[] {
  const warnings: string[] = [];
  const phone = str(pick(raw, ["caller_number", "from_number", "caller"]));
  if (!phone) warnings.push("Missing caller phone number.");
  const occurred = iso(pick(raw, ["called_at", "start_time", "timestamp"]));
  const call: Json = {
    source_system: "ctm",
    occurred_at: occurred,
    direction: str(pick(raw, ["direction"])) ?? "inbound",
    caller_name: str(pick(raw, ["caller_name", "name"])),
    caller_phone: phone,
    called_number: str(pick(raw, ["called_number", "tracking_number"])),
    duration_seconds: num(pick(raw, ["duration", "duration_seconds"])),
    recording_url: str(pick(raw, ["recording_url"])),
    disposition: str(pick(raw, ["disposition"])),
    campaign: str(pick(raw, ["campaign", "utm_campaign"])),
    state: str(pick(raw, ["state"])),
    raw_payload: raw,
  };
  const source: Json = {
    source_system: "ctm",
    event_type: "phone_call",
    occurred_at: occurred,
    caller_name: call.caller_name,
    caller_phone: phone,
    state: call.state,
    payload_summary: `CTM call ${phone ?? "unknown"}`,
    raw_payload: raw,
    status: "new",
  };
  return [
    { table: "marketing_call_events", row: call, warnings },
    { table: "marketing_source_events", row: source, warnings },
  ];
}

function mapJivetel(raw: Json): NormalizedInsert[] {
  const warnings: string[] = [];
  const phone = str(pick(raw, ["from", "caller_number", "src"]));
  if (!phone) warnings.push("Missing caller phone number.");
  return [
    {
      table: "marketing_call_events",
      row: {
        source_system: "jivetel",
        occurred_at: iso(pick(raw, ["start_time", "timestamp", "date"])),
        direction: str(pick(raw, ["direction"])) ?? "inbound",
        caller_phone: phone,
        called_number: str(pick(raw, ["to", "did"])),
        duration_seconds: num(pick(raw, ["duration", "seconds"])),
        disposition: str(pick(raw, ["disposition", "status"])),
        raw_payload: raw,
      },
      warnings,
    },
  ];
}

function mapRetell(raw: Json): NormalizedInsert[] {
  const warnings: string[] = [];
  const phone = str(pick(raw, ["from_number", "caller"]));
  const ms = num(pick(raw, ["duration_ms"]));
  const durationSec = ms != null ? Math.round(ms / 1000) : num(pick(raw, ["duration"]));
  const occurred = iso(pick(raw, ["start_timestamp", "start_time", "timestamp"]));
  const call: Json = {
    source_system: "retellai",
    occurred_at: occurred,
    direction: str(pick(raw, ["direction"])) ?? "inbound",
    caller_phone: phone,
    called_number: str(pick(raw, ["to_number", "agent_number"])),
    duration_seconds: durationSec,
    recording_url: str(pick(raw, ["recording_url"])),
    transcript: str(pick(raw, ["transcript"])),
    summary: str(pick(raw, ["summary", "call_summary"])),
    disposition: str(pick(raw, ["call_status", "disposition"])),
    raw_payload: raw,
  };
  const source: Json = {
    source_system: "retellai",
    event_type: "ai_call",
    occurred_at: occurred,
    caller_phone: phone,
    payload_summary: (call.summary as string | null) ?? "Retell AI call",
    raw_payload: raw,
    status: "new",
  };
  if (!phone) warnings.push("Missing caller phone.");
  return [
    { table: "marketing_call_events", row: call, warnings },
    { table: "marketing_source_events", row: source, warnings },
  ];
}

function mapLeadTrap(raw: Json): NormalizedInsert[] {
  const warnings: string[] = [];
  const email = str(pick(raw, ["email", "parent_email"]));
  const phone = str(pick(raw, ["phone", "parent_phone"]));
  if (!email && !phone) warnings.push("Missing both email and phone.");
  return [
    {
      table: "marketing_source_events",
      row: {
        source_system: "leadtrap",
        event_type: "web_form",
        occurred_at: iso(pick(raw, ["submitted_at", "created_at", "timestamp"])),
        caller_name: str(pick(raw, ["name", "parent_name", "full_name"])),
        caller_email: email,
        caller_phone: phone,
        state: str(pick(raw, ["state"])),
        payload_summary: str(pick(raw, ["message", "notes"])) ?? "LeadTrap submission",
        raw_payload: raw,
        status: "new",
      },
      warnings,
    },
  ];
}

function mapAds(system: "google_ads" | "meta_ads", raw: Json): NormalizedInsert[] {
  const warnings: string[] = [];
  const out: NormalizedInsert[] = [];
  const isLead = Boolean(pick(raw, ["email", "phone", "lead_id", "form_id"]));
  const isMetric = Boolean(pick(raw, ["impressions", "clicks", "spend", "cost", "conversions"]));
  if (isLead) {
    out.push({
      table: "marketing_source_events",
      row: {
        source_system: system,
        event_type: "ad_lead",
        occurred_at: iso(pick(raw, ["created_time", "submitted_at", "timestamp"])),
        caller_name: str(pick(raw, ["full_name", "name"])),
        caller_email: str(pick(raw, ["email"])),
        caller_phone: str(pick(raw, ["phone", "phone_number"])),
        state: str(pick(raw, ["state"])),
        payload_summary: str(pick(raw, ["form_name", "campaign_name"])) ?? `${system} lead`,
        raw_payload: raw,
        status: "new",
      },
      warnings,
    });
  }
  if (isMetric) {
    out.push({
      table: "marketing_campaign_metrics",
      row: {
        source_system: system,
        metric_date: iso(pick(raw, ["date", "day", "report_date"])).slice(0, 10),
        campaign_id: str(pick(raw, ["campaign_id"])),
        campaign_name: str(pick(raw, ["campaign_name", "campaign"])),
        impressions: num(pick(raw, ["impressions"])) ?? 0,
        clicks: num(pick(raw, ["clicks"])) ?? 0,
        conversions: num(pick(raw, ["conversions"])) ?? 0,
        spend: num(pick(raw, ["spend", "cost"])) ?? 0,
        raw_payload: raw,
      },
      warnings,
    });
  }
  if (!out.length) {
    warnings.push("Payload matched neither ad lead nor campaign metric shape.");
    out.push({
      table: "marketing_source_events",
      row: {
        source_system: system,
        event_type: "ad_lead",
        occurred_at: new Date().toISOString(),
        raw_payload: raw,
        status: "needs_review",
      },
      warnings,
    });
  }
  return out;
}

function mapMailchimp(raw: Json): NormalizedInsert[] {
  return [
    {
      table: "marketing_email_events",
      row: {
        source_system: "mailchimp",
        occurred_at: iso(pick(raw, ["fired_at", "timestamp", "sent_at"])),
        event_type: str(pick(raw, ["type", "event"])) ?? "sent",
        recipient_email: str(pick(raw, ["email", "recipient"])),
        subject: str(pick(raw, ["subject"])),
        campaign_name: str(pick(raw, ["campaign_name", "campaign"])),
        raw_payload: raw,
      },
      warnings: [],
    },
  ];
}

function mapOutlook(raw: Json): NormalizedInsert[] {
  return [
    {
      table: "marketing_email_events",
      row: {
        source_system: "ms365",
        occurred_at: iso(pick(raw, ["receivedDateTime", "sentDateTime", "timestamp"])),
        event_type: str(pick(raw, ["event_type"])) ?? "sent",
        recipient_email: str(pick(raw, ["toRecipient", "recipient", "to"])),
        sender_email: str(pick(raw, ["from", "sender"])),
        subject: str(pick(raw, ["subject"])),
        raw_payload: raw,
      },
      warnings: [],
    },
  ];
}

function mapCentralReach(raw: Json): NormalizedInsert[] {
  const cid = str(pick(raw, ["client_id", "central_reach_client_id"]));
  const pid = str(pick(raw, ["patient_id", "central_reach_patient_id"]));
  const warnings: string[] = [];
  if (!cid && !pid) warnings.push("Missing CentralReach client_id / patient_id.");
  return [
    {
      table: "marketing_source_events",
      row: {
        source_system: "centralreach",
        event_type: "manual_import",
        occurred_at: iso(pick(raw, ["created_at", "timestamp"])),
        caller_name: str(pick(raw, ["client_name", "name"])),
        state: str(pick(raw, ["state"])),
        central_reach_client_id: cid,
        central_reach_patient_id: pid,
        payload_summary: "CentralReach crosswalk",
        raw_payload: raw,
        status: "new",
      },
      warnings,
    },
  ];
}

function mapNava(raw: Json): NormalizedInsert[] {
  const warnings: string[] = [];
  const phone = str(pick(raw, ["phone", "member_phone"]));
  const email = str(pick(raw, ["email", "member_email"]));
  if (!phone && !email) warnings.push("Missing contact info on Nava payload.");
  return [
    {
      table: "marketing_source_events",
      row: {
        source_system: "nava",
        event_type: str(pick(raw, ["event_type"])) ?? "referral",
        occurred_at: iso(pick(raw, ["occurred_at", "timestamp", "created_at"])),
        caller_name: str(pick(raw, ["member_name", "name"])),
        caller_email: email,
        caller_phone: phone,
        state: str(pick(raw, ["state"])),
        payload_summary: str(pick(raw, ["summary", "notes"])) ?? "Go Integrate Nava event",
        raw_payload: raw,
        status: "new",
      },
      warnings,
    },
  ];
}

export const MARKETING_PAYLOAD_CONTRACTS: PayloadContract[] = [
  { id: "ctm", displayName: "CallTrackingMetrics", targetTables: ["marketing_call_events", "marketing_source_events"], map: mapCTM },
  { id: "jivetel", displayName: "Jive / Jivetel", targetTables: ["marketing_call_events"], map: mapJivetel },
  { id: "retellai", displayName: "RetellAI", targetTables: ["marketing_call_events", "marketing_source_events"], map: mapRetell },
  { id: "leadtrap", displayName: "LeadTrap", targetTables: ["marketing_source_events"], map: mapLeadTrap },
  { id: "google_ads", displayName: "Google Ads", targetTables: ["marketing_source_events", "marketing_campaign_metrics"], map: (raw) => mapAds("google_ads", raw) },
  { id: "meta_ads", displayName: "Meta / Facebook Ads", targetTables: ["marketing_source_events", "marketing_campaign_metrics"], map: (raw) => mapAds("meta_ads", raw) },
  { id: "mailchimp", displayName: "Mailchimp", targetTables: ["marketing_email_events"], map: mapMailchimp },
  { id: "ms365", displayName: "Outlook / Microsoft 365", targetTables: ["marketing_email_events"], map: mapOutlook },
  { id: "centralreach", displayName: "CentralReach", targetTables: ["marketing_source_events"], map: mapCentralReach },
  { id: "nava", displayName: "Go Integrate Nava", targetTables: ["marketing_source_events"], map: mapNava },
];

export function getPayloadContract(id: string): PayloadContract | undefined {
  return MARKETING_PAYLOAD_CONTRACTS.find((c) => c.id === id);
}

export function mapPayload(id: string, raw: Json): NormalizedInsert[] {
  const c = getPayloadContract(id);
  if (!c) return [];
  return c.map(raw);
}
