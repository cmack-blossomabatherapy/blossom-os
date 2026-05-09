/**
 * Built-in SOP starter pack. Used to seed a brand-new user's SOP library
 * the first time they visit SOP Intelligence so the page is never empty.
 */

export interface SeedSop {
  title: string;
  owner: string;
  body: string; // raw text with markdown-style headings
}

export const SEED_SOPS: SeedSop[] = [
  {
    title: "Authorization Denial Playbook",
    owner: "Devorah Singh",
    body: `# Resubmission SLA
When an authorization is denied the assigned coordinator receives an immediate task. The team has 1 business day to resubmit. Medical-necessity denials require a BCBA justification note before resubmission. Devorah is the default escalation owner.

# Documentation Correction
Use the documentation correction workflow to attach corrected session notes, treatment plan excerpts, and the BCBA medical necessity rationale. Submit through CentralReach with the denial reason code attached.`,
  },
  {
    title: "Financial Gate SOP",
    owner: "Gabi Romero",
    body: `# Payor Routing
After VOB is received leads enter Financial Review. Medicaid auto-approves. Commercial payors require Gabi's review and may trigger a payment plan or non-viable status. Approved gates create a client pipeline conversion task automatically.`,
  },
  {
    title: "VOB Process",
    owner: "Intake Team",
    body: `# Solum Submission
Initiate verification of benefits by submitting a Solum request with the correct payor packet. Attach insurance card front/back, demographics form, and prescriber referral. Common errors: missing subscriber DOB, wrong group ID, mismatched address.`,
  },
  {
    title: "Onboarding — Georgia New Hires",
    owner: "HR Admin",
    body: `# State Signature Packet
Georgia new hires must complete the GA Sworn Statement and GA Background Authorization on day one. HR uploads the signed packet to the employee record before clinical orientation begins.`,
  },
  {
    title: "Parent Intake Call SOP",
    owner: "Intake Team",
    body: `# Discovery & Empathy
Open every intake call by acknowledging the family's journey. Capture diagnosis, current services, geographic constraints, and parent goals. Avoid clinical jargon. Confirm next step in writing within 1 hour.`,
  },
  {
    title: "Scheduling Conflict Resolution",
    owner: "Scheduling Lead",
    body: `# RBT Reassignment
When an RBT calls out, scheduling first checks the float pool, then in-clinic coverage, then offers virtual parent training as a bridge. Notify the family within 30 minutes. Log the conflict in the scheduling tracker.`,
  },
  {
    title: "QA Session Review Checklist",
    owner: "QA Director",
    body: `# Note Quality Standards
Every session note must include: behavior data, intervention used, parent involvement, response to programming, and next session focus. QA flags any note missing two or more elements for BCBA review.`,
  },
];