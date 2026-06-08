/**
 * State Director Evidence Panels
 *
 * These 8 modules in the State Director journey do not have UI screenshots —
 * they are live shadows, knowledge checks, sign-offs, or certifications. Each
 * one is represented here with a full mentor-reviewed evidence panel that
 * replaces any "screenshot pending" placeholder in module detail.
 *
 * Source of truth: outputs/state-director-evidence-panels.json
 */

export interface SDEvidencePanel {
  moduleId: string;
  title: string;
  purpose: string;
  whatToObserve: string[];
  evidenceToCapture: string[];
  mentorReview: string;
  completionCriteria: string;
}

export const SD_EVIDENCE_PANELS: SDEvidencePanel[] = [
  {
    moduleId: "sd-w4d5-scheduling-shadow",
    title: "Shadow the Scheduling team",
    purpose:
      "Understand how staffing decisions are made in real time so you can support, escalate, and protect therapy hours in your state.",
    whatToObserve: [
      "How the scheduler prioritizes coverage gaps for the day.",
      "How call-outs and last-minute changes are handled.",
      "How communication flows between scheduling, BCBAs, and families.",
    ],
    evidenceToCapture: [
      "A short written summary of one decision the scheduler made and why.",
      "One operational risk you noticed (e.g., a recurring coverage gap).",
      "One question you would ask in your state's next staffing huddle.",
    ],
    mentorReview:
      "Your mentor reviews the written summary and confirms the observation captured a real scheduling decision, not just activity.",
    completionCriteria:
      "Mentor sign-off recorded and the written summary saved in your training record.",
  },
  {
    moduleId: "sd-w4d5-recruiting-shadow",
    title: "Shadow the Recruiting team",
    purpose:
      "See how applicants move from inquiry to hire so you can advocate for your state's hiring needs with realistic timelines.",
    whatToObserve: [
      "How recruiters source and screen RBT and BCBA candidates.",
      "How interviews are scheduled and decisions communicated.",
      "Where the funnel slows down most often.",
    ],
    evidenceToCapture: [
      "Notes on one candidate path from inquiry to next step.",
      "One bottleneck you observed that affects your state.",
      "One concrete way you can help recruiting from the State Director seat.",
    ],
    mentorReview:
      "Your mentor reviews the notes to confirm you understand the funnel — not just the tools used.",
    completionCriteria:
      "Mentor sign-off recorded and recruiting walkthrough notes saved in your training record.",
  },
  {
    moduleId: "sd-w4d5-bcba-shadow",
    title: "Shadow a BCBA in your state",
    purpose:
      "Build empathy for the BCBA workload and learn what clinical oversight actually looks like inside a session.",
    whatToObserve: [
      "How the BCBA prepares for and runs a supervision session.",
      "How documentation, parent communication, and RBT coaching fit together.",
      "How clinical concerns are escalated.",
    ],
    evidenceToCapture: [
      "A written reflection on what BCBA oversight requires day-to-day.",
      "One operational support a State Director can provide to BCBAs.",
      "One clinical-quality risk you noticed (no PHI, no names).",
    ],
    mentorReview:
      "Your mentor reviews the reflection privately — screenshots and PHI must not be captured.",
    completionCriteria:
      "Mentor sign-off recorded and the BCBA reflection saved (PHI-free) in your training record.",
  },
  {
    moduleId: "sd-w4d5-state-director-shadow",
    title: "Shadow an experienced State Director",
    purpose:
      "Watch operational judgment in action so you can model the calm, decisive pattern your state will need.",
    whatToObserve: [
      "How they prioritize the day's competing requests.",
      "How they communicate decisions to leadership, staff, and families.",
      "Which problems they escalate and which they own.",
    ],
    evidenceToCapture: [
      "A written summary of how the State Director spent the day.",
      "One decision pattern you want to replicate.",
      "One question to bring back to your mentor.",
    ],
    mentorReview:
      "Your mentor confirms you observed judgment and not just activity.",
    completionCriteria:
      "Mentor sign-off recorded and the day-summary saved in your training record.",
  },
  {
    moduleId: "sd-w5d5-final-knowledge-review",
    title: "Final knowledge review",
    purpose:
      "Confirm you can recall the operational rules, escalations, and reports a State Director relies on every week.",
    whatToObserve: [
      "Your own pace and confidence as you move through the review.",
      "Topics you hesitate on — these are next week's coaching topics.",
    ],
    evidenceToCapture: [
      "A completed knowledge review with score and timestamp.",
      "Any flagged questions you want to revisit with your mentor.",
    ],
    mentorReview:
      "Your mentor reviews the score and any flagged questions before sign-off.",
    completionCriteria:
      "Passing score on the final knowledge review recorded in your training record.",
  },
  {
    moduleId: "sd-w5d5-readiness-assessment",
    title: "State Director readiness assessment",
    purpose:
      "Pause and reflect on whether you feel ready to own a state — and where you still want support.",
    whatToObserve: [
      "Your honest answers to the readiness questions.",
      "The themes that show up across your answers (operational, clinical, leadership, personal).",
    ],
    evidenceToCapture: [
      "A submitted written readiness reflection.",
      "Two areas where you want continued mentorship.",
    ],
    mentorReview:
      "Your mentor reads the reflection and meets with you to discuss it before sign-off.",
    completionCriteria:
      "Submitted readiness reflection reviewed and acknowledged by your mentor.",
  },
  {
    moduleId: "sd-w5d5-leadership-sign-off",
    title: "Leadership sign-off conversation",
    purpose:
      "Have a real conversation with leadership about your readiness, your state, and your first 90 days.",
    whatToObserve: [
      "Feedback themes that leadership returns to.",
      "Commitments leadership makes back to you.",
    ],
    evidenceToCapture: [
      "A short summary of the conversation and commitments on both sides.",
      "Any conditions or next steps leadership attached to sign-off.",
    ],
    mentorReview:
      "Your mentor and leadership co-confirm the sign-off was completed and any next steps are owned.",
    completionCriteria:
      "Leadership sign-off recorded in your training record with a written summary.",
  },
  {
    moduleId: "sd-w5d5-state-director-certification",
    title: "State Director certification",
    purpose:
      "Mark the completion of the State Director journey and the beginning of your operational ownership.",
    whatToObserve: [
      "How it feels to step into the State Director role officially.",
      "Which of the prior weeks you want to revisit during your first 90 days.",
    ],
    evidenceToCapture: [
      "Acknowledgement that you accept the State Director role and responsibilities.",
      "Your first-90-day focus statement.",
    ],
    mentorReview:
      "HR and your mentor confirm all prior modules and sign-offs are complete before certification is issued.",
    completionCriteria:
      "State Director certification recorded in HR with a first-90-day focus statement.",
  },
];

const SD_EVIDENCE_BY_ID: Record<string, SDEvidencePanel> = (() => {
  const m: Record<string, SDEvidencePanel> = {};
  for (const p of SD_EVIDENCE_PANELS) m[p.moduleId] = p;
  return m;
})();

export function getStateDirectorEvidencePanel(
  moduleId: string,
): SDEvidencePanel | null {
  return SD_EVIDENCE_BY_ID[moduleId] ?? null;
}

export const SD_EVIDENCE_PANEL_MODULE_IDS: string[] = SD_EVIDENCE_PANELS.map(
  (p) => p.moduleId,
);