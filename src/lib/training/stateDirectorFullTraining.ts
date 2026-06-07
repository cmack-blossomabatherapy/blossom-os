/**
 * State Director Academy — full module content source of truth.
 *
 * Every State Director module gets a complete content payload:
 *   - learningObjective
 *   - stateDirectorLens          (how a State Director should read this)
 *   - stepByStep[]               (action / look for / owner / escalation)
 *   - sop                        (purpose, owner, inputs, process, escalations, quality, rhythm)
 *   - scenario                   (situation, prompt, expected response, escalation path)
 *   - knowledgeCheck[]           (≥2 module-specific questions)
 *
 * Curated entries override the derived defaults for Week 1 + select
 * load-bearing modules. Every other SD module receives a derived payload
 * built from its title, week/day, and matching SOP — so no module ever
 * falls back to the generic "what is your role" quiz.
 */
import type { Training } from "./academyData";
import { SD_SOPS_BY_WEEK } from "./academyData";

export interface SDWalkStep {
  action: string;
  lookFor: string;
  owner: string;
  escalation?: string;
}

export interface SDSop {
  purpose: string;
  owner: string;
  inputs: string[];
  process: string[];
  escalationTriggers: string[];
  qualityStandard: string;
  reviewRhythm: string;
}

export interface SDScenario {
  situation: string;
  prompt: string;
  expectedResponse: string;
  escalationPath: string;
}

export interface SDKnowledgeQ {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface SDFullContent {
  learningObjective: string;
  stateDirectorLens: string;
  stepByStep: SDWalkStep[];
  sop: SDSop;
  scenario: SDScenario;
  knowledgeCheck: SDKnowledgeQ[];
}

/* ---------------- helpers ---------------- */

function parseSdId(id: string): { week: number; day: number } | null {
  const m = /^sd-w(\d+)d(\d+)-/.exec(id);
  return m ? { week: Number(m[1]), day: Number(m[2]) } : null;
}

function cleanTitle(t: string): string {
  return t.replace(/^W\d+ · D\d+ — /, "").trim();
}

const WEEK_THEME: Record<number, string> = {
  1: "Foundations & Welcome to Blossom",
  2: "Systems & Client Flow",
  3: "Authorizations & Utilization",
  4: "Staffing, Recruiting & Operations",
  5: "State Ownership & Leadership",
};

const WEEK_OWNER: Record<number, string> = {
  1: "State Director Program",
  2: "Operations Leadership",
  3: "Authorizations Lead",
  4: "Recruiting & Staffing Leads",
  5: "State Director (you)",
};

/* ---------------- curated overrides ---------------- */

const CURATED: Record<string, SDFullContent> = {
  /* ---------- Week 1 · Day 1 — Welcome to Blossom ---------- */
  "sd-w1d1-welcome-video-from-blossom": {
    learningObjective:
      "Internalize Blossom's purpose and the operational tone leaders are expected to set.",
    stateDirectorLens:
      "This is the only module where you are explicitly a learner. Every module after this, you are responsible for translating the why into operational decisions in your state.",
    stepByStep: [
      { action: "Block 15 quiet minutes. Watch the welcome video without distractions.", lookFor: "Phrases leadership repeats — those become your operating language.", owner: "You" },
      { action: "Write down one sentence: who Blossom serves, and what we promise them.", lookFor: "Clarity over polish. If you can't say it simply, you can't lead from it.", owner: "You" },
      { action: "Send your sentence to your mentor before your first check-in.", lookFor: "Mentor will refine the language with you.", owner: "Mentor" },
      { action: "Save the video link in your personal SD playbook for re-watching at month 3.", lookFor: "Most directors hear different things the second time.", owner: "You" },
      { action: "Carry one takeaway into your first state stand-up.", lookFor: "Set the tone for your team using leadership's own language.", owner: "You" },
    ],
    sop: {
      purpose: "Establish a shared operational foundation across every State Director.",
      owner: "State Director Program",
      inputs: ["Welcome video link", "Note-taking template", "Mentor check-in slot"],
      process: [
        "Watch the welcome video end-to-end.",
        "Capture one takeaway and one question.",
        "Bring both to your first mentor check-in.",
        "Re-watch at the 90-day mark.",
      ],
      escalationTriggers: [
        "If the video link is broken, notify the State Director Program owner same day.",
      ],
      qualityStandard: "Watched in full, one takeaway captured, one question prepared.",
      reviewRhythm: "Re-watch at 90 days and 12 months as a tone-check.",
    },
    scenario: {
      situation:
        "It's Monday morning. You join your first state stand-up as the new State Director.",
      prompt:
        "How do you open the meeting in 60 seconds so the room hears Blossom's purpose, not your résumé?",
      expectedResponse:
        "Name who we serve (families with kids who need ABA), what we promise (calm, consistent, on-time care), and what you'll be looking at this week (one or two specific KPIs). End with a question for the team.",
      escalationPath:
        "No escalation needed — this is tone-setting. If the team pushes back hard, loop in your mentor before the next stand-up.",
    },
    knowledgeCheck: [
      {
        id: "sd-w1d1-welcome-video-from-blossom-q1",
        question: "What is the State Director's job after watching the welcome video?",
        options: [
          "Memorize the script and repeat it verbatim.",
          "Translate leadership's why into operational decisions in your state.",
          "Wait for instructions on how to apply it.",
        ],
        answerIndex: 1,
      },
      {
        id: "sd-w1d1-welcome-video-from-blossom-q2",
        question: "When should you re-watch the welcome video?",
        options: [
          "Never — once is enough.",
          "At the 90-day mark as a tone-check.",
          "Only if a family complains.",
        ],
        answerIndex: 1,
      },
    ],
  },

  "sd-w1d1-mission-vision": {
    learningObjective:
      "Restate Blossom's mission and vision in your own words and use them to make operational calls.",
    stateDirectorLens:
      "Mission and vision are the tiebreakers when the playbook runs out. Your team will watch how you use them — not whether you can recite them.",
    stepByStep: [
      { action: "Read the mission & vision page end-to-end.", lookFor: "The phrase 'we exist to…' — that's the line you'll repeat.", owner: "You" },
      { action: "Rewrite the mission in one sentence in your own words.", lookFor: "If it doesn't fit on a sticky note, it's too long.", owner: "You" },
      { action: "Map each value to one current operational metric in your state.", lookFor: "Values without metrics are decoration.", owner: "You" },
      { action: "Send your one-line restatement to your mentor.", lookFor: "Mentor will calibrate language with you.", owner: "Mentor" },
      { action: "Use your restatement to open or close a department meeting this week.", lookFor: "Team should recognize the language by week 3.", owner: "You" },
    ],
    sop: {
      purpose: "Make Blossom's mission and vision actionable at the state level.",
      owner: "State Director Program",
      inputs: ["Mission & vision page", "Current state KPI snapshot"],
      process: [
        "Read mission and vision.",
        "Restate in one sentence.",
        "Map values to metrics.",
        "Bring restatement to mentor check-in.",
        "Use language in a real meeting this week.",
      ],
      escalationTriggers: [
        "If you cannot connect a value to any metric in your state, raise it with your mentor — that's a real gap.",
      ],
      qualityStandard: "One-sentence restatement that ladders to at least one operational metric.",
      reviewRhythm: "Revisit at every quarterly leadership review.",
    },
    scenario: {
      situation:
        "A BCBA tells you a family is unhappy and wants to leave Blossom for a competitor closer to home.",
      prompt:
        "Which part of the mission do you anchor your response in, and what's the first operational move?",
      expectedResponse:
        "Anchor in 'calm, consistent care for families who need it.' First move: get the family on a call within 24 hours, understand the real reason, and see if pairing/scheduling can solve it before retention is lost.",
      escalationPath:
        "If the family still wants to leave after the call, loop in QA and Operations Leadership — log it in client timeline.",
    },
    knowledgeCheck: [
      {
        id: "sd-w1d1-mission-vision-q1",
        question: "How should a State Director use Blossom's mission day-to-day?",
        options: [
          "Recite it at every meeting.",
          "Use it as a tiebreaker when the playbook runs out.",
          "Frame it on the wall.",
        ],
        answerIndex: 1,
      },
      {
        id: "sd-w1d1-mission-vision-q2",
        question: "What makes a Blossom value real at the state level?",
        options: [
          "It's printed on the onboarding deck.",
          "It maps to at least one operational metric you actually watch.",
          "Leadership reminds the team about it.",
        ],
        answerIndex: 1,
      },
    ],
  },

  /* ---------- Week 3 · Day 1 — Authorization Lifecycle (high-leverage) ---------- */
  "sd-w3d1-authorization-lifecycle": {
    learningObjective:
      "Understand the full authorization lifecycle and know exactly where it tends to stall in your state.",
    stateDirectorLens:
      "Authorizations are revenue. You don't write them — you make sure no client ever loses hours because of a delay you could have unblocked.",
    stepByStep: [
      { action: "Open the Authorizations dashboard for your state.", lookFor: "Auths in Awaiting Submission and Expiring Soon — those are your at-risk buckets.", owner: "State Director" },
      { action: "Pick three auths from each bucket and trace where they're stuck.", lookFor: "Owner, days in status, missing inputs (PR, assessment, etc.).", owner: "Authorization Coordinator", escalation: "If owner is missing or status is stale > 3 days, escalate." },
      { action: "Sit with the Authorizations Coordinator for 30 minutes.", lookFor: "Their actual workflow vs. the SOP. Differences are training gaps or process gaps.", owner: "Authorization Coordinator" },
      { action: "Walk through one full auth: initial → submission → approval → utilization.", lookFor: "Hand-off moments — those are where things drop.", owner: "Authorization Coordinator" },
      { action: "Document one bottleneck in your state and bring it to the weekly meeting.", lookFor: "Specific, owned, and time-bound — not 'auths are slow.'", owner: "State Director", escalation: "Bring to Operations Leadership if structural." },
    ],
    sop: {
      purpose: "Protect treatment continuity and revenue by keeping every authorization current.",
      owner: "Authorization Coordinator (Authorizations Lead oversight)",
      inputs: ["Authorization status board", "PRs and reassessments", "Insurance portal access"],
      process: [
        "Track every active auth by status and expiration date.",
        "Submit at least 30 days before expiration.",
        "Confirm approval and log into CR.",
        "Flag expiring auths every Monday.",
        "Escalate any auth at risk of lapsing.",
      ],
      escalationTriggers: [
        "Auth within 14 days of expiration with no submission.",
        "Missing PR blocking submission > 7 days.",
        "Denied auth without resubmission plan within 48 hours.",
      ],
      qualityStandard: "Zero lapsed authorizations. < 5% of auths in 'expiring soon' on any Monday.",
      reviewRhythm: "Weekly auth review (Mon AM). Monthly utilization review with Operations.",
    },
    scenario: {
      situation:
        "It's Friday at 4pm. You see two clients with auths expiring Sunday and no PR submitted.",
      prompt:
        "What do you do in the next hour, and who do you call?",
      expectedResponse:
        "Call the Authorization Coordinator and the assigned BCBA immediately. Confirm where the PR is stuck. If the BCBA can finish it before EOD, push for submission tonight. If not, contact the payer Monday morning with a backdating request and notify the family proactively. Log the situation in the client timeline.",
      escalationPath:
        "Loop in Operations Leadership same evening if either auth will lapse. Document the cause and the prevention plan in Monday's weekly meeting.",
    },
    knowledgeCheck: [
      {
        id: "sd-w3d1-authorization-lifecycle-q1",
        question: "What is the State Director's role in the authorization workflow?",
        options: [
          "Personally submit every authorization.",
          "Make sure no client loses hours because of a delay you could have unblocked.",
          "Only review auths at month-end.",
        ],
        answerIndex: 1,
      },
      {
        id: "sd-w3d1-authorization-lifecycle-q2",
        question: "When should an authorization be submitted before expiration?",
        options: [
          "At least 30 days before expiration.",
          "When the family asks about it.",
          "After the auth has lapsed, with a backdating request.",
        ],
        answerIndex: 0,
      },
    ],
  },
};

/* ---------------- derivation ---------------- */

function sopNameFor(week: number, day: number, position: number, title: string): string {
  return SD_SOPS_BY_WEEK[week]?.[day]?.[position] ?? `${title} SOP`;
}

function deriveContent(training: Training): SDFullContent {
  const parsed = parseSdId(training.id);
  const week = parsed?.week ?? 1;
  const day = parsed?.day ?? 1;
  const title = cleanTitle(training.title);
  const owner = WEEK_OWNER[week] ?? "State Director (you)";
  const sopName = sopNameFor(week, day, 0, title);
  const theme = WEEK_THEME[week] ?? "State Director Academy";

  const stepByStep: SDWalkStep[] = [
    {
      action: `Open the ${title} workflow in Blossom OS and review the live data for your state.`,
      lookFor: "Anomalies — anything outside the normal range or stuck > 3 days.",
      owner: "State Director",
    },
    {
      action: `Read the named SOP (${sopName}) end-to-end.`,
      lookFor: "Who owns each step, the SLA, and where ownership hands off.",
      owner: "You",
    },
    {
      action: `Sit with the department owner for 30 minutes and watch them run ${title.toLowerCase()}.`,
      lookFor: "Where their real workflow differs from the SOP — that's either training or process.",
      owner,
      escalation: "If you find a structural gap, raise it with Operations Leadership.",
    },
    {
      action: "Pick one example from your state and walk it end-to-end out loud.",
      lookFor: "Hand-offs and missing data — those are where this workflow breaks.",
      owner: "You",
    },
    {
      action: "Document 1 strength and 1 gap, and bring both to your mentor check-in.",
      lookFor: "Specific, owned, time-bound — not vague observations.",
      owner: "You",
      escalation: "If the gap is repeating across states, escalate to Operations Leadership.",
    },
  ];

  const sop: SDSop = {
    purpose: `Establish a consistent operational standard for ${title.toLowerCase()} so every state runs it the same way.`,
    owner,
    inputs: [
      `${sopName}`,
      "Live data from the relevant Blossom OS workspace",
      "Department owner's calendar for a 30-minute walkthrough",
    ],
    process: [
      `Read ${sopName} in full.`,
      `Pull the live ${title.toLowerCase()} view for your state.`,
      "Walk one example end-to-end with the department owner.",
      "Identify 1 strength and 1 gap.",
      "Confirm understanding in your mentor check-in.",
    ],
    escalationTriggers: [
      "Workflow stalled > 3 days with no owner.",
      "Repeating gap that affects more than one client/staff member.",
      "Any pattern that puts revenue, compliance, or client care at risk.",
    ],
    qualityStandard: `State Director can explain ${title.toLowerCase()} in 2 minutes, name the owner, and point to the metric that proves it's healthy.`,
    reviewRhythm: week >= 4
      ? "Reviewed weekly in state operations meeting; trended monthly with Operations Leadership."
      : "Reviewed in mentor check-in this week; revisited during week 5 readiness review.",
  };

  const scenario: SDScenario = {
    situation: `A team member raises a ${title.toLowerCase()} issue in your state stand-up: the workflow is stuck and nobody is sure who owns the next move.`,
    prompt: "What's your first move, and how do you make sure this doesn't recur?",
    expectedResponse: `Name the SOP owner out loud. Confirm where the workflow is stuck and what input is missing. Set an owner, an action, and a check-back time before the meeting ends. After the meeting, document the gap and add it to your weekly state operations review so the pattern is visible.`,
    escalationPath: week >= 3
      ? "If the gap repeats next week or involves revenue/auth risk, escalate to Operations Leadership with data."
      : "Bring the pattern to your mentor in this week's check-in.",
  };

  const knowledgeCheck: SDKnowledgeQ[] = [
    {
      id: `${training.id}-q1`,
      question: `${title}: what is the State Director's primary responsibility in this workflow?`,
      options: [
        `Personally execute every ${title.toLowerCase()} task.`,
        `Know who owns it, what healthy looks like, and unblock it when it stalls.`,
        `Wait for leadership to flag problems.`,
      ],
      answerIndex: 1,
    },
    {
      id: `${training.id}-q2`,
      question: `Which SOP grounds ${title} for State Directors?`,
      options: [
        sopName,
        `The generic ${theme} overview deck.`,
        `Whatever the previous director used.`,
      ],
      answerIndex: 0,
    },
    {
      id: `${training.id}-q3`,
      question: "When should this workflow be escalated to Operations Leadership?",
      options: [
        "Only at quarter-end.",
        "When the gap repeats or affects revenue, compliance, or client care.",
        "Never — handle everything in-state.",
      ],
      answerIndex: 1,
    },
  ];

  return {
    learningObjective: `Be able to run, oversee, and unblock ${title.toLowerCase()} in your state without supervision.`,
    stateDirectorLens: `${title} is part of ${theme}. You're not the doer — you're the operational owner who makes sure it's healthy and gets unstuck fast.`,
    stepByStep,
    sop,
    scenario,
    knowledgeCheck,
  };
}

/* ---------------- public API ---------------- */

/** Returns true when the training is a State Director Academy module. */
export function isStateDirectorModule(training: Pick<Training, "id" | "department">): boolean {
  return training.id.startsWith("sd-") || training.department === "state_director" || training.department === "state_operations";
}

/**
 * Full content for a State Director module. Returns curated content when
 * present, otherwise a derived payload that still includes every required
 * section. Returns null for non-SD modules.
 */
export function getStateDirectorFullContent(training: Training): SDFullContent | null {
  if (!isStateDirectorModule(training)) return null;
  return CURATED[training.id] ?? deriveContent(training);
}

/** Exposed for tests — list of curated module ids. */
export const SD_CURATED_MODULE_IDS = Object.keys(CURATED);
