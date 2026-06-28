import type { OSRole } from "@/lib/os/permissions";
import type { KBEntry } from "./types";
import { canAccessCategory } from "./aiPermissions";
import { leadBenefitsCheatSheets } from "@/lib/intake/leadBenefitsCheatSheets";

/**
 * Seeded mock knowledge base. Summarizes material that already lives in the
 * app (SOPs, VOB workflow, state ops, directory). Real RAG entries will
 * replace these once live AI is wired.
 */
export const KNOWLEDGE_BASE: KBEntry[] = [
  { id: "kb-vob-process", category: "workflow", title: "VOB (Verification of Benefits) Process",
    sourceType: "vob", sourceId: "vob-sop",
    content: "Confirm payer and member ID, run eligibility, capture deductible / OOP max / copay / coinsurance, document auth requirements, and post the decision to the VOB Decision Center. Escalate ambiguous payers to the Auth Lead.",
    updatedAt: "2026-04-20", tags: ["vob","verification","benefits","insurance","intake"] },
  { id: "kb-auth-submission", category: "sop", title: "How to Submit an Authorization",
    sourceType: "sop_library",
    content: "Open the client's Auth tab > New Authorization > select payer + plan > attach diagnostic report and treatment plan > assign CPT codes and units > submit. Tracker updates daily; PR deadlines auto-populate from submission date.",
    updatedAt: "2026-05-01", tags: ["authorization","auth","submit","pr","units"] },
  { id: "kb-scheduling-escalation", category: "workflow", title: "Scheduling Escalation Workflow",
    sourceType: "sop_library",
    content: "Tier 1: Scheduling Team attempts coverage from float pool. Tier 2: BCBA-of-record contacted within 2 hours. Tier 3: State Director escalation if coverage gap >24h. Document every escalation in the session note.",
    updatedAt: "2026-04-30", tags: ["scheduling","escalation","coverage","cancellations"] },
  { id: "kb-intake-flow", category: "workflow", title: "Intake Lead to Ready-to-Start Flow",
    sourceType: "sop_library",
    content: "Lead captured > contact within 24h > VOB > intake packet > diagnostic confirmed > auth submitted > schedule built > first session. Each stage has SLAs surfaced in the Intake dashboard.",
    updatedAt: "2026-05-05", tags: ["intake","lead","pipeline","client"] },
  { id: "kb-payment-plans", category: "policy", title: "Payment Plan Policy",
    sourceType: "policy",
    content: "Payment plans are offered when family responsibility exceeds $500. Auto-pay required, max 6 installments, signed by parent and Billing Lead. Default after 2 missed payments triggers service-pause review.",
    updatedAt: "2026-03-15", tags: ["payment","billing","finance","plan"],
    roles: ["super_admin","executive_leadership","operations_leadership","billing_finance","state_director"] },

  { id: "kb-insurance-cheats", category: "insurance", title: "Payer Cheat Sheets",
    sourceType: "insurance_cheats",
    content: "Quick references for Anthem, BCBS, Aetna, Cigna, UHC, Medicaid (per state). Includes covered CPTs, auth durations, supervision ratios, and re-auth windows.",
    updatedAt: "2026-05-10", tags: ["insurance","payer","cpt","coverage","anthem","bcbs","aetna","medicaid"] },

  { id: "kb-state-ga", category: "state", title: "Georgia Operations", sourceType: "state_ops", sourceId: "GA",
    content: "Lead State Director: Kayla Brown. Active clients: 41. Active BCBAs: 12. Medicaid contract active. Top payers: Anthem GA, Peach State.",
    updatedAt: "2026-05-18", tags: ["ga","georgia","state"] },
  { id: "kb-state-nc", category: "state", title: "North Carolina Operations", sourceType: "state_ops", sourceId: "NC",
    content: "Lead State Director: Marcus Hill. Active clients: 38. Staffing risk: moderate (2 open BCBA roles). Top payers: BCBS NC, NC Medicaid.",
    updatedAt: "2026-05-18", tags: ["nc","north carolina","state","staffing"] },
  { id: "kb-state-va", category: "state", title: "Virginia Operations", sourceType: "state_ops", sourceId: "VA",
    content: "Lead State Director: Priya Shah. Active clients: 29. Recruiting slowing; 6 candidates active. Top payers: Anthem VA, Optima.",
    updatedAt: "2026-05-18", tags: ["va","virginia","state","recruiting"] },

  { id: "dir-kayla", category: "directory", title: "Kayla Brown - State Director (GA)", sourceType: "directory",
    content: "Role: State Director. Department: Operations. State: GA. Email: kayla.brown@blossomaba.com. Extension: 1042. Supervisor: VP Operations.",
    updatedAt: "2026-04-01", tags: ["kayla","brown","georgia","director"] },
  { id: "dir-marcus", category: "directory", title: "Marcus Hill - State Director (NC)", sourceType: "directory",
    content: "Role: State Director. Department: Operations. State: NC. Email: marcus.hill@blossomaba.com. Extension: 1051. Supervisor: VP Operations.",
    updatedAt: "2026-04-01", tags: ["marcus","hill","north carolina","director"] },
  { id: "dir-qa-director", category: "directory", title: "Renee Patel - QA Director", sourceType: "directory",
    content: "Role: QA Director. Department: Quality Assurance. Email: renee.patel@blossomaba.com. Extension: 1100.",
    updatedAt: "2026-04-01", tags: ["qa","renee","patel","director","quality"] },
  { id: "dir-va-auths", category: "directory", title: "Jordan Lee - VA Authorizations Lead", sourceType: "directory",
    content: "Role: Authorization Coordinator. State: VA. Email: jordan.lee@blossomaba.com. Extension: 1208.",
    updatedAt: "2026-04-01", tags: ["va","virginia","authorization","jordan","lee"] },
  { id: "dir-ga-scheduling", category: "directory", title: "Tasha Owens - GA Scheduling Lead", sourceType: "directory",
    content: "Role: Scheduling Team Lead. State: GA. Email: tasha.owens@blossomaba.com. Extension: 1305.",
    updatedAt: "2026-04-01", tags: ["ga","georgia","scheduling","tasha","owens"] },

  { id: "kb-role-rbt", category: "role", title: "RBT Responsibilities", sourceType: "role_guide",
    content: "Run sessions as written in the BIP, collect data, complete session notes within 24h, escalate behavior concerns to the supervising BCBA.",
    updatedAt: "2026-02-12", tags: ["rbt","role","responsibilities"] },
  { id: "kb-role-bcba", category: "role", title: "BCBA Responsibilities", sourceType: "role_guide",
    content: "Maintain caseload, run supervision hours, write/update BIPs, complete PRs on time, ensure parent training compliance, support RBT development.",
    updatedAt: "2026-02-12", tags: ["bcba","role","responsibilities","supervision"] },

  { id: "faq-session-note", category: "faq", title: "How do I submit a session note?", sourceType: "faq",
    content: "Open the session from your calendar > Notes tab > complete required fields > sign > Submit. Session notes must be submitted within 24 hours.",
    updatedAt: "2026-02-01", tags: ["session","note","submit"] },
  { id: "faq-pto", category: "faq", title: "What is the PTO request process?", sourceType: "faq",
    content: "Submit PTO requests via HR Suite > Time Off > New Request. Approval routes to your supervisor and triggers scheduling coverage planning.",
    updatedAt: "2026-01-20", tags: ["pto","time off","hr"] },
  { id: "faq-dress-code", category: "policy", title: "Clinic Dress Code", sourceType: "policy",
    content: "Business-casual, closed-toe shoes, Blossom-branded shirt or solid color. No fragrances. Hair tied back during sessions.",
    updatedAt: "2026-01-12", tags: ["dress","code","clinic"] },

  { id: "term-pr", category: "terminology", title: "PR (Progress Report)", sourceType: "glossary",
    content: "Progress report required by most payers at set intervals (commonly every 6 months) to renew authorization. Late PRs jeopardize re-auths.",
    updatedAt: "2026-03-01", tags: ["pr","progress","report","auth"] },
  { id: "term-97156", category: "terminology", title: "CPT 97156 - Parent Training", sourceType: "glossary",
    content: "Parent/caregiver training delivered by a BCBA. Most plans require monthly delivery; missing 97156 is a top compliance risk.",
    updatedAt: "2026-03-01", tags: ["97156","parent","training","cpt","compliance"] },

  { id: "train-rbt-onboarding", category: "training", title: "RBT Onboarding Track", sourceType: "academy",
    content: "5-week onboarding: foundations, ethics, data collection, behavior basics, shadow sessions. Tracked in My Learning.",
    updatedAt: "2026-04-10", tags: ["rbt","onboarding","training","academy"] },

  // ---------------------------- Intake — SOPs ------------------------------
  { id: "intake-sop-first-contact", category: "sop", title: "Intake — First Contact SLA & Script",
    sourceType: "intake_sop",
    content: "Reach every new lead within 1 business hour (target: 15 minutes for self-referred families). Greet by family name, confirm child's first name + age, ask the presenting concern in one open-ended question, then walk through: insurance on file, primary concerns, diagnosis status, preferred location/state, and best contact window. Close by setting expectations: 'I'll verify your benefits today and circle back within 24 hours with next steps.' Always log the call in the lead drawer and advance the pipeline stage.",
    updatedAt: "2026-05-20", tags: ["intake","sop","first contact","script","sla","lead"] },
  { id: "intake-sop-vob-handoff", category: "sop", title: "Intake — Benefits Verification Handoff",
    sourceType: "intake_sop",
    content: "Once insurance card front/back + member info are captured, move the lead to 'Benefits Verification' and notify the Finance/Benefits queue. Required fields: payer, member ID, group #, subscriber DOB, plan type, state. If the payer's cheat sheet says DON'T TAKE, route the lead to 'Non-Qualified' with a templated decline message — do not start VOB.",
    updatedAt: "2026-05-20", tags: ["intake","vob","benefits","verification","handoff"] },
  { id: "intake-sop-packet-followup", category: "sop", title: "Intake — Packet Follow Up / Missing Info Cadence",
    sourceType: "intake_sop",
    content: "Day 0: send packet + checklist. Day 2: text reminder. Day 4: phone call + email. Day 7: escalate to Intake Lead and offer 'we can complete this together' Zoom slot. After 14 days with no response, move to 'Stalled' and schedule a 30-day re-engagement task.",
    updatedAt: "2026-05-20", tags: ["intake","packet","missing information","follow up","cadence"] },
  { id: "intake-sop-diagnosis-required", category: "sop", title: "Intake — Diagnosis Requirements",
    sourceType: "intake_sop",
    content: "ABA requires a current ASD diagnostic evaluation (typically <3 years old; some payers require <1 year). If the family does not have one, offer the Blossom diagnostic evaluation pathway and tag the lead 'Needs Dx'. Never schedule sessions before a qualifying Dx report is in the chart.",
    updatedAt: "2026-05-20", tags: ["intake","diagnosis","asd","evaluation","dx"] },
  { id: "intake-sop-stage-meanings", category: "workflow", title: "Intake — Canonical Pipeline Stages",
    sourceType: "intake_sop",
    content: "Lead Captured → Contact Attempted → Contact Made → Benefits Verification → Assessment Scheduling → Assessment Completed → Intake Packet Sent → Packet Follow Up → Diagnosis Confirmed → Authorization Submitted → Authorization Approved → Scheduling Build → Ready to Start. Every stage has SLAs surfaced on the Intake Dashboard. Move stages from the lead drawer or by drag-and-drop on the Lead-to-Active pipeline.",
    updatedAt: "2026-05-20", tags: ["intake","pipeline","stages","workflow","canonical"] },

  // ------------------- Intake — Email & SMS templates ----------------------
  { id: "intake-email-welcome", category: "faq", title: "Email Template — Welcome / First Touch",
    sourceType: "intake_email",
    content: "Subject: Welcome to Blossom ABA — next steps for {{child_first_name}}\n\nHi {{parent_first_name}},\n\nThank you for reaching out to Blossom ABA. I'm {{intake_coordinator}}, your intake coordinator. I'd love to learn a little more about {{child_first_name}} and walk you through what starting ABA with us looks like.\n\nTo get started, could you reply with:\n• A photo of the front + back of your insurance card\n• {{child_first_name}}'s date of birth\n• The best phone number + time to reach you\n\nI'll verify your benefits and follow up within 24 hours.\n\nWarmly,\n{{intake_coordinator}}",
    updatedAt: "2026-05-20", tags: ["intake","email","template","welcome","first touch"] },
  { id: "intake-email-packet-reminder", category: "faq", title: "Email Template — Packet Reminder",
    sourceType: "intake_email",
    content: "Subject: Quick reminder — {{child_first_name}}'s intake packet\n\nHi {{parent_first_name}},\n\nJust a friendly nudge — we're still missing a couple of items to keep {{child_first_name}}'s start on track:\n{{missing_items}}\n\nIf it's easier, I'm happy to hop on a quick 15-minute call to fill these out together. Reply with a time that works, or grab a slot here: {{scheduling_link}}.\n\nThanks!\n{{intake_coordinator}}",
    updatedAt: "2026-05-20", tags: ["intake","email","template","packet","reminder","missing"] },
  { id: "intake-email-benefits-good", category: "faq", title: "Email Template — Benefits Verified (Good Coverage)",
    sourceType: "intake_email",
    content: "Subject: Great news — {{child_first_name}}'s benefits are verified\n\nHi {{parent_first_name}},\n\nGood news! I verified your {{payer}} benefits for {{child_first_name}}. Here's a quick summary:\n• In-network with Blossom: {{in_network}}\n• Estimated family responsibility per session: {{family_responsibility}}\n• Authorization required: {{auth_required}}\n\nNext step is our diagnostic/assessment scheduling — I'll send a calendar link shortly. Let me know if you have any questions!\n\n{{intake_coordinator}}",
    updatedAt: "2026-05-20", tags: ["intake","email","template","benefits","vob","verified"] },
  { id: "intake-email-decline", category: "faq", title: "Email Template — Non-Qualified / Decline",
    sourceType: "intake_email",
    content: "Subject: Update on {{child_first_name}}'s services with Blossom ABA\n\nHi {{parent_first_name}},\n\nThank you for trusting us with {{child_first_name}}'s care. After reviewing your {{payer}} plan, unfortunately we are not able to provide in-network ABA services under this plan at this time.\n\nA few options that may help:\n• Other local providers who are in-network: {{referrals}}\n• Single-case agreement option (we can help you submit a request)\n• Reach back out if your insurance changes — we'd love to serve your family\n\nWishing you the best,\n{{intake_coordinator}}",
    updatedAt: "2026-05-20", tags: ["intake","email","template","decline","non-qualified"] },
  { id: "intake-sms-templates", category: "faq", title: "SMS Templates — Intake Quick Replies",
    sourceType: "intake_sms",
    content: "Voicemail follow-up: 'Hi {{parent_first_name}}, this is {{intake_coordinator}} with Blossom ABA following up on {{child_first_name}}'s referral. Best number to reach you?'\n\nPacket nudge: 'Hi {{parent_first_name}} — still need {{missing_items}} to keep {{child_first_name}}'s start moving. Reply here when you have a minute. Thanks!'\n\nAppointment confirm: 'Reminder: {{child_first_name}}'s assessment is {{date_time}} with {{clinician}}. Reply C to confirm or R to reschedule.'",
    updatedAt: "2026-05-20", tags: ["intake","sms","text","template","reminder"] },

  // ------------------- Intake — Direction / Coaching ----------------------
  { id: "intake-coach-tough-call", category: "workflow", title: "Coaching — Handling a Frustrated Parent",
    sourceType: "intake_coach",
    content: "1) Lead with empathy — name the feeling: 'It sounds like this has been exhausting.' 2) Reflect back what they said before pivoting. 3) Own what we can: timelines, next concrete step, who is doing what. 4) Always commit to a specific next-touch time and log it as a task in the drawer. 5) Escalate to Intake Lead if the family mentions complaints, attorney, or BBB.",
    updatedAt: "2026-05-20", tags: ["intake","coaching","parent","de-escalation","script"] },
  { id: "intake-coach-pace", category: "workflow", title: "Coaching — Keeping the Pipeline Moving",
    sourceType: "intake_coach",
    content: "Touch every active lead at least every 48 hours until they hit 'Ready to Start'. Use the Intake Tasks spreadsheet view to clear overdue rows first. If a lead has been in the same stage >7 days without a logged contact, the Intake Dashboard flags it as 'Stalled' — clear those before opening new referrals.",
    updatedAt: "2026-05-20", tags: ["intake","coaching","pipeline","sla","stalled"] },
];

// ------------- Auto-generated entries from Lead Benefits Cheat Sheets -------------
// Every payer cheat sheet row is searchable by Ask Blossom so intake can ask
// "do we take Anthem GA?" and get a precise answer with the source.
for (const row of leadBenefitsCheatSheets) {
  KNOWLEDGE_BASE.push({
    id: `cheat-${row.mondayItemId ?? `${row.state}-${row.payer}`.replace(/\s+/g, "-")}`,
    category: "insurance",
    title: `Cheat Sheet — ${row.payer} (${row.state})`,
    sourceType: "lead_benefits_cheat_sheet",
    sourceId: row.mondayItemId,
    content: `Payer: ${row.payer}\nState: ${row.state}\nCategory: ${row.insuranceCategory}\nIntake Status: ${row.intakeStatus}\nNotes: ${row.notes || "—"}`,
    updatedAt: "2026-05-20",
    tags: [
      "cheat sheet", "benefits", "payer", "intake",
      row.state.toLowerCase(),
      row.payer.toLowerCase(),
      row.insuranceCategory.toLowerCase(),
      row.intakeStatus.toLowerCase(),
    ],
  });
}

export function searchKnowledge(query: string, role: OSRole, limit = 5): KBEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return KNOWLEDGE_BASE
    .filter((e) => canAccessCategory(role, e.category))
    .filter((e) => !e.roles || e.roles.includes(role))
    .map((e) => {
      const hay = `${e.title} ${e.content} ${(e.tags ?? []).join(" ")}`.toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += t.length;
      for (const t of tokens) if ((e.tags ?? []).some((tag) => tag.toLowerCase() === t)) score += 6;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

export function listKnowledgeByCategory(role: OSRole): Record<string, KBEntry[]> {
  const grouped: Record<string, KBEntry[]> = {};
  KNOWLEDGE_BASE
    .filter((e) => canAccessCategory(role, e.category))
    .filter((e) => !e.roles || e.roles.includes(role))
    .forEach((e) => { (grouped[e.category] ??= []).push(e); });
  return grouped;
}
