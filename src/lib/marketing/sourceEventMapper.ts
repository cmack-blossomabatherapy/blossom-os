/**
 * Marketing source-event mapper.
 *
 * Bridges the `marketing_source_events` table (the source of truth) with the
 * long-standing UI `LeadSourceEvent` model. Used everywhere Marketing surfaces
 * read/write source events so the previous in-memory `leadSourceEventsStore`
 * can be retired from production pages.
 */
import type {
  LeadSourceEvent,
  LeadSourceEventStatus,
  LeadSourceEventType,
} from "@/lib/leads/leadSourceEvents";
import {
  getLeadSourceOption,
  leadSourceLabel,
} from "@/lib/leads/leadSourceConfig";

export interface MarketingSourceEventRow {
  id: string;
  source_system: string;
  source_id?: string | null;
  campaign_id?: string | null;
  external_id?: string | null;
  event_type: string | null;
  occurred_at: string;
  state: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  caller_email: string | null;
  payload_summary: string | null;
  raw_payload: Record<string, unknown> | null;
  status: string | null;
  lead_id: string | null;
  referral_contact_id?: string | null;
  referral_company_id?: string | null;
  central_reach_client_id?: string | null;
  central_reach_patient_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  assigned_to?: string | null;
  assigned_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Slug (`marketing_source_events.source_system`) → canonical LEAD_SOURCE_OPTIONS value. */
const SLUG_TO_SOURCE_VALUE: Record<string, string> = {
  ctm: "CTM",
  retell: "Retell AI",
  retellai: "Retell AI",
  leadtrap: "LeadTrap",
  "google-ads": "Google Ads",
  google_ads: "Google Ads",
  google: "Google Ads",
  "meta-ads": "Facebook Ads",
  meta_ads: "Facebook Ads",
  facebook_ads: "Facebook Ads",
  facebook: "Facebook Ads",
  mailchimp: "Mailchimp",
  jivetel: "Phone",
  ms365: "Other",
  manual: "Other",
};

export function sourceSystemToSourceValue(slug: string | null | undefined): string {
  if (!slug) return "Other";
  const k = slug.toLowerCase();
  return SLUG_TO_SOURCE_VALUE[k] ?? slug;
}

/**
 * Legacy + current source-system slug aliases. Every entry maps a canonical
 * slug to the full set of variants that historically or currently appear in
 * `marketing_source_events.source_system`. Used by hooks/components that
 * filter by source so both `google_ads`/`google-ads`, `meta_ads`/`meta-ads`,
 * `retell`/`retellai`, etc. always match.
 */
const SLUG_ALIAS_GROUPS: string[][] = [
  ["google_ads", "google-ads", "google"],
  ["facebook_ads", "facebook", "meta_ads", "meta-ads", "facebook-ads"],
  ["retell", "retellai", "retell_ai", "retell-ai"],
  ["ctm", "calltrackingmetrics"],
  ["jivetel", "jive", "jivetel_ai"],
  ["mailchimp", "mailchimp_email"],
  ["leadtrap"],
  ["manual", "manual_import"],
];

const ALIAS_INDEX: Record<string, string[]> = (() => {
  const idx: Record<string, string[]> = {};
  for (const group of SLUG_ALIAS_GROUPS) {
    for (const s of group) idx[s.toLowerCase()] = group;
  }
  return idx;
})();

export function expandSourceSlugAliases(slugs: string[]): string[] {
  const out = new Set<string>();
  for (const raw of slugs) {
    const s = (raw ?? "").toLowerCase();
    if (!s) continue;
    const group = ALIAS_INDEX[s] ?? [s];
    for (const v of group) out.add(v);
  }
  return Array.from(out);
}

/** Canonical LEAD_SOURCE_OPTIONS value → slug we write into `source_system`. */
export function sourceValueToSourceSystem(value: string | null | undefined): string {
  if (!value) return "manual";
  const opt = getLeadSourceOption(value);
  if (opt?.integrationId) return opt.integrationId;
  return value.toLowerCase().replace(/\s+/g, "_");
}

const EVENT_TYPE_MAP: Record<string, LeadSourceEventType> = {
  form_submission: "web_form",
  form: "web_form",
  web_form: "web_form",
  phone_call: "phone_call",
  call: "phone_call",
  ai_call: "ai_call",
  ad_lead: "ad_lead",
  email_campaign: "email_campaign",
  email: "email_campaign",
  referral: "referral",
  business_development: "business_development",
  manual_import: "manual_import",
  chat: "web_form",
  review: "web_form",
  other: "manual_import",
};

export function normalizeEventType(t: string | null | undefined): LeadSourceEventType {
  if (!t) return "web_form";
  return EVENT_TYPE_MAP[t.toLowerCase()] ?? "manual_import";
}

/** UI LeadSourceEventType → DB `event_type` string. */
export function eventTypeToDb(t: LeadSourceEventType): string {
  switch (t) {
    case "web_form": return "form_submission";
    case "phone_call": return "phone_call";
    case "ai_call": return "ai_call";
    case "ad_lead": return "ad_lead";
    case "email_campaign": return "email";
    case "referral": return "referral";
    case "business_development": return "business_development";
    case "manual_import":
    default: return "manual_import";
  }
}

const VALID_STATUSES = new Set<LeadSourceEventStatus>([
  "new",
  "needs_review",
  "possible_duplicate",
  "converted_to_lead",
  "attached_to_existing_lead",
  "ignored",
  "error",
]);

export function normalizeStatus(s: string | null | undefined): LeadSourceEventStatus {
  const v = (s ?? "new") as LeadSourceEventStatus;
  return VALID_STATUSES.has(v) ? v : "new";
}

function splitName(n: string | null | undefined): { first?: string; last?: string } {
  if (!n) return {};
  const parts = n.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { first: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function payloadString(raw: Record<string, unknown> | null | undefined, key: string): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const v = (raw as Record<string, unknown>)[key];
  return typeof v === "string" && v ? v : undefined;
}

export function mapRowToEvent(row: MarketingSourceEventRow): LeadSourceEvent {
  const sourceValue = sourceSystemToSourceValue(row.source_system);
  const opt = getLeadSourceOption(sourceValue);
  const parent = splitName(row.caller_name);
  const raw = row.raw_payload ?? undefined;
  return {
    id: row.id,
    source: sourceValue,
    sourceLabel: opt?.label ?? leadSourceLabel(sourceValue),
    sourceEventType: normalizeEventType(row.event_type),
    status: normalizeStatus(row.status),
    receivedAt: row.occurred_at ?? row.created_at ?? new Date().toISOString(),
    parentFirstName: parent.first,
    parentLastName: parent.last,
    phone: row.caller_phone ?? undefined,
    email: row.caller_email ?? undefined,
    state: row.state ?? undefined,
    campaign: payloadString(raw, "campaign") ?? payloadString(raw, "utm_campaign"),
    utmSource: payloadString(raw, "utm_source"),
    utmMedium: payloadString(raw, "utm_medium"),
    utmCampaign: payloadString(raw, "utm_campaign"),
    externalId: row.external_id ?? undefined,
    callRecordingUrl: payloadString(raw, "recording_url"),
    transcript: payloadString(raw, "transcript"),
    summary: row.payload_summary ?? undefined,
    referralPartner: payloadString(raw, "referral_partner"),
    referringProvider: payloadString(raw, "referring_provider"),
    insurance: payloadString(raw, "insurance"),
    rawPayload: raw,
    resolvedLeadId: row.lead_id ?? undefined,
    matchedLeadId: row.lead_id ?? undefined,
    resolvedAt: row.reviewed_at ?? undefined,
    sourceRowId: row.source_id ?? undefined,
    campaignId: row.campaign_id ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    assignedAt: row.assigned_at ?? undefined,
  };
}

/**
 * Build an insert payload for `marketing_source_events` from a UI-shaped
 * partial LeadSourceEvent (used by manual "Add source event" flows).
 */
export function buildInsertRow(input: {
  source: string;
  eventType: LeadSourceEventType;
  parentFirstName?: string;
  parentLastName?: string;
  childFirstName?: string;
  childLastName?: string;
  phone?: string;
  email?: string;
  state?: string;
  campaign?: string;
  referralPartner?: string;
  summary?: string;
  occurredAt?: string;
  reviewedBy?: string | null;
}) {
  const fullName = [input.parentFirstName, input.parentLastName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ") || null;
  const child = [input.childFirstName, input.childLastName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ") || null;
  const raw: Record<string, unknown> = {};
  if (input.campaign) raw.campaign = input.campaign;
  if (input.referralPartner) raw.referral_partner = input.referralPartner;
  if (child) raw.child_name = child;
  return {
    source_system: sourceValueToSourceSystem(input.source),
    event_type: eventTypeToDb(input.eventType),
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    caller_name: fullName,
    caller_phone: (input.phone ?? "").trim() || null,
    caller_email: (input.email ?? "").trim() || null,
    state: (input.state ?? "").trim() || null,
    payload_summary: (input.summary ?? "").trim() || null,
    raw_payload: Object.keys(raw).length ? raw : null,
    status: "new" as const,
    reviewed_by: input.reviewedBy ?? null,
  };
}