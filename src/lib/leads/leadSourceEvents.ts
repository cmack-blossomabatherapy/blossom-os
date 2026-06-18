/**
 * Sprint 10 — Lead Source Event model.
 *
 * Pure types + helpers describing inbound lead-source events (CTM calls,
 * Retell AI transcripts, ad form leads, referral partner pings, manual
 * imports, …) before they become intake leads. Designed to be testable
 * and reusable from any UI surface or future ingestion edge function.
 */
import type { Lead } from "@/data/leads";
import {
  getLeadSourceOption,
  leadSourceLabel,
  type PatientJourneyEventOrigin,
} from "@/lib/leads/leadSourceConfig";

export type LeadSourceEventStatus =
  | "new"
  | "needs_review"
  | "possible_duplicate"
  | "converted_to_lead"
  | "attached_to_existing_lead"
  | "ignored"
  | "error";

export type LeadSourceEventType =
  | "web_form"
  | "phone_call"
  | "ai_call"
  | "ad_lead"
  | "email_campaign"
  | "referral"
  | "business_development"
  | "manual_import";

export interface LeadSourceEvent {
  id: string;
  source: string;                 // matches LEAD_SOURCE_OPTIONS.value
  sourceLabel: string;
  sourceEventType: LeadSourceEventType;
  status: LeadSourceEventStatus;
  receivedAt: string;             // ISO
  childFirstName?: string;
  childLastName?: string;
  parentFirstName?: string;
  parentLastName?: string;
  phone?: string;
  email?: string;
  state?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  externalId?: string;
  externalUrl?: string;
  callRecordingUrl?: string;
  transcript?: string;
  summary?: string;
  referralPartner?: string;
  referringProvider?: string;
  insurance?: string;
  notes?: string;
  rawPayload?: Record<string, unknown>;
  matchedLeadId?: string;
  duplicateScore?: number;
  duplicateReasons?: string[];
  /** Set after Convert / Attach actions. */
  resolvedLeadId?: string;
  resolvedAt?: string;
}

/* --------------------------------- Helpers -------------------------------- */

const normPhone = (p?: string) => (p ?? "").replace(/\D+/g, "").slice(-10);
const normEmail = (e?: string) => (e ?? "").trim().toLowerCase();
const normName = (n?: string) => (n ?? "").trim().toLowerCase();

export function normalizeLeadSourceEvent(input: Partial<LeadSourceEvent>): LeadSourceEvent {
  const id = input.id ?? `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const source = input.source ?? "Other";
  return {
    id,
    source,
    sourceLabel: input.sourceLabel ?? leadSourceLabel(source),
    sourceEventType: input.sourceEventType ?? "web_form",
    status: input.status ?? "new",
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    childFirstName: input.childFirstName?.trim() || undefined,
    childLastName:  input.childLastName?.trim()  || undefined,
    parentFirstName: input.parentFirstName?.trim() || undefined,
    parentLastName:  input.parentLastName?.trim()  || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    state: input.state || undefined,
    campaign: input.campaign || undefined,
    utmSource: input.utmSource || undefined,
    utmMedium: input.utmMedium || undefined,
    utmCampaign: input.utmCampaign || undefined,
    externalId: input.externalId || undefined,
    externalUrl: input.externalUrl || undefined,
    callRecordingUrl: input.callRecordingUrl || undefined,
    transcript: input.transcript || undefined,
    summary: input.summary || undefined,
    referralPartner: input.referralPartner || undefined,
    referringProvider: input.referringProvider || undefined,
    insurance: input.insurance || undefined,
    notes: input.notes || undefined,
    rawPayload: input.rawPayload,
    matchedLeadId: input.matchedLeadId,
    duplicateScore: input.duplicateScore,
    duplicateReasons: input.duplicateReasons,
    resolvedLeadId: input.resolvedLeadId,
    resolvedAt: input.resolvedAt,
  };
}

/** Build the defaults a NewLeadDialog (or createLead call) should receive. */
export function eventToLeadDefaults(event: LeadSourceEvent) {
  const opt = getLeadSourceOption(event.source);
  const child = [event.childFirstName, event.childLastName].filter(Boolean).join(" ").trim();
  const parent = [event.parentFirstName, event.parentLastName].filter(Boolean).join(" ").trim();
  const tags = Array.from(
    new Set([
      ...(opt?.defaultTags ?? []),
      "from_source_inbox",
      `event_${event.sourceEventType}`,
    ]),
  );
  return {
    patientFirstName: event.childFirstName,
    patientLastName:  event.childLastName,
    childName: child || "Unknown child",
    parentFirstName: event.parentFirstName,
    parentLastName:  event.parentLastName,
    parentName: parent || "Unknown parent",
    phone: event.phone ?? "",
    email: event.email ?? "",
    state: event.state || "GA",
    leadSource: event.source,
    referralSource: event.referringProvider,
    referralPartner: event.referralPartner,
    utmSource: event.utmSource ?? opt?.defaultUtmSource,
    utmMedium: event.utmMedium ?? opt?.defaultUtmMedium,
    utmCampaign: event.utmCampaign ?? event.campaign,
    insurance: event.insurance,
    pipelineStage: "New Lead",
    nextAction: event.summary ? `Follow up: ${event.summary.slice(0, 80)}` : "Contact Lead",
    tags: tags.join(", "),
    notes: event.notes ?? event.summary ?? event.transcript,
    sourceMetadata: {
      created_via: opt?.integrationId ?? "lead_source_inbox",
      integration_id: opt?.integrationId ?? null,
      source_label: event.sourceLabel,
      source_value: event.source,
      journey_origin: opt?.journeyOrigin ?? "Manual",
      source_event_id: event.id,
      source_event_type: event.sourceEventType,
      external_id: event.externalId,
      external_url: event.externalUrl,
      call_recording_url: event.callRecordingUrl,
      transcript_excerpt: event.transcript?.slice(0, 600),
      campaign: event.campaign,
      raw_payload: event.rawPayload,
      created_at_client: new Date().toISOString(),
    } as Record<string, unknown>,
  };
}

export interface DuplicateMatch {
  leadId: string;
  score: number;       // 0..1
  reasons: string[];
  lead: Lead;
}

export function getDuplicateScore(event: LeadSourceEvent, lead: Lead): DuplicateMatch {
  const reasons: string[] = [];
  let score = 0;

  const evPhone = normPhone(event.phone);
  const leadPhones = [lead.phone, (lead as unknown as { parentCellPhone?: string }).parentCellPhone]
    .map(normPhone)
    .filter(Boolean);
  if (evPhone && leadPhones.includes(evPhone)) {
    score += 0.55;
    reasons.push("Same phone number");
  }

  const evEmail = normEmail(event.email);
  if (evEmail && evEmail === normEmail(lead.email)) {
    score += 0.45;
    reasons.push("Same email");
  }

  const childFull = normName(`${event.childFirstName ?? ""} ${event.childLastName ?? ""}`);
  if (childFull && normName(lead.childName).includes(childFull.trim())) {
    score += 0.25;
    reasons.push("Same child name");
  }
  const parentFull = normName(`${event.parentFirstName ?? ""} ${event.parentLastName ?? ""}`);
  if (parentFull && normName(lead.parentName).includes(parentFull.trim())) {
    score += 0.15;
    reasons.push("Same parent name");
  }

  if (event.state && lead.state && event.state === lead.state) {
    score += 0.05;
    reasons.push("Same state");
  }

  const meta = (lead as unknown as { sourceMetadata?: Record<string, unknown> }).sourceMetadata;
  if (event.externalId && meta && meta.external_id === event.externalId) {
    score += 0.6;
    reasons.push("Matched external id");
  }

  // Recent lead bonus (created within 14 days)
  const created = new Date(lead.createdAt).getTime();
  if (Number.isFinite(created) && Date.now() - created < 14 * 86_400_000 && score > 0) {
    score += 0.1;
    reasons.push("Created in last 14d");
  }

  return { leadId: lead.id, score: Math.min(1, score), reasons, lead };
}

export function findPossibleLeadMatches(
  event: LeadSourceEvent,
  leads: Lead[],
  opts: { minScore?: number; limit?: number } = {},
): DuplicateMatch[] {
  const min = opts.minScore ?? 0.35;
  const limit = opts.limit ?? 5;
  return leads
    .map((l) => getDuplicateScore(event, l))
    .filter((m) => m.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getEventPriority(event: LeadSourceEvent): "high" | "normal" | "low" {
  if (event.sourceEventType === "phone_call" || event.sourceEventType === "ai_call") return "high";
  if (event.sourceEventType === "referral" || event.sourceEventType === "business_development") return "high";
  if (event.sourceEventType === "ad_lead" || event.sourceEventType === "web_form") return "normal";
  return "low";
}

export function getEventDisplayName(event: LeadSourceEvent): string {
  const child = [event.childFirstName, event.childLastName].filter(Boolean).join(" ");
  const parent = [event.parentFirstName, event.parentLastName].filter(Boolean).join(" ");
  return child || parent || event.email || event.phone || "Unknown family";
}

export function getEventSourceBadge(event: LeadSourceEvent): {
  label: string;
  origin: PatientJourneyEventOrigin;
} {
  const opt = getLeadSourceOption(event.source);
  return { label: event.sourceLabel ?? opt?.label ?? event.source, origin: opt?.journeyOrigin ?? "Manual" };
}

export function shouldAutoCreateLead(event: LeadSourceEvent): boolean {
  // Conservative — never auto-create. Always require human review.
  if (event.status !== "new") return false;
  if ((event.duplicateScore ?? 0) >= 0.4) return false;
  return false;
}

export function shouldRequireReview(event: LeadSourceEvent): boolean {
  if (event.status === "possible_duplicate" || event.status === "needs_review") return true;
  if ((event.duplicateScore ?? 0) >= 0.4) return true;
  if (!event.phone && !event.email) return true;
  return false;
}