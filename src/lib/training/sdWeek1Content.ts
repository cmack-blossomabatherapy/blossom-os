/**
 * State Director — Week 1 full content (Foundations & Welcome to Blossom).
 *
 * This file is the source of truth for Week 1 module content:
 *   - SD_W1_TRAINING_SPECS      → Training-level fields (whyItMatters, whatToDo,
 *                                  completionEvidence, reflectionPrompt, description)
 *                                  keyed by the display title used in
 *                                  SD_JOURNEY_STRUCTURE.
 *   - SD_W1_FULL_CONTENT        → Curated SDFullContent payloads keyed by
 *                                  the generated module id (sd-w{week}d{day}-{slug}).
 *
 * Goal: a new State Director can complete every Week 1 module without
 * needing a mentor to fill in operational gaps.
 */
import type { SDFullContent } from "./stateDirectorFullTraining";

export interface SDTrainingSpecOverride {
  description?: string;
  whyItMatters: string;
  whatToDo: string;
  completionEvidence: string;
  reflectionPrompt: string;
}

/* ============================================================
 * Training-level overrides (Day 2 – Day 5)
 * Day 1 already has dedicated SD_W1D1_SPECS in academyData.ts; we
 * only need to ensure each Day 1 module also has a reflectionPrompt
 * (added below for the ones that were missing one).
 * ============================================================ */

export const SD_W1_TRAINING_SPECS: Record<string, SDTrainingSpecOverride> = {
  /* ---------- Day 1 reflection prompts (description/why/what already set) ---------- */
  "Mission & Vision": {
    whyItMatters: "Every operational decision you make should ladder up to this. Mission and vision are tiebreakers when the playbook runs out.",
    whatToDo: "Read the mission & vision. Rewrite both in your own words. Connect each value to one operational metric you will watch.",
    completionEvidence: "Bring your one-sentence restatement and one mapped metric to your mentor check-in.",
    reflectionPrompt: "Which part of the mission will be hardest to protect when the state is busy?",
  },
  "Core Values": {
    whyItMatters: "Values are how leaders make calls when there's no playbook. Your team will learn the values by watching your decisions.",
    whatToDo: "Read each value. Pick the one that comes naturally and the one that will require discipline. Write one observable behavior for each.",
    completionEvidence: "Share your two chosen values and one action with your mentor.",
    reflectionPrompt: "Which value will your team most need from you during your first month?",
  },
  "Welcome Video from Blossom": {
    whyItMatters: "Sets the tone for everything you'll learn. You'll hear our purpose in our own words.",
    whatToDo: "Watch the welcome video end-to-end. Capture one thing that stood out and one question you want to bring back to your mentor.",
    completionEvidence: "Mark the video as watched and bring your takeaway to your first mentor check-in.",
    reflectionPrompt: "What kind of leader will families and staff need you to be in your first 30 days?",
  },
  "Meet the Team": {
    whyItMatters: "You can't run a state if you don't know who owns what. Knowing the right person to call shortens every issue from days to hours.",
    whatToDo: "Review the team directory, identify your mentor, and write down the three department leads you will lean on most in Week 1.",
    completionEvidence: "Bookmark the team directory, introduce yourself to at least three department leads, and share the list with your mentor.",
    reflectionPrompt: "Which department do you understand the least today — and who will you ask to walk you through it?",
  },
  "How Blossom Works": {
    whyItMatters: "You are not the owner of every task. You are the owner of the flow. If the flow is healthy, the state is healthy.",
    whatToDo: "Walk the 11-step Blossom flow (Lead → Active → Renewal). Mark the three points you think are most likely to get stuck in your state.",
    completionEvidence: "Sketch the flow from memory and share your three risk points with your mentor.",
    reflectionPrompt: "Where in the flow does a small delay cause the biggest problem downstream?",
  },
  "Welcome from Chad Kaufman": {
    whyItMatters: "Hearing directly from Chad grounds you in why Blossom exists and what leadership expects from a State Director.",
    whatToDo: "Read the full letter without skimming. Notice the words leadership uses — those become the operating language of your state.",
    completionEvidence: "Capture one sentence that resonated and bring it to your first mentor check-in.",
    reflectionPrompt: "Which line from Chad's letter will you carry into your first month?",
  },
  "A Note from Shira Lasry": {
    whyItMatters: "Operations is your closest partner. Shira's framing is the bar you'll be measured against day-to-day.",
    whatToDo: "Read Shira's letter end-to-end. Underline one expectation that surprised you and one phrase you want to use with your team.",
    completionEvidence: "Bring your underlined expectation and phrase to your first mentor check-in.",
    reflectionPrompt: "What's one operational habit Shira described that you do not yet have — and how will you build it?",
  },

  /* ---------- Day 2 — Understanding Blossom Operations ---------- */
  "Company Structure": {
    description:
      "How Blossom is organized: leadership, operations, state directors, departments, and the lines of accountability between them.",
    whyItMatters:
      "You can only escalate well if you know who owns what. The org is not bureaucracy — it's the map of accountability you will use every day.",
    whatToDo:
      "Read the org overview. Draw the chart from memory. Mark the two people you will work with most this week and the two you would loop in for an escalation.",
    completionEvidence:
      "Share your drawn chart and the four named people with your mentor. Confirm the escalation lanes are correct.",
    reflectionPrompt:
      "Who owns the decision when a clinical issue, a staffing issue, and a billing issue collide on the same client?",
  },
  "Department Overview": {
    description:
      "What each Blossom department does, what they need from you, and what you should expect from them.",
    whyItMatters:
      "A State Director succeeds by partnering well, not by doing every department's work. Knowing each department's promise prevents you from over-functioning.",
    whatToDo:
      "Walk through each department: Intake, Authorizations, Scheduling, Recruiting, QA, Billing. For each, write one sentence on what they own and one sentence on what you need from them in Week 1.",
    completionEvidence:
      "Share your one-pager (six departments × two sentences) with your mentor.",
    reflectionPrompt:
      "Which department do you most want to over-function in? What will you do instead?",
  },
  "State Director Role Overview": {
    description:
      "The real shape of the State Director role: what you own, what you do not own, and how success is measured.",
    whyItMatters:
      "Most new directors fail by trying to do every department's job. Clarity on your role is the first form of operational discipline.",
    whatToDo:
      "Read the State Director Role & Responsibilities SOP. Write 'I own…' and 'I do not own…' in two columns. Bring both to your mentor.",
    completionEvidence:
      "Two-column role map reviewed and confirmed with your mentor.",
    reflectionPrompt:
      "Which item on your 'I do not own' list will be hardest for you to leave alone?",
  },
  "Leadership Expectations": {
    description:
      "What Blossom leadership expects from a State Director: rhythm, communication, follow-through, and operational tone.",
    whyItMatters:
      "Expectations that are not spoken are still expected. Knowing the bar early prevents the slow drift that costs new directors their first 90 days.",
    whatToDo:
      "Read the Leadership Expectations SOP. Identify one expectation you already meet, one you'll need to grow into, and one question to ask leadership about.",
    completionEvidence:
      "Share your three items with your mentor and book a 15-minute conversation with your reporting leader to confirm understanding.",
    reflectionPrompt:
      "What's the difference between meeting an expectation and modeling it for your team?",
  },

  /* ---------- Day 3 — Blossom Ecosystem ---------- */
  "Intake Department": {
    description:
      "How leads enter Blossom, how Intake moves them to active clients, and where the workflow tends to stall.",
    whyItMatters:
      "Intake is the front door. Anything stuck here becomes a family without care and revenue you never see. As a State Director, you are the unblocker.",
    whatToDo:
      "Open the lead pipeline for your state. Identify any lead aged more than 5 days in a single stage. Read the Intake Department Operations SOP. Sit with the Intake Coordinator for 20 minutes.",
    completionEvidence:
      "Name the Intake owner in your state, list the top two stuck-points you saw, and bring both to your mentor check-in.",
    reflectionPrompt:
      "What's one signal that a lead is about to fall out of the pipeline — and what's your move when you see it?",
  },
  "Authorizations Department": {
    description:
      "How authorizations get drafted, submitted, approved, and renewed — and where revenue is most at risk.",
    whyItMatters:
      "An expired auth means a child loses sessions. You are not the submitter — you are the person who makes sure no one loses hours because of a delay you could have caught.",
    whatToDo:
      "Open the Authorizations board for your state. Find every auth expiring in the next 30 days. Read the Authorizations Department Operations SOP. Sit with the Authorization Coordinator for 30 minutes.",
    completionEvidence:
      "Capture: number of expiring auths, the named owner, and any auth currently missing a PR. Bring to mentor check-in.",
    reflectionPrompt:
      "What's the latest you would let an authorization sit in 'awaiting submission' before you personally walk to the coordinator's desk?",
  },
  "Scheduling Department": {
    description:
      "How schedules are built, how coverage holds together, and how cancellations are absorbed without losing hours.",
    whyItMatters:
      "A clean schedule is a calm state. Cancellations and coverage gaps are operational signals, not just inconveniences.",
    whatToDo:
      "Open the calendar for your state. Spot one empty recurring slot and one repeat-cancellation client. Read the Scheduling Department Operations SOP. Sit with the Scheduler for 20 minutes.",
    completionEvidence:
      "List the top three coverage risks you saw and bring them to mentor check-in.",
    reflectionPrompt:
      "When a family cancels three weeks in a row, what's the difference between a scheduling fix and a retention conversation?",
  },
  "Recruiting Department": {
    description:
      "How candidates move from sourcing to start date, and how recruiting health drives staffing health.",
    whyItMatters:
      "You cannot staff a growing state without a healthy pipeline. Empty roles become empty schedules become lost hours.",
    whatToDo:
      "Open the recruiting board for your state. Count candidates per stage. Read the Recruiting Department Operations SOP. Sit with the Recruiter for 20 minutes.",
    completionEvidence:
      "Name the recruiter, list current pipeline health (sourced/screened/interview/offer), and identify the slowest stage.",
    reflectionPrompt:
      "If you had to fill one role in 14 days, what's the first move and who is your partner?",
  },
  "QA Department": {
    description:
      "How QA reviews authorizations, treatment plans, progress reports, and clinical compliance — and what they need from you.",
    whyItMatters:
      "Quality control is what keeps care defensible and revenue collectable. A State Director who ignores QA pays for it at month-end.",
    whatToDo:
      "Open the QA queue for your state. Note any items aged more than 5 days. Read the Quality Assurance Department Operations SOP. Sit with QA for 20 minutes.",
    completionEvidence:
      "Name the QA reviewer for your state, list one current QA bottleneck, and bring both to mentor check-in.",
    reflectionPrompt:
      "What's the difference between catching a QA issue and preventing the next one?",
  },
  "Billing Department": {
    description:
      "How sessions become claims, where revenue gets stuck, and the operational signals a State Director should watch.",
    whyItMatters:
      "Operational issues — missed conversions, missing notes, unclean auths — show up as denied claims weeks later. The fastest way to protect revenue is to protect operations now.",
    whatToDo:
      "Skim the latest Billing report for your state. Identify one denial pattern. Read the Billing Department Operations SOP. Sit with Billing for 15 minutes.",
    completionEvidence:
      "Name the Billing partner for your state, the top denial pattern, and the operational root cause.",
    reflectionPrompt:
      "Which Week 1 operational habit (auths, scheduling, QA) will most reduce next month's denials?",
  },

  /* ---------- Day 4 — Communication & Accountability ---------- */
  "Communication Standards": {
    description:
      "How Blossom expects State Directors to write, escalate, document, and follow up.",
    whyItMatters:
      "Tone is operational. Calm, specific, time-bound communication keeps a state from sliding into noise and panic.",
    whatToDo:
      "Read the Communication Standards & Professional Expectations SOP. Audit your last five operational messages: were they clear, owned, and time-bound? Rewrite any that were not.",
    completionEvidence:
      "Share your before/after rewrites with your mentor and adopt the standard format going forward.",
    reflectionPrompt:
      "What's one communication habit from a past role you need to leave behind?",
  },
  "Escalation Structure": {
    description:
      "When to escalate, to whom, with what information, and how to keep escalations from becoming alarms.",
    whyItMatters:
      "Escalations done poorly create panic. Escalations done well create speed. The State Director is the calibrator.",
    whatToDo:
      "Read the Operational Escalation Management SOP. Map the escalation path for: a clinical concern, a staffing gap, a revenue risk, and a parent complaint. Confirm with your mentor.",
    completionEvidence:
      "Four mapped escalation paths reviewed with your mentor and stored in your personal SD playbook.",
    reflectionPrompt:
      "When should you escalate before you have all the answers?",
  },
  "Accountability Expectations": {
    description:
      "What accountability looks like inside Blossom — how it is set, tracked, and reinforced without becoming punitive.",
    whyItMatters:
      "Accountability is the operating system. Without it, SOPs and dashboards are decoration.",
    whatToDo:
      "Read the Accountability & Performance Ownership SOP. Identify one item in your state that does not currently have a named owner. Assign it (or flag it to your mentor for assignment).",
    completionEvidence:
      "One previously-unowned item now has a named owner, an action, and a check-back date.",
    reflectionPrompt:
      "What's the difference between holding someone accountable and giving them clarity?",
  },
  "Operational Ownership": {
    description:
      "What it means to operationally own a state — the rhythm, the visibility, and the personal standard.",
    whyItMatters:
      "Ownership is not a title. It's the willingness to know the state's real numbers before anyone asks.",
    whatToDo:
      "Read the State Director Operational Ownership SOP. Write your one-page state health summary as if leadership were asking for it on Friday. Identify what you do not yet know.",
    completionEvidence:
      "Submit your state health draft to your mentor with a list of the data gaps you need to close in Week 2.",
    reflectionPrompt:
      "If your reporting leader called you on Friday and asked 'how is the state?' — what's your honest 60-second answer?",
  },

  /* ---------- Day 5 — The Winning State Philosophy ---------- */
  "Data Integrity": {
    description:
      "Why a single source of truth matters and how to protect it across CentralReach, Blossom OS, and team workflows.",
    whyItMatters:
      "If the data is wrong, every decision after it is wrong. Defending data integrity is a daily leadership act, not an IT problem.",
    whatToDo:
      "Read the Data Integrity & Source of Truth Management SOP. Find one data inconsistency in your state (e.g., session converted in one system, missing in another). Trace it to the source.",
    completionEvidence:
      "Document the inconsistency, the root cause, and the fix. Share with mentor.",
    reflectionPrompt:
      "Which system is your source of truth for clients, schedules, and auths — and what do you do when two systems disagree?",
  },
  "Utilization Mindset": {
    description:
      "Why utilization is the heartbeat of a healthy state and how to think about it as a clinical, family, and operational signal.",
    whyItMatters:
      "Utilization is not just a revenue metric. Low utilization usually means a family is not getting consistent care.",
    whatToDo:
      "Read the Utilization Management Philosophy SOP. Pull your state's utilization snapshot. Identify three clients below 80% and one pattern (pairing, scheduling, parent availability).",
    completionEvidence:
      "Three named clients, a pattern, and a proposed first move shared with mentor.",
    reflectionPrompt:
      "When utilization drops, what's the first conversation you have — and with whom?",
  },
  "State Ownership": {
    description:
      "What it means to own your state end-to-end: visibility, rhythm, decisions, and standards.",
    whyItMatters:
      "By Week 5 leadership expects you to own your state. Week 1 is when you decide what 'owning it' means to you.",
    whatToDo:
      "Read the State Ownership Framework SOP. Write your personal definition of ownership for: families, staff, revenue, and quality. Compare to the framework.",
    completionEvidence:
      "Personal ownership statement reviewed with mentor and stored in your SD playbook.",
    reflectionPrompt:
      "What's one thing you will not delegate, no matter how busy you get?",
  },
  "Operational Leadership Philosophy": {
    description:
      "The leadership philosophy that makes a State Director effective at Blossom: calm, clear, consistent, accountable.",
    whyItMatters:
      "Your team will mirror your operating temperature. Calm under pressure is a skill, not a personality trait — and it is the most important one in this role.",
    whatToDo:
      "Read the Operational Leadership Philosophy SOP. Write one paragraph on how you intend to lead under pressure. Share with your mentor.",
    completionEvidence:
      "Leadership paragraph stored in your SD playbook and revisited at the 90-day mark.",
    reflectionPrompt:
      "What does 'calm under pressure' look like in your behavior on a hard day?",
  },
};

/* ============================================================
 * Full curated SDFullContent for every Week 1 module
 * Keyed by generated module id: sd-w1d{day}-{slug}
 * ============================================================ */

function step(action: string, lookFor: string, owner: string, escalation?: string) {
  return escalation ? { action, lookFor, owner, escalation } : { action, lookFor, owner };
}

function quiz(idBase: string, items: Array<{ q: string; opts: string[]; answer: number }>) {
  return items.map((it, i) => ({
    id: `${idBase}-q${i + 1}`,
    question: it.q,
    options: it.opts,
    answerIndex: it.answer,
  }));
}

export const SD_W1_FULL_CONTENT: Record<string, SDFullContent> = {
  /* ---------- Day 1 (extras — welcome-video & mission-vision already curated) ---------- */

  "sd-w1d1-core-values": {
    learningObjective:
      "Translate Blossom's six core values into specific operational behaviors you will model in Week 1.",
    stateDirectorLens:
      "Your team will learn the values by watching your decisions, not by reading the deck. Pick a value and live it for a week — that's how culture spreads.",
    stepByStep: [
      step("Read all six core values end-to-end.", "Pick the value that comes most naturally and the one that will require the most discipline.", "You"),
      step("Write one concrete behavior you will model for each value this week.", "Behaviors must be observable — 'communicate clearly' is not a behavior; 'name owner + due date in every escalation' is.", "You"),
      step("Share your two chosen values (natural + disciplined) with your mentor.", "Mentor will help you spot the value your team will most need from you first.", "Mentor"),
      step("Use your disciplined value in a real meeting this week.", "Your team should notice the language shift by week 3.", "You"),
      step("Re-read the values at the 30-day mark.", "Most directors hear different things the second time.", "You"),
    ],
    sop: {
      purpose: "Make Blossom's values operational at the state level by modeling them in daily decisions.",
      owner: "State Director Program",
      inputs: ["Core values list", "A current operational decision you're facing"],
      process: [
        "Read each value.",
        "Identify natural + disciplined value.",
        "Convert each value into one observable behavior.",
        "Confirm with mentor.",
        "Practice in a real meeting this week.",
      ],
      escalationTriggers: [
        "If a value is repeatedly violated in your state and you cannot get traction, raise it with your mentor and Operations Leadership.",
      ],
      qualityStandard: "Each value has one observable behavior you can be coached on.",
      reviewRhythm: "Quarterly with mentor; revisited during readiness review.",
    },
    scenario: {
      situation:
        "A BCBA delivers feedback to an RBT in a way that lands as harsh in front of a family. The RBT is upset and the family noticed.",
      prompt: "Which value do you anchor your response in, and what are the first three moves?",
      expectedResponse:
        "Anchor in 'Clear Communication' and 'Team Support.' First: speak privately with the BCBA same day, name what you observed, and reset expectation. Second: check in with the RBT. Third: follow up with the family with a calm, brief acknowledgement. Document the conversation in 24 hours.",
      escalationPath:
        "If the BCBA pushes back or the pattern repeats, loop in QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d1-core-values", [
      { q: "How do values become real at the state level?", opts: ["By framing them on the wall.", "Through observable behaviors the State Director models repeatedly.", "By repeating them in every email."], answer: 1 },
      { q: "What should you do with the value that requires the most discipline for you?", opts: ["Avoid it until you're more senior.", "Choose one observable behavior and practice it this week.", "Delegate it to your mentor."], answer: 1 },
    ]),
  },

  "sd-w1d1-meet-the-team": {
    learningObjective:
      "Know who owns what across Blossom and identify the first three department partners you will rely on in Week 1.",
    stateDirectorLens:
      "Speed comes from knowing who to call. Every hour you spend learning the org now saves a day later.",
    stepByStep: [
      step("Open the team directory and read the org overview.", "Leadership, operations, department leads, mentors, and peer State Directors.", "You"),
      step("Identify your mentor and your reporting leader.", "Confirm cadence and channel (calendar invite, Slack, email).", "You"),
      step("Pick three department leads you'll work with most in Week 1.", "Likely: Intake, Authorizations, Scheduling.", "You"),
      step("Send a short intro to each (3-4 sentences, one question).", "Tone: warm, specific, and brief.", "You"),
      step("Save the directory in your SD playbook and check back at week 4.", "Most directors discover new partners by week 4.", "You"),
    ],
    sop: {
      purpose: "Build a working map of accountability so the new State Director can route issues to the right owner from day one.",
      owner: "State Director Program",
      inputs: ["Team directory", "Org chart", "Mentor calendar slot"],
      process: [
        "Read team directory.",
        "Confirm mentor + reporting leader.",
        "Identify three Week 1 department partners.",
        "Send three brief intros.",
        "Store directory in personal SD playbook.",
      ],
      escalationTriggers: [
        "If you cannot identify a clear owner for a department in your state, raise it with your mentor same day.",
      ],
      qualityStandard: "You can name the owner of every department your state touches.",
      reviewRhythm: "Re-validate at 30, 60, and 90 days.",
    },
    scenario: {
      situation:
        "A family calls you directly about an authorization concern. You're not sure if Authorizations or Intake should respond.",
      prompt: "How do you route the issue without dropping the family?",
      expectedResponse:
        "Thank the family, give them a clear timeline ('I'll have a named person back to you by end of day'), then ping both the Authorization Coordinator and Intake Coordinator in one message asking which one owns it. Once confirmed, the owner replies directly to the family and copies you.",
      escalationPath: "If neither department picks it up within 4 hours, escalate to Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d1-meet-the-team", [
      { q: "Why is knowing the org chart an operational skill, not a courtesy?", opts: ["So you look prepared in meetings.", "Because routing speed determines how fast problems get solved.", "So you can name-drop leadership."], answer: 1 },
      { q: "What's the first move when you don't know who owns an issue?", opts: ["Solve it yourself.", "Give the family a clear timeline, then ping both likely owners in one message.", "Wait for the next stand-up."], answer: 1 },
    ]),
  },

  "sd-w1d1-how-blossom-works": {
    learningObjective:
      "Describe the end-to-end Blossom flow (Lead → Active → Renewal) and name the three handoff points most likely to break.",
    stateDirectorLens:
      "You are not the owner of any single step. You are the owner of the flow. The handoffs between departments are where most operational issues live.",
    stepByStep: [
      step("Read the 11-step Blossom flow once.", "Notice each handoff — who passes the work to whom.", "You"),
      step("Draw the flow from memory.", "Gaps in your drawing are gaps in your understanding.", "You"),
      step("Mark the three handoffs you think are most likely to break in your state.", "Common: Intake → VOB, Assessment → Auth, Auth → Scheduling.", "You"),
      step("Walk one real client end-to-end with your mentor.", "Real examples expose where the SOP differs from reality.", "Mentor"),
      step("Add the three handoff risks to your personal SD watch list.", "Revisit weekly until they feel under control.", "You"),
    ],
    sop: {
      purpose: "Give the State Director a working mental model of how a client moves through Blossom so they can see where the flow is healthy and where it's stuck.",
      owner: "State Director Program",
      inputs: ["Blossom flow diagram", "One real client journey", "Mentor walkthrough slot"],
      process: [
        "Read the flow.",
        "Draw it from memory.",
        "Mark three handoff risks.",
        "Walk one client end-to-end with mentor.",
        "Add risks to weekly watch list.",
      ],
      escalationTriggers: [
        "If a real client is stuck at a handoff longer than the SOP allows, name the owner and unblock same day.",
      ],
      qualityStandard: "State Director can describe the flow in 2 minutes and name the three highest-risk handoffs in their state.",
      reviewRhythm: "Reviewed weekly until Week 5 readiness check.",
    },
    scenario: {
      situation:
        "A client has a completed assessment from 9 days ago but no authorization has been submitted yet. The BCBA assumes Authorizations has it. Authorizations is waiting on the BCBA.",
      prompt: "What's wrong with the handoff, and what do you do?",
      expectedResponse:
        "The handoff has no named owner of the next move. Get both parties on a 15-minute call. Confirm what Authorizations is missing, who will provide it, and when. Set a check-back time. Update the client timeline so the next person sees the handoff clearly.",
      escalationPath:
        "If similar handoff confusion happens again the same week, raise it as a process gap to Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d1-how-blossom-works", [
      { q: "Where do most operational issues live in the Blossom flow?", opts: ["Inside a single department's work.", "At the handoffs between departments.", "In the dashboards."], answer: 1 },
      { q: "What's the State Director's primary job in the flow?", opts: ["Personally perform every step.", "Own the health of the flow and unblock stuck handoffs.", "Track completion percentages."], answer: 1 },
    ]),
  },

  "sd-w1d1-welcome-from-chad-kaufman": {
    learningObjective:
      "Internalize the company-level expectations the CEO has for new State Directors.",
    stateDirectorLens:
      "Chad's letter is the company's voice. The phrases he uses are the phrases your team should hear from you.",
    stepByStep: [
      step("Read the letter end-to-end without skimming.", "Notice the words Chad repeats. Those become your operating language.", "You"),
      step("Underline one sentence that resonates and one expectation that surprised you.", "Surprise is data — it tells you where you have growth.", "You"),
      step("Share your underlined sentence with your mentor.", "Mentor will help you connect it to your first 30 days.", "Mentor"),
      step("Re-read the letter at the 90-day mark.", "Most directors hear different things the second time.", "You"),
      step("Use one of Chad's phrases in a real conversation this week.", "Your team should hear leadership's voice through yours.", "You"),
    ],
    sop: {
      purpose: "Anchor every new State Director in the company-level expectations and tone leadership has set.",
      owner: "State Director Program",
      inputs: ["CEO welcome letter", "Mentor check-in slot"],
      process: ["Read the letter.", "Underline one sentence + one surprise.", "Share with mentor.", "Re-read at 90 days.", "Use leadership language in a real meeting."],
      escalationTriggers: ["If anything in the letter contradicts what you're being asked to do in-state, raise it with your mentor."],
      qualityStandard: "State Director can name two expectations from the CEO letter that shape how they work.",
      reviewRhythm: "Re-read at 90 days and 12 months.",
    },
    scenario: {
      situation: "Your team asks you in a stand-up: 'Why does Blossom do it this way?'",
      prompt: "How do you answer in 60 seconds using leadership's actual language?",
      expectedResponse:
        "Use Chad's framing: families come to us at important moments and we exist to make that experience supported, not confusing. Then connect it to the specific decision being questioned. Tone over policy.",
      escalationPath: "If the team's pushback persists, bring it to your mentor before the next stand-up.",
    },
    knowledgeCheck: quiz("sd-w1d1-welcome-from-chad-kaufman", [
      { q: "What does Chad expect a new State Director to know on day one?", opts: ["Everything.", "How to learn the system, ask good questions, and follow through.", "How to fix all operational problems."], answer: 1 },
      { q: "What is the operational use of leadership's language?", opts: ["Decoration.", "It becomes the operating language of your state.", "Compliance signaling."], answer: 1 },
    ]),
  },

  "sd-w1d1-a-note-from-shira-lasry": {
    learningObjective:
      "Understand the operational leadership rhythm Director of Operations expects from State Directors.",
    stateDirectorLens:
      "Shira is your closest operational partner. The habits she names in this letter are the habits she will look for in your first 90 days.",
    stepByStep: [
      step("Read the letter end-to-end.", "Notice the verbs: name, assign, follow up, fix, support. Those are operational behaviors.", "You"),
      step("Pick one habit Shira describes that you do not yet have.", "Be honest. Pretending you already do it is the fastest way to fail.", "You"),
      step("Write one concrete plan for building that habit in 30 days.", "Plan must be observable: a meeting cadence, a checklist, a recurring review.", "You"),
      step("Share your habit and plan with your mentor.", "Mentor will help you make it real, not aspirational.", "Mentor"),
      step("Revisit at 30 days.", "If the habit hasn't stuck, redesign it — don't restart it.", "You"),
    ],
    sop: {
      purpose: "Translate the DOO's leadership philosophy into one observable habit each new State Director will build in their first 30 days.",
      owner: "State Director Program",
      inputs: ["DOO welcome letter", "Mentor check-in slot"],
      process: ["Read the letter.", "Identify one missing habit.", "Write a 30-day plan.", "Share with mentor.", "Review at 30 days."],
      escalationTriggers: ["If you cannot find time to build the habit, raise it — that is the operational issue."],
      qualityStandard: "One named habit, one written plan, one mentor sign-off.",
      reviewRhythm: "30-day check and 90-day readiness review.",
    },
    scenario: {
      situation: "Your week is full and the only thing slipping is the operational habit you committed to building.",
      prompt: "What do you do?",
      expectedResponse:
        "Name it out loud to your mentor — don't quietly drop it. Either redesign the habit so it fits the week, or move something off your plate. Operational leaders model the behavior they ask of their teams: when something is stuck, we name it.",
      escalationPath: "Persistent inability to make space for operational habits = mentor + reporting leader conversation.",
    },
    knowledgeCheck: quiz("sd-w1d1-a-note-from-shira-lasry", [
      { q: "What's the deeper skill of State Director leadership?", opts: ["Knowing every SOP.", "Keeping a state moving without creating panic.", "Reporting numbers up."], answer: 1 },
      { q: "What do you do when something is stuck?", opts: ["Wait for it to resolve.", "Name it, assign it, set a check-back.", "Escalate immediately."], answer: 1 },
    ]),
  },

  /* ---------- Day 2 — Understanding Blossom Operations ---------- */

  "sd-w1d2-company-structure": {
    learningObjective: "Map Blossom's organizational structure and identify the four people you will most rely on in Week 1.",
    stateDirectorLens: "The org chart is your map of accountability. Escalating well requires knowing exactly who owns the next decision.",
    stepByStep: [
      step("Read the Understanding Blossom Organizational Structure SOP end-to-end.", "Leadership tier, operations tier, state directors, departments, and the lines between them.", "You"),
      step("Draw the chart from memory.", "Gaps in your drawing are gaps in your operational map.", "You"),
      step("Mark the two people you will work with most this week.", "Likely: mentor + reporting leader.", "You"),
      step("Mark the two people you would loop in for an escalation.", "Operations Leadership + relevant department lead.", "You", "If you cannot identify a clear owner, raise it to your mentor same day."),
      step("Save the chart in your personal SD playbook.", "Revisit at 30 and 90 days.", "You"),
    ],
    sop: {
      purpose: "Give the State Director a working map of accountability so they can route every issue to the right owner from day one.",
      owner: "State Director Program",
      inputs: ["Org chart", "Team directory", "Understanding Blossom Organizational Structure SOP"],
      process: ["Read the org SOP.", "Draw the chart from memory.", "Mark Week 1 partners.", "Mark escalation lanes.", "Confirm with mentor."],
      escalationTriggers: ["Any escalation that cannot find an owner within 4 hours."],
      qualityStandard: "State Director can name the owner of every department, decision, and escalation lane their state touches.",
      reviewRhythm: "Re-validate at 30 and 90 days, and after any org change.",
    },
    scenario: {
      situation: "A clinical concern, a staffing gap, and a billing risk land on the same client in the same week.",
      prompt: "Who owns each decision, and how do you sequence the response?",
      expectedResponse:
        "Clinical → BCBA + QA lead. Staffing → Recruiter/Scheduler. Billing → Billing partner. State Director owns the sequencing: protect care first (clinical), then protect continuity (staffing), then protect revenue (billing). Run a 15-minute alignment call with named owners and one check-back time.",
      escalationPath: "Loop in Operations Leadership if any thread is unowned after 24 hours.",
    },
    knowledgeCheck: quiz("sd-w1d2-company-structure", [
      { q: "What's the operational use of the org chart?", opts: ["A formality.", "A map of accountability that decides where each issue should go.", "An onboarding deck."], answer: 1 },
      { q: "What's the right move when multiple owners might own an issue?", opts: ["Pick one and hope.", "Name the most likely owner, ping both, and confirm in writing.", "Send it to leadership."], answer: 1 },
    ]),
  },

  "sd-w1d2-department-overview": {
    learningObjective: "Describe what each Blossom department owns, what they need from a State Director, and what to expect from them.",
    stateDirectorLens: "State Directors succeed by partnering, not by doing every department's work. Knowing each department's promise prevents you from over-functioning.",
    stepByStep: [
      step("Read the Department Functions & Operational Ecosystem SOP.", "Each department's mission, deliverables, and named owner.", "You"),
      step("For each of the six departments, write one sentence on what they own.", "Intake, Authorizations, Scheduling, Recruiting, QA, Billing.", "You"),
      step("For each, write one sentence on what you need from them in Week 1.", "Be specific — 'visibility into expiring auths,' not 'communication.'", "You"),
      step("Share the six-department one-pager with your mentor.", "Mentor calibrates expectations against reality.", "Mentor"),
      step("Schedule a 15-minute intro with at least three department leads.", "Build relationships before you need them.", "You"),
    ],
    sop: {
      purpose: "Establish a shared understanding of department boundaries so State Directors know who owns what and what to ask for.",
      owner: "Operations Leadership",
      inputs: ["Department Functions & Operational Ecosystem SOP", "Department leads directory"],
      process: ["Read SOP.", "Write owns/needs per department.", "Confirm with mentor.", "Schedule intros.", "Store in SD playbook."],
      escalationTriggers: ["If a department's actual operations don't match the SOP, raise it to Operations Leadership."],
      qualityStandard: "State Director can describe each department's promise in one sentence and name its owner.",
      reviewRhythm: "Reviewed after any department reorganization.",
    },
    scenario: {
      situation: "A BCBA asks you to personally chase an authorization because 'Authorizations is too slow.'",
      prompt: "What's the right response?",
      expectedResponse:
        "Decline to do the work — but commit to unblocking it. Ask the BCBA for the specifics, then call the Authorization Coordinator and ask what's missing. If the coordinator needs information, get it from the BCBA. Document the conversation. If the pattern repeats, raise it as a department capacity issue, not a personal favor.",
      escalationPath: "Recurring 'go around the department' requests = mentor + Operations Leadership conversation.",
    },
    knowledgeCheck: quiz("sd-w1d2-department-overview", [
      { q: "When a team member asks you to do another department's work, what's the right move?", opts: ["Do it to be helpful.", "Decline to do it, commit to unblocking it.", "Tell them to handle it themselves."], answer: 1 },
      { q: "What's the operational risk of over-functioning across departments?", opts: ["None — it shows initiative.", "You become the bottleneck and departments stop owning their work.", "Leadership rewards it."], answer: 1 },
    ]),
  },

  "sd-w1d2-state-director-role-overview": {
    learningObjective: "Define what a State Director owns, what they do not own, and how success is measured at Blossom.",
    stateDirectorLens: "Most new directors fail by trying to do every job. Clarity on your role is the first form of operational discipline.",
    stepByStep: [
      step("Read the State Director Role & Responsibilities SOP end-to-end.", "What you own, what you do not own, and how performance is measured.", "You"),
      step("Write two columns: 'I own' and 'I do not own.'", "Be specific. Vague ownership = no ownership.", "You"),
      step("Identify the item on 'I do not own' that will be hardest to leave alone.", "That's your discipline focus for Week 1.", "You"),
      step("Share both columns with your mentor.", "Mentor calibrates against how the role is actually run.", "Mentor"),
      step("Revisit the role map at the 30-day mark.", "Most directors discover they over-claimed something.", "You"),
    ],
    sop: {
      purpose: "Establish the boundaries of the State Director role so the new director can lead through ownership, not through doing.",
      owner: "State Director Program",
      inputs: ["State Director Role & Responsibilities SOP", "Mentor calendar slot"],
      process: ["Read role SOP.", "Build two-column role map.", "Identify discipline focus.", "Confirm with mentor.", "Re-validate at 30 days."],
      escalationTriggers: ["If you're asked to own something not in the SOP, surface it to your mentor before saying yes."],
      qualityStandard: "State Director can describe their role boundaries clearly in 60 seconds.",
      reviewRhythm: "30-day, 90-day, and at any role expansion.",
    },
    scenario: {
      situation: "Leadership informally asks you to start running a workflow that belongs to another department.",
      prompt: "What's your response?",
      expectedResponse:
        "Acknowledge the ask. Reflect on whether it's a true role expansion or a temporary stretch. Bring it to your mentor before committing. If it's a stretch, set a clear time-box and re-evaluation date so the temporary doesn't become permanent.",
      escalationPath: "Always confirm role changes in writing with your reporting leader.",
    },
    knowledgeCheck: quiz("sd-w1d2-state-director-role-overview", [
      { q: "What's the first form of operational discipline for a State Director?", opts: ["Working long hours.", "Clarity on what you own vs. don't own.", "Reading every SOP."], answer: 1 },
      { q: "What should you do when asked to take on work outside your role?", opts: ["Say yes to be helpful.", "Acknowledge, confirm with mentor, time-box if temporary.", "Refuse immediately."], answer: 1 },
    ]),
  },

  "sd-w1d2-leadership-expectations": {
    learningObjective: "Name the leadership expectations Blossom holds for State Directors and identify your personal growth edge.",
    stateDirectorLens: "Unspoken expectations are still expected. Knowing the bar early prevents the slow drift that costs new directors their first 90 days.",
    stepByStep: [
      step("Read the Leadership Expectations for State Directors SOP.", "Rhythm, communication, follow-through, operational tone.", "You"),
      step("Identify one expectation you already meet.", "Confidence comes from naming your strengths honestly.", "You"),
      step("Identify one expectation you'll need to grow into.", "That's your Week 1 development focus.", "You"),
      step("Write one question to ask your reporting leader.", "Clarifying expectations early is leadership, not weakness.", "You"),
      step("Book a 15-minute alignment conversation with your reporting leader.", "Confirm understanding before Week 2.", "You"),
    ],
    sop: {
      purpose: "Make leadership expectations explicit so the new State Director can measure themselves against the right bar.",
      owner: "Operations Leadership",
      inputs: ["Leadership Expectations SOP", "Reporting leader calendar slot"],
      process: ["Read expectations.", "Identify strength + growth edge.", "Write one clarifying question.", "Confirm with reporting leader.", "Revisit at 30 days."],
      escalationTriggers: ["If expectations feel contradictory between mentor and reporting leader, raise it for alignment."],
      qualityStandard: "State Director can recite leadership expectations and self-assess against them.",
      reviewRhythm: "Reviewed at every quarterly check-in.",
    },
    scenario: {
      situation: "Three weeks in, a leadership member gives you feedback that contradicts an instruction your mentor gave you.",
      prompt: "How do you handle the contradiction without becoming defensive?",
      expectedResponse:
        "Acknowledge both perspectives without picking sides in the moment. Ask the leadership member to clarify the priority. Then bring it to your mentor and align. Reset expectations in writing if needed. Disagreement is data — handle it calmly.",
      escalationPath: "Repeated contradictions = escalate to Operations Leadership for alignment.",
    },
    knowledgeCheck: quiz("sd-w1d2-leadership-expectations", [
      { q: "What's the cost of unspoken expectations?", opts: ["Nothing — leaders should infer them.", "Slow drift that costs new directors their first 90 days.", "Increased autonomy."], answer: 1 },
      { q: "What's the right move when expectations contradict each other?", opts: ["Pick the one you like best.", "Surface the contradiction calmly and align in writing.", "Ignore both."], answer: 1 },
    ]),
  },

  /* ---------- Day 3 — Blossom Ecosystem ---------- */

  "sd-w1d3-intake-department": {
    learningObjective: "Trace the intake workflow from lead to active client and name the two stuck-points most common in your state.",
    stateDirectorLens: "Intake is the front door. A stuck lead is a family without care and revenue you'll never see. Your job is to unblock fast.",
    stepByStep: [
      step("Open the lead pipeline for your state in Blossom OS.", "Leads aged > 5 days in any stage — those are at risk.", "State Director"),
      step("Read the Intake Department Operations SOP.", "Owner, SLA, hand-off points to VOB and Scheduling.", "You"),
      step("Sit with the Intake Coordinator for 20 minutes.", "What does their real day look like? Where do they get stuck?", "Intake Coordinator"),
      step("Trace one stuck lead end-to-end with the coordinator.", "Find the actual hand-off that's failing.", "Intake Coordinator", "If lead is stuck > 7 days with no owner, escalate to Operations Leadership."),
      step("Document the two most common stuck-points in your state.", "Bring both to the weekly state meeting with named owners.", "State Director"),
    ],
    sop: {
      purpose: "Move every qualified family from lead to active treatment with no avoidable delay.",
      owner: "Intake Coordinator (Operations Leadership oversight)",
      inputs: ["Lead pipeline (Blossom OS)", "Intake Department Operations SOP", "Phone/email queue"],
      process: [
        "Capture and qualify lead within 24 hours.",
        "Move to VOB inside SLA.",
        "Hand off cleanly to Assessment scheduling.",
        "Update lead pipeline at every state change.",
        "Flag any lead aged > 5 days in a single stage.",
      ],
      escalationTriggers: [
        "Lead aged > 7 days without owner movement.",
        "Family unreachable > 3 contact attempts.",
        "Insurance mismatch blocking VOB.",
      ],
      qualityStandard: "< 5% of active leads aged > 5 days in any stage. Every lead has a named owner.",
      reviewRhythm: "Daily quick-look. Weekly review in state operations meeting.",
    },
    scenario: {
      situation: "A family called twice last week and never got a callback. They're now considering a competitor.",
      prompt: "What do you do in the next two hours?",
      expectedResponse:
        "Call the family yourself within the next hour. Apologize specifically, not vaguely. Get them on the next available step (VOB, assessment, whatever's next). Then sit with Intake and find out why the callback was missed — is it volume, owner, or process? Document the recovery and the root cause.",
      escalationPath: "If this pattern is showing up more than once a week, raise it as a capacity issue with Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d3-intake-department", [
      { q: "What's the most common signal a lead is about to fall out of the pipeline?", opts: ["The family stops calling.", "It ages > 5 days in a single stage without owner movement.", "The coordinator looks tired."], answer: 1 },
      { q: "What's your role when a lead is stuck?", opts: ["Personally close the lead.", "Find the hand-off that broke and unblock it.", "Wait for Intake to fix it."], answer: 1 },
    ]),
  },

  "sd-w1d3-authorizations-department": {
    learningObjective: "Understand how Authorizations operates and identify any expiring auths in your state right now.",
    stateDirectorLens: "Auths are revenue and care continuity. Your job is to make sure no client ever loses hours because of a delay you could have caught.",
    stepByStep: [
      step("Open the Authorizations board for your state.", "Auths in Awaiting Submission and Expiring within 30 days.", "State Director"),
      step("Read the Authorizations Department Operations SOP.", "Lifecycle, owner, SLAs, escalation triggers.", "You"),
      step("Sit with the Authorization Coordinator for 30 minutes.", "Walk one auth end-to-end: draft → submit → approve → utilize.", "Authorization Coordinator"),
      step("Identify any auth missing a Progress Report.", "PR missing = submission blocked = potential lapse.", "Authorization Coordinator", "Auth within 14 days of expiration without PR → escalate same day."),
      step("Document expiring auths + named owners in your weekly state meeting agenda.", "Make it visible weekly until under control.", "State Director"),
    ],
    sop: {
      purpose: "Protect treatment continuity and revenue by keeping every authorization current and submitted on time.",
      owner: "Authorization Coordinator (Authorizations Lead oversight)",
      inputs: ["Authorization status board", "Progress Reports", "Insurance portal access"],
      process: [
        "Track every auth by status and expiration date.",
        "Submit at least 30 days before expiration.",
        "Confirm approval and log in CR.",
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
      situation: "It's Friday at 4pm. Two clients have auths expiring Sunday and no PR has been submitted.",
      prompt: "What do you do in the next hour?",
      expectedResponse:
        "Call the Authorization Coordinator and the assigned BCBA immediately. Confirm where the PR is stuck. If the BCBA can finish it before EOD, push for submission tonight. If not, prep a backdating request for Monday and notify the family proactively. Log the situation in the client timeline.",
      escalationPath: "Loop in Operations Leadership same evening if either auth will lapse.",
    },
    knowledgeCheck: quiz("sd-w1d3-authorizations-department", [
      { q: "When should an auth be submitted before expiration?", opts: ["At least 30 days.", "When the family asks.", "After it lapses."], answer: 0 },
      { q: "What's the State Director's role in auth management?", opts: ["Submit every auth personally.", "Make sure no client loses hours from a preventable delay.", "Only review at month-end."], answer: 1 },
    ]),
  },

  "sd-w1d3-scheduling-department": {
    learningObjective: "Read a state schedule for health and name the two biggest coverage risks this week.",
    stateDirectorLens: "A clean schedule is a calm state. Cancellations and coverage gaps are operational signals — not just inconveniences.",
    stepByStep: [
      step("Open the calendar for your state (month view).", "Empty recurring slots, repeat cancellations, unpaired RBTs.", "State Director"),
      step("Read the Scheduling Department Operations SOP.", "Pairing rules, cancellation policy, coverage escalation.", "You"),
      step("Sit with the Scheduler for 20 minutes.", "What do they spend their day fighting? That's your operational signal.", "Scheduler"),
      step("Pick three at-risk clients and trace the cause.", "Pairing? Parent availability? RBT no-shows? Each has a different fix.", "Scheduler"),
      step("Bring the top two coverage risks to your weekly state meeting.", "Named clients, named owners, named next moves.", "State Director"),
    ],
    sop: {
      purpose: "Protect care continuity by maintaining clean schedules and absorbing cancellations without losing hours.",
      owner: "Scheduler (Operations Leadership oversight)",
      inputs: ["CR calendar", "Cancellation queue", "Pairing matrix"],
      process: [
        "Build schedules within pairing rules.",
        "Triage cancellations daily.",
        "Backfill open slots within SLA.",
        "Escalate repeat cancellations to State Director.",
        "Weekly schedule audit.",
      ],
      escalationTriggers: [
        "Client with 3+ cancellations in a rolling 4 weeks.",
        "RBT unpaired > 7 days.",
        "Open recurring slot uncovered > 14 days.",
      ],
      qualityStandard: "≥ 90% scheduled sessions converted. < 10% rolling cancellation rate.",
      reviewRhythm: "Daily triage. Weekly state schedule audit.",
    },
    scenario: {
      situation: "A family has cancelled three weeks in a row. The Scheduler keeps rebooking.",
      prompt: "Is this a scheduling issue or something else?",
      expectedResponse:
        "It's a retention conversation. Call the family yourself or have the BCBA call. Find out the real reason — pairing, timing, life circumstances, satisfaction. Adjust the schedule based on what you learn, not just by rebooking. Document the conversation in the client timeline.",
      escalationPath: "If retention risk is real, loop in QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d3-scheduling-department", [
      { q: "What does a clean schedule signal about a state?", opts: ["Nothing operationally meaningful.", "It signals operational calm and accountability.", "It means the Scheduler is over-working."], answer: 1 },
      { q: "What's the right move on a client with repeat cancellations?", opts: ["Keep rebooking.", "Treat it as a retention conversation, not a scheduling problem.", "Drop them from the schedule."], answer: 1 },
    ]),
  },

  "sd-w1d3-recruiting-department": {
    learningObjective: "Read the recruiting pipeline for your state and name the slowest stage.",
    stateDirectorLens: "You can't staff a growing state without a healthy pipeline. Empty roles become empty schedules become lost hours.",
    stepByStep: [
      step("Open the recruiting board for your state.", "Counts per stage: Sourced, Screened, Interviewed, Offer, Hired.", "State Director"),
      step("Read the Recruiting Department Operations SOP.", "Funnel, SLAs, hand-off to HR/Viventium.", "You"),
      step("Sit with the Recruiter for 20 minutes.", "What channel is converting? What's the slowest stage?", "Recruiter"),
      step("Identify the slowest stage and the cause.", "Sourcing? Screening capacity? Hiring manager response time? Each has a different fix.", "Recruiter"),
      step("Bring pipeline health and slowest stage to your weekly state meeting.", "Visible weekly until under control.", "State Director"),
    ],
    sop: {
      purpose: "Maintain a predictable pipeline of qualified clinicians so the state never runs out of capacity.",
      owner: "Recruiter (Recruiting Lead oversight)",
      inputs: ["Recruiting pipeline (Blossom OS)", "Sourcing channels", "Hiring manager calendar"],
      process: [
        "Source consistently from primary channels.",
        "Screen within 48 hours of inbound.",
        "Move qualified candidates to interview within 5 days.",
        "Send offers within 48 hours of hiring decision.",
        "Hand off cleanly to HR/Viventium for onboarding.",
      ],
      escalationTriggers: [
        "Candidate aged > 7 days in a stage.",
        "Hiring manager response > 48 hours.",
        "Offer acceptance < 70%.",
      ],
      qualityStandard: "Time-to-hire < 21 days for RBT roles. Offer acceptance ≥ 70%.",
      reviewRhythm: "Weekly pipeline review in state operations meeting.",
    },
    scenario: {
      situation: "You need to fill one RBT role in 14 days to cover a known coverage gap.",
      prompt: "What's your first move, and who is your partner?",
      expectedResponse:
        "Partner is the Recruiter. First move: ask for the current pipeline count and any candidates already at interview/offer. If pipeline is thin, agree on the highest-yield source (referral bonus, posting refresh, contractor backfill). Set a daily 5-minute pipeline check until the role is filled. Communicate the timeline to the affected family/BCBA.",
      escalationPath: "If 7 days pass with no qualified candidate, escalate to Recruiting Lead and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d3-recruiting-department", [
      { q: "Why does recruiting health matter to a State Director?", opts: ["It doesn't — that's HR.", "Empty roles become empty schedules become lost hours.", "Only at month-end."], answer: 1 },
      { q: "What's the right cadence for an urgent role?", opts: ["Weekly check-in.", "Daily 5-minute pipeline check until filled.", "Hands-off — let the recruiter run it."], answer: 1 },
    ]),
  },

  "sd-w1d3-qa-department": {
    learningObjective: "Understand what QA reviews, what they need from you, and where QA bottlenecks usually form.",
    stateDirectorLens: "QA is what keeps care defensible and revenue collectable. A State Director who ignores QA pays for it at month-end.",
    stepByStep: [
      step("Open the QA queue for your state.", "Items aged > 5 days, items pending more than one back-and-forth.", "State Director"),
      step("Read the Quality Assurance Department Operations SOP.", "Review types, SLAs, owner, escalation triggers.", "You"),
      step("Sit with QA for 20 minutes.", "What types of items get stuck? What are they waiting on from your state?", "QA Reviewer"),
      step("Identify the most common QA bottleneck in your state.", "Usually: late PRs, incomplete assessments, unclear authorizations.", "QA Reviewer"),
      step("Bring the bottleneck and an owner to your weekly state meeting.", "Make it visible until the pattern breaks.", "State Director"),
    ],
    sop: {
      purpose: "Catch operational and clinical issues early to protect care quality and prevent denied claims.",
      owner: "QA Reviewer (QA Lead oversight)",
      inputs: ["QA queue", "Authorizations", "Treatment plans", "Progress reports"],
      process: [
        "Review submitted items within SLA.",
        "Return items needing fixes with specific feedback.",
        "Track repeat issues by BCBA and by state.",
        "Escalate systemic issues to State Director and QA Lead.",
      ],
      escalationTriggers: [
        "QA item aged > 5 days without movement.",
        "Same BCBA returning repeated issues > 3 times.",
        "Pattern of QA failures by issue type.",
      ],
      qualityStandard: "≥ 95% of items pass QA on first or second submission.",
      reviewRhythm: "Daily queue. Weekly pattern review with State Director.",
    },
    scenario: {
      situation: "QA returns the same BCBA's progress reports three weeks in a row for the same issue.",
      prompt: "What's the operational move?",
      expectedResponse:
        "This isn't a QA problem — it's a training/coaching problem. Sit with the BCBA, walk through the specific QA feedback, and confirm understanding. Document the conversation. If it happens again, loop in QA Lead and consider a more structured coaching plan.",
      escalationPath: "Repeat after coaching = QA Lead + clinical leadership review.",
    },
    knowledgeCheck: quiz("sd-w1d3-qa-department", [
      { q: "What's the difference between catching a QA issue and preventing the next one?", opts: ["No difference.", "Catching = reactive; preventing = coaching the pattern, not just the item.", "Preventing is QA's job, not yours."], answer: 1 },
      { q: "What does a recurring QA failure usually signal?", opts: ["Bad luck.", "A training, process, or capacity issue that needs operational attention.", "QA is being too strict."], answer: 1 },
    ]),
  },

  "sd-w1d3-billing-department": {
    learningObjective: "Connect operational behavior (auths, conversions, documentation) to billing outcomes (clean claims, fewer denials).",
    stateDirectorLens: "Operational issues show up as denied claims weeks later. The fastest way to protect revenue is to protect operations now.",
    stepByStep: [
      step("Skim the latest Billing report for your state.", "Denial patterns, conversion rates, days-to-claim.", "State Director"),
      step("Read the Billing Department Operations SOP.", "What Billing needs from operations, owner, escalation triggers.", "You"),
      step("Sit with the Billing partner for 15 minutes.", "Top 1-2 denial patterns and their operational root causes.", "Billing Partner"),
      step("Trace one denial back to the operational cause.", "Late note? Wrong auth? Missing PR? Each maps to a Week 1 habit.", "Billing Partner"),
      step("Bring the top denial pattern and its operational fix to your weekly state meeting.", "Make the link between operations and revenue visible.", "State Director"),
    ],
    sop: {
      purpose: "Convert delivered care into clean, timely revenue by tightening the operational inputs Billing depends on.",
      owner: "Billing Partner (Billing Lead oversight)",
      inputs: ["Session notes", "Authorizations", "Progress reports", "Claim status reports"],
      process: [
        "Confirm session conversion daily.",
        "Submit claims within payer SLA.",
        "Track denials by reason code and BCBA.",
        "Flag operational root causes to the State Director weekly.",
      ],
      escalationTriggers: [
        "Denial rate > 5% for the state.",
        "Same denial reason recurring > 3 weeks.",
        "Aging claims > 60 days.",
      ],
      qualityStandard: "Clean claim rate ≥ 95%. < 5% denials by volume.",
      reviewRhythm: "Weekly with State Director. Monthly with Operations Leadership.",
    },
    scenario: {
      situation: "Billing flags that 12% of last month's claims for your state were denied for 'missing documentation.'",
      prompt: "What do you do?",
      expectedResponse:
        "Get the denial list by BCBA and by client. Identify whether it's one BCBA, a process gap, or a pattern (e.g., late notes). Sit with the responsible BCBA(s). Tighten the documentation rhythm. Confirm next month's clean-claim rate target with Billing.",
      escalationPath: "If denial rate doesn't improve in 30 days, escalate to Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w1d3-billing-department", [
      { q: "Where do most billing denials actually start?", opts: ["In Billing.", "Upstream in operational habits (notes, auths, PRs).", "With the payer."], answer: 1 },
      { q: "What's the most leveraged way to reduce denials?", opts: ["Hire more billers.", "Tighten the operational inputs Billing depends on.", "Argue every denial."], answer: 1 },
    ]),
  },

  /* ---------- Day 4 — Communication & Accountability ---------- */

  "sd-w1d4-communication-standards": {
    learningObjective: "Write and speak in a way that creates calm, clarity, and accountability instead of noise.",
    stateDirectorLens: "Tone is operational. Your team will mirror your communication style. Calm, specific, time-bound communication is a leadership skill.",
    stepByStep: [
      step("Read the Communication Standards & Professional Expectations SOP.", "Tone, format, ownership language, escalation etiquette.", "You"),
      step("Audit your last five operational messages.", "Did each name an owner, an action, and a time? If not, rewrite.", "You"),
      step("Adopt the standard format for escalations: Situation, Impact, Ask, Time-frame.", "Use it consistently for two weeks. It becomes habit.", "You"),
      step("Share your before/after rewrites with your mentor.", "Mentor will calibrate tone.", "Mentor"),
      step("Model the standard in a real team meeting this week.", "Your team will start mirroring within two weeks.", "You"),
    ],
    sop: {
      purpose: "Establish a calm, specific, time-bound communication standard for every State Director.",
      owner: "State Director Program",
      inputs: ["Recent escalations or written messages", "Communication Standards SOP"],
      process: ["Read SOP.", "Audit five recent messages.", "Adopt SIAT format (Situation, Impact, Ask, Time-frame).", "Practice in one team meeting.", "Confirm with mentor."],
      escalationTriggers: ["If a communication has triggered confusion or panic, debrief same day."],
      qualityStandard: "Every operational message names an owner, an action, and a time-frame.",
      reviewRhythm: "Reviewed monthly with mentor.",
    },
    scenario: {
      situation: "A late-night message lands in your inbox: 'auths are a mess in your state.'",
      prompt: "How do you respond — same night, or next morning?",
      expectedResponse:
        "Next morning, in writing, using SIAT. Acknowledge calmly, confirm what you know, set a specific time-frame for a fuller response. Do not react in the moment with incomplete information. Calm under pressure is the brand of the role.",
      escalationPath: "If the message itself is creating panic in the team, address it privately with the sender.",
    },
    knowledgeCheck: quiz("sd-w1d4-communication-standards", [
      { q: "What three things must every operational message name?", opts: ["Tone, urgency, attachments.", "Owner, action, time-frame.", "Sender, recipient, subject."], answer: 1 },
      { q: "What's the right move on a panic-triggering late-night message?", opts: ["Respond immediately in kind.", "Respond next morning, in writing, with SIAT.", "Ignore it."], answer: 1 },
    ]),
  },

  "sd-w1d4-escalation-structure": {
    learningObjective: "Escalate the right issues, to the right people, with the right information — and at the right time.",
    stateDirectorLens: "Escalations done poorly create alarm. Escalations done well create speed. The State Director is the calibrator.",
    stepByStep: [
      step("Read the Operational Escalation Management SOP.", "What to escalate, to whom, by when, and in what format.", "You"),
      step("Map four escalation paths for your state.", "Clinical concern, staffing gap, revenue risk, parent complaint.", "You"),
      step("Confirm each path with your mentor.", "Real escalations differ from the SOP — your mentor knows the texture.", "Mentor"),
      step("Use the SIAT format on your next real escalation.", "Practice in low-stakes moments first.", "You"),
      step("Debrief any escalation that didn't land well.", "Improvement comes from honest debrief, not avoidance.", "You", "If a pattern of poorly-landed escalations forms, raise it with your mentor."),
    ],
    sop: {
      purpose: "Create speed and clarity when something is stuck, at risk, or unclear.",
      owner: "State Director (Operations Leadership oversight)",
      inputs: ["Escalation paths by issue type", "Communication Standards SOP"],
      process: ["Identify the issue.", "Confirm the right owner.", "Format using SIAT.", "Send with time-frame.", "Debrief after."],
      escalationTriggers: ["Any issue affecting clinical safety, revenue continuity, or family experience and unresolved within SLA."],
      qualityStandard: "Escalations land calmly, get clear owners, and resolve inside SLA.",
      reviewRhythm: "Debrief escalations weekly with mentor in early weeks.",
    },
    scenario: {
      situation: "A BCBA reports a clinical concern about an RBT's session conduct. You're not sure if this is QA, HR, or both.",
      prompt: "How do you escalate without losing the calm?",
      expectedResponse:
        "Use SIAT in writing: Situation (what was observed), Impact (clinical risk + family experience), Ask (joint review by QA and HR), Time-frame (initial conversation in 24 hours). Send to both QA Lead and HR Lead with mentor copied. Do not speculate about cause in writing.",
      escalationPath: "If clinical safety is at risk, also notify Operations Leadership same day.",
    },
    knowledgeCheck: quiz("sd-w1d4-escalation-structure", [
      { q: "When should you escalate before you have all the answers?", opts: ["Never.", "When delay would cost more than uncertainty (safety, revenue, family experience).", "Always."], answer: 1 },
      { q: "What format keeps escalations calm?", opts: ["A long narrative.", "SIAT: Situation, Impact, Ask, Time-frame.", "A bullet list."], answer: 1 },
    ]),
  },

  "sd-w1d4-accountability-expectations": {
    learningObjective: "Set, track, and reinforce accountability without it becoming punitive.",
    stateDirectorLens: "Accountability is the operating system. Without it, SOPs and dashboards are decoration.",
    stepByStep: [
      step("Read the Accountability & Performance Ownership SOP.", "Define accountability vs. blame. The difference is direction (forward vs. backward).", "You"),
      step("Identify one item in your state without a named owner.", "Unowned items are accountability vacuums.", "You"),
      step("Assign an owner, an action, and a check-back date.", "Or escalate to your mentor for assignment.", "You", "If you cannot assign an owner inside your authority, escalate same day."),
      step("Track the item to closure.", "Closing the loop is more important than opening it.", "You"),
      step("Reflect: would your team describe you as accountable or harsh?", "Adjust tone based on the answer.", "You"),
    ],
    sop: {
      purpose: "Build an operating environment where ownership is clear, follow-through is normal, and accountability is calm.",
      owner: "State Director",
      inputs: ["Open items list", "Accountability & Performance Ownership SOP"],
      process: ["Audit open items.", "Confirm owner + action + check-back for each.", "Track to closure.", "Reflect on tone weekly."],
      escalationTriggers: ["Repeated missed commitments by the same owner."],
      qualityStandard: "Every open item has owner, action, and check-back. Nothing 'floats.'",
      reviewRhythm: "Weekly review in state operations meeting.",
    },
    scenario: {
      situation: "An owner has missed the same commitment three weeks in a row.",
      prompt: "What's the conversation, and how do you keep it calm?",
      expectedResponse:
        "Private 1:1. State the pattern factually. Ask what's getting in the way (capacity, clarity, conflict). Reset the commitment with a smaller scope or different support. Document. If the pattern continues after support, escalate to that person's leader.",
      escalationPath: "If pattern persists after support, escalate to reporting leader and HR for performance review.",
    },
    knowledgeCheck: quiz("sd-w1d4-accountability-expectations", [
      { q: "What's the difference between accountability and blame?", opts: ["Nothing.", "Accountability looks forward; blame looks backward.", "Accountability is harsher."], answer: 1 },
      { q: "What's the first move on a missed commitment?", opts: ["Public callout.", "Private 1:1 to understand the cause and reset.", "Take the work yourself."], answer: 1 },
    ]),
  },

  "sd-w1d4-operational-ownership": {
    learningObjective: "Articulate what it means to operationally own a state and identify what you don't yet know.",
    stateDirectorLens: "Ownership isn't a title. It's the willingness to know your state's real numbers before anyone asks.",
    stepByStep: [
      step("Read the State Director Operational Ownership SOP.", "Rhythm, visibility, decision standard, personal bar.", "You"),
      step("Draft a one-page state health summary.", "As if leadership asked for it Friday at 4pm.", "You"),
      step("Identify what you do not yet know.", "Honest gap list is more valuable than a polished summary.", "You"),
      step("Send draft + gap list to your mentor.", "Mentor will help you close the most important gaps in Week 2.", "Mentor"),
      step("Save the format in your SD playbook.", "You'll write this summary weekly for the next 90 days.", "You"),
    ],
    sop: {
      purpose: "Build the State Director's personal habit of knowing the state's real numbers, daily.",
      owner: "State Director",
      inputs: ["State KPIs", "Auth board", "Schedule", "Pipeline", "QA queue", "Billing report"],
      process: ["Draft state health summary.", "List unknown data points.", "Close gaps in Week 2.", "Write summary weekly thereafter."],
      escalationTriggers: ["If a data source is broken or inaccessible, raise it same day."],
      qualityStandard: "State Director can answer 'how is the state?' in 60 seconds with real numbers.",
      reviewRhythm: "Weekly summary; quarterly deep review.",
    },
    scenario: {
      situation: "Your reporting leader calls on Friday at 5pm: 'Quick — how's the state?'",
      prompt: "What's your 60-second answer?",
      expectedResponse:
        "Lead with one number that matters (utilization, auth lapses, active clients), one thing that's working, one thing that's at risk, and one move you're making this week. Calm tone. Specific numbers. If you don't know, say 'I'll have that by Monday' — not 'I think.'",
      escalationPath: "If you can't honestly answer at all, that's the conversation to have with your mentor before Monday.",
    },
    knowledgeCheck: quiz("sd-w1d4-operational-ownership", [
      { q: "What does operational ownership actually mean?", opts: ["A title.", "Knowing your state's real numbers daily and being willing to act on them.", "Doing every job yourself."], answer: 1 },
      { q: "What's the right response when you don't know a number?", opts: ["Estimate.", "Say 'I'll have that by [time]' — not 'I think.'", "Avoid the question."], answer: 1 },
    ]),
  },

  /* ---------- Day 5 — The Winning State Philosophy ---------- */

  "sd-w1d5-data-integrity": {
    learningObjective: "Protect the single source of truth across CentralReach, Blossom OS, and team workflows.",
    stateDirectorLens: "If the data is wrong, every decision after it is wrong. Defending data integrity is a daily leadership act.",
    stepByStep: [
      step("Read the Data Integrity & Source of Truth Management SOP.", "Which system is the source of truth for which entity.", "You"),
      step("Find one inconsistency in your state.", "Session converted in one system, missing in another. Auth showing approved in one place, pending in another.", "State Director"),
      step("Trace it to the source.", "Who entered it? When? Where did the divergence happen?", "Relevant owner"),
      step("Fix it cleanly and document the root cause.", "Don't just patch — understand the why.", "Owner", "If the inconsistency could affect billing or care, escalate same day."),
      step("Share the fix and root cause with your mentor.", "Patterns of inconsistency are operational signals.", "Mentor"),
    ],
    sop: {
      purpose: "Maintain a single source of truth across systems so operational decisions are based on real data.",
      owner: "State Director (Operations Leadership oversight)",
      inputs: ["CR", "Blossom OS", "Source-of-truth map"],
      process: ["Identify the source of truth per entity.", "Audit weekly for divergence.", "Fix at root cause, not symptom.", "Document patterns."],
      escalationTriggers: ["Divergence affecting billing, auths, or care continuity."],
      qualityStandard: "Zero divergence between systems for active clients.",
      reviewRhythm: "Weekly spot-check; monthly audit.",
    },
    scenario: {
      situation: "CR shows a session converted. Blossom OS shows it as cancelled.",
      prompt: "What do you do, and which one do you trust?",
      expectedResponse:
        "Confirm which system is the source of truth for session status (per SOP — usually CR). Trace where the divergence happened (manual entry, sync delay, two people updating). Correct the wrong system. Document the cause. If the divergence is sync-related, escalate to whoever maintains the integration.",
      escalationPath: "Recurring divergence = Operations Leadership + systems owner.",
    },
    knowledgeCheck: quiz("sd-w1d5-data-integrity", [
      { q: "Why is data integrity a leadership issue, not an IT issue?", opts: ["It's not.", "Because every operational decision rests on the data being right.", "Because IT delegates it up."], answer: 1 },
      { q: "What's the right move when two systems disagree?", opts: ["Trust the prettier one.", "Confirm the source of truth, fix the wrong system, find the root cause.", "Ignore until month-end."], answer: 1 },
    ]),
  },

  "sd-w1d5-utilization-mindset": {
    learningObjective: "Read utilization as a clinical, family, and operational signal — not just a revenue metric.",
    stateDirectorLens: "Low utilization usually means a family isn't getting consistent care. The metric matters because the child matters.",
    stepByStep: [
      step("Read the Utilization Management Philosophy SOP.", "What utilization measures, what it doesn't, and what counts as healthy.", "You"),
      step("Pull your state's utilization snapshot.", "Per-client % vs. authorized hours.", "State Director"),
      step("Identify three clients below 80% utilization.", "These are your operational signals.", "State Director"),
      step("Find the pattern.", "Pairing, scheduling, parent availability, RBT no-shows — each has a different fix.", "Scheduler / BCBA"),
      step("Pick the most leveraged first move and assign it.", "Named owner, named action, named check-back.", "State Director", "If a client is below 50% for two weeks, escalate to QA and Operations Leadership."),
    ],
    sop: {
      purpose: "Treat utilization as the heartbeat of care continuity — and act on it weekly.",
      owner: "State Director",
      inputs: ["Utilization report", "Pairing matrix", "Cancellation log"],
      process: ["Pull weekly utilization.", "Identify clients below 80%.", "Find pattern.", "Assign first move.", "Track to recovery."],
      escalationTriggers: ["Client < 50% utilization for 2+ weeks. State average < 80% for 4+ weeks."],
      qualityStandard: "Target band 85-100% per client. State average ≥ 85%.",
      reviewRhythm: "Weekly state utilization review.",
    },
    scenario: {
      situation: "Three clients on your roster are sitting at 60-70% utilization for the last month.",
      prompt: "What's your first conversation, and with whom?",
      expectedResponse:
        "Pull the data per client. Look for the pattern — is it the same RBT? Same day of week? Same family circumstance? First conversation depends on what you find: with the Scheduler if it's pairing/coverage, with the BCBA if it's a pairing concern, with the family if it's availability or satisfaction. Document the move and check-back in one week.",
      escalationPath: "If utilization doesn't recover in 2 weeks, escalate.",
    },
    knowledgeCheck: quiz("sd-w1d5-utilization-mindset", [
      { q: "What does utilization actually measure?", opts: ["Revenue only.", "Whether the family is getting the care they were authorized for.", "Therapist productivity only."], answer: 1 },
      { q: "What's the healthy utilization band?", opts: ["50-70%.", "85-100%.", "100%+ always."], answer: 1 },
    ]),
  },

  "sd-w1d5-state-ownership": {
    learningObjective: "Write your personal definition of state ownership across families, staff, revenue, and quality.",
    stateDirectorLens: "By Week 5 leadership expects you to own your state. Week 1 is when you decide what 'owning it' means to you.",
    stepByStep: [
      step("Read the State Ownership Framework SOP.", "Four lenses: families, staff, revenue, quality.", "You"),
      step("Write your personal definition of ownership for each lens.", "One paragraph per lens. Be specific.", "You"),
      step("Compare your draft to the framework.", "Where are you stricter than the framework? Where are you softer?", "You"),
      step("Share with your mentor.", "Mentor will challenge your definitions calmly.", "Mentor"),
      step("Identify one thing you will not delegate, no matter how busy you get.", "That's your personal standard.", "You"),
    ],
    sop: {
      purpose: "Establish the State Director's personal standard for what it means to own a state.",
      owner: "State Director",
      inputs: ["State Ownership Framework SOP", "Your personal ownership definitions"],
      process: ["Read SOP.", "Draft personal definitions across four lenses.", "Compare to framework.", "Confirm with mentor.", "Name one undelegatable thing."],
      escalationTriggers: ["If your personal standard contradicts the framework, raise it for alignment."],
      qualityStandard: "Written, signed-off personal ownership statement stored in SD playbook.",
      reviewRhythm: "Revisited at 90 days and 12 months.",
    },
    scenario: {
      situation: "Your week is full. Something has to give. The options are: cancel a family check-in, skip a QA review, push a 1:1 with a struggling RBT, or miss the weekly state meeting.",
      prompt: "How do you decide?",
      expectedResponse:
        "Anchor in your four lenses. Family check-in (family lens) and struggling RBT (staff lens) are usually the highest priority because they're irreplaceable conversations. QA review can often be tightened in 30 minutes later. The state meeting is the most delegable, but only with a strong delegate. Communicate the trade-off — don't disappear.",
      escalationPath: "If this pattern repeats weekly, you have a capacity issue. Raise it with your mentor.",
    },
    knowledgeCheck: quiz("sd-w1d5-state-ownership", [
      { q: "What are the four lenses of state ownership?", opts: ["Speed, scale, scope, sales.", "Families, staff, revenue, quality.", "KPIs, OKRs, P&L, NPS."], answer: 1 },
      { q: "Why name one thing you will not delegate?", opts: ["Vanity.", "It defines your personal standard and what 'ownership' means under pressure.", "To prove you work hard."], answer: 1 },
    ]),
  },

  "sd-w1d5-operational-leadership-philosophy": {
    learningObjective: "Articulate how you intend to lead under pressure and commit it to writing.",
    stateDirectorLens: "Your team will mirror your operating temperature. Calm under pressure is a skill, not a personality — and it's the most important one.",
    stepByStep: [
      step("Read the Operational Leadership Philosophy SOP.", "Calm, clear, consistent, accountable.", "You"),
      step("Write one paragraph on how you intend to lead under pressure.", "Be honest about your defaults and the discipline you'll need.", "You"),
      step("Identify your most likely failure mode.", "Going silent, getting reactive, over-functioning, hiding the truth — name yours.", "You"),
      step("Design one habit that protects against your failure mode.", "Observable, weekly, sustainable.", "You"),
      step("Share paragraph + habit with your mentor.", "Mentor will calibrate against the role's real demands.", "Mentor"),
    ],
    sop: {
      purpose: "Define the personal leadership standard each new State Director will hold themselves to.",
      owner: "State Director Program",
      inputs: ["Operational Leadership Philosophy SOP", "Honest self-assessment"],
      process: ["Read SOP.", "Draft leadership paragraph.", "Name failure mode.", "Design protective habit.", "Confirm with mentor."],
      escalationTriggers: ["If your failure mode starts repeating in real situations, raise it with your mentor before it becomes a pattern."],
      qualityStandard: "Written leadership philosophy + named failure mode + named habit, stored and revisited at 90 days.",
      reviewRhythm: "30, 90, and 365 days.",
    },
    scenario: {
      situation: "Three operational problems hit on the same day: a client lost coverage, a BCBA is upset about a schedule change, and Billing flagged a denial spike.",
      prompt: "How do you lead the next 60 minutes?",
      expectedResponse:
        "Calm tone. Sequence: coverage first (family impact), BCBA next (staff impact, fast 1:1), denial spike third (collect facts, schedule a follow-up). Name owners for each. Set check-backs. Resist the urge to fix all three personally. Communicate the plan to your mentor in one short message.",
      escalationPath: "If any thread is too big for your authority, loop in Operations Leadership early — not after you've struggled.",
    },
    knowledgeCheck: quiz("sd-w1d5-operational-leadership-philosophy", [
      { q: "Why is calm under pressure called a skill, not a personality trait?", opts: ["It isn't.", "Because it can be practiced, designed, and built into habit.", "Because some people are just born with it."], answer: 1 },
      { q: "What's the operational use of naming your failure mode?", opts: ["Self-criticism.", "It lets you design a habit that protects against it before it costs you.", "Therapy."], answer: 1 },
    ]),
  },
};

/** Module ids that are Week 1 State Director modules. */
export const SD_WEEK1_MODULE_IDS: string[] = Object.keys(SD_W1_FULL_CONTENT).concat([
  "sd-w1d1-welcome-video-from-blossom",
  "sd-w1d1-mission-vision",
]);
