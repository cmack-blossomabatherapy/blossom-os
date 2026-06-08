/**
 * Welcome to Blossom — shared first-day content.
 *
 * Source-of-truth for the /training/welcome page. Phase 0 of the State
 * Director journey and the shared welcome for every Blossom team member.
 * Treated as non-SOP content — these modules must NOT be counted against
 * State Director SOP upload coverage.
 */

export interface WelcomeHero {
  eyebrow: string;
  headline: string;
  supporting: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface WelcomeModule {
  id: string;
  title: string;
  /** Module kind for learner UI chips and Training Management. */
  moduleType: "video" | "content" | "letter";
  /** Estimated minutes for the learner to complete the module. */
  estimatedMinutes: number;
  description: string;
  learningObjective: string;
  whyThisMatters: string;
  whatToDo: string[];
  completionEvidence: string;
  reflectionPrompt?: string;
  videoPending?: string;
}

export interface WelcomeValue {
  title: string;
  body: string;
}

export interface WelcomeFlowStep {
  step: number;
  text: string;
}

export interface WelcomeLeadershipLetter {
  id: "welcome-letter-chad" | "welcome-letter-shira";
  displayTitle: string;
  subtitle: string;
  name: string;
  role: string;
  initials: string;
  paragraphs: string[];
  signoff: string;
  pullQuote: string;
}

export interface WelcomeCompletion {
  title: string;
  copy: string;
  cta: string;
}

export const WELCOME_TO_BLOSSOM_HERO: WelcomeHero = {
  eyebrow: "Day 1 — Welcome to Blossom",
  headline: "Welcome to Blossom.",
  supporting:
    "Before you learn the systems, dashboards, SOPs, and weekly rhythms, start here. This is the part of training that explains who we are, why the work matters, and how we show up for families and for each other. You do not need to know everything today. You only need to get grounded, meet the company, and take the next step.",
  primaryCta: "Start Welcome to Blossom",
  secondaryCta: "Continue to State Director Journey",
};

/** Canonical phase id used by Training Management overrides. */
export const WELCOME_TO_BLOSSOM_PHASE_ID = "welcome" as const;

/**
 * The seven Welcome to Blossom modules. These IDs are intentionally distinct
 * from State Director SOP module IDs and must be excluded from SOP coverage.
 */
export const WELCOME_TO_BLOSSOM_MODULES: WelcomeModule[] = [
  {
    id: "welcome-video-from-blossom",
    title: "Welcome Video from Blossom",
    moduleType: "video",
    estimatedMinutes: 4,
    description:
      "Start with a short welcome from Blossom leadership. This video should give you the tone of the company: calm, practical, family-centered, and serious about doing the work well.",
    videoPending:
      "The welcome video is being prepared. You can continue with the written Welcome to Blossom guidance now and revisit the video later.",
    learningObjective:
      "Understand the tone, purpose, and leadership expectations behind Blossom ABA Therapy.",
    whyThisMatters:
      "The State Director role is not just a management role. You are responsible for how a state feels, functions, communicates, and recovers when things get hard. This welcome sets the tone for the kind of leader Blossom expects you to become.",
    whatToDo: [
      "Watch the video when available.",
      "If the video is pending, read the leadership letters below.",
      "Write down one sentence that captures what Blossom is here to do.",
      "Bring that sentence to your first mentor check-in.",
    ],
    completionEvidence:
      "Mark the welcome reviewed and capture one takeaway for your mentor.",
    reflectionPrompt:
      "What kind of leader will families and staff need you to be in your first 30 days?",
  },
  {
    id: "welcome-mission-vision",
    title: "Mission & Vision",
    moduleType: "content",
    estimatedMinutes: 8,
    description:
      "Blossom exists to help children and families access high-quality ABA therapy with a system behind it that is organized, responsive, and human.",
    learningObjective:
      "Restate Blossom's mission and vision in plain language and connect them to operational priorities.",
    whyThisMatters:
      "Your job is to protect the bridge between care and operations. Families experience Blossom through scheduling, communication, authorization continuity, staffing, clinical quality, and follow-through. If the state is disorganized, the family feels it. If the state is calm and accountable, the family feels that too.",
    whatToDo: [
      "Read the mission and vision.",
      "Rewrite them in your own words.",
      "Connect them to one operational metric you will watch as a State Director.",
    ],
    completionEvidence: "Bring your one-sentence version to your mentor check-in.",
    reflectionPrompt:
      "Which part of the mission will be hardest to protect when the state is busy?",
  },
  {
    id: "welcome-core-values",
    title: "Core Values",
    moduleType: "content",
    estimatedMinutes: 8,
    description: "Values are not slogans. They are the standards we use when the day gets complicated.",
    learningObjective:
      "Identify the value that comes most naturally to you and the value that will require the most discipline.",
    whyThisMatters:
      "Your team will learn the values by watching your decisions. If you tolerate unclear ownership, the state will become unclear. If you model calm follow-up, the state will become calmer. Values become real through the way you run meetings, escalations, and daily priorities.",
    whatToDo: [
      "Read each value.",
      "Pick one value that feels natural to you.",
      "Pick one value that will require discipline.",
      "Write one action you can take this week to model that value.",
    ],
    completionEvidence: "Share one chosen value and one action with your mentor.",
    reflectionPrompt:
      "Which value will your team most need from you during your first month?",
  },
  {
    id: "welcome-meet-the-team",
    title: "Meet the Team",
    moduleType: "content",
    estimatedMinutes: 8,
    description:
      "You are not expected to solve everything alone. Blossom works because departments own their lanes and communicate across them.",
    learningObjective:
      "Know who owns what and identify the first three department partners you will need in week one.",
    whyThisMatters:
      "Knowing who owns what prevents delay. If the wrong person is holding the problem, the problem grows. A strong State Director routes issues quickly and respectfully.",
    whatToDo: [
      "Review the leadership and department map.",
      "Identify your primary mentor.",
      "Identify the department leaders you will need during week one.",
      "Schedule or confirm your first check-in.",
    ],
    completionEvidence:
      "Write down your mentor, your first three department partners, and one question for each.",
  },
  {
    id: "welcome-how-blossom-works",
    title: "How Blossom Works",
    moduleType: "content",
    estimatedMinutes: 10,
    description:
      "Blossom is an ABA care organization supported by an operational system. The work moves from family interest to verified benefits, assessment, authorization, scheduling, active treatment, utilization, progress reporting, and renewal.",
    learningObjective:
      "Describe the 11-step Blossom flow and identify the three places a state is most likely to get stuck.",
    whyThisMatters:
      "You are not the owner of every task. You are the owner of the flow. Your job is to know where the flow is healthy, where it is stuck, who owns the next action, and what needs escalation.",
    whatToDo: [
      "Read the flow once.",
      "Draw it from memory.",
      "Mark the three places where you think a state is most likely to get stuck.",
      "Bring those three risk points to your mentor.",
    ],
    completionEvidence: "Share your drawn flow and three risk points with your mentor.",
  },
  {
    id: "welcome-letter-chad",
    title: "Welcome Letter from Chad",
    moduleType: "letter",
    estimatedMinutes: 5,
    description: "A letter from the Chief Executive Officer.",
    learningObjective:
      "Internalize the company-level expectations the CEO has for new State Directors.",
    whyThisMatters:
      "Hearing directly from leadership sets the tone for your training and signals that your role matters at the company level.",
    whatToDo: ["Read the full letter without skimming."],
    completionEvidence: "Capture one sentence that resonated and share it with your mentor.",
  },
  {
    id: "welcome-letter-shira",
    title: "Welcome Letter from Shira",
    moduleType: "letter",
    estimatedMinutes: 5,
    description: "A letter from the Director of Operations.",
    learningObjective:
      "Understand the operational leadership rhythm Blossom expects from State Directors.",
    whyThisMatters:
      "Operations leadership is your closest partner. Knowing how Shira frames the work helps you align quickly.",
    whatToDo: ["Read the full letter without skimming."],
    completionEvidence: "Bring one question for Shira's team to your first mentor check-in.",
  },
];

/** Stable IDs for the seven Welcome modules — referenced by SOP coverage. */
export const WELCOME_MODULE_IDS: string[] = WELCOME_TO_BLOSSOM_MODULES.map((m) => m.id);

/** Canonical titles, in order — used by tests and Training Management. */
export const WELCOME_TO_BLOSSOM_MODULE_TITLES: string[] =
  WELCOME_TO_BLOSSOM_MODULES.map((m) => m.title);

export function isWelcomeNonSopModule(id: string): boolean {
  return WELCOME_MODULE_IDS.includes(id) || id.startsWith("welcome-");
}

export const WELCOME_CORE_VALUES: WelcomeValue[] = [
  {
    title: "Family-Centered Care",
    body:
      "Families should not have to chase us for clarity. We communicate, follow through, and treat every family interaction as part of care.",
  },
  {
    title: "Clinical Excellence",
    body:
      "ABA services must be clinically sound, ethical, and individualized. Operations exist to support quality, not replace it.",
  },
  {
    title: "Operational Accountability",
    body:
      "If something is stuck, unclear, overdue, or at risk, we name it and assign ownership. Calm accountability prevents crisis.",
  },
  {
    title: "Clear Communication",
    body:
      "We say what is happening, who owns the next step, and when follow-up will happen. We do not let silence become the system.",
  },
  {
    title: "Team Support",
    body:
      "People do better work when they know where to go, what is expected, and who will help them solve problems.",
  },
  {
    title: "Continuous Improvement",
    body:
      "If the same problem happens more than once, we look at the system. Blossom OS, SOPs, training, and dashboards are tools for making the work better.",
  },
];

export const WELCOME_BLOSSOM_FLOW: WelcomeFlowStep[] = [
  { step: 1, text: "A family reaches out or is referred." },
  { step: 2, text: "Intake captures the lead and confirms basic fit." },
  { step: 3, text: "Benefits are verified." },
  { step: 4, text: "Assessment is scheduled." },
  { step: 5, text: "Clinical team completes assessment and treatment planning." },
  { step: 6, text: "Authorization is requested and approved." },
  { step: 7, text: "Scheduling and staffing build the service plan." },
  { step: 8, text: "The client becomes active." },
  { step: 9, text: "Utilization is monitored." },
  { step: 10, text: "Progress reports and reauthorizations keep treatment moving." },
  { step: 11, text: "The State Director watches the health of the whole flow." },
];

export const WELCOME_LEADERSHIP_LETTERS: WelcomeLeadershipLetter[] = [
  {
    id: "ceo",
    displayTitle: "A Welcome From Chad Kaufman",
    subtitle: "Chief Executive Officer",
    name: "Chad Kaufman",
    role: "Chief Executive Officer",
    initials: "CK",
    paragraphs: [
      "Welcome to Blossom.",
      "I want you to know from the beginning that this company was built with a very real responsibility in mind. Families come to us at important moments in their lives. They are looking for care, clarity, and trust. They are often trying to understand insurance, schedules, assessments, staffing, and clinical recommendations all at once. Our job is to make that experience feel more supported, not more confusing.",
      "That is why operations matter so much here.",
      "Great ABA therapy does not happen through good intentions alone. It happens when families are communicated with, when authorizations are watched, when schedules are clean, when staff are supported, when clinical teams have what they need, and when leaders follow through. Blossom is building the systems to make that possible at scale.",
      "As a State Director, you are stepping into one of the most important leadership seats in the company. You will not personally do every task in the state, but you will be responsible for knowing whether the state is healthy. You will learn to see where the flow is stuck, where families are waiting, where staff need support, and where leadership needs to step in.",
      "Do not pressure yourself to know everything on day one. That is not the expectation.",
      "The expectation is that you learn the system, ask good questions, communicate clearly, and build trust through follow-through. If you do those things consistently, you will become the kind of leader this role requires.",
      "We are glad you are here. Take the training seriously, lean on your mentor, and remember that this work matters because the families matter.",
      "Welcome to Blossom.",
    ],
    signoff: "Chad Kaufman, Chief Executive Officer",
    pullQuote: "Great ABA therapy does not happen through good intentions alone.",
  },
  {
    id: "doo",
    displayTitle: "A Note From Shira Lasry",
    subtitle: "Director of Operations",
    name: "Shira Lasry",
    role: "Director of Operations",
    initials: "SL",
    paragraphs: [
      "Welcome.",
      "If you are reading this on your first day, I want you to take a breath. You are going to learn a lot, but you are not expected to absorb it all at once.",
      "The State Director role is built around rhythm, ownership, and communication. You will learn the dashboards, the SOPs, the meetings, the departments, and the escalation paths. Those tools matter. But the deeper skill is learning how to keep a state moving without creating panic.",
      "When something is stuck, we name it. When ownership is unclear, we assign it. When a family is waiting, we follow up. When a process breaks, we fix the system. When a team member needs support, we do not leave them guessing.",
      "That is the kind of operational leadership Blossom needs.",
      "Your training path is designed to give you structure. Start with Welcome to Blossom. Then move through the State Director journey one day at a time. Read the SOPs. Ask your mentor what the work looks like in real life. Pay attention to the handoffs between departments, because that is where many operational issues begin.",
      "You do not have to become perfect. You do have to become clear, consistent, and accountable.",
      "My hope is that by the end of this journey, you understand not only what a State Director does, but why the role matters. A healthy state creates better experiences for families, clinicians, staff, and leaders. That is the work.",
      "Welcome to the team. We are going to build this with you.",
    ],
    signoff: "Shira Lasry, Director of Operations",
    pullQuote: "The deeper skill is learning how to keep a state moving without creating panic.",
  },
];

export const WELCOME_COMPLETION: WelcomeCompletion = {
  title: "You are ready for the State Director Journey.",
  copy:
    "You have met the company, read the leadership notes, reviewed the mission and values, and walked the high-level Blossom flow. Now move into the State Director launch journey. You will go one day at a time, with SOPs, walkthroughs, mentor check-ins, shadowing, and readiness sign-off. Nothing here has to be solved alone.",
  cta: "Continue to State Director Journey",
};