/**
 * Shared Lead Source configuration (Sprint 07).
 *
 * Single source of truth for the lead-source dropdown, default UTM tagging,
 * tags, integration mapping, and Patient Lifetime Journey "origin" labels.
 * Used by NewLeadDialog, LeadSourceActions, marketing source pages, and the
 * Patient Lifetime Journey filters / event-origin chips.
 */

export type PatientJourneyEventOrigin =
  | "Manual"
  | "CTM"
  | "Retell"
  | "LeadTrap"
  | "Jotform"
  | "Facebook Ads"
  | "Google Ads"
  | "Mailchimp"
  | "Outlook"
  | "CentralReach"
  | "Eligipro"
  | "Solum"
  | "PandaDoc"
  | "Calendly";

export interface LeadSourceOption {
  /** Stored on intake_leads.lead_source. Keep stable for compatibility. */
  value: string;
  /** Human label rendered in selects / chips. */
  label: string;
  /** Future Blossom OS integration ID (matches integrationRegistry). */
  integrationId?: string;
  /** Default UTM source applied when creating from a source page. */
  defaultUtmSource?: string;
  /** Default UTM medium applied when creating from a source page. */
  defaultUtmMedium?: string;
  /** Default tags applied to new leads (e.g. paid_social, web_form). */
  defaultTags?: string[];
  /** Origin label used in the Patient Lifetime Journey timeline. */
  journeyOrigin?: PatientJourneyEventOrigin;
  /** Short operational description shown in the dialog's Source tab. */
  description?: string;
}

export const LEAD_SOURCE_OPTIONS: LeadSourceOption[] = [
  { value: "Website",              label: "Website",              defaultUtmSource: "website",  defaultUtmMedium: "organic",   defaultTags: ["web_form"],     journeyOrigin: "Manual" },
  { value: "Phone",                label: "Phone",                defaultUtmSource: "phone",    defaultUtmMedium: "phone",     defaultTags: ["inbound_call"], journeyOrigin: "Manual" },
  { value: "CTM",                  label: "CTM / CallTrackingMetrics", integrationId: "ctm",      defaultUtmSource: "ctm",      defaultUtmMedium: "phone",     defaultTags: ["call_lead"],    journeyOrigin: "CTM",
    description: "Lead attributed to a tracked CTM phone call." },
  { value: "Retell AI",            label: "Retell AI",            integrationId: "retell",      defaultUtmSource: "retell",   defaultUtmMedium: "ai_voice",  defaultTags: ["after_hours"],  journeyOrigin: "Retell",
    description: "Captured by the Retell AI after-hours voice agent." },
  { value: "LeadTrap",             label: "LeadTrap",             integrationId: "leadtrap",    defaultUtmSource: "leadtrap", defaultUtmMedium: "web_form",  defaultTags: ["web_form"],     journeyOrigin: "LeadTrap",
    description: "Historical LeadTrap submissions (retired — new submissions come via Jotform)." },
  { value: "Jotform",              label: "Jotform",              integrationId: "jotform",     defaultUtmSource: "jotform",  defaultUtmMedium: "web_form",  defaultTags: ["web_form","jotform"], journeyOrigin: "Jotform",
    description: "Submitted via a Jotform intake form." },
  { value: "Google Ads",           label: "Google Ads",           integrationId: "google-ads",  defaultUtmSource: "google",   defaultUtmMedium: "cpc",       defaultTags: ["paid_search"],  journeyOrigin: "Google Ads",
    description: "Paid search inquiry from Google Ads." },
  { value: "Facebook Ads",         label: "Facebook Ads / Meta Ads", integrationId: "meta-ads", defaultUtmSource: "facebook", defaultUtmMedium: "paid_social", defaultTags: ["paid_social"], journeyOrigin: "Facebook Ads",
    description: "Paid social inquiry from Meta / Facebook Ads." },
  { value: "Mailchimp",            label: "Mailchimp",            integrationId: "mailchimp",   defaultUtmSource: "mailchimp", defaultUtmMedium: "email",    defaultTags: ["email_campaign"], journeyOrigin: "Mailchimp",
    description: "Inquiry from a Mailchimp email campaign." },
  { value: "Referral",             label: "Referral",             defaultTags: ["referral"],     journeyOrigin: "Manual" },
  { value: "Referral Partner",     label: "Referral Partner",     defaultTags: ["referral_partner"], journeyOrigin: "Manual" },
  { value: "Pediatrician",         label: "Pediatrician",         defaultTags: ["pediatrician"],  journeyOrigin: "Manual" },
  { value: "Community Outreach",   label: "Community Outreach",   defaultTags: ["community"],     journeyOrigin: "Manual" },
  { value: "Business Development", label: "Business Development", defaultTags: ["bd"],            journeyOrigin: "Manual" },
  { value: "BCBA Referral",        label: "BCBA Referral",        defaultTags: ["bcba_referral"], journeyOrigin: "Manual" },
  { value: "Insurance",            label: "Insurance",            defaultTags: ["insurance_referral"], journeyOrigin: "Manual" },
  { value: "Organic",              label: "Organic",              defaultUtmMedium: "organic",    defaultTags: ["organic"],       journeyOrigin: "Manual" },
  { value: "Other",                label: "Other",                journeyOrigin: "Manual" },
];

const SOURCE_BY_VALUE = new Map(LEAD_SOURCE_OPTIONS.map((o) => [o.value, o]));

/** Lookup helper that tolerates unknown / legacy values. */
export function getLeadSourceOption(value: string | null | undefined): LeadSourceOption | undefined {
  if (!value) return undefined;
  return SOURCE_BY_VALUE.get(value);
}

/** Human label for a stored lead_source value, falling back to the raw string. */
export function leadSourceLabel(value: string | null | undefined): string {
  return getLeadSourceOption(value)?.label ?? (value ?? "Unknown");
}

/** Journey-timeline origin label (CTM, Retell, …). Defaults to "Manual". */
export function leadSourceJourneyOrigin(value: string | null | undefined): PatientJourneyEventOrigin {
  return getLeadSourceOption(value)?.journeyOrigin ?? "Manual";
}

/** Build the defaults a NewLeadDialog should receive when opened from a source page. */
export function buildLeadSourceDefaults(value: string, extras?: {
  utmCampaign?: string;
  sourcePage?: string;
  extraTags?: string[];
}): {
  leadSource: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  tags: string;
  sourceMetadata: Record<string, unknown>;
} {
  const opt = getLeadSourceOption(value);
  const tags = Array.from(new Set([...(opt?.defaultTags ?? []), ...(extras?.extraTags ?? [])]));
  return {
    leadSource: value,
    utmSource: opt?.defaultUtmSource,
    utmMedium: opt?.defaultUtmMedium,
    utmCampaign: extras?.utmCampaign,
    tags: tags.join(", "),
    sourceMetadata: {
      created_via: opt?.integrationId ?? "manual",
      integration_id: opt?.integrationId ?? null,
      source_page: extras?.sourcePage ?? null,
      source_label: opt?.label ?? value,
      source_value: value,
      journey_origin: opt?.journeyOrigin ?? "Manual",
      created_at_client: new Date().toISOString(),
    },
  };
}