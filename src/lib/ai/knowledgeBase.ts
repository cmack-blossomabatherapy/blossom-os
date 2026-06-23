import type { OSRole } from "@/lib/os/permissions";
import type { KBEntry } from "./types";
import { canAccessCategory } from "./aiPermissions";

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
];

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
