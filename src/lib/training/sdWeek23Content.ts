/**
 * State Director — Weeks 2 & 3 full content (Systems & Client Flow,
 * Authorizations & Utilization).
 *
 * Source of truth for Week 2 and Week 3 module content:
 *   - SD_W23_TRAINING_SPECS  → Training-level overrides keyed by display title.
 *   - SD_W23_FULL_CONTENT    → Curated SDFullContent payloads keyed by
 *                              the generated module id (sd-w{week}d{day}-{slug}).
 *
 * Goal: a new State Director can complete every Week 2 & Week 3 module without
 * needing a mentor to fill in operational gaps. Each module teaches from
 * written SOP guidance even when the uploaded SOP file is still pending.
 */
import type { SDFullContent, SDWalkStep, SDKnowledgeQ } from "./stateDirectorFullTraining";
import type { SDTrainingSpecOverride } from "./sdWeek1Content";

function step(
  action: string,
  lookFor: string,
  owner: string,
  escalation?: string,
): SDWalkStep {
  return escalation ? { action, lookFor, owner, escalation } : { action, lookFor, owner };
}

function shot(label: string): string {
  return `Screenshot pending — expected view: ${label}.`;
}

function quiz(
  idBase: string,
  items: Array<{ q: string; opts: string[]; answer: number }>,
): SDKnowledgeQ[] {
  return items.map((it, i) => ({
    id: `${idBase}-q${i + 1}`,
    question: it.q,
    options: it.opts,
    answerIndex: it.answer,
  }));
}

/* ============================================================
 * Training-level overrides for Weeks 2 & 3
 * ============================================================ */

export const SD_W23_TRAINING_SPECS: Record<string, SDTrainingSpecOverride> = {
  /* ============= WEEK 2 ============= */

  /* Day 1 — CentralReach Foundations */
  "CR Overview": {
    description: "What CentralReach is, what it is the source of truth for, and what a State Director must know to run their state from it.",
    whyItMatters: "CentralReach is the operational source of truth for clients, schedules, sessions, and authorizations. If you can't read CR, you can't run a state.",
    whatToDo: "Read the CentralReach System Overview SOP. Open your state's CR instance. Locate clients, schedules, sessions, authorizations, users, notes, and reporting. Confirm the source-of-truth boundary with your mentor.",
    completionEvidence: "Bring a one-page note to your mentor describing what CR owns, what Blossom OS owns, and where the two systems sync.",
    reflectionPrompt: "When CR and Blossom OS disagree on a client's status, which one do you trust — and why?",
  },
  "Navigation": {
    description: "Where to look in CentralReach for the operational data a State Director needs day-to-day.",
    whyItMatters: "Speed of answers comes from knowing exactly where each operational signal lives. Hunting through menus is how you miss the early warning.",
    whatToDo: "Read the CentralReach Navigation & User Experience SOP. Locate clients, authorizations, schedules, sessions, users, notes, and the reporting menu. Bookmark the five views you will open daily.",
    completionEvidence: "Five named CR bookmarks saved in your browser and reviewed with your mentor.",
    reflectionPrompt: "Which CR view will you open first thing every morning?",
  },
  "Calendar Basics": {
    description: "How to read the CentralReach calendar for schedule health, gaps, cancellations, and service delivery risk.",
    whyItMatters: "The calendar is the heartbeat of a state. Reading it well is how you catch lost hours before they show up in revenue.",
    whatToDo: "Read the CentralReach Calendar Management SOP. Open the state calendar in week view. Identify three signals: empty recurring slots, cancellations, and unconverted sessions.",
    completionEvidence: "List three calendar risks you saw and bring them to your weekly state meeting.",
    reflectionPrompt: "What does a healthy state calendar actually look like at 5pm on a Friday?",
  },
  "User Permissions": {
    description: "What a State Director needs to understand about CR user roles, permissions, and when to escalate access requests.",
    whyItMatters: "Permission mistakes are how PHI leaks and how the wrong people see the wrong screens. Knowing the boundaries protects families and the company.",
    whatToDo: "Read the CentralReach User Permissions & Security SOP. Confirm your own permission level. Identify the named owner for permission changes in your state.",
    completionEvidence: "Document your role's permissions and the named owner for access changes. Share with your mentor.",
    reflectionPrompt: "A BCBA asks for access they don't currently have. What's your first move?",
  },

  /* Day 2 — Scheduling Fundamentals */
  "Calendar Views": {
    description: "The CR calendar views and filters a State Director uses to monitor schedule health by provider, client, and state.",
    whyItMatters: "The right view at the right time is how you spot risk early. The wrong view hides it.",
    whatToDo: "Read the Calendar Views & Filtering SOP. Practice switching between day, week, month, provider, and client views. Filter by your state and by individual providers.",
    completionEvidence: "Demonstrate the four most useful calendar views to your mentor and explain when you use each.",
    reflectionPrompt: "Which calendar view tells you the most about your state's health in 30 seconds?",
  },
  "Labels & Filters": {
    description: "How CR labels and filters help a State Director monitor the schedule and surface operational risk.",
    whyItMatters: "Labels and filters turn a noisy calendar into a usable operational signal. They are how you find what matters in 500 appointments.",
    whatToDo: "Read the Scheduling Labels & Workflow Filters SOP. Learn the meaning of each label used in your state. Build three saved filters: cancellations, unconverted, and open recurring slots.",
    completionEvidence: "Three saved filters demonstrated to your mentor. Confirm label meanings match your state's actual usage.",
    reflectionPrompt: "What label, if used inconsistently, would create the biggest operational confusion?",
  },
  "Session Tracking": {
    description: "How to monitor sessions through their lifecycle: scheduled, delivered, converted, billed.",
    whyItMatters: "Sessions that don't convert don't get billed. Tracking conversion is how a State Director defends revenue without becoming a biller.",
    whatToDo: "Read the Session Tracking & Monitoring SOP. Identify converted vs non-converted sessions for the past week in your state. Trace one non-converted session to its root cause.",
    completionEvidence: "Count of non-converted sessions for the past week + named root cause for one. Share with mentor.",
    reflectionPrompt: "If conversion drops 10% in one week, what's the first place you look?",
  },
  "Scheduling Oversight": {
    description: "What the State Director owns vs what the Scheduler owns when it comes to building, fixing, and protecting schedules.",
    whyItMatters: "Over-functioning into the scheduling chair is the fastest way to drown. Knowing the line protects you and the Scheduler.",
    whatToDo: "Read the Scheduling Oversight & Capacity Management SOP. Write 'Scheduler owns…' vs 'State Director owns…' in two columns. Confirm with your Scheduler.",
    completionEvidence: "Two-column ownership map reviewed with both your mentor and your Scheduler.",
    reflectionPrompt: "What's the most tempting scheduling task for you to grab — and why should you leave it?",
  },

  /* Day 3 — Session Accountability */
  "Converted Sessions": {
    description: "What a converted session means operationally and why conversion protects both utilization and revenue.",
    whyItMatters: "Converted sessions are delivered care that becomes billable revenue. Every unconverted session is care without payment.",
    whatToDo: "Read the Session Conversion Management SOP. Pull conversion rate for your state last week. Identify one BCBA with the lowest rate and the cause.",
    completionEvidence: "State conversion % for last week, named BCBA, and root cause shared with mentor.",
    reflectionPrompt: "When conversion is healthy, what does that say about your operational discipline?",
  },
  "Non-Converted Sessions": {
    description: "How to identify and resolve non-converted sessions before they become lost revenue.",
    whyItMatters: "Non-converted sessions are operational debt. Every day a non-converted session sits is a day closer to write-off.",
    whatToDo: "Read the Non-Converted Session Resolution SOP. Pull the non-converted queue for your state. Confirm an owner and SLA for resolution.",
    completionEvidence: "Non-converted count + named owner + resolution SLA documented and shared with mentor.",
    reflectionPrompt: "What's the latest you would let a non-converted session sit before personally walking it through resolution?",
  },
  "Session Integrity": {
    description: "Why session integrity matters — accurate times, correct codes, real signatures — and how to protect it.",
    whyItMatters: "Session integrity is what keeps audits clean and claims paid. Soft integrity is how companies get into compliance trouble.",
    whatToDo: "Read the Session Integrity & Fraud Prevention SOP. Identify three integrity red flags you would escalate immediately. Confirm with QA.",
    completionEvidence: "Three named red flags and the escalation path for each, reviewed with QA and mentor.",
    reflectionPrompt: "What's the difference between a careless mistake and an integrity issue — and how do you respond to each?",
  },
  "Schedule Monitoring": {
    description: "The State Director's weekly rhythm for monitoring schedule health: conversion, gaps, cancellations, integrity.",
    whyItMatters: "Monitoring is what turns a calendar into early warning. Without rhythm, the calendar is just history.",
    whatToDo: "Read the Schedule Monitoring & Operational Visibility SOP. Build a personal Monday-morning monitoring checklist: conversion %, open slots, repeat cancellations, integrity flags.",
    completionEvidence: "Personal Monday checklist saved and walked through with your mentor.",
    reflectionPrompt: "What signal, if you saw it every Monday, would tell you the week is going to be hard?",
  },

  /* Day 4 — Lead & Intake Flow */
  "Lead Lifecycle": {
    description: "How a lead moves from first contact to active client, and where the lifecycle most often breaks.",
    whyItMatters: "Leads that stall become families without care. The lead lifecycle is where growth lives or dies for your state.",
    whatToDo: "Read the Lead Lifecycle Management SOP. Walk one real lead end-to-end with your Intake Coordinator. Identify the stage with the longest dwell time.",
    completionEvidence: "Named stage with longest dwell time + owner + proposed first fix shared with mentor.",
    reflectionPrompt: "What's the human cost of a lead that sits unanswered for 7 days?",
  },
  "Phone Calls Workflow": {
    description: "How initial phone calls with families get logged, routed, and followed up so no lead is dropped.",
    whyItMatters: "First calls set the family's experience of Blossom. A dropped call is a dropped family.",
    whatToDo: "Read the Phone Calls & Lead Follow-Up Process SOP. Listen to or review one recent inbound call workflow. Confirm the follow-up SLA is being met.",
    completionEvidence: "Documented review of one call workflow + confirmation that SLA was met, shared with Intake lead.",
    reflectionPrompt: "What would a family say about how their first call to Blossom was handled?",
  },
  "Intake Workflow": {
    description: "The Intake workflow end-to-end: from inquiry, to insurance verification, to consent, to assessment scheduling.",
    whyItMatters: "Intake is where the State Director's growth promise gets tested. Operational gaps here become lost families.",
    whatToDo: "Read the Intake Workflow Management SOP. Map your state's Intake board. Identify any client aged > 7 days in a single stage.",
    completionEvidence: "List of stuck Intake clients with named owners and an unblock plan, reviewed with Intake Coordinator and mentor.",
    reflectionPrompt: "What's the difference between an Intake board that is busy and one that is healthy?",
  },
  "Consent Workflow": {
    description: "How consent forms are collected, stored, and validated before a client starts services.",
    whyItMatters: "Consent gaps block services and create compliance risk. A clean consent process is how care starts on time.",
    whatToDo: "Read the Consent Form Management SOP. Verify three recent starts have consents on file. Confirm the storage location with the Intake Coordinator.",
    completionEvidence: "Three consents verified + named storage location + escalation path for missing consents, shared with mentor.",
    reflectionPrompt: "If a consent form goes missing, what is the operational cost over the next 30 days?",
  },

  /* Day 5 — Client Lifecycle */
  "VOB Process": {
    description: "How verification of benefits runs through Solum and CR, and how to spot a VOB that is stalled or wrong.",
    whyItMatters: "A bad VOB is a bad start. Wrong coverage means wrong auths, wrong billing, and a family that loses care later.",
    whatToDo: "Read the Verification of Benefits (VOB) Process SOP. Walk one VOB end-to-end with the responsible team. Confirm SLAs and where VOBs typically stall.",
    completionEvidence: "Named VOB owner + typical stall point + escalation path documented and shared with mentor.",
    reflectionPrompt: "When a VOB is two days late, what's the right move — wait or escalate?",
  },
  "Assessment Process": {
    description: "How assessments are scheduled, completed, and converted into a treatment plan and authorization.",
    whyItMatters: "Assessments are the bridge from intake to active care. A delayed assessment is a delayed start, which is lost weeks of care.",
    whatToDo: "Read the Assessment Scheduling & Oversight SOP. Identify any assessment > 14 days from authorization to schedule date in your state.",
    completionEvidence: "List of delayed assessments + named owner + plan to close the gap, shared with mentor.",
    reflectionPrompt: "What's the longest you would let an assessment sit unscheduled before stepping in?",
  },
  "Client Workflow": {
    description: "How a client moves through the full Blossom lifecycle and what the State Director watches at each stage.",
    whyItMatters: "You are the only person who sees a client end-to-end. That perspective is the entire job.",
    whatToDo: "Read the Client Lifecycle Management SOP. Pick three active clients and walk each through their full timeline. Note any stage transition that took longer than the SOP allows.",
    completionEvidence: "Three client timelines reviewed with notes on stage delays, shared with mentor.",
    reflectionPrompt: "Where in the client lifecycle does your state currently have the most friction?",
  },
  "Active Client Lifecycle": {
    description: "How to spot a stalled active client — drop in hours, missed PRs, repeat cancellations, communication silence.",
    whyItMatters: "An active client that goes quiet often becomes a churned client. Catching the signal early is the difference between retention and loss.",
    whatToDo: "Read the Active Client Oversight SOP. Identify three at-risk active clients in your state. Define a check-back plan for each.",
    completionEvidence: "Three named at-risk clients + check-back plan + assigned owner, shared with mentor and BCBA.",
    reflectionPrompt: "What signal told you a client was at risk before the data did?",
  },

  /* ============= WEEK 3 ============= */

  /* Day 1 — Authorization Foundations */
  "Authorization Lifecycle": {
    description: "How an authorization moves from request through approval, utilization, and renewal — and where it can break.",
    whyItMatters: "An auth lifecycle break is a child losing care. Knowing the lifecycle is how you prevent the break.",
    whatToDo: "Read the Authorization Lifecycle Management SOP. Walk one auth end-to-end with your Authorization Coordinator. Note every status transition and the SLA for each.",
    completionEvidence: "End-to-end walk documented with status transitions and SLAs, reviewed with mentor.",
    reflectionPrompt: "Where in the auth lifecycle would a small delay cause the biggest downstream impact in your state?",
  },
  "Auth Statuses": {
    description: "What each authorization status means operationally — and what the State Director should do for each.",
    whyItMatters: "A status without an action is decoration. Knowing what each status requires is how you turn a list into a workflow.",
    whatToDo: "Read the Authorization Status Management SOP. Memorize the meaning of each status. Map each status to a specific operational action.",
    completionEvidence: "Status → action mapping written down and reviewed with Authorization Coordinator.",
    reflectionPrompt: "Which auth status, if ignored for a week, causes the largest revenue impact?",
  },
  "Submission Process": {
    description: "Who owns submission, QA, and follow-up for each authorization — and how a State Director keeps the process honest.",
    whyItMatters: "Submission discipline is what keeps auths from lapsing. Without a clean process, hours get lost in the gap between BCBA and submitter.",
    whatToDo: "Read the Authorization Submission Process SOP. Confirm your state's submission cadence and the QA step before each submission. Identify any submission > 7 days late.",
    completionEvidence: "Submission cadence confirmed + list of late submissions + named owner, shared with mentor.",
    reflectionPrompt: "What's the cost of one auth submitted 14 days late?",
  },

  /* Day 2 — Treatment Authorizations */
  "Initial Auths": {
    description: "How initial authorizations are built from the assessment and what the State Director must confirm.",
    whyItMatters: "A weak initial auth shapes every future renewal. The first auth is the foundation of the client's care budget.",
    whatToDo: "Read the Initial Authorization Management SOP. Review three recent initial auths in your state. Confirm hours requested align with the assessment recommendation.",
    completionEvidence: "Three initial auths reviewed + any mismatch documented and resolved, shared with mentor.",
    reflectionPrompt: "When an initial auth is approved for fewer hours than recommended, what do you do?",
  },
  "Treatment Auths": {
    description: "How treatment authorizations renew without breaking care — and what the State Director monitors weekly.",
    whyItMatters: "Treatment auth gaps are the most common cause of lost hours. Weekly monitoring is the discipline that prevents them.",
    whatToDo: "Read the Treatment Authorization Management SOP. Pull all treatment auths expiring in the next 60 days. Confirm named owner and submission plan for each.",
    completionEvidence: "60-day expiring list + named owners + submission plan documented, reviewed with mentor.",
    reflectionPrompt: "What's your weekly rhythm for monitoring expiring treatment auths?",
  },
  "Reassessments": {
    description: "How and when reassessments are conducted to support continued treatment authorization.",
    whyItMatters: "A missing reassessment is a missing PR is a stalled renewal. Reassessments are continuity in disguise.",
    whatToDo: "Read the Reassessment Management SOP. Identify all clients whose reassessment is due in the next 30 days. Confirm scheduling owner.",
    completionEvidence: "30-day reassessment list + named scheduling owner + status for each, shared with mentor.",
    reflectionPrompt: "What's the operational impact of one delayed reassessment on the next renewal?",
  },
  "Progress Reports": {
    description: "How progress reports support reauthorization — what good looks like, what bad looks like, and where State Directors step in.",
    whyItMatters: "Without PRs, auths don't renew. A late PR cascades into lost weeks of care.",
    whatToDo: "Read the Progress Report Management SOP. Identify any PR overdue or returned by QA. Confirm a completion plan with the responsible BCBA.",
    completionEvidence: "Overdue PR list + named BCBA + completion plan with date, shared with mentor and QA.",
    reflectionPrompt: "How will you tell a BCBA their PR is late without damaging the relationship?",
  },

  /* Day 3 — Utilization Tracking */
  "Actual Hours": {
    description: "What 'actual hours' means in CR reporting and how it differs from scheduled or pending hours.",
    whyItMatters: "Actual hours are what was actually delivered. It is the floor of your utilization story.",
    whatToDo: "Read the Actual Hours Monitoring SOP. Pull actual hours for your state for the past month. Compare by BCBA and by client.",
    completionEvidence: "Actual-hours report reviewed + one anomaly named + cause documented, shared with mentor.",
    reflectionPrompt: "When actual hours drop sharply for a single client, what is the first conversation you have?",
  },
  "Pending Hours": {
    description: "How pending hours represent at-risk work and what the State Director does to convert them.",
    whyItMatters: "Pending hours are revenue suspended in mid-air. Letting them sit is how clean utilization rots.",
    whatToDo: "Read the Pending Hours Management SOP. Pull pending hours for your state. Confirm conversion SLA and named owner.",
    completionEvidence: "Pending count + SLA + named owner documented and shared with mentor.",
    reflectionPrompt: "What rhythm should you build so pending hours never exceed 48 hours old?",
  },
  "Remaining Hours": {
    description: "How to read remaining authorized hours by client and act before they run out.",
    whyItMatters: "Running out of hours mid-month is a service interruption. Watching remaining hours is how you prevent it.",
    whatToDo: "Read the Remaining Hours Tracking SOP. Pull remaining hours by client. Identify any client < 20% of monthly auth remaining with > 1 week left.",
    completionEvidence: "List of clients at risk of running out + named action for each, shared with mentor.",
    reflectionPrompt: "When a client is about to exhaust their auth mid-month, who owns the conversation with the family?",
  },
  "Utilization %": {
    description: "How utilization % is calculated and how a State Director uses it to spot care, staffing, and revenue risk.",
    whyItMatters: "Utilization % is the single best operational pulse of a state. Above 90% is healthy; below 75% is a problem you need to name.",
    whatToDo: "Read the Utilization Percentage Management SOP. Pull your state's utilization for the past month. Identify three clients below 80% and one pattern.",
    completionEvidence: "Three named clients + named pattern + proposed first move shared with mentor.",
    reflectionPrompt: "If utilization drops 5% week-over-week, what's the first place you look?",
  },

  /* Day 4 — Managing Gaps */
  "Expiring Auths": {
    description: "How to manage the expiring authorization queue so no client experiences a lapse.",
    whyItMatters: "An expired auth means a child loses sessions. Expiring auth discipline is non-negotiable.",
    whatToDo: "Read the Expiring Authorization Management SOP. Pull all auths expiring in the next 30 days. Confirm submission plan for each.",
    completionEvidence: "30-day expiring list + submission plan + named owner per auth, reviewed weekly with mentor.",
    reflectionPrompt: "What's the latest you would let an auth sit in 'awaiting submission' before personally walking to the coordinator's desk?",
  },
  "Missing PRs": {
    description: "How to identify and resolve missing progress reports before they block authorization renewals.",
    whyItMatters: "A missing PR is a paused renewal is a lost week of care. Resolution speed protects continuity.",
    whatToDo: "Read the Missing Progress Report Resolution SOP. Pull the missing-PR list for your state. Confirm a completion date for each.",
    completionEvidence: "Missing-PR list + named BCBA + commit date for each, shared with QA and mentor.",
    reflectionPrompt: "How do you make 'PRs are due' feel like a shared mission, not a nag?",
  },
  "Delayed Assessments": {
    description: "How to identify delayed assessments and what State Director actions unblock them.",
    whyItMatters: "Delayed assessments delay care. Most delays are scheduling gaps that a State Director can clear in one conversation.",
    whatToDo: "Read the Delayed Assessment Resolution SOP. Pull the delayed-assessment list. Confirm cause and resolution owner for each.",
    completionEvidence: "Delayed-assessment list + root cause + named owner per item, reviewed with mentor.",
    reflectionPrompt: "What's the most common reason an assessment slips in your state — and what is the fix?",
  },
  "Coverage Risks": {
    description: "How to identify clients at risk of coverage interruption due to auth, assessment, scheduling, or staffing gaps.",
    whyItMatters: "Coverage risk is the umbrella metric of operational health. If you watch it well, you protect care, families, and revenue at once.",
    whatToDo: "Read the Coverage Risk Management SOP. Build a weekly coverage-risk list combining expiring auths, missing PRs, delayed assessments, and staffing gaps.",
    completionEvidence: "Weekly coverage-risk list created and reviewed in your state operations meeting.",
    reflectionPrompt: "What's one signal that would tell you coverage is at risk before any dashboard would?",
  },

  /* Day 5 — Revenue Protection */
  "Utilization Management": {
    description: "The State Director's playbook for managing utilization week over week — recover, defend, and grow.",
    whyItMatters: "Utilization is not an accident. It is a managed outcome of weekly operational discipline.",
    whatToDo: "Read the Utilization Management & Recovery SOP. Build a weekly utilization review agenda. Identify the lowest-utilization client cohort and a recovery plan.",
    completionEvidence: "Weekly utilization agenda + recovery plan for lowest cohort, reviewed with mentor.",
    reflectionPrompt: "What weekly habit will most reliably move utilization in the right direction?",
  },
  "Revenue Awareness": {
    description: "How operational decisions translate into revenue outcomes — and how a State Director keeps the connection visible.",
    whyItMatters: "You don't have to be a biller to protect revenue. You have to understand which operational levers move it.",
    whatToDo: "Read the Revenue Awareness for State Directors SOP. Identify the three operational levers that most impact your state's monthly revenue.",
    completionEvidence: "Three named levers + how you will watch each weekly, reviewed with mentor and Billing partner.",
    reflectionPrompt: "What's the difference between knowing revenue and influencing it?",
  },
  "Preventing Lost Hours": {
    description: "The practical actions a State Director takes weekly to keep hours from being lost to cancellations, gaps, or non-conversions.",
    whyItMatters: "Lost hours never come back. Prevention is the only winning strategy.",
    whatToDo: "Read the Lost Hours Prevention SOP. Review the past month's lost hours by reason code. Identify the top reason and the first systemic fix.",
    completionEvidence: "Lost-hours summary + top reason + named systemic fix, reviewed with mentor.",
    reflectionPrompt: "Which reason for lost hours in your state would be easiest to cut in half this month?",
  },
  "Operational Visibility": {
    description: "How a State Director creates and maintains weekly operational visibility for themselves, their team, and leadership.",
    whyItMatters: "Visibility is leadership. If you can't see your state, you can't lead it. If leadership can't see your state, they can't support you.",
    whatToDo: "Read the Operational Visibility & Reporting SOP. Build a one-page weekly state health report covering utilization, coverage risk, conversion, and pipeline.",
    completionEvidence: "One-page weekly report drafted and reviewed with mentor and reporting leader.",
    reflectionPrompt: "If your reporting leader called Friday at 4pm and asked 'how is the state?', what's your honest 60-second answer?",
  },
};

/* ============================================================
 * Curated SDFullContent for every Week 2 & Week 3 module
 * ============================================================ */

export const SD_W23_FULL_CONTENT: Record<string, SDFullContent> = {
  /* ============= WEEK 2 — DAY 1 (CR Foundations) ============= */
  "sd-w2d1-cr-overview": {
    learningObjective: "Describe what CentralReach is the source of truth for, and what Blossom OS owns vs what CR owns.",
    stateDirectorLens: "CR is the operational system of record. Blossom OS is the operational workspace. Knowing which one to trust in any given moment is a State Director skill.",
    stepByStep: [
      step("Read the CentralReach System Overview SOP.", "CR's role as source of truth for clients, schedules, sessions, authorizations.", "You"),
      step("Log in to CR for your state.", shot("CR home page filtered by your state."), "State Director"),
      step("Locate the seven primary areas: clients, schedules, sessions, authorizations, users, notes, reporting.", shot("CR left navigation menu showing each major module."), "State Director"),
      step("Compare to Blossom OS: what lives where.", "Boundary between CR (system of record) and Blossom OS (workspace).", "You"),
      step("Walk one client end-to-end across CR and Blossom OS.", "Where the two systems sync, where they don't.", "Mentor", "If the two systems disagree on a client, log a Data Integrity issue same day."),
    ],
    sop: {
      purpose: "Anchor every State Director in CR as the operational source of truth and clarify the boundary with Blossom OS.",
      owner: "State Director Program (CR Admin oversight)",
      inputs: ["CentralReach access", "Blossom OS access", "State client roster"],
      process: [
        "Read the CR System Overview SOP.",
        "Log in and locate the seven primary modules.",
        "Walk one client end-to-end across CR and OS.",
        "Document the source-of-truth boundary.",
        "Confirm with mentor.",
      ],
      escalationTriggers: [
        "CR and Blossom OS disagree on client status > 24 hours.",
        "Access not provisioned correctly within 48 hours.",
        "Source-of-truth boundary unclear after mentor walkthrough.",
      ],
      qualityStandard: "State Director can answer 'where does this data live?' for any operational question in under 30 seconds.",
      reviewRhythm: "Re-validate any time CR or Blossom OS gets a major release.",
    },
    scenario: {
      situation: "A BCBA tells you a client's session yesterday was 4 hours; CR shows 2 hours scheduled and 0 converted.",
      prompt: "Which system do you trust, and what's your first move?",
      expectedResponse: "Trust CR as the system of record but verify with the BCBA. Open the session in CR, confirm timestamps, and ask the BCBA to walk you through what actually happened. If a real session was delivered and not captured, get it logged today before it becomes a non-converted session.",
      escalationPath: "If discrepancies repeat with the same BCBA, loop in QA same week.",
    },
    knowledgeCheck: quiz("sd-w2d1-cr-overview", [
      { q: "What is CR the source of truth for?", opts: ["Marketing data.", "Clients, schedules, sessions, and authorizations.", "Recruiting pipelines."], answer: 1 },
      { q: "When CR and Blossom OS disagree on a client, what should you do?", opts: ["Pick whichever is most convenient.", "Trust CR as system of record and log a Data Integrity issue.", "Ignore the discrepancy."], answer: 1 },
    ]),
  },

  "sd-w2d1-navigation": {
    learningObjective: "Locate the five CR views a State Director opens daily and bookmark them for speed.",
    stateDirectorLens: "Speed of answers comes from knowing exactly where each operational signal lives. Bookmarks are operational discipline.",
    stepByStep: [
      step("Read the CentralReach Navigation & User Experience SOP.", "Menu structure and primary modules.", "You"),
      step("Open the Clients module.", shot("CR Clients list filtered by your state."), "State Director"),
      step("Open Authorizations, Schedules, Sessions, Users, Notes, and Reporting in turn.", shot("CR sub-navigation showing each module landing page."), "State Director"),
      step("Bookmark the five views you'll open daily.", "Calendar (week view), Authorizations (expiring), Sessions (non-converted), Reporting (utilization), Clients (active).", "You"),
      step("Walk a mentor through your bookmarks.", "Mentor confirms the views chosen are the right operational starting points.", "Mentor"),
    ],
    sop: {
      purpose: "Reduce time-to-answer for State Directors by standardizing the five CR views they open daily.",
      owner: "State Director Program",
      inputs: ["CR access", "Bookmark bar"],
      process: [
        "Read the Navigation SOP.",
        "Open each major module.",
        "Bookmark the five daily views.",
        "Confirm with mentor.",
        "Refresh bookmarks any time CR releases UI changes.",
      ],
      escalationTriggers: [
        "You can't locate a primary module after the SOP walkthrough.",
        "A CR UI change breaks bookmarks > 24 hours.",
      ],
      qualityStandard: "Any operational question can be answered from a bookmarked view in under 60 seconds.",
      reviewRhythm: "Re-validate quarterly and after CR releases.",
    },
    scenario: {
      situation: "Your Operations Lead asks 'how many auths are expiring this month in your state?' and you're on a call.",
      prompt: "How fast should the answer come, and how do you get there?",
      expectedResponse: "Under 60 seconds. Open your bookmarked Authorizations (expiring) view, filter to current month, and read the count. If you can't get there that fast, your bookmarks aren't right yet — fix them today.",
      escalationPath: "If a daily view is missing in CR, raise it with the CR Admin same day.",
    },
    knowledgeCheck: quiz("sd-w2d1-navigation", [
      { q: "Why do State Directors bookmark CR views?", opts: ["For looks.", "To reduce time-to-answer to under 60 seconds.", "Because IT requires it."], answer: 1 },
      { q: "What's a good test of your bookmarks?", opts: ["You have more than 20.", "You can answer any operational question in under 60 seconds.", "They match your peers' bookmarks."], answer: 1 },
    ]),
  },

  "sd-w2d1-calendar-basics": {
    learningObjective: "Read the CR calendar for three signals: empty recurring slots, cancellations, and unconverted sessions.",
    stateDirectorLens: "The calendar is the heartbeat of a state. Read it well or fly blind.",
    stepByStep: [
      step("Read the CentralReach Calendar Management SOP.", "Calendar views, color codes, status indicators.", "You"),
      step("Open the calendar in week view, filtered by your state.", shot("CR weekly calendar for the current week, state-filtered."), "State Director"),
      step("Identify empty recurring slots.", "Slots scheduled to recur but missing a session this week.", "State Director"),
      step("Identify cancellations and repeat-cancel clients.", shot("Calendar with cancellation labels visible."), "State Director", "Any client with 3+ cancellations in a rolling 4 weeks → retention conversation."),
      step("Identify unconverted sessions from yesterday.", "Sessions delivered but not yet converted in CR.", "State Director"),
    ],
    sop: {
      purpose: "Build the State Director's daily calendar-reading habit so risk is caught before it becomes loss.",
      owner: "State Director Program (Scheduler partnership)",
      inputs: ["CR calendar", "State filter", "Cancellation report"],
      process: [
        "Open week view first thing each day.",
        "Scan for empty recurring slots.",
        "Note cancellations and repeats.",
        "Confirm yesterday's sessions converted.",
        "Bring patterns to weekly state meeting.",
      ],
      escalationTriggers: [
        "Repeat cancellations 3+ in 4 weeks for one client.",
        "Open recurring slot uncovered > 14 days.",
        "Non-converted sessions > 48 hours old.",
      ],
      qualityStandard: "Daily calendar review takes < 5 minutes and surfaces zero surprises in weekly state meetings.",
      reviewRhythm: "Daily scan. Weekly pattern review with Scheduler.",
    },
    scenario: {
      situation: "You open the calendar Monday morning and see 6 empty recurring slots across 3 clients and 5 unconverted sessions from Friday.",
      prompt: "What's your sequence?",
      expectedResponse: "Triage in this order: (1) Unconverted sessions — get them converted today before they age. (2) Empty recurring slots — text the Scheduler with the three clients and ask for fill plan by EOD. (3) Bring both numbers to your state's weekly meeting as standing items until they're under control.",
      escalationPath: "If unconverted sessions consistently age > 48 hours, loop in QA and Billing.",
    },
    knowledgeCheck: quiz("sd-w2d1-calendar-basics", [
      { q: "What are the three signals a State Director reads on the calendar daily?", opts: ["Birthday, vacation, anniversary.", "Empty recurring slots, cancellations, unconverted sessions.", "BCBA mood, RBT mood, family mood."], answer: 1 },
      { q: "What's the SLA on non-converted sessions?", opts: ["Convert within 48 hours.", "Convert sometime this month.", "Wait for Billing to ask."], answer: 0 },
    ]),
  },

  "sd-w2d1-user-permissions": {
    learningObjective: "Understand your CR permission level and know who owns access changes in your state.",
    stateDirectorLens: "Permissions protect families. PHI exposure from a permission mistake is a serious operational failure.",
    stepByStep: [
      step("Read the CentralReach User Permissions & Security SOP.", "Role types, permission boundaries, escalation rules.", "You"),
      step("Confirm your own permission level in CR.", shot("CR user profile showing role and permission set."), "You"),
      step("Identify the named owner for permission changes in your state.", "Usually CR Admin or Operations Leadership.", "State Director"),
      step("Map who in your state has what level of access.", "BCBAs, RBTs, Schedulers, Coordinators.", "State Director", "Any access mismatch with role → flag to CR Admin same day."),
      step("Document the escalation path for a permission request.", "Who asks, who approves, who provisions.", "You"),
    ],
    sop: {
      purpose: "Protect PHI and operational integrity by enforcing correct CR permissions for every user.",
      owner: "CR Admin (State Director partnership)",
      inputs: ["CR user list", "Role definitions", "Permission request workflow"],
      process: [
        "Confirm SD permission level.",
        "Audit state user list against role definitions.",
        "Flag any mismatches to CR Admin.",
        "Document escalation path for new requests.",
        "Re-audit quarterly.",
      ],
      escalationTriggers: [
        "User has access beyond their role definition.",
        "Terminated employee still has CR access > 24 hours.",
        "PHI exposure incident.",
      ],
      qualityStandard: "Zero terminated employees with active CR access. Zero access mismatches > 7 days.",
      reviewRhythm: "Monthly user audit. Immediate audit on every termination.",
    },
    scenario: {
      situation: "A BCBA asks you for access to a client they're not assigned to, saying they're 'just helping out this week.'",
      prompt: "How do you respond?",
      expectedResponse: "Don't grant ad-hoc access. Ask the Scheduler whether the BCBA needs to be assigned to the client. If yes, formalize the assignment and let the standard permission flow grant access. If it's a one-time consult, route it through the assigned BCBA instead. Document the request and your decision.",
      escalationPath: "Repeated ad-hoc access requests = pattern conversation with QA and CR Admin.",
    },
    knowledgeCheck: quiz("sd-w2d1-user-permissions", [
      { q: "When should you grant ad-hoc CR access?", opts: ["When a colleague asks nicely.", "Never — formalize the assignment instead.", "When the family asks."], answer: 1 },
      { q: "What's the SLA on removing access for a terminated employee?", opts: ["Within 24 hours.", "Within 30 days.", "When you remember."], answer: 0 },
    ]),
  },

  /* ============= WEEK 2 — DAY 2 (Scheduling Fundamentals) ============= */
  "sd-w2d2-calendar-views": {
    learningObjective: "Switch fluently between day, week, month, provider, and client calendar views in CR.",
    stateDirectorLens: "The right view at the right time is how you spot risk early. Pick the wrong view and the risk hides in plain sight.",
    stepByStep: [
      step("Read the Calendar Views & Filtering SOP.", "Available views and when to use each.", "You"),
      step("Practice day view.", shot("CR day view filtered by your state."), "State Director"),
      step("Practice week view, provider view, client view, month view.", shot("CR week view with provider filter applied."), "State Director"),
      step("Pick the 'first view of the day' for your operational rhythm.", "Most SDs land on week view, state-filtered.", "You"),
      step("Demonstrate the four most useful views to your mentor.", "Mentor confirms operational fit.", "Mentor"),
    ],
    sop: {
      purpose: "Standardize the calendar views a State Director uses daily for fastest operational read.",
      owner: "State Director Program",
      inputs: ["CR calendar", "Filter options"],
      process: [
        "Learn each view.",
        "Pick a 'first view of day.'",
        "Save filter sets for the most-used views.",
        "Confirm with mentor.",
        "Re-validate after CR UI changes.",
      ],
      escalationTriggers: [
        "You consistently can't find a piece of operational data — likely a wrong view choice.",
      ],
      qualityStandard: "State Director can answer schedule questions across day/week/month/provider/client in < 60 seconds.",
      reviewRhythm: "Monthly self-check.",
    },
    scenario: {
      situation: "A BCBA tells you they're 'slammed' this week and want help. Which view do you open first?",
      prompt: "Walk through your reasoning.",
      expectedResponse: "Provider view, filtered to that BCBA, week range. You need to see their actual load before reacting. If the calendar shows reasonable load, the conversation is about prioritization or pairing. If it shows overload, the conversation is with the Scheduler about redistribution.",
      escalationPath: "Sustained overload across multiple BCBAs = capacity conversation with Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d2-calendar-views", [
      { q: "What's a State Director's typical 'first view of the day'?", opts: ["Day view.", "Week view, state-filtered.", "Month view."], answer: 1 },
      { q: "What view do you use to diagnose one BCBA's workload?", opts: ["Provider view.", "Client view.", "Month view."], answer: 0 },
    ]),
  },

  "sd-w2d2-labels-filters": {
    learningObjective: "Build three saved filters: cancellations, unconverted sessions, and open recurring slots.",
    stateDirectorLens: "Labels and filters turn a noisy calendar into operational signal. Without them, you drown in 500 appointments.",
    stepByStep: [
      step("Read the Scheduling Labels & Workflow Filters SOP.", "Label meanings and filter mechanics.", "You"),
      step("Confirm the meaning of each label your state uses.", shot("CR label legend or filter dropdown."), "State Director", "Inconsistent label usage → calibration meeting with Scheduler."),
      step("Build a saved filter for cancellations.", shot("Saved filter named 'Cancellations — [state].'"), "State Director"),
      step("Build saved filters for unconverted and open recurring slots.", "Three filters total, each named clearly.", "State Director"),
      step("Demonstrate filters to mentor and Scheduler.", "Both confirm filters surface the right operational signals.", "Mentor"),
    ],
    sop: {
      purpose: "Turn the CR calendar into a usable operational dashboard with three high-leverage saved filters.",
      owner: "State Director Program (Scheduler partnership)",
      inputs: ["CR labels", "Filter configuration"],
      process: [
        "Read SOP.",
        "Confirm label meanings.",
        "Build the three saved filters.",
        "Demonstrate to mentor.",
        "Re-validate after label changes.",
      ],
      escalationTriggers: [
        "Labels used inconsistently across providers.",
        "Saved filters not surfacing expected items.",
      ],
      qualityStandard: "Three saved filters in active daily use.",
      reviewRhythm: "Weekly use. Quarterly audit.",
    },
    scenario: {
      situation: "You notice your Scheduler is using a label inconsistently — some 'cancelled' sessions are tagged 'no-show.'",
      prompt: "What do you do?",
      expectedResponse: "Calibrate. Sit down with the Scheduler and walk through the label definitions in the SOP. Agree on the canonical use of each label. Re-tag the past week's inconsistent sessions. Document the calibration so the team operates on shared definitions.",
      escalationPath: "If labeling drift recurs, raise it with QA — it's a data integrity issue.",
    },
    knowledgeCheck: quiz("sd-w2d2-labels-filters", [
      { q: "Why do labels matter operationally?", opts: ["They're decorative.", "They turn a noisy calendar into a usable signal.", "They're for billing only."], answer: 1 },
      { q: "What do you do when labels are used inconsistently?", opts: ["Ignore it.", "Calibrate with the Scheduler and re-tag the past week.", "Switch tools."], answer: 1 },
    ]),
  },

  "sd-w2d2-session-tracking": {
    learningObjective: "Track session conversion for your state weekly and trace one non-converted session to its root cause.",
    stateDirectorLens: "Conversion is where care becomes revenue. A non-converted session is delivered care without a paycheck.",
    stepByStep: [
      step("Read the Session Tracking & Monitoring SOP.", "Lifecycle: scheduled → delivered → converted → billed.", "You"),
      step("Pull conversion rate for your state for the past week.", shot("Conversion report filtered to your state, last 7 days."), "State Director"),
      step("Identify any non-converted session > 48 hours old.", "List by BCBA and by client.", "State Director", "Non-converted > 48 hours → same-day push to BCBA."),
      step("Trace one non-converted session end-to-end.", "BCBA late on note? Conversion step missed? Tech issue?", "BCBA"),
      step("Bring the conversion % and root cause to your weekly state meeting.", "Make it visible weekly until trending up.", "State Director"),
    ],
    sop: {
      purpose: "Protect revenue and operational integrity by keeping session conversion at or above 95% weekly.",
      owner: "State Director (BCBA partnership)",
      inputs: ["CR conversion report", "BCBA note status", "Billing feedback"],
      process: [
        "Pull weekly conversion %.",
        "Identify non-converted > 48 hours.",
        "Trace one to root cause.",
        "Push completion same day.",
        "Bring to weekly state meeting.",
      ],
      escalationTriggers: [
        "State conversion < 90% for a single week.",
        "Same BCBA with non-converted > 48 hours, 3+ weeks running.",
        "Pattern of non-converted by reason code.",
      ],
      qualityStandard: "≥ 95% conversion weekly. Zero non-converted > 7 days old.",
      reviewRhythm: "Weekly state meeting. Monthly trend review with Billing.",
    },
    scenario: {
      situation: "Conversion for your state dropped from 96% to 87% last week. One BCBA accounts for most of it.",
      prompt: "What's your sequence?",
      expectedResponse: "Talk to the BCBA today. Find out the cause — workload, tech, note backlog, personal. If it's workload, talk to the Scheduler about redistribution. If it's notes, set a daily completion check. If it's tech, loop in CR Admin. Don't let it sit for a second week.",
      escalationPath: "If conversion stays low after a coaching cycle, loop in QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d2-session-tracking", [
      { q: "Why does conversion matter?", opts: ["It doesn't.", "It is where delivered care becomes billable revenue.", "Only at month-end."], answer: 1 },
      { q: "What's the SLA on non-converted sessions?", opts: ["48 hours.", "1 month.", "Whenever Billing asks."], answer: 0 },
    ]),
  },

  "sd-w2d2-scheduling-oversight": {
    learningObjective: "Draw the ownership line between Scheduler and State Director and confirm it with both.",
    stateDirectorLens: "Over-functioning into the Scheduler's chair is the fastest way to drown. Knowing the line protects both of you.",
    stepByStep: [
      step("Read the Scheduling Oversight & Capacity Management SOP.", "Owner boundaries and escalation triggers.", "You"),
      step("Write 'Scheduler owns…' and 'State Director owns…' in two columns.", "Scheduler: builds and adjusts the schedule. SD: protects the state's health.", "You"),
      step("Walk the map with your Scheduler.", "Capture any disagreement and resolve in-meeting.", "Scheduler"),
      step("Confirm escalation triggers: when does the SD get involved?", shot("Written escalation triggers shared with Scheduler."), "State Director"),
      step("Adopt the line for 30 days and review.", "Adjust based on real friction.", "You"),
    ],
    sop: {
      purpose: "Prevent over-functioning by State Directors and clarify scheduling ownership end-to-end.",
      owner: "State Director Program (Scheduling Lead oversight)",
      inputs: ["Role definitions", "State scheduling workflow"],
      process: [
        "Read SOP.",
        "Draft two-column ownership map.",
        "Walk it with Scheduler.",
        "Adopt for 30 days.",
        "Review and adjust.",
      ],
      escalationTriggers: [
        "SD repeatedly doing Scheduler's work.",
        "Scheduler escalating issues SD should not own.",
      ],
      qualityStandard: "Both SD and Scheduler can name what each owns without overlap.",
      reviewRhythm: "30-day review then quarterly.",
    },
    scenario: {
      situation: "A family asks you to reschedule their session because they want a different time slot every week.",
      prompt: "Do you reschedule, or hand it to the Scheduler?",
      expectedResponse: "Hand to the Scheduler. Your role is to make sure the request is routed properly and acknowledged with the family. The Scheduler owns the actual schedule change. If you reschedule yourself, you undercut the Scheduler's visibility into capacity and pairing.",
      escalationPath: "If the family is unhappy with scheduling response time, SD owns the relationship and Scheduler owns the fix.",
    },
    knowledgeCheck: quiz("sd-w2d2-scheduling-oversight", [
      { q: "Who owns building and adjusting the schedule?", opts: ["State Director.", "Scheduler.", "BCBA."], answer: 1 },
      { q: "When a family requests a reschedule, what's the SD's role?", opts: ["Make the change yourself.", "Route to the Scheduler and own the family relationship.", "Ignore it."], answer: 1 },
    ]),
  },

  /* ============= WEEK 2 — DAY 3 (Session Accountability) ============= */
  "sd-w2d3-converted-sessions": {
    learningObjective: "Measure your state's conversion rate and name the lowest-converting BCBA with a root cause.",
    stateDirectorLens: "Converted sessions are the heartbeat of revenue. You don't need to bill — you need to protect conversion.",
    stepByStep: [
      step("Read the Session Conversion Management SOP.", "Conversion definitions, SLAs, and ownership.", "You"),
      step("Pull last week's conversion rate by BCBA.", shot("Conversion report grouped by BCBA, last 7 days."), "State Director"),
      step("Identify the lowest-converting BCBA.", "Compare to state and peer averages.", "State Director"),
      step("Trace the cause: notes, tech, workload, training?", "Conversation, not assumption.", "BCBA", "Same BCBA lowest 3+ weeks → structured coaching with QA."),
      step("Bring the rate, the name, and the cause to your weekly state meeting.", "Visibility drives accountability.", "State Director"),
    ],
    sop: {
      purpose: "Maintain ≥ 95% session conversion across the state by tracking weekly and acting fast.",
      owner: "State Director (BCBA + Scheduler partnership)",
      inputs: ["CR conversion report", "Note completion data"],
      process: [
        "Pull weekly conversion.",
        "Identify lowest performers.",
        "Trace root cause.",
        "Act this week.",
        "Report in state meeting.",
      ],
      escalationTriggers: [
        "BCBA below state average 3+ weeks running.",
        "State conversion < 90%.",
      ],
      qualityStandard: "≥ 95% weekly conversion. < 5% spread between top and bottom BCBA.",
      reviewRhythm: "Weekly state meeting. Monthly with Billing.",
    },
    scenario: {
      situation: "One BCBA has been at 82% conversion for three weeks. Others are at 96%.",
      prompt: "What's the conversation you have?",
      expectedResponse: "Direct, calm, curious. 'I've been watching conversion and noticed you're trending below state average. What's getting in the way?' Listen first. If notes, set a daily check. If workload, talk to Scheduler. If a personal moment, support and adjust. Set a 2-week recheck.",
      escalationPath: "No improvement after 2 weeks of support = QA + Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d3-converted-sessions", [
      { q: "What's the weekly conversion target?", opts: ["75%.", "≥ 95%.", "It doesn't matter."], answer: 1 },
      { q: "What's the first move when one BCBA trends low?", opts: ["Skip the conversation.", "Have a direct, curious conversation this week.", "Wait for month-end."], answer: 1 },
    ]),
  },

  "sd-w2d3-non-converted-sessions": {
    learningObjective: "Maintain a clean non-converted queue with named owner and SLA for resolution.",
    stateDirectorLens: "Non-converted sessions are operational debt. The longer they sit, the harder they are to recover.",
    stepByStep: [
      step("Read the Non-Converted Session Resolution SOP.", "Resolution path and SLAs.", "You"),
      step("Pull the non-converted queue for your state.", shot("Non-converted sessions list, oldest first."), "State Director"),
      step("Confirm the named owner for non-converted resolution.", "Usually the BCBA who delivered the session.", "State Director"),
      step("Set the SLA: convert within 48 hours, escalate at 72 hours.", shot("State-level SLA written on the team agenda."), "You", "Non-converted > 7 days → write-off discussion with Billing."),
      step("Build a daily 5-minute non-converted check into your morning.", "Catch and push same day.", "State Director"),
    ],
    sop: {
      purpose: "Resolve every non-converted session within 48 hours to protect revenue and integrity.",
      owner: "State Director (BCBA accountability)",
      inputs: ["Non-converted queue", "BCBA roster", "Billing feedback"],
      process: [
        "Daily morning queue scan.",
        "Push BCBA same day on > 48 hour items.",
        "Escalate at 72 hours.",
        "Track weekly trend.",
        "Report to state meeting.",
      ],
      escalationTriggers: [
        "Non-converted > 72 hours.",
        "Same BCBA repeatedly missing the SLA.",
        "Non-converted > 7 days (write-off risk).",
      ],
      qualityStandard: "Zero non-converted > 7 days. < 5 non-converted > 48 hours on any given Monday.",
      reviewRhythm: "Daily check. Weekly state meeting. Monthly Billing review.",
    },
    scenario: {
      situation: "You see 12 sessions non-converted from last Wednesday — six days ago.",
      prompt: "What do you do today?",
      expectedResponse: "Today: list the BCBAs responsible. Personal message each one with the specific list and a same-day completion ask. If any won't convert by EOD, get the reason in writing. Loop in Billing on anything trending toward 7 days so a write-off decision happens with awareness, not surprise.",
      escalationPath: "Repeated late non-converted = pattern conversation with QA.",
    },
    knowledgeCheck: quiz("sd-w2d3-non-converted-sessions", [
      { q: "What's the resolution SLA on a non-converted session?", opts: ["48 hours.", "30 days.", "When Billing asks."], answer: 0 },
      { q: "What happens at 7 days non-converted?", opts: ["Nothing.", "Write-off risk — loop in Billing.", "Auto-resolve."], answer: 1 },
    ]),
  },

  "sd-w2d3-session-integrity": {
    learningObjective: "Name three session-integrity red flags and the escalation path for each.",
    stateDirectorLens: "Integrity is non-negotiable. Soft integrity is how companies get into compliance trouble.",
    stepByStep: [
      step("Read the Session Integrity & Fraud Prevention SOP.", "Definitions of integrity issues vs honest mistakes.", "You"),
      step("Identify three red flags: timestamp mismatch, missing signature, duplicate session.", shot("CR session detail showing integrity field."), "State Director", "Any integrity red flag → escalate to QA same day."),
      step("Walk the escalation path with QA.", "Who is notified, in what order, with what evidence.", "QA"),
      step("Communicate the standard to your BCBAs and RBTs.", "Calm, clear, non-accusatory.", "State Director"),
      step("Confirm your monitoring rhythm: weekly scan + immediate response to flags.", "Discipline beats luck.", "You"),
    ],
    sop: {
      purpose: "Protect Blossom and our families from fraud, errors, and audit risk by enforcing strict session integrity.",
      owner: "QA Lead (State Director partnership)",
      inputs: ["Session records", "Signature data", "Timestamp logs"],
      process: [
        "Weekly integrity scan.",
        "Immediate escalation on red flags.",
        "Coaching for honest mistakes.",
        "Formal review for repeated issues.",
        "Document every decision.",
      ],
      escalationTriggers: [
        "Timestamp mismatch > 15 minutes.",
        "Missing or forged signatures.",
        "Duplicate sessions for same client/time.",
      ],
      qualityStandard: "Zero unaddressed integrity flags > 24 hours.",
      reviewRhythm: "Weekly scan. Immediate response to red flags.",
    },
    scenario: {
      situation: "A session in CR shows a 4-hour duration but the parent says the RBT was only there 2 hours.",
      prompt: "What's your move?",
      expectedResponse: "Treat as integrity until proven otherwise. Pull the session, compare timestamps and any clock-in data. Talk to the RBT and the BCBA. Document everything in writing. Loop in QA same day. Do not adjust the session yourself — let QA own the resolution path.",
      escalationPath: "QA → Operations Leadership → Compliance if pattern.",
    },
    knowledgeCheck: quiz("sd-w2d3-session-integrity", [
      { q: "What's the difference between an integrity issue and an honest mistake?", opts: ["No difference.", "Integrity is about intent and pattern; mistakes get coached, integrity gets escalated.", "Mistakes are worse."], answer: 1 },
      { q: "What do you do when a parent reports a session duration mismatch?", opts: ["Adjust the session.", "Document, talk to the team, escalate to QA same day.", "Ignore the parent."], answer: 1 },
    ]),
  },

  "sd-w2d3-schedule-monitoring": {
    learningObjective: "Build a personal Monday-morning monitoring checklist that surfaces risk in under 15 minutes.",
    stateDirectorLens: "Monitoring is what turns a calendar into early warning. Without rhythm, the calendar is just history.",
    stepByStep: [
      step("Read the Schedule Monitoring & Operational Visibility SOP.", "Recommended cadences and metrics.", "You"),
      step("Draft a Monday checklist: conversion %, open slots, repeat cancels, integrity flags.", shot("Personal Monday checklist (markdown or notebook)."), "State Director"),
      step("Set 15 minutes on your Monday calendar for the scan.", "Discipline becomes operational habit.", "You"),
      step("Walk through the checklist with mentor.", "Mentor adjusts based on state-specific patterns.", "Mentor"),
      step("Use the checklist for two weeks then refine.", "What you scan should evolve as the state matures.", "You"),
    ],
    sop: {
      purpose: "Surface the State's operational health every Monday before the week starts moving.",
      owner: "State Director Program",
      inputs: ["CR reports", "Calendar", "Non-converted queue"],
      process: [
        "15-minute Monday scan.",
        "Capture conversion, open slots, repeat cancels, integrity flags.",
        "Set top 3 priorities for the week.",
        "Share with team in Monday meeting.",
        "Refine the checklist monthly.",
      ],
      escalationTriggers: [
        "Two consecutive Mondays surfacing the same unresolved item.",
      ],
      qualityStandard: "Monday scan takes < 15 minutes and drives the week's top 3 priorities.",
      reviewRhythm: "Weekly use. Monthly refinement.",
    },
    scenario: {
      situation: "Your Monday scan shows conversion at 91%, three repeat-cancellation clients, and one integrity flag from Friday.",
      prompt: "What are this week's top three priorities?",
      expectedResponse: "(1) Integrity flag — escalate to QA today. (2) Conversion at 91% — identify which BCBA(s) and have a same-week conversation. (3) Repeat cancellations — pick the one with the most clinical risk and turn it into a retention conversation with the BCBA and family.",
      escalationPath: "If the integrity flag turns out to be a pattern, loop in Operations Leadership immediately.",
    },
    knowledgeCheck: quiz("sd-w2d3-schedule-monitoring", [
      { q: "What's the Monday scan's purpose?", opts: ["Busywork.", "Surface operational health and set the week's top priorities.", "Reporting to leadership."], answer: 1 },
      { q: "How long should the Monday scan take?", opts: ["A full morning.", "< 15 minutes.", "Variable."], answer: 1 },
    ]),
  },

  /* ============= WEEK 2 — DAY 4 (Lead & Intake Flow) ============= */
  "sd-w2d4-lead-lifecycle": {
    learningObjective: "Walk one real lead end-to-end and name the stage with the longest dwell time in your state.",
    stateDirectorLens: "Leads that stall become families without care. The lead lifecycle is where your state's growth lives or dies.",
    stepByStep: [
      step("Read the Lead Lifecycle Management SOP.", "Stages: inquiry → contact → VOB → consent → assessment scheduled.", "You"),
      step("Open your state's lead pipeline.", shot("Lead pipeline filtered to your state."), "State Director"),
      step("Walk one real lead end-to-end with the Intake Coordinator.", "Note dwell time in each stage.", "Intake Coordinator"),
      step("Identify the stage with the longest dwell time.", "Common: inquiry → contact, VOB → consent.", "State Director", "Any lead aged > 7 days in a stage → same-day unblock."),
      step("Bring the longest-dwell stage and a first fix to your weekly state meeting.", "Visibility drives accountability.", "State Director"),
    ],
    sop: {
      purpose: "Move every lead through the lifecycle without dropping families along the way.",
      owner: "Intake Coordinator (State Director oversight)",
      inputs: ["Lead pipeline", "VOB workflow", "Consent workflow"],
      process: [
        "Triage inbound daily.",
        "Move leads within stage SLAs.",
        "Surface stuck leads weekly.",
        "SD unblocks at the breakpoint.",
        "Report pipeline health to state meeting.",
      ],
      escalationTriggers: [
        "Lead aged > 7 days in a single stage.",
        "Drop-off rate spike at a single stage.",
        "Family complaint about responsiveness.",
      ],
      qualityStandard: "< 5% of leads aged > 7 days at any time. Inquiry-to-assessment < 21 days median.",
      reviewRhythm: "Daily triage. Weekly state meeting.",
    },
    scenario: {
      situation: "A lead has been sitting in 'awaiting VOB' for 9 days. The family has called twice.",
      prompt: "What's your sequence?",
      expectedResponse: "Call the VOB team today and confirm what's blocking. Personally call the family with a real timeline, not a generic 'we're working on it.' Once the VOB lands, push to consent the same day. Document the recovery so the pattern doesn't repeat. Bring it to your weekly state meeting as a process gap, not a one-off.",
      escalationPath: "Repeated VOB delays = process conversation with VOB team and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d4-lead-lifecycle", [
      { q: "What's the SLA for a lead sitting in a single stage?", opts: ["No SLA.", "7 days max before escalation.", "30 days."], answer: 1 },
      { q: "What's the State Director's role in the lead pipeline?", opts: ["Run Intake.", "Unblock at the breakpoint and own the family experience.", "Track only."], answer: 1 },
    ]),
  },

  "sd-w2d4-phone-calls-workflow": {
    learningObjective: "Confirm that inbound family calls are logged, routed, and followed up within SLA.",
    stateDirectorLens: "First calls set the family's experience of Blossom. A dropped call is a dropped family.",
    stepByStep: [
      step("Read the Phone Calls & Lead Follow-Up Process SOP.", "Logging, routing, and SLA expectations.", "You"),
      step("Review one recent inbound call workflow.", shot("Call log entry showing status, owner, follow-up."), "Intake Coordinator"),
      step("Confirm the follow-up SLA was met.", "Usually within 1 business day.", "State Director"),
      step("Identify any calls without follow-up.", "Same-day push.", "State Director", "Family called twice with no follow-up → SD personally calls family."),
      step("Bring SLA adherence and any gaps to your weekly state meeting.", "Visibility prevents pattern.", "State Director"),
    ],
    sop: {
      purpose: "Ensure every inbound family call is logged, routed, and followed up within 1 business day.",
      owner: "Intake Coordinator (State Director oversight)",
      inputs: ["Call log", "Inbound routing rules", "Follow-up queue"],
      process: [
        "Log every inbound call.",
        "Route within 4 hours.",
        "Follow up within 1 business day.",
        "Confirm follow-up landed.",
        "Report adherence weekly.",
      ],
      escalationTriggers: [
        "Family called twice without response.",
        "Follow-up SLA missed > 5% of inbound.",
        "Routing errors > once per week.",
      ],
      qualityStandard: "100% of inbound calls logged. ≥ 95% follow-up within 1 business day.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "A family tells you they've called three times and no one has called them back.",
      prompt: "What do you do in the next 30 minutes?",
      expectedResponse: "Call the family yourself. Apologize plainly. Get the operational details (when they called, what they need). Stay on the phone until you have an answer or a real timeline. Then pull the call log, find the gap, and address with the Intake team — calmly, with the goal of preventing the next one.",
      escalationPath: "If three-call gap recurs, raise it with Intake Lead as a process issue.",
    },
    knowledgeCheck: quiz("sd-w2d4-phone-calls-workflow", [
      { q: "What's the inbound follow-up SLA?", opts: ["No SLA.", "1 business day.", "1 week."], answer: 1 },
      { q: "A family says they've called three times with no response. First move?", opts: ["Email them.", "Call them yourself in the next 30 minutes.", "Wait for Intake to call."], answer: 1 },
    ]),
  },

  "sd-w2d4-intake-workflow": {
    learningObjective: "Map your state's Intake board and identify clients stuck > 7 days in a single stage.",
    stateDirectorLens: "Intake is where the State Director's growth promise gets tested. Gaps here become lost families.",
    stepByStep: [
      step("Read the Intake Workflow Management SOP.", "Stages, SLAs, and ownership.", "You"),
      step("Open the Intake board for your state.", shot("Intake board grouped by stage."), "State Director"),
      step("Identify any client aged > 7 days in a single stage.", "List by stage and by owner.", "State Director", "Any stuck client > 7 days → SD-led unblock conversation."),
      step("Build an unblock plan with the Intake Coordinator.", "Named owner, specific next move, due date.", "Intake Coordinator"),
      step("Bring the list and the plan to your weekly state meeting.", "Visibility drives accountability.", "State Director"),
    ],
    sop: {
      purpose: "Move Intake clients through the workflow without losing families to operational gaps.",
      owner: "Intake Coordinator (State Director oversight)",
      inputs: ["Intake board", "VOB workflow", "Consent workflow", "Assessment scheduling"],
      process: [
        "Daily triage.",
        "Move clients within stage SLAs.",
        "Surface stuck clients weekly.",
        "SD unblocks at the breakpoint.",
        "Report Intake health weekly.",
      ],
      escalationTriggers: [
        "Client > 7 days in a single stage.",
        "Drop-off rate spike at a stage.",
        "Family complaint about Intake responsiveness.",
      ],
      qualityStandard: "< 5% of Intake clients > 7 days in a single stage. Inquiry-to-assessment < 21 days median.",
      reviewRhythm: "Daily triage. Weekly state meeting.",
    },
    scenario: {
      situation: "You see four clients stuck in 'awaiting consent' for over 10 days each. Intake says families haven't responded.",
      prompt: "What's the right response?",
      expectedResponse: "Don't accept 'they haven't responded' as the final answer. Get the names. Pick the two with most clinical urgency and personally reach the families today (call, text, email — all three if needed). Set a 48-hour close for the other two. Build a 'consent reminder' rhythm so this doesn't accumulate again.",
      escalationPath: "If consent gaps persist, raise with Intake Lead and consider workflow redesign.",
    },
    knowledgeCheck: quiz("sd-w2d4-intake-workflow", [
      { q: "What's the State Director's role on the Intake board?", opts: ["Run Intake.", "Unblock stuck clients and own family experience.", "Watch only."], answer: 1 },
      { q: "How long should a client sit in a single Intake stage?", opts: ["No limit.", "< 7 days, then SD-led unblock.", "30 days."], answer: 1 },
    ]),
  },

  "sd-w2d4-consent-workflow": {
    learningObjective: "Verify three recent client starts have consents on file and know the named storage location.",
    stateDirectorLens: "Consent gaps block services and create compliance risk. A clean consent process is how care starts on time.",
    stepByStep: [
      step("Read the Consent Form Management SOP.", "Required forms, storage, validation.", "You"),
      step("Pull the last three client starts in your state.", shot("Client roster sorted by start date."), "State Director"),
      step("Verify consent forms are on file for each.", shot("Client document tab showing signed consent."), "State Director", "Any missing consent → block service until resolved."),
      step("Confirm the named storage location with the Intake Coordinator.", "Usually CR client documents tab.", "State Director"),
      step("Document the escalation path for missing consents.", "Family contact → re-sign → file → resume care.", "You"),
    ],
    sop: {
      purpose: "Ensure every active client has valid consent on file before services begin.",
      owner: "Intake Coordinator (State Director audit)",
      inputs: ["Client roster", "Consent forms", "Storage location"],
      process: [
        "Verify consent at client start.",
        "Store in the canonical location.",
        "Audit monthly.",
        "Escalate any gap same day.",
        "Block service until resolved.",
      ],
      escalationTriggers: [
        "Client started without consent.",
        "Consent missing > 24 hours after detection.",
        "Storage location inconsistent across clients.",
      ],
      qualityStandard: "100% of active clients have valid consent on file.",
      reviewRhythm: "Monthly state audit.",
    },
    scenario: {
      situation: "An audit shows two active clients in your state are missing signed consent forms.",
      prompt: "What do you do today?",
      expectedResponse: "Pause non-essential services on both clients while you resolve. Contact the families directly to re-sign — explain calmly that it's a process correction, not a problem with them. Get signatures filed today if possible. Document the recovery and walk the Intake Coordinator through how to prevent this at start.",
      escalationPath: "Compliance issue — loop in QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d4-consent-workflow", [
      { q: "What happens when a client is missing consent?", opts: ["Continue services.", "Block service until resolved and re-sign with the family.", "Wait for QA to flag."], answer: 1 },
      { q: "What's the quality standard for consent?", opts: ["Most clients.", "100% of active clients have valid consent on file.", "Whichever we have time for."], answer: 1 },
    ]),
  },

  /* ============= WEEK 2 — DAY 5 (Client Lifecycle) ============= */
  "sd-w2d5-vob-process": {
    learningObjective: "Walk one VOB end-to-end and name the typical stall point in your state.",
    stateDirectorLens: "A bad VOB is a bad start. Wrong coverage means wrong auths, wrong billing, and a family that loses care later.",
    stepByStep: [
      step("Read the Verification of Benefits (VOB) Process SOP.", "Solum workflow, owner, SLAs.", "You"),
      step("Walk one VOB end-to-end with the responsible team.", shot("Solum VOB record showing status timeline."), "VOB Team"),
      step("Identify the typical stall point.", "Common: payer slow response, missing client info.", "State Director"),
      step("Confirm the SLA from inquiry to completed VOB.", "Usually 3-5 business days.", "State Director", "VOB > 5 business days → SD escalation to VOB lead."),
      step("Document the escalation path and bring to your weekly state meeting.", "Visibility drives accountability.", "You"),
    ],
    sop: {
      purpose: "Verify benefits accurately and quickly so authorizations and billing start clean.",
      owner: "VOB Team (State Director partnership)",
      inputs: ["Solum", "Client demographic data", "Insurance details"],
      process: [
        "Receive VOB request from Intake.",
        "Run benefits via Solum.",
        "Confirm coverage and capture details.",
        "Return to Intake within SLA.",
        "Document for Authorization team.",
      ],
      escalationTriggers: [
        "VOB > 5 business days.",
        "Coverage discrepancy detected.",
        "Repeat payer-specific delays.",
      ],
      qualityStandard: "≥ 95% of VOBs returned within 5 business days. Zero authorizations submitted on wrong coverage.",
      reviewRhythm: "Weekly with VOB lead.",
    },
    scenario: {
      situation: "A VOB has been pending for 8 business days. The family is asking when services start.",
      prompt: "What's your sequence?",
      expectedResponse: "Today: call the VOB team and find out what's specifically blocking. If payer-side, ask for the payer reference and call them yourself if needed. Update the family with a real timeline. Once the VOB lands, push to consent the same day. Document the delay so the VOB lead can address the pattern.",
      escalationPath: "If payer delays recur, raise systemically with Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d5-vob-process", [
      { q: "What's the VOB SLA?", opts: ["No SLA.", "≥ 95% returned within 5 business days.", "30 days."], answer: 1 },
      { q: "What's the risk of starting auth on a bad VOB?", opts: ["No risk.", "Wrong coverage → wrong auth → wrong billing → family loses care.", "Only billing impact."], answer: 1 },
    ]),
  },

  "sd-w2d5-assessment-process": {
    learningObjective: "Identify any assessment > 14 days from authorization to schedule and build a close-the-gap plan.",
    stateDirectorLens: "Assessments are the bridge from intake to active care. Delays are lost weeks.",
    stepByStep: [
      step("Read the Assessment Scheduling & Oversight SOP.", "Stages, owner, SLAs.", "You"),
      step("Pull the assessment queue for your state.", shot("Assessment pipeline showing days from auth to schedule."), "State Director"),
      step("Identify any assessment > 14 days from auth to scheduled.", "List by client and BCBA.", "State Director", "Assessment > 14 days → SD-led scheduling push."),
      step("Build a close-the-gap plan with the BCBA and Scheduler.", "Named slot, named owner, named date.", "BCBA"),
      step("Bring delayed assessments to your weekly state meeting.", "Make visible until pattern breaks.", "State Director"),
    ],
    sop: {
      purpose: "Schedule and complete assessments within 14 days of authorization to start care on time.",
      owner: "BCBA + Scheduler (State Director oversight)",
      inputs: ["Assessment queue", "BCBA availability", "Family availability"],
      process: [
        "Schedule within 7 days of auth.",
        "Complete within 14 days of auth.",
        "Submit treatment plan within 7 days of assessment.",
        "Surface delays weekly.",
        "SD unblocks at the gap.",
      ],
      escalationTriggers: [
        "Assessment > 14 days from auth without schedule.",
        "Treatment plan > 7 days from assessment.",
        "Family unavailability > 14 days.",
      ],
      qualityStandard: "≥ 90% assessments complete within 14 days of auth.",
      reviewRhythm: "Weekly with BCBA team.",
    },
    scenario: {
      situation: "Three assessments in your state have been unscheduled for 18+ days. BCBAs say they're full.",
      prompt: "What do you do?",
      expectedResponse: "Get the names today. Talk to the Scheduler and Recruiting about capacity — full BCBAs means the state needs more or different scheduling. Short term: find slot creativity (different BCBA, weekend, evening) and ask families directly what works. Long term: raise it as a capacity issue at your weekly state meeting.",
      escalationPath: "Repeated capacity gaps = Operations Leadership + Recruiting conversation.",
    },
    knowledgeCheck: quiz("sd-w2d5-assessment-process", [
      { q: "What's the assessment SLA?", opts: ["No SLA.", "Complete within 14 days of authorization.", "Within 90 days."], answer: 1 },
      { q: "What does sustained assessment delay usually signal?", opts: ["Lazy BCBAs.", "Capacity gap — staffing or scheduling.", "Bad families."], answer: 1 },
    ]),
  },

  "sd-w2d5-client-workflow": {
    learningObjective: "Walk three active clients end-to-end and note any stage transition that exceeded SOP timing.",
    stateDirectorLens: "You are the only person who sees a client end-to-end. That perspective is the entire job.",
    stepByStep: [
      step("Read the Client Lifecycle Management SOP.", "Stages and expected transitions.", "You"),
      step("Pick three active clients with varied tenure.", "New, mid-tenure, long-term.", "State Director"),
      step("Walk each through their full timeline.", shot("Client timeline view showing stage history."), "State Director"),
      step("Note any transition that exceeded SOP timing.", "Inquiry → VOB, VOB → consent, assessment → auth, auth → schedule.", "You", "Any transition consistently slow across clients → process conversation."),
      step("Bring patterns to your weekly state meeting.", "Patterns are signals.", "State Director"),
    ],
    sop: {
      purpose: "Give the State Director real visibility into how clients actually flow through Blossom in their state.",
      owner: "State Director Program",
      inputs: ["Client roster", "CR timeline data", "Stage SLAs"],
      process: [
        "Sample three clients monthly.",
        "Walk each timeline.",
        "Note transition delays.",
        "Surface patterns.",
        "Adjust process where the same delay recurs.",
      ],
      escalationTriggers: [
        "Same transition slow across multiple clients.",
        "Specific BCBA consistently slow on a stage.",
      ],
      qualityStandard: "State Director can describe the end-to-end client experience for any client in their state in < 2 minutes.",
      reviewRhythm: "Monthly sample.",
    },
    scenario: {
      situation: "Walking three clients reveals the same pattern: 5-7 day gap between assessment completion and treatment plan submission.",
      prompt: "What's the right response?",
      expectedResponse: "It's a process gap, not three BCBA mistakes. Sit with the BCBAs and ask what's getting in the way (workload, template, QA back-and-forth). Adjust the workflow — maybe a tighter QA loop or a template improvement. Re-sample in 30 days to confirm the fix held.",
      escalationPath: "If the pattern persists after process change, raise with QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w2d5-client-workflow", [
      { q: "Why does the State Director walk client timelines?", opts: ["To check on BCBAs.", "Because they're the only one who sees the client end-to-end.", "Compliance."], answer: 1 },
      { q: "What does a recurring transition delay signal?", opts: ["Bad luck.", "A process gap — fix the workflow, not the individuals.", "BCBA laziness."], answer: 1 },
    ]),
  },

  "sd-w2d5-active-client-lifecycle": {
    learningObjective: "Identify three at-risk active clients in your state and define a check-back plan for each.",
    stateDirectorLens: "An active client that goes quiet often becomes a churned client. Catching the signal early is the difference between retention and loss.",
    stepByStep: [
      step("Read the Active Client Oversight SOP.", "Risk signals and check-back rhythms.", "You"),
      step("Pull active client list with utilization, cancellations, and PR status.", shot("Active client roster with risk indicators."), "State Director"),
      step("Identify three at-risk clients.", "Drop in hours, repeat cancellations, missing PR, communication silence.", "State Director", "Any client with 3+ cancellations in 4 weeks → retention conversation."),
      step("Define a check-back plan: who calls, when, what we want to learn.", "Plan is operational, not vague.", "BCBA + State Director"),
      step("Bring the three names and the plan to your weekly state meeting.", "Track until resolved.", "State Director"),
    ],
    sop: {
      purpose: "Catch active-client risk early and convert it into retention conversations before it becomes churn.",
      owner: "State Director (BCBA partnership)",
      inputs: ["Active client roster", "Utilization data", "Cancellation log", "PR status"],
      process: [
        "Weekly risk scan.",
        "Identify three at-risk clients.",
        "Define check-back plan.",
        "Execute and document.",
        "Track outcomes.",
      ],
      escalationTriggers: [
        "Three+ cancellations in 4 weeks.",
        "Utilization drop > 20% week-over-week.",
        "Missing PR > 7 days.",
        "No family communication > 14 days.",
      ],
      qualityStandard: "Zero churned clients without a documented retention attempt.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "A client has dropped from 20 hours/week to 8 hours/week over the past month. The family hasn't responded to two outreach attempts.",
      prompt: "What's your move?",
      expectedResponse: "Call the family yourself today. Don't text — call. Lead with concern, not data. Ask what's changed and what would help. Document what you hear. Adjust care plan (pairing, time, frequency) based on what they tell you. Loop in the BCBA. Set a 2-week check-back. If you can't reach them, escalate as retention risk in your state meeting.",
      escalationPath: "If retention attempt fails, document the loss with reason code for state-level pattern review.",
    },
    knowledgeCheck: quiz("sd-w2d5-active-client-lifecycle", [
      { q: "What's the first signal of an at-risk active client?", opts: ["Cancellation pattern.", "Drop in hours.", "Either — both deserve a retention conversation."], answer: 2 },
      { q: "When utilization drops sharply, who calls the family?", opts: ["The Scheduler.", "The State Director or BCBA — direct call, not text.", "Nobody."], answer: 1 },
    ]),
  },

  /* ============= WEEK 3 — DAY 1 (Authorization Foundations) ============= */
  "sd-w3d1-authorization-lifecycle": {
    learningObjective: "Walk an auth end-to-end and document every status transition with its SLA.",
    stateDirectorLens: "An auth lifecycle break is a child losing care. Knowing the lifecycle is how you prevent the break.",
    stepByStep: [
      step("Read the Authorization Lifecycle Management SOP.", "Full lifecycle: request → draft → submit → approve → utilize → renew.", "You"),
      step("Pick one auth with your Authorization Coordinator.", shot("Authorization record showing status history."), "Authorization Coordinator"),
      step("Walk every status transition.", "Capture timestamps and SLA at each.", "Authorization Coordinator"),
      step("Document the lifecycle map for your state.", "Reference for the team.", "You", "Any stage exceeding SLA → SD escalates same day."),
      step("Confirm the map with your mentor.", "Mentor calibrates against state reality.", "Mentor"),
    ],
    sop: {
      purpose: "Ensure every authorization moves through its lifecycle without lapses that interrupt care.",
      owner: "Authorization Coordinator (State Director oversight)",
      inputs: ["Authorization records", "Status timeline", "Payer SLAs"],
      process: [
        "Request via assessment recommendation.",
        "Draft within 3 business days.",
        "Submit within 5 business days of draft.",
        "Track approval status weekly.",
        "Renew 30 days before expiration.",
      ],
      escalationTriggers: [
        "Any stage exceeding SLA.",
        "Auth approaching 14 days from expiration without submission.",
        "Denial without resubmission plan within 48 hours.",
      ],
      qualityStandard: "Zero lapsed authorizations.",
      reviewRhythm: "Weekly Monday auth review.",
    },
    scenario: {
      situation: "An auth has been in 'awaiting submission' for 12 days. Expiration is in 18 days.",
      prompt: "What do you do today?",
      expectedResponse: "Walk to the Authorization Coordinator's desk (or call). Find out specifically what's blocking — is it BCBA, payer, internal QA? Get a commit to submit by EOD tomorrow. Document the unblock. Track the auth daily until approved. Add this client to your weekly state meeting watch list.",
      escalationPath: "If auth lapses, loop in Operations Leadership and notify family with care plan.",
    },
    knowledgeCheck: quiz("sd-w3d1-authorization-lifecycle", [
      { q: "What's the renewal SLA?", opts: ["Submit at expiration.", "Renew 30 days before expiration.", "Renew when family asks."], answer: 1 },
      { q: "What's the State Director's role in the lifecycle?", opts: ["Submit auths personally.", "Prevent lapses by tracking and escalating breaks at any stage.", "Track only."], answer: 1 },
    ]),
  },

  "sd-w3d1-auth-statuses": {
    learningObjective: "Map each authorization status to a specific operational action the State Director will take.",
    stateDirectorLens: "A status without an action is decoration. Turning statuses into actions is how you operationalize the auth queue.",
    stepByStep: [
      step("Read the Authorization Status Management SOP.", "Status definitions.", "You"),
      step("List every status used in your state's auth board.", shot("Auth board grouped by status."), "State Director"),
      step("Map each status to a specific operational action.", "Awaiting submission → daily push. In review → weekly check. Denied → resubmission plan in 48 hours.", "State Director"),
      step("Confirm the mapping with your Authorization Coordinator.", "Coordinator confirms operational fit.", "Authorization Coordinator"),
      step("Adopt the mapping for 30 days and refine.", "Patterns will emerge.", "You"),
    ],
    sop: {
      purpose: "Standardize the State Director's operational response to each authorization status.",
      owner: "Authorization Coordinator (State Director partnership)",
      inputs: ["Auth status list", "Operational SLAs"],
      process: [
        "List statuses.",
        "Map to actions.",
        "Confirm with Coordinator.",
        "Adopt for 30 days.",
        "Refine based on real patterns.",
      ],
      escalationTriggers: [
        "Status with no clear action.",
        "Auth staying in one status > SLA.",
      ],
      qualityStandard: "Every status has a defined SD action and SLA.",
      reviewRhythm: "Monthly with Authorization Coordinator.",
    },
    scenario: {
      situation: "You see five auths in 'awaiting payer response' for 21 days.",
      prompt: "What action does that status trigger?",
      expectedResponse: "Per your mapping: at 14 days, the Authorization Coordinator follows up with the payer. At 21 days, the SD escalates to the payer's escalation contact or to the Authorization Lead for help. Pick up the phone, find out where the requests are, get a commit. Document every contact.",
      escalationPath: "Payer non-response > 28 days = Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d1-auth-statuses", [
      { q: "Why map every status to an action?", opts: ["For completeness.", "Because a status without an action is decoration.", "For training."], answer: 1 },
      { q: "What happens at 21 days 'awaiting payer response'?", opts: ["Keep waiting.", "SD escalates to the payer's escalation contact.", "Drop the auth."], answer: 1 },
    ]),
  },

  "sd-w3d1-submission-process": {
    learningObjective: "Confirm your state's submission cadence and identify any submission > 7 days late.",
    stateDirectorLens: "Submission discipline is what keeps auths from lapsing. Without a clean process, hours get lost in the gap.",
    stepByStep: [
      step("Read the Authorization Submission Process SOP.", "Submission cadence, QA, follow-up.", "You"),
      step("Confirm your state's submission cadence.", "Usually batched 2-3 times per week.", "Authorization Coordinator"),
      step("Identify any submission > 7 days late.", shot("Submission queue sorted by age."), "State Director", "Submission > 7 days late → SD-led unblock today."),
      step("Confirm the QA step before each submission.", "Avoid resubmissions for fixable errors.", "QA"),
      step("Document the named owner and bring to your weekly state meeting.", "Visibility drives accountability.", "You"),
    ],
    sop: {
      purpose: "Submit every authorization on time and clean so approval is not delayed by avoidable errors.",
      owner: "Authorization Coordinator (QA + State Director partnership)",
      inputs: ["Submission queue", "QA checklist", "Payer portals"],
      process: [
        "Draft auth.",
        "QA review before submission.",
        "Submit in batched cadence.",
        "Confirm submission landed in payer system.",
        "Track to approval.",
      ],
      escalationTriggers: [
        "Submission > 7 days late.",
        "QA returns auth > twice.",
        "Payer rejection on submission format.",
      ],
      qualityStandard: "≥ 95% of submissions accepted by payer on first attempt. Zero submissions > 7 days late.",
      reviewRhythm: "Weekly Monday review.",
    },
    scenario: {
      situation: "Two auths drafted 11 days ago still haven't been submitted. Coordinator says QA is the bottleneck.",
      prompt: "What's your move?",
      expectedResponse: "Talk to QA today. Find out specifically what's blocking — capacity, document quality, ambiguity. Get a commit for both auths by EOD tomorrow. If QA is over capacity, raise the pattern at your weekly state meeting and with QA Lead. Don't let either auth slip another day.",
      escalationPath: "Sustained QA bottleneck = QA Lead + Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d1-submission-process", [
      { q: "What's the submission SLA?", opts: ["No SLA.", "Submit within 7 days of draft.", "Within 30 days."], answer: 1 },
      { q: "What's the QA role in submission?", opts: ["Optional.", "Quality check before submission to avoid rejection.", "Post-submission only."], answer: 1 },
    ]),
  },

  /* ============= WEEK 3 — DAY 2 (Treatment Authorizations) ============= */
  "sd-w3d2-initial-auths": {
    learningObjective: "Review three initial auths and confirm hours requested align with the assessment recommendation.",
    stateDirectorLens: "A weak initial auth shapes every future renewal. The first auth is the foundation of the client's care budget.",
    stepByStep: [
      step("Read the Initial Authorization Management SOP.", "Initial auth workflow and alignment with assessment.", "You"),
      step("Pull three recent initial auths in your state.", shot("Initial auths list with hours and assessment links."), "State Director"),
      step("Compare auth hours requested to assessment recommendation.", "Identify any gap.", "State Director", "Auth hours less than recommendation → reconsideration with BCBA."),
      step("Confirm any approved-for-less auths have a reconsideration plan.", "Plan: appeal, partial start, payer follow-up.", "Authorization Coordinator"),
      step("Document patterns and bring to weekly state meeting.", "Initial auth misalignment compounds over renewals.", "State Director"),
    ],
    sop: {
      purpose: "Start every client with an authorization that reflects clinical need, not just what's easy to get.",
      owner: "BCBA + Authorization Coordinator (State Director oversight)",
      inputs: ["Assessment recommendation", "Payer guidelines", "Auth request template"],
      process: [
        "BCBA recommends hours from assessment.",
        "Coordinator submits at recommendation.",
        "Track payer response.",
        "If approved for less, reconsider or appeal.",
        "Document the final outcome.",
      ],
      escalationTriggers: [
        "Auth approved for < 75% of recommendation.",
        "Pattern of low approvals from a payer.",
        "BCBA recommendation softened before submission.",
      ],
      qualityStandard: "≥ 90% of initial auths approved at requested hours.",
      reviewRhythm: "Monthly with BCBA and Coordinator.",
    },
    scenario: {
      situation: "A new client was recommended 25 hours/week; the payer approved 15.",
      prompt: "What's the right operational response?",
      expectedResponse: "Don't accept silently. Confirm with the BCBA that 25 was the clinical recommendation. Submit a reconsideration with supporting documentation. Communicate with the family about what's happening and what care looks like at 15 in the interim. Track the appeal. Don't let the partial approval become the new normal.",
      escalationPath: "Pattern of low approvals from one payer = Operations Leadership for payer-level conversation.",
    },
    knowledgeCheck: quiz("sd-w3d2-initial-auths", [
      { q: "Why does the initial auth matter beyond month one?", opts: ["It doesn't.", "It shapes every future renewal.", "Only for new clients."], answer: 1 },
      { q: "What's the response when an auth is approved for less than recommended?", opts: ["Accept it.", "Reconsider or appeal with supporting documentation.", "Drop the client."], answer: 1 },
    ]),
  },

  "sd-w3d2-treatment-auths": {
    learningObjective: "Pull all treatment auths expiring in 60 days and confirm a named submission plan for each.",
    stateDirectorLens: "Treatment auth gaps are the most common cause of lost hours. Weekly monitoring is the discipline that prevents them.",
    stepByStep: [
      step("Read the Treatment Authorization Management SOP.", "Renewal cadence and submission requirements.", "You"),
      step("Pull all treatment auths expiring in 60 days.", shot("Auth board filtered to 'expiring in 60 days.'"), "State Director"),
      step("Confirm a named owner for each renewal.", "Usually BCBA + Authorization Coordinator.", "State Director"),
      step("Confirm a submission date target 30 days before expiration.", "30-day buffer absorbs payer turn time.", "Authorization Coordinator", "Any auth without submission plan → SD-led plan today."),
      step("Bring the 60-day list and submission plan to your weekly state meeting.", "Standing agenda item.", "State Director"),
    ],
    sop: {
      purpose: "Renew every treatment authorization on time so no client experiences a coverage gap.",
      owner: "BCBA + Authorization Coordinator (State Director oversight)",
      inputs: ["Auth board", "PR completion status", "Payer SLAs"],
      process: [
        "60-day forward scan weekly.",
        "Submit 30 days before expiration.",
        "Confirm PR is complete pre-submission.",
        "Track payer response.",
        "Confirm approval before expiration.",
      ],
      escalationTriggers: [
        "Auth within 14 days of expiration without submission.",
        "Missing PR blocking submission.",
        "Payer non-response > 21 days.",
      ],
      qualityStandard: "Zero lapsed treatment authorizations.",
      reviewRhythm: "Weekly Monday auth review.",
    },
    scenario: {
      situation: "Your 60-day scan shows 8 auths expiring. Three have no PR submitted yet.",
      prompt: "What's your sequence?",
      expectedResponse: "Prioritize the three with no PR — they're highest risk. Today: get a PR completion commit from each BCBA. Set a 7-day target. For the other five with PRs in place, confirm submission cadence with the Coordinator. Add the full 8 to your weekly state meeting agenda until each is approved.",
      escalationPath: "PR not completed within 7 days of ask = QA + Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d2-treatment-auths", [
      { q: "When should a treatment auth be submitted before expiration?", opts: ["At expiration.", "30 days before.", "When PR is finally done."], answer: 1 },
      { q: "What blocks most renewal submissions?", opts: ["Family.", "Missing or late Progress Report.", "Payer."], answer: 1 },
    ]),
  },

  "sd-w3d2-reassessments": {
    learningObjective: "Identify all reassessments due in 30 days and confirm a named scheduling owner for each.",
    stateDirectorLens: "A missing reassessment is a missing PR is a stalled renewal. Reassessments are continuity in disguise.",
    stepByStep: [
      step("Read the Reassessment Management SOP.", "Cadence, owner, scheduling rules.", "You"),
      step("Pull all reassessments due in 30 days.", shot("Reassessment due list grouped by week."), "State Director"),
      step("Confirm a named scheduling owner for each.", "Usually BCBA + Scheduler.", "State Director"),
      step("Confirm reassessments are scheduled in time to feed the PR.", "Reassessment must complete 14+ days before PR is due.", "BCBA", "Reassessment slipping → SD-led unblock conversation."),
      step("Bring the 30-day list to your weekly state meeting.", "Standing rhythm.", "State Director"),
    ],
    sop: {
      purpose: "Complete every reassessment on time so PRs and auth renewals are not delayed downstream.",
      owner: "BCBA + Scheduler (State Director oversight)",
      inputs: ["Reassessment due list", "BCBA availability", "PR due dates"],
      process: [
        "30-day forward scan weekly.",
        "Schedule 14+ days before PR due.",
        "Complete and submit timely.",
        "Confirm PR pipeline is unblocked.",
        "Report status weekly.",
      ],
      escalationTriggers: [
        "Reassessment unscheduled within 14 days of PR due.",
        "BCBA repeatedly slow to complete.",
        "Family unavailability > 14 days.",
      ],
      qualityStandard: "≥ 95% reassessments complete on time.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "A reassessment due in 21 days hasn't been scheduled. The PR is due in 35 days.",
      prompt: "What's the urgency?",
      expectedResponse: "Urgent today. The reassessment needs to be scheduled this week so the BCBA has time to complete it and feed the PR. Talk to the BCBA and Scheduler today, get it on the calendar in the next 7 days. Don't let the gap close to less than 14 days from PR due.",
      escalationPath: "Repeated scheduling slippage = capacity conversation.",
    },
    knowledgeCheck: quiz("sd-w3d2-reassessments", [
      { q: "Why is reassessment timing operationally critical?", opts: ["It isn't.", "Because PR and auth renewal depend on it.", "Only for billing."], answer: 1 },
      { q: "When should a reassessment be complete relative to PR due date?", opts: ["Same day.", "At least 14 days before.", "After."], answer: 1 },
    ]),
  },

  "sd-w3d2-progress-reports": {
    learningObjective: "Identify any overdue PR or PR returned by QA and confirm a written completion plan with the BCBA.",
    stateDirectorLens: "Without PRs, auths don't renew. A late PR cascades into lost weeks of care.",
    stepByStep: [
      step("Read the Progress Report Management SOP.", "PR standards and timing.", "You"),
      step("Pull all PRs overdue or returned by QA.", shot("PR queue with status and age."), "State Director"),
      step("Talk to the responsible BCBA for each.", "Calm and curious — what's getting in the way.", "BCBA", "PR overdue > 7 days → SD-led completion conversation."),
      step("Get a written completion plan with date.", "Plan is concrete: when, what, by whom.", "BCBA"),
      step("Track to completion and notify QA when ready.", "Closed-loop accountability.", "State Director"),
    ],
    sop: {
      purpose: "Complete every Progress Report on time and to QA standard so renewals are not delayed.",
      owner: "BCBA (State Director oversight, QA partnership)",
      inputs: ["PR queue", "QA feedback", "Auth renewal calendar"],
      process: [
        "Identify PRs due in 30 days.",
        "Complete 14+ days before due date.",
        "QA review before submission.",
        "Confirm submission landed.",
        "Track to auth renewal.",
      ],
      escalationTriggers: [
        "PR overdue > 7 days.",
        "Same BCBA returned by QA > twice on same item.",
        "Pattern of late PRs in state.",
      ],
      qualityStandard: "≥ 95% of PRs complete on time and clean on first or second QA pass.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "A BCBA's PR is 10 days overdue. The auth renewal is in 25 days. The BCBA says they're 'almost done.'",
      prompt: "What do you do?",
      expectedResponse: "Calmly but specifically: get a written commit for a completion date by EOD this week. Offer help if workload is the issue — maybe a scheduling adjustment to free up admin time. If 'almost done' becomes a pattern, raise it as a coaching item with QA. Track the PR daily until submitted. Tell the family if there's a real risk to care.",
      escalationPath: "PR still not done after written commit = QA Lead + Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d2-progress-reports", [
      { q: "What's the consequence of a late PR?", opts: ["Nothing.", "Delayed auth renewal — potential lost weeks of care.", "Only QA annoyance."], answer: 1 },
      { q: "How do you address a chronically late BCBA?", opts: ["Public callout.", "Calm, specific, written commit; offer support; escalate if pattern.", "Ignore."], answer: 1 },
    ]),
  },

  /* ============= WEEK 3 — DAY 3 (Utilization Tracking) ============= */
  "sd-w3d3-actual-hours": {
    learningObjective: "Pull actual hours for your state for the past month and name one anomaly with its cause.",
    stateDirectorLens: "Actual hours are what was actually delivered. It is the floor of your utilization story.",
    stepByStep: [
      step("Read the Actual Hours Monitoring SOP.", "What 'actual' means in CR and how to read the report.", "You"),
      step("Pull actual hours for your state for the past month.", shot("Actual hours report, state-filtered, month-to-date."), "State Director"),
      step("Compare by BCBA and by client.", "Distribution and outliers.", "State Director"),
      step("Name one anomaly with its cause.", "Drop in hours for one client, surge for another.", "State Director", "Sharp client drop > 25% week-over-week → BCBA + family conversation."),
      step("Bring the anomaly to your weekly state meeting.", "Patterns become signals.", "State Director"),
    ],
    sop: {
      purpose: "Track actual hours weekly to spot care, family, and operational signals early.",
      owner: "State Director (BCBA partnership)",
      inputs: ["CR actual hours report", "Scheduled hours data"],
      process: [
        "Weekly pull.",
        "Compare to prior week.",
        "Identify outliers.",
        "Trace to cause.",
        "Report in state meeting.",
      ],
      escalationTriggers: [
        "Client drop > 25% week-over-week.",
        "BCBA drop > 20% with no explanation.",
        "State-wide drop without seasonal explanation.",
      ],
      qualityStandard: "Weekly review with documented action on every outlier.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "One client's actual hours dropped from 22 to 12 in one week. The BCBA didn't flag it.",
      prompt: "What's your move?",
      expectedResponse: "Talk to the BCBA today. Find out what happened — illness, family travel, pairing issue, satisfaction. If it's anything other than a one-time event, set up a family check-in. The fact that the BCBA didn't flag it is also worth a calm conversation — we want to know fast.",
      escalationPath: "Drop continues > 2 weeks = retention risk; loop in QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d3-actual-hours", [
      { q: "What does a sharp drop in actual hours usually mean?", opts: ["Nothing.", "An operational, family, or care signal that needs investigation.", "Just a slow week."], answer: 1 },
      { q: "How often should the SD review actual hours?", opts: ["Monthly.", "Weekly.", "Quarterly."], answer: 1 },
    ]),
  },

  "sd-w3d3-pending-hours": {
    learningObjective: "Pull pending hours for your state and confirm conversion SLA and named owner.",
    stateDirectorLens: "Pending hours are revenue suspended in mid-air. Letting them sit is how clean utilization rots.",
    stepByStep: [
      step("Read the Pending Hours Management SOP.", "Definition of pending vs actual.", "You"),
      step("Pull pending hours for your state.", shot("Pending hours report sorted by age."), "State Director"),
      step("Confirm the conversion SLA.", "Usually 48 hours.", "State Director", "Pending > 48 hours → SD escalation to BCBA."),
      step("Confirm the named owner for resolution.", "Usually delivering BCBA.", "State Director"),
      step("Build a daily pending check into your morning.", "5 minutes prevents 5 hours of cleanup later.", "You"),
    ],
    sop: {
      purpose: "Convert every pending hour within 48 hours so utilization reflects reality.",
      owner: "State Director (BCBA accountability)",
      inputs: ["Pending hours report", "BCBA roster"],
      process: [
        "Daily morning scan.",
        "Push BCBA on > 48 hour items.",
        "Escalate > 72 hours.",
        "Track weekly trend.",
        "Report in state meeting.",
      ],
      escalationTriggers: [
        "Pending > 72 hours.",
        "Same BCBA repeatedly missing SLA.",
        "Pending > 7 days (write-off risk).",
      ],
      qualityStandard: "Zero pending hours > 7 days. < 5% of weekly pending > 48 hours.",
      reviewRhythm: "Daily check. Weekly state meeting.",
    },
    scenario: {
      situation: "Pending hours for your state grew from 12 to 38 over the past week.",
      prompt: "What does that signal and what do you do?",
      expectedResponse: "Something broke in the conversion habit — workload, illness, system issue, training gap. Today: list the BCBAs contributing the most. Personal conversation with each. Set a same-week clear-down target. If it's systemic (CR issue, new BCBA training), raise at state meeting and adjust process.",
      escalationPath: "Pending continues to grow = QA and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d3-pending-hours", [
      { q: "What's the pending conversion SLA?", opts: ["48 hours.", "1 month.", "No SLA."], answer: 0 },
      { q: "What does a sudden pending surge signal?", opts: ["A broken conversion habit somewhere.", "Healthy growth.", "Nothing."], answer: 0 },
    ]),
  },

  "sd-w3d3-remaining-hours": {
    learningObjective: "Identify clients with < 20% of monthly auth remaining and > 1 week left in the month and build a named action for each.",
    stateDirectorLens: "Running out of hours mid-month is a service interruption. Watching remaining hours is how you prevent it.",
    stepByStep: [
      step("Read the Remaining Hours Tracking SOP.", "How remaining is calculated and when to act.", "You"),
      step("Pull remaining hours by client.", shot("Remaining hours report sorted by % remaining."), "State Director"),
      step("Identify any client < 20% remaining with > 1 week left.", "Risk of running out mid-month.", "State Director", "Client at risk of running out → BCBA + family conversation."),
      step("Build a named action for each.", "Options: pause non-essential, family conversation, request supplemental auth.", "BCBA"),
      step("Track to month-end and document outcomes.", "Pattern feeds next month's auth planning.", "State Director"),
    ],
    sop: {
      purpose: "Prevent service interruptions caused by running out of authorized hours mid-month.",
      owner: "State Director (BCBA + Authorization Coordinator partnership)",
      inputs: ["Remaining hours report", "Auth limits", "Family communication log"],
      process: [
        "Weekly pull.",
        "Identify at-risk clients.",
        "Build named action.",
        "Communicate with family before they hit the wall.",
        "Document outcome.",
      ],
      escalationTriggers: [
        "Client < 20% remaining with > 1 week left.",
        "Pattern of multiple clients running out.",
        "Family surprise about coverage limits.",
      ],
      qualityStandard: "Zero clients running out mid-month without proactive communication.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "A client has used 85% of their monthly auth by day 18 of the month. They have 12 days left.",
      prompt: "What do you do?",
      expectedResponse: "Talk to the BCBA today about clinical need and pacing. Talk to the Authorization Coordinator about a possible supplemental auth. Talk to the family — proactively, kindly — about what's happening and what care looks like for the rest of the month. Document everything. Don't let them find out by a missed session.",
      escalationPath: "Repeated month-end exhaustion = auth planning gap; raise with Authorizations and Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d3-remaining-hours", [
      { q: "What's the risk threshold for remaining hours?", opts: ["< 20% with > 1 week left.", "0% only.", "There is no risk threshold."], answer: 0 },
      { q: "Who owns the family conversation about running out?", opts: ["Nobody.", "State Director or BCBA — proactive, not reactive.", "Billing."], answer: 1 },
    ]),
  },

  "sd-w3d3-utilization": {
    learningObjective: "Pull your state's utilization for the past month and identify three clients below 80% with a pattern.",
    stateDirectorLens: "Utilization % is the single best operational pulse of a state. Above 90% is healthy; below 75% is a problem you need to name.",
    stepByStep: [
      step("Read the Utilization Percentage Management SOP.", "How utilization is calculated and what good looks like.", "You"),
      step("Pull state utilization % for the past month.", shot("Utilization dashboard, state-filtered, month-to-date."), "State Director"),
      step("Identify three clients below 80%.", "Look across pairing, scheduling, parent availability.", "State Director", "State utilization < 75% sustained → systemic conversation."),
      step("Name a pattern.", "Pairing instability? Repeat cancellations? Parent work schedule?", "State Director"),
      step("Bring the pattern and a first move to your weekly state meeting.", "Patterns drive systemic fixes.", "State Director"),
    ],
    sop: {
      purpose: "Maintain state utilization ≥ 90% by acting weekly on the lowest-utilizing clients and patterns.",
      owner: "State Director (BCBA + Scheduler partnership)",
      inputs: ["Utilization report", "Cancellation log", "Pairing matrix"],
      process: [
        "Weekly pull.",
        "Identify lowest cohort.",
        "Name patterns.",
        "Build first move.",
        "Report at weekly state meeting.",
      ],
      escalationTriggers: [
        "State utilization < 75% sustained 2+ weeks.",
        "Client cohort < 70% utilization.",
        "Single BCBA with low utilization across multiple clients.",
      ],
      qualityStandard: "State utilization ≥ 90% weekly average.",
      reviewRhythm: "Weekly state meeting. Monthly trend review with Operations Leadership.",
    },
    scenario: {
      situation: "State utilization dropped from 92% to 81% over two weeks. Three clients are driving most of the drop.",
      prompt: "What's your sequence?",
      expectedResponse: "Name the three clients. For each, trace cause — pairing, family availability, BCBA workload, satisfaction. Talk to BCBAs first. Where it's pairing or scheduling, talk to Scheduler. Where it's family, have the retention conversation. Bring all three to your weekly state meeting and track until utilization is back above 90%.",
      escalationPath: "If utilization stays below 85% after 2 weeks of intervention, loop in Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d3-utilization", [
      { q: "What's a healthy state utilization?", opts: ["≥ 90%.", "≥ 50%.", "Any number."], answer: 0 },
      { q: "When utilization drops, what's the first conversation?", opts: ["With Billing.", "With the BCBAs of the lowest clients.", "With the family."], answer: 1 },
    ]),
  },

  /* ============= WEEK 3 — DAY 4 (Managing Gaps) ============= */
  "sd-w3d4-expiring-auths": {
    learningObjective: "Pull all auths expiring in 30 days and confirm a submission plan with named owner for each.",
    stateDirectorLens: "An expired auth means a child loses sessions. Expiring auth discipline is non-negotiable.",
    stepByStep: [
      step("Read the Expiring Authorization Management SOP.", "30/14/7 day escalation cadence.", "You"),
      step("Pull all auths expiring in 30 days.", shot("Auth board filtered to 'expiring in 30 days.'"), "State Director"),
      step("Confirm submission plan with named owner for each.", "BCBA + Coordinator co-owned.", "Authorization Coordinator"),
      step("Escalate any auth within 14 days of expiration without submission.", shot("List of expiring auths within 14 days."), "State Director", "Auth within 7 days of expiration without submission → immediate Operations Leadership."),
      step("Track every expiring auth daily until approved.", "Discipline beats luck.", "State Director"),
    ],
    sop: {
      purpose: "Renew every authorization before expiration so no client experiences a coverage lapse.",
      owner: "Authorization Coordinator + BCBA (State Director oversight)",
      inputs: ["Auth board", "PR status", "Payer SLAs"],
      process: [
        "30-day forward scan weekly.",
        "Submit 30 days before expiration.",
        "Escalate at 14 days without submission.",
        "Operations Leadership at 7 days.",
        "Confirm approval before expiration.",
      ],
      escalationTriggers: [
        "Auth within 14 days of expiration without submission.",
        "Auth within 7 days without approval.",
        "Missing PR blocking submission.",
      ],
      qualityStandard: "Zero lapsed authorizations.",
      reviewRhythm: "Weekly Monday auth review.",
    },
    scenario: {
      situation: "An auth expires in 8 days. Submission hasn't happened because the PR is in QA review.",
      prompt: "What's your move?",
      expectedResponse: "Today: call QA, get a commit on PR clearance by EOD tomorrow. Submission tomorrow or Wednesday at latest. Notify Operations Leadership of the at-risk auth. Prepare the family for the possible gap and have a care plan ready. Track hourly until submitted and approved.",
      escalationPath: "Operations Leadership immediately for any auth within 7 days of expiration.",
    },
    knowledgeCheck: quiz("sd-w3d4-expiring-auths", [
      { q: "When should you escalate an expiring auth?", opts: ["At expiration.", "Within 14 days without submission; 7 days = leadership.", "Never."], answer: 1 },
      { q: "What's the standard?", opts: ["A few lapses are fine.", "Zero lapsed authorizations.", "Best effort."], answer: 1 },
    ]),
  },

  "sd-w3d4-missing-prs": {
    learningObjective: "Pull the missing-PR list and get a written completion date for each.",
    stateDirectorLens: "A missing PR is a paused renewal is a lost week of care. Resolution speed protects continuity.",
    stepByStep: [
      step("Read the Missing Progress Report Resolution SOP.", "Standards, owners, escalation.", "You"),
      step("Pull the missing-PR list for your state.", shot("PR queue filtered to overdue."), "State Director"),
      step("Identify the responsible BCBA for each.", "Direct ownership.", "State Director"),
      step("Get a written completion date for each.", "Concrete, not 'soon.'", "BCBA", "PR > 14 days late → QA + Operations Leadership."),
      step("Track to completion and notify QA.", "Closed loop.", "State Director"),
    ],
    sop: {
      purpose: "Resolve every missing PR within 7 days of detection to prevent renewal delays.",
      owner: "BCBA (State Director oversight, QA partnership)",
      inputs: ["PR queue", "QA feedback", "Renewal calendar"],
      process: [
        "Detect missing PR.",
        "Get written completion date from BCBA.",
        "Offer support if workload is the issue.",
        "Track daily until complete.",
        "Notify QA on completion.",
      ],
      escalationTriggers: [
        "PR > 7 days late after detection.",
        "Same BCBA missing > 2 PRs in a quarter.",
        "PR > 14 days late.",
      ],
      qualityStandard: "Zero PRs > 14 days late.",
      reviewRhythm: "Weekly state meeting. Daily for items > 7 days.",
    },
    scenario: {
      situation: "Two PRs are 12 days overdue. Both BCBAs say they're 'working on it.'",
      prompt: "How do you make this concrete without damaging the relationship?",
      expectedResponse: "Calmly: 'I need a specific completion date in writing today. What can I move off your plate to make that happen?' Listen for real obstacles. If workload, adjust schedule. If template confusion, get QA help. Set the commit date. Check in halfway. If the commit slips, escalate immediately — not punitively, just to keep the family from losing care.",
      escalationPath: "Commit slips = QA Lead and Operations Leadership same day.",
    },
    knowledgeCheck: quiz("sd-w3d4-missing-prs", [
      { q: "What's the SLA on a detected missing PR?", opts: ["7 days.", "30 days.", "No SLA."], answer: 0 },
      { q: "How do you handle a BCBA with chronic missing PRs?", opts: ["Public callout.", "Calm written commit, support, escalate if it slips.", "Ignore."], answer: 1 },
    ]),
  },

  "sd-w3d4-delayed-assessments": {
    learningObjective: "Pull the delayed-assessment list and confirm root cause and resolution owner for each.",
    stateDirectorLens: "Delayed assessments delay care. Most delays are scheduling gaps a State Director can clear in one conversation.",
    stepByStep: [
      step("Read the Delayed Assessment Resolution SOP.", "Cadence and ownership.", "You"),
      step("Pull the delayed-assessment list.", shot("Assessment queue with delays highlighted."), "State Director"),
      step("Confirm root cause for each.", "BCBA capacity, family availability, scheduling.", "State Director"),
      step("Assign a resolution owner with a date.", "Concrete plan, not vague.", "BCBA or Scheduler", "Delay > 21 days → SD-led recovery."),
      step("Track to completion and bring to weekly state meeting.", "Patterns drive systemic fixes.", "State Director"),
    ],
    sop: {
      purpose: "Reduce assessment delays so care starts on time and downstream auths are not at risk.",
      owner: "BCBA + Scheduler (State Director oversight)",
      inputs: ["Assessment queue", "BCBA availability", "Family availability"],
      process: [
        "Weekly scan.",
        "Root-cause each delay.",
        "Assign owner + date.",
        "Unblock scheduling gaps.",
        "Report patterns weekly.",
      ],
      escalationTriggers: [
        "Assessment delay > 21 days.",
        "Pattern of delays across multiple BCBAs.",
        "Family unavailability persistent.",
      ],
      qualityStandard: "≥ 90% of assessments complete within 14 days of authorization.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "Four assessments in your state are delayed > 21 days. Two are BCBA capacity, two are family availability.",
      prompt: "What's the right response?",
      expectedResponse: "Two different problems, two different responses. For BCBA capacity: talk to Scheduler and Recruiting about staffing — short term, look for a different BCBA or creative scheduling. For family availability: call families directly, offer flexible options (evenings, weekends, alternate week). Document outcomes. Raise systemic capacity at weekly state meeting.",
      escalationPath: "Sustained capacity gap = Recruiting + Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d4-delayed-assessments", [
      { q: "What's the operational target?", opts: ["≥ 90% complete within 14 days of auth.", "Whenever.", "100% within 1 day."], answer: 0 },
      { q: "What does a pattern of capacity-based delays signal?", opts: ["Lazy BCBAs.", "Staffing/scheduling gap that needs systemic attention.", "Bad families."], answer: 1 },
    ]),
  },

  "sd-w3d4-coverage-risks": {
    learningObjective: "Build a weekly coverage-risk list combining expiring auths, missing PRs, delayed assessments, and staffing gaps.",
    stateDirectorLens: "Coverage risk is the umbrella metric of operational health. Watching it protects care, families, and revenue at once.",
    stepByStep: [
      step("Read the Coverage Risk Management SOP.", "Combined risk view and weekly cadence.", "You"),
      step("Pull expiring auths, missing PRs, delayed assessments, staffing gaps.", shot("Coverage risk dashboard or compiled list."), "State Director"),
      step("Combine into a single weekly risk list.", "One page, ranked by urgency.", "State Director"),
      step("Assign a named owner and next move for each.", "Action over analysis.", "State Director", "Any risk without owner > 24 hours → SD owns it."),
      step("Bring the risk list to your weekly state meeting.", "Standing agenda item.", "State Director"),
    ],
    sop: {
      purpose: "Surface every coverage risk weekly in one place so nothing falls through the cracks.",
      owner: "State Director Program",
      inputs: ["Auth board", "PR queue", "Assessment queue", "Staffing gaps"],
      process: [
        "Weekly compile.",
        "Rank by urgency.",
        "Assign owner + next move.",
        "Track in weekly state meeting.",
        "Close items as resolved.",
      ],
      escalationTriggers: [
        "Risk item unowned > 24 hours.",
        "Same item carrying over > 2 weeks.",
        "Multiple risks for same client simultaneously.",
      ],
      qualityStandard: "Coverage risk list reviewed weekly with named owner on every item.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "Your weekly risk list has 14 items, three of which involve the same client.",
      prompt: "How do you prioritize?",
      expectedResponse: "The client with three risks gets prioritized — that's a compound risk. Identify the upstream cause (likely BCBA, scheduling, or family). Sit with the BCBA today, build one integrated plan. For the other 11, rank by clinical urgency and time-to-expiration. Anything with < 7 days runway gets daily check until closed.",
      escalationPath: "Compound-risk clients = Operations Leadership for awareness.",
    },
    knowledgeCheck: quiz("sd-w3d4-coverage-risks", [
      { q: "Why combine the risks into one list?", opts: ["For looks.", "So nothing falls through the cracks and patterns become visible.", "For Billing."], answer: 1 },
      { q: "What's a compound risk?", opts: ["A risk with no owner.", "Multiple risks for the same client at once — prioritize it.", "A duplicate."], answer: 1 },
    ]),
  },

  /* ============= WEEK 3 — DAY 5 (Revenue Protection) ============= */
  "sd-w3d5-utilization-management": {
    learningObjective: "Build a weekly utilization review agenda and define a recovery plan for the lowest-utilization cohort.",
    stateDirectorLens: "Utilization is not an accident. It is a managed outcome of weekly operational discipline.",
    stepByStep: [
      step("Read the Utilization Management & Recovery SOP.", "Recovery patterns and rhythms.", "You"),
      step("Build a weekly utilization review agenda.", "State trend, lowest cohort, top patterns, next moves.", "You"),
      step("Identify the lowest-utilization client cohort.", shot("Utilization by client cohort report."), "State Director"),
      step("Define a recovery plan with the BCBA(s).", "Named clients, named actions, named dates.", "BCBA"),
      step("Track recovery weekly and report progress.", "Visibility drives accountability.", "State Director"),
    ],
    sop: {
      purpose: "Manage utilization week-over-week as a leading indicator of state health.",
      owner: "State Director Program",
      inputs: ["Utilization report", "Cancellation log", "Pairing matrix"],
      process: [
        "Weekly utilization review.",
        "Identify lowest cohort.",
        "Build recovery plan.",
        "Execute and document.",
        "Track week-over-week.",
      ],
      escalationTriggers: [
        "Cohort utilization < 70% sustained.",
        "Recovery plan not moving after 2 weeks.",
        "Same pattern across multiple cohorts.",
      ],
      qualityStandard: "Lowest cohort recovered to ≥ 80% within 4 weeks.",
      reviewRhythm: "Weekly state meeting.",
    },
    scenario: {
      situation: "Your lowest cohort (5 clients with the same BCBA) is at 68% utilization for the third week running.",
      prompt: "What's your move?",
      expectedResponse: "Sit with the BCBA today. Walk each client. Find the patterns — pairing, parent availability, scheduling, satisfaction. Build a per-client recovery move. Loop in Scheduler for pairing/timing changes. Consider whether the BCBA needs a smaller caseload or a different mix. Track weekly until cohort is back above 80%.",
      escalationPath: "No improvement in 4 weeks = Operations Leadership for staffing or coaching support.",
    },
    knowledgeCheck: quiz("sd-w3d5-utilization-management", [
      { q: "What's utilization management?", opts: ["An accident.", "A managed outcome of weekly operational discipline.", "Billing's job."], answer: 1 },
      { q: "What's the recovery target for a low cohort?", opts: ["No target.", "≥ 80% within 4 weeks.", "100% next week."], answer: 1 },
    ]),
  },

  "sd-w3d5-revenue-awareness": {
    learningObjective: "Identify the three operational levers that most impact your state's monthly revenue and define how you'll watch each weekly.",
    stateDirectorLens: "You don't have to be a biller to protect revenue. You have to understand which operational levers move it.",
    stepByStep: [
      step("Read the Revenue Awareness for State Directors SOP.", "Operational-to-revenue map.", "You"),
      step("Talk to your Billing partner.", "Get the top 3 operational levers for your state.", "Billing Partner"),
      step("Define a weekly watch for each lever.", "What you'll look at, when, and where.", "You"),
      step("Adopt the watch and track for 30 days.", "Discipline beats analysis.", "You", "Sustained downward revenue trend → Operations Leadership."),
      step("Refine the watch based on what actually correlates with month-end revenue.", "Patterns mature with reps.", "You"),
    ],
    sop: {
      purpose: "Connect operational discipline to revenue outcomes so the State Director leads from cause, not symptom.",
      owner: "State Director (Billing partnership)",
      inputs: ["Billing reports", "Operational metrics", "Lever-to-revenue map"],
      process: [
        "Identify top 3 levers.",
        "Define weekly watch.",
        "Track 30 days.",
        "Refine based on outcomes.",
        "Report at state meeting.",
      ],
      escalationTriggers: [
        "Sustained downward revenue trend.",
        "Lever moving wrong direction > 2 weeks.",
      ],
      qualityStandard: "State Director can name how each operational decision affects revenue.",
      reviewRhythm: "Weekly state meeting. Monthly Billing review.",
    },
    scenario: {
      situation: "Month-end revenue for your state was 8% below forecast.",
      prompt: "Where do you look first?",
      expectedResponse: "Walk the three levers: conversion %, utilization %, expiring auths. If conversion dropped, BCBA conversation. If utilization dropped, cohort recovery plan. If auths lapsed, escalation pattern review. Don't accept a shortfall as random — every dollar has an operational story.",
      escalationPath: "Sustained shortfall = Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d5-revenue-awareness", [
      { q: "What's the SD's relationship to revenue?", opts: ["Run billing.", "Understand and protect the operational levers that move revenue.", "Track only."], answer: 1 },
      { q: "When revenue is below forecast, where do you look?", opts: ["Spreadsheets.", "Operational levers: conversion, utilization, auths.", "Family complaints."], answer: 1 },
    ]),
  },

  "sd-w3d5-preventing-lost-hours": {
    learningObjective: "Review the past month's lost hours by reason code and name the top reason with a systemic fix.",
    stateDirectorLens: "Lost hours never come back. Prevention is the only winning strategy.",
    stepByStep: [
      step("Read the Lost Hours Prevention SOP.", "Common reason codes and fix patterns.", "You"),
      step("Pull lost hours for the past month by reason code.", shot("Lost hours report grouped by reason."), "State Director"),
      step("Identify the top reason.", "Often: cancellations, non-conversion, gaps in pairing.", "State Director"),
      step("Build one systemic fix for the top reason.", "Pattern-level, not one-off.", "State Director", "Lost hours pattern unchanged > 2 months → Operations Leadership."),
      step("Track the lost-hours trend month-over-month.", "Pattern fixes show up in 30-60 days.", "State Director"),
    ],
    sop: {
      purpose: "Reduce lost hours month-over-month by identifying and fixing the top systemic cause.",
      owner: "State Director (Scheduler + BCBA partnership)",
      inputs: ["Lost hours report", "Reason codes", "Conversion data"],
      process: [
        "Monthly pull.",
        "Identify top reason.",
        "Build systemic fix.",
        "Execute over 30 days.",
        "Measure month-over-month change.",
      ],
      escalationTriggers: [
        "Lost hours unchanged > 2 months.",
        "New reason code appearing suddenly.",
        "Lost hours > 10% of scheduled.",
      ],
      qualityStandard: "Lost hours < 5% of scheduled monthly.",
      reviewRhythm: "Monthly state review.",
    },
    scenario: {
      situation: "Lost hours for last month were 12% of scheduled. The top reason is 'family cancellation.'",
      prompt: "What's the systemic fix?",
      expectedResponse: "Pull the cancellation log and identify which families drove most of it. Look for pattern — pairing, time of day, BCBA, season. Build a retention conversation rhythm: any client with 3+ cancellations in 4 weeks gets a family check-in. Adjust pairing/timing based on what families tell you. Re-measure next month.",
      escalationPath: "If lost hours stay > 10% after the fix attempt, raise as a systemic state issue with Operations Leadership.",
    },
    knowledgeCheck: quiz("sd-w3d5-preventing-lost-hours", [
      { q: "What's the target for lost hours?", opts: ["< 5% of scheduled monthly.", "< 30%.", "No target."], answer: 0 },
      { q: "What's the right level of fix?", opts: ["Per-incident.", "Systemic — fix the pattern, not just the instance.", "No fix needed."], answer: 1 },
    ]),
  },

  "sd-w3d5-operational-visibility": {
    learningObjective: "Build a one-page weekly state health report covering utilization, coverage risk, conversion, and pipeline.",
    stateDirectorLens: "Visibility is leadership. If you can't see your state, you can't lead it. If leadership can't see your state, they can't support you.",
    stepByStep: [
      step("Read the Operational Visibility & Reporting SOP.", "Recommended weekly format.", "You"),
      step("Draft a one-page weekly state health report.", "Utilization %, coverage risk count, conversion %, pipeline health, top 3 priorities.", "You"),
      step("Confirm format with mentor and reporting leader.", "Match the format leadership wants to consume.", "Mentor"),
      step("Adopt the report weekly.", shot("Sample weekly state health report (1 page)."), "State Director", "Skipping the report > 2 weeks → leadership conversation."),
      step("Use the report to drive the weekly state meeting.", "Visibility into the work, not just the work itself.", "State Director"),
    ],
    sop: {
      purpose: "Maintain weekly operational visibility for the State Director, the team, and leadership.",
      owner: "State Director Program",
      inputs: ["Utilization report", "Coverage risk list", "Conversion data", "Pipeline metrics"],
      process: [
        "Pull data Friday morning.",
        "Draft one-page report.",
        "Identify top 3 priorities for next week.",
        "Share with team Monday.",
        "Share with reporting leader weekly.",
      ],
      escalationTriggers: [
        "Report not produced 2 weeks running.",
        "Sustained downward trend on any core metric.",
        "Top priorities unchanged 3 weeks running.",
      ],
      qualityStandard: "Weekly one-page report consistently produced and consumed.",
      reviewRhythm: "Weekly. Monthly retro with reporting leader.",
    },
    scenario: {
      situation: "Your reporting leader calls Friday at 4pm and asks 'how is the state?'",
      prompt: "What's your 60-second answer?",
      expectedResponse: "Lead with the one-page report. 'Utilization 91%, up from 88%. Coverage risk list has 6 items, all with named owners. Conversion 95%. Pipeline healthy. Top three priorities next week: [list].' If you can't answer this in 60 seconds, your weekly rhythm isn't tight enough yet.",
      escalationPath: "If you can't answer this confidently, that itself is the operational issue — talk to your mentor.",
    },
    knowledgeCheck: quiz("sd-w3d5-operational-visibility", [
      { q: "Why is visibility a leadership act?", opts: ["For reporting.", "Because if leadership can't see your state, they can't support you.", "Compliance."], answer: 1 },
      { q: "How long should the weekly state health report be?", opts: ["1 page.", "10 pages.", "Variable."], answer: 0 },
    ]),
  },
};