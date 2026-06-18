/**
 * Sprint 10 — local store for inbound Lead Source Events.
 *
 * No DB table yet — the Lead Source Inbox uses an in-memory store with a
 * subscribe model so the UI updates when events are added, converted, or
 * attached. When a future migration adds `public.lead_source_events`, this
 * file is the single seam to swap for a Supabase-backed implementation.
 */
import {
  normalizeLeadSourceEvent,
  type LeadSourceEvent,
  type LeadSourceEventStatus,
} from "@/lib/leads/leadSourceEvents";

type Listener = (events: LeadSourceEvent[]) => void;

const SEED: LeadSourceEvent[] = [
  {
    id: "evt_ctm_001",
    source: "CTM",
    sourceLabel: "CTM / CallTrackingMetrics",
    sourceEventType: "phone_call",
    status: "new",
    receivedAt: new Date(Date.now() - 35 * 60_000).toISOString(),
    childFirstName: "Eli",
    childLastName: "Martinez",
    parentFirstName: "Sofia",
    parentLastName: "Martinez",
    phone: "(404) 555-0182",
    state: "GA",
    campaign: "Atlanta — Brand",
    externalId: "ctm_call_88421",
    callRecordingUrl: "https://example-ctm.com/recordings/88421.mp3",
    summary: "Parent asking about ABA in north Atlanta; insurance unknown.",
    rawPayload: { caller_id: "+14045550182", duration: 184, source: "Google" },
  },
  {
    id: "evt_retell_001",
    source: "Retell AI",
    sourceLabel: "Retell AI",
    sourceEventType: "ai_call",
    status: "needs_review",
    receivedAt: new Date(Date.now() - 6 * 3_600_000).toISOString(),
    parentFirstName: "Jamal",
    parentLastName: "Brooks",
    phone: "(704) 555-0119",
    state: "NC",
    transcript:
      "Hi, I'm calling after hours. My son is four, recently diagnosed with autism. We have Aetna…",
    summary: "After-hours intake call. DX confirmed. Aetna insurance.",
    insurance: "Aetna",
    externalId: "retell_call_2031",
    rawPayload: { ended_reason: "agent_hangup" },
  },
  {
    id: "evt_meta_001",
    source: "Facebook Ads",
    sourceLabel: "Facebook Ads / Meta Ads",
    sourceEventType: "ad_lead",
    status: "new",
    receivedAt: new Date(Date.now() - 9 * 3_600_000).toISOString(),
    childFirstName: "Ava",
    parentFirstName: "Megan",
    parentLastName: "Williams",
    phone: "(615) 555-0140",
    email: "megan.williams@example.com",
    state: "TN",
    campaign: "TN Parents — Diagnosis",
    utmSource: "facebook",
    utmMedium: "paid_social",
    utmCampaign: "tn_parents_dx",
    externalId: "fb_lead_77129",
  },
  {
    id: "evt_gads_001",
    source: "Google Ads",
    sourceLabel: "Google Ads",
    sourceEventType: "web_form",
    status: "new",
    receivedAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    childFirstName: "Noah",
    childLastName: "Patel",
    parentFirstName: "Priya",
    parentLastName: "Patel",
    email: "priya.patel@example.com",
    state: "VA",
    campaign: "VA — ABA Therapy",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "va_aba_brand",
    externalUrl: "https://blossomaba.com/start?gclid=abc",
  },
  {
    id: "evt_leadtrap_001",
    source: "LeadTrap",
    sourceLabel: "LeadTrap",
    sourceEventType: "web_form",
    status: "new",
    receivedAt: new Date(Date.now() - 50 * 3_600_000).toISOString(),
    childFirstName: "Mia",
    parentFirstName: "Rebecca",
    parentLastName: "Cohen",
    phone: "(410) 555-0171",
    email: "rebecca.c@example.com",
    state: "MD",
    externalId: "lt_form_5512",
    summary: "Filled out website intake form. Wants morning sessions.",
  },
  {
    id: "evt_mc_001",
    source: "Mailchimp",
    sourceLabel: "Mailchimp",
    sourceEventType: "email_campaign",
    status: "new",
    receivedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    parentFirstName: "Hannah",
    parentLastName: "Lee",
    email: "hannah.lee@example.com",
    state: "GA",
    campaign: "Q2 — Parents Newsletter",
    utmSource: "mailchimp",
    utmMedium: "email",
    utmCampaign: "q2_parents_newsletter",
    summary: "Replied to newsletter asking how to start the intake process.",
  },
  {
    id: "evt_ped_001",
    source: "Pediatrician",
    sourceLabel: "Pediatrician",
    sourceEventType: "referral",
    status: "needs_review",
    receivedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    childFirstName: "Leo",
    childLastName: "Nguyen",
    parentFirstName: "Anh",
    parentLastName: "Nguyen",
    phone: "(919) 555-0190",
    state: "NC",
    referringProvider: "Dr. Carla Reyes — Triangle Pediatrics",
    summary: "Pediatric referral; recent diagnosis, parent wants Raleigh services.",
  },
  {
    id: "evt_bd_001",
    source: "Business Development",
    sourceLabel: "Business Development",
    sourceEventType: "business_development",
    status: "new",
    receivedAt: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    parentFirstName: "Daniel",
    parentLastName: "Foster",
    phone: "(703) 555-0166",
    state: "VA",
    referralPartner: "Fairfax Schools Liaison",
    summary: "BD intro from school district contact. Parent expecting our call.",
  },
  {
    id: "evt_bcba_001",
    source: "BCBA Referral",
    sourceLabel: "BCBA Referral",
    sourceEventType: "referral",
    status: "new",
    receivedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    childFirstName: "Sam",
    parentFirstName: "Olivia",
    parentLastName: "Hart",
    phone: "(404) 555-0205",
    state: "GA",
    summary: "Referred by Ms. Brown (BCBA). Sibling of a current client.",
  },
];

let events: LeadSourceEvent[] = SEED.map(normalizeLeadSourceEvent);
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l([...events]);
}

export function subscribeLeadSourceEvents(listener: Listener): () => void {
  listeners.add(listener);
  listener([...events]);
  return () => listeners.delete(listener);
}

export function listLeadSourceEvents(): LeadSourceEvent[] {
  return [...events];
}

export function addLeadSourceEvent(input: Partial<LeadSourceEvent>): LeadSourceEvent {
  const ev = normalizeLeadSourceEvent(input);
  events = [ev, ...events];
  emit();
  return ev;
}

export function updateLeadSourceEventStatus(
  id: string,
  status: LeadSourceEventStatus,
  patch: Partial<LeadSourceEvent> = {},
) {
  events = events.map((e) =>
    e.id === id
      ? {
          ...e,
          ...patch,
          status,
          resolvedAt:
            status === "converted_to_lead" || status === "attached_to_existing_lead"
              ? new Date().toISOString()
              : e.resolvedAt,
        }
      : e,
  );
  emit();
}

/** Lookup attached/converted events for a single lead — used by Patient Journey. */
export function getEventsForLead(leadId: string): LeadSourceEvent[] {
  return events.filter((e) => e.resolvedLeadId === leadId || e.matchedLeadId === leadId);
}