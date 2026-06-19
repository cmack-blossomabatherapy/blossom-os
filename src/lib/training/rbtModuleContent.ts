/**
 * RBT module runtime content.
 *
 * The unified academy runtime previously synthesized very thin content for
 * RBT modules (title + one-line summary). This file supplies real LMS
 * content — objectives, lessons, checklists, trainer notes, knowledge
 * checks, signoff requirements — for every RBT module called out in the
 * Training Academy spec.
 *
 * Hannah/Anju appear as label text only (no real user IDs).
 */

export interface RBTLesson {
  title: string;
  summary: string;
  kind: "Read" | "Video" | "Practice" | "Role-Play" | "Discussion" | "Knowledge Check" | "Observation";
  minutes: number;
}

export interface RBTModuleContent {
  objectives: string[];
  lessons?: RBTLesson[];
  checklist?: string[];
  trainerNotes?: string;
  shadowing?: string[];
  knowledgeCheck?: { q: string; a: string };
  reflectionPrompt?: string;
  signoffRequired?: string;
  estimatedMinutes?: number;
}

function L(title: string, summary: string, kind: RBTLesson["kind"], minutes: number): RBTLesson {
  return { title, summary, kind, minutes };
}

/**
 * Keyed by RBT module id (from rbtAcademy.ts, e.g. "welcome-1", "nc-c2").
 * Modules not in this map fall back to a generic body in the runtime.
 */
export const RBT_MODULE_CONTENT: Record<string, RBTModuleContent> = {
  // ─────────── Welcome (all tracks) ───────────
  "welcome-1": {
    objectives: [
      "Understand Blossom's mission, values, and clinical philosophy.",
      "Know who you serve and the families that count on you.",
      "Be able to explain the Blossom way in one paragraph.",
    ],
    lessons: [
      L("Welcome from leadership", "Short video — what Blossom stands for and why we exist.", "Video", 6),
      L("The Blossom way", "Read the field-standards summary.", "Read", 8),
      L("Who we serve", "States, services, and the families behind our caseloads.", "Read", 4),
    ],
    checklist: [
      "Watched the welcome video",
      "Read the Blossom way",
      "Signed in to Blossom OS",
    ],
    knowledgeCheck: {
      q: "Name two Blossom principles you'll bring to every session.",
      a: "Examples: client dignity, calm under pressure, data integrity, role-based clarity, less but better.",
    },
    reflectionPrompt: "What from the welcome resonated with you, and what do you want to be known for as a Blossom RBT?",
  },
  "welcome-2": {
    objectives: [
      "Know your Lead RBT Trainer, BCBA supervisor, and Training Admin by name.",
      "Know who to message for schedule, payroll, clinical, and HR questions.",
    ],
    lessons: [
      L("Meet your team", "Photos and names of your direct support team.", "Read", 4),
      L("Who to call when stuck", "Decision tree for who you message and when.", "Read", 4),
    ],
    checklist: [
      "Wrote down my Lead RBT Trainer name",
      "Wrote down my BCBA name",
      "Confirmed who to message for scheduling vs clinical vs HR",
    ],
  },
  "welcome-3": {
    objectives: [
      "Find My Day, schedule, messages, and resources in Blossom OS.",
      "Open a client record and read a session note.",
      "Submit a question to Ask Blossom AI.",
    ],
    lessons: [
      L("Blossom OS quick tour", "Walk-through of the RBT shell.", "Video", 6),
      L("My Day in practice", "Plan your day from a single screen.", "Practice", 4),
      L("Ask Blossom AI", "How to ask the assistant for help mid-session.", "Practice", 3),
    ],
    checklist: [
      "Opened My Day",
      "Found my Resources",
      "Sent a test message",
    ],
  },

  // ─────────── Not Certified · Classroom & role play ───────────
  "nc-c1": {
    objectives: [
      "Define the RBT role and the limits of scope.",
      "Recall the BACB ethics code in plain language.",
      "Identify situations that require escalation to a BCBA.",
    ],
    lessons: [
      L("What an RBT does", "Scope of practice in plain English.", "Read", 8),
      L("Ethics in your first 90 days", "The most common ethical situations and the right call.", "Read", 8),
      L("Three escalation scenarios", "Role play three calls to your BCBA.", "Role-Play", 12),
    ],
    checklist: ["Reviewed BACB scope", "Reviewed Ethics Code", "Completed three escalation role-plays"],
    knowledgeCheck: { q: "Name three situations that must be escalated to your BCBA.", a: "Examples: client safety risk, parent dissent on plan, unexpected medication side effect, scope creep request." },
    trainerNotes: "Lead RBT Trainer leads escalation role plays in clinic; debrief out loud.",
  },
  "nc-c2": {
    objectives: [
      "Explain ABA in plain language to a parent.",
      "Identify reinforcement, prompting, and measurement in a real example.",
    ],
    lessons: [
      L("ABA Explained — overview", "Plain-language intro video.", "Video", 12),
      L("Reinforcement in real life", "Spot reinforcement around you for a day.", "Practice", 8),
      L("Parent-friendly script", "Practice explaining ABA in one paragraph.", "Role-Play", 5),
    ],
    checklist: ["Watched ABA Explained playlist", "Drafted a parent-friendly explanation"],
    knowledgeCheck: { q: "Give a one-paragraph plain-language explanation of ABA for a parent.", a: "ABA is the science of using reinforcement and structured teaching to help your child learn the skills that matter most." },
  },
  "nc-c3": {
    objectives: [
      "Differentiate reinforcement, prompting, fading, and measurement.",
      "Explain why measurement is non-negotiable for clinical decisions.",
    ],
    lessons: [
      L("Reinforcement and motivation", "How to find what works for a learner today.", "Video", 8),
      L("Prompting and fading", "The least-to-most hierarchy explained.", "Video", 8),
      L("Measurement matters", "Why bad data leads to bad clinical calls.", "Read", 8),
    ],
    checklist: ["Named the four reinforcement quadrants", "Drew the prompting hierarchy from memory"],
    knowledgeCheck: { q: "Why does measurement integrity matter for clinical decision-making?", a: "Decisions about program changes, mastery, and discharge are made from the data. Bad data → wrong calls." },
  },
  "nc-c4": {
    objectives: [
      "Run DTT, NET, prompting, and reinforcement smoothly under coaching.",
      "Take frequency, duration, and trial data without losing pace.",
    ],
    lessons: [
      L("DTT role play", "Three trials with your Lead RBT Trainer.", "Role-Play", 20),
      L("NET role play", "Naturalistic teaching with a peer learner.", "Role-Play", 15),
      L("Data while teaching", "Take data without breaking the trial flow.", "Practice", 15),
    ],
    checklist: ["DTT role play attempted", "NET role play attempted", "Took data while teaching"],
    signoffRequired: "Lead RBT Trainer signs off when DTT/NET/prompting/data are at safe practice level.",
    trainerNotes: "Staffing expectation per the meeting notes: 2–3 Lead RBT Trainers per group when applicable.",
  },

  // ─────────── Not Certified · Client-Based Competency ───────────
  "nc-cp1": {
    objectives: [
      "Know exactly what the BCBA will check during the BACB competency.",
      "Identify which items can be role-played vs need a real client.",
    ],
    lessons: [
      L("Competency checklist walk-through", "Read every item with your trainer.", "Read", 10),
      L("With-Client vs Role-Play", "Tag each item with its assessment type.", "Practice", 10),
    ],
    checklist: [
      "Reviewed all 19 BACB items",
      "Identified the three minimum With-Client items in 6–14",
      "Asked any unclear questions",
    ],
    trainerNotes: "Use the Initial Competency Assessment panel in the Readiness Board to plan items by assessment type before scheduling.",
  },
  "nc-cp2": {
    objectives: [
      "Demonstrate the 19 BACB competency tasks at the required levels.",
      "Show at least 3 of items 6–14 With Client.",
    ],
    lessons: [
      L("With Client demonstrations", "Run target items in a real session.", "Practice", 60),
      L("Role-Play demonstrations", "Run remaining items in role-play.", "Role-Play", 20),
      L("Interview items", "Talk through dignity, boundaries, supervision, direction.", "Discussion", 10),
    ],
    checklist: [
      "All 19 items attempted",
      "≥3 With-Client demonstrations in items 6–14",
      "Responsible assessor signed",
    ],
    signoffRequired: "Responsible BCBA/BCaBA signs the official 2026 packet AND the in-OS attestation.",
  },

  // ─────────── Not Certified · Knowledge Assessment ───────────
  "nc-k1": {
    objectives: [
      "Use frequency, duration, ABC, and trial-by-trial data correctly.",
      "Know when to use each measurement type.",
    ],
    lessons: [
      L("Measurement types", "Frequency, duration, ABC, trial-by-trial.", "Read", 8),
      L("Live data practice", "Take 10 trials of data on a recorded session.", "Practice", 10),
    ],
    checklist: ["Reviewed the Data Collection quick guide", "Practiced 10 trials of data"],
  },
  "nc-k2": {
    objectives: [
      "Write a complete, billable, audit-ready session note.",
      "Identify common note pitfalls that delay billing.",
    ],
    lessons: [
      L("Note structure", "Header, programs, behaviors, client status, signature.", "Read", 8),
      L("Common pitfalls", "Vague language, missing data, late submissions.", "Read", 5),
      L("Draft a note", "Write a mock note from a recorded session.", "Practice", 10),
    ],
    checklist: ["Reviewed Session Notes guide", "Drafted a mock session note"],
  },
  "nc-k3": {
    objectives: [
      "Pass the Assistance Test covering ethics, data, and documentation.",
    ],
    lessons: [
      L("Knowledge review", "Quick recap of ethics + data + notes.", "Read", 10),
      L("Assistance Test", "Administered by Hannah or assigned RBT Trainer.", "Knowledge Check", 20),
    ],
    checklist: ["Took the Assistance Test", "Passed with required score"],
    trainerNotes: "Assistance Test is administered by Hannah or the assigned RBT Trainer.",
    signoffRequired: "Lead RBT Trainer records pass result in the Readiness Board.",
  },

  // ─────────── Not Certified · Shadowing & Doc Review ───────────
  "nc-s1": {
    objectives: [
      "Observe a real session and identify ABA principles in action.",
      "Take a mock session note while observing.",
    ],
    lessons: [
      L("Shadow expectations", "Read before you observe.", "Read", 5),
      L("Live observation", "Shadow your Lead RBT's client.", "Observation", 90),
      L("Mock note draft", "Write the session note as if you ran it.", "Practice", 20),
    ],
    shadowing: [
      "Arrive 10 minutes early.",
      "Take notes silently; do not interrupt the session.",
      "Submit a mock session note within 24 hours.",
    ],
    checklist: ["Shadowed the session", "Submitted mock session note"],
  },
  "nc-s2": {
    objectives: [
      "Receive structured feedback on your mock session note.",
      "Revise the note to billable standard.",
    ],
    lessons: [
      L("Submit your note", "Send via the training form.", "Practice", 5),
      L("Feedback review", "Anju reviews and returns written/verbal feedback.", "Discussion", 15),
      L("Revise and resubmit", "Apply edits and resubmit.", "Practice", 10),
    ],
    trainerNotes: "Mock session note is reviewed by Anju in line with the meeting notes.",
    signoffRequired: "Documentation reviewer approves the revised note.",
  },

  // ─────────── Not Certified · Full Session ───────────
  "nc-fs1": {
    objectives: [
      "Run a full session with the Lead RBT observing.",
      "Take complete data and write a complete session note.",
    ],
    lessons: [
      L("Pre-session prep", "Programs, materials, reinforcers, expected behaviors.", "Practice", 15),
      L("Full session", "Run the session with Lead RBT support.", "Practice", 90),
      L("Debrief", "Lead RBT completes the performance evaluation.", "Discussion", 15),
    ],
    checklist: ["Pre-session prep complete", "Full session run", "Lead RBT performance evaluation positive"],
    signoffRequired: "Lead RBT Trainer signs the full-session readiness item.",
  },

  // ─────────── Not Certified · BCBA Final ───────────
  "nc-b1": {
    objectives: [
      "Demonstrate skill implementation, data accuracy, behavior reduction, session management, professionalism, and parent interaction.",
    ],
    lessons: [
      L("BCBA observation", "Length/frequency set by the BCBA.", "Observation", 90),
      L("Clinical debrief", "BCBA reviews findings and clears for independent assignment.", "Discussion", 15),
    ],
    checklist: ["BCBA observation complete", "BCBA cleared for independent assignment"],
    signoffRequired: "BCBA signs the final clinical readiness item in the Readiness Board.",
  },

  // ─────────── Certified · No experience ───────────
  "ne-p1": {
    objectives: ["Show up to Blossom standard in the home and clinic."],
    lessons: [
      L("Field standards", "Dress, communication, punctuality, boundaries.", "Read", 10),
      L("Standards quiz", "Quick check.", "Knowledge Check", 5),
    ],
    checklist: ["Reviewed field standards", "Took the standards quiz"],
  },
  "ne-a1": {
    objectives: ["Align your ABA vocabulary to Blossom."],
    lessons: [
      L("ABA Refresher video", "Reinforcement, prompting, measurement — Blossom's way.", "Video", 12),
      L("Vocabulary check", "Quick check.", "Knowledge Check", 8),
    ],
    checklist: ["Watched the refresher", "Passed the vocabulary check"],
  },
  "ne-f1": {
    objectives: ["Run a Blossom session from arrival to wrap-up."],
    lessons: [
      L("Session flow walk-through", "Arrival, pairing, programming, transitions, wrap-up.", "Read", 12),
      L("Run-the-day practice", "Simulate the day with your Lead RBT Trainer.", "Practice", 8),
    ],
    checklist: ["Reviewed the session flow", "Simulated the day"],
  },
  "ne-d1": {
    objectives: ["Capture Blossom-standard data and notes day-to-day."],
    lessons: [
      L("Data day-to-day", "Where, how, and when you take data.", "Read", 12),
      L("Notes day-to-day", "When and how to submit session notes.", "Read", 13),
    ],
    checklist: ["Reviewed data SOP", "Reviewed notes SOP"],
  },
  "ne-r1": {
    objectives: ["Run core programs in role-play with a Lead RBT."],
    lessons: [
      L("Role play set 1", "DTT and prompting.", "Role-Play", 30),
      L("Role play set 2", "NET and reinforcement.", "Role-Play", 30),
    ],
    checklist: ["Ran DTT role play", "Ran NET role play"],
    signoffRequired: "Lead RBT Trainer signs off on role-play performance.",
  },
  "ne-s1": {
    objectives: ["Observe a Lead RBT session and reflect."],
    lessons: [
      L("Live shadow", "Shadow a Lead RBT session.", "Observation", 75),
      L("Reflection", "Submit a guided reflection.", "Practice", 15),
    ],
    reflectionPrompt: "What did the Lead RBT do that you want to add to your own practice this week?",
    checklist: ["Shadowed the session", "Submitted the reflection"],
  },
  "ne-fs1": {
    objectives: ["Lead a full session under Lead RBT observation."],
    lessons: [
      L("Pre-session prep", "Materials, reinforcers, expected behaviors.", "Practice", 15),
      L("Full session", "Lead the session with the Lead RBT observing.", "Practice", 75),
    ],
    checklist: ["Ran the full session", "Received Lead RBT feedback"],
    signoffRequired: "Lead RBT Trainer signs the full-session readiness item.",
  },
  "ne-b1": {
    objectives: ["Pass a BCBA readiness observation."],
    lessons: [
      L("BCBA observation", "Length set by the BCBA.", "Observation", 60),
      L("Final clearance", "BCBA signs the readiness item.", "Discussion", 10),
    ],
    signoffRequired: "BCBA signs the readiness observation item.",
  },

  // ─────────── Certified · Under 2 years ───────────
  "u2-e1": {
    objectives: [
      "Run a live session for Lead RBT + BCBA evaluation.",
      "Receive a routing recommendation based on results.",
    ],
    lessons: [
      L("Pre-session prep", "Quick overview of programs.", "Practice", 10),
      L("Live evaluation", "Run the session under evaluation.", "Practice", 60),
      L("Outcome routing", "Implementation, ABA concepts, or pass.", "Discussion", 20),
    ],
    checklist: [
      "Pre-session prep complete",
      "Live evaluation complete",
      "Routing recommendation recorded",
    ],
    trainerNotes: "Routing per the meeting notes — Implementation gaps → Lead RBT support session; ABA concept gaps → ABA Explained Gap Module; Passed → Day 2 BCBA Supervision.",
  },
  "u2-c1": {
    objectives: ["Confirm fluency in reinforcement, prompting, and measurement."],
    lessons: [
      L("Concept check", "Quick check.", "Knowledge Check", 15),
      L("Targeted review", "Re-read any gap topics.", "Read", 5),
    ],
    checklist: ["Took the concept check"],
  },
  "u2-g1": {
    objectives: ["Close specific implementation gaps with Lead RBT support."],
    lessons: [
      L("Targeted coaching", "Specific drills based on the evaluation.", "Practice", 45),
      L("Reattempt", "Re-run the failing items.", "Role-Play", 15),
    ],
    checklist: ["Targeted coaching complete", "Re-attempt successful"],
    signoffRequired: "Lead RBT Trainer confirms the gaps are closed.",
  },
  "u2-g2": {
    objectives: ["Close ABA concept gaps before progressing."],
    lessons: [
      L("ABA Explained deep dive", "Reinforcement, prompting, measurement.", "Video", 20),
      L("Concept re-check", "Re-take the check.", "Knowledge Check", 10),
    ],
    checklist: ["Watched the deep dive", "Passed the re-check"],
  },
  "u2-b1": {
    objectives: ["Run a Day 2 session under BCBA supervision and pass clearance."],
    lessons: [
      L("Day 2 session", "Run the session with BCBA support.", "Practice", 75),
      L("Final clearance", "BCBA signs the readiness item.", "Discussion", 15),
    ],
    signoffRequired: "BCBA signs the Day 2 supervision item.",
  },

  // ─────────── Certified · 2+ years ───────────
  "ex-d1": {
    objectives: ["Match Blossom's documentation and data standards."],
    lessons: [
      L("Documentation standards", "Quality, timeliness, integrity.", "Read", 15),
      L("Quick quiz", "Confirm understanding.", "Knowledge Check", 5),
    ],
    checklist: ["Reviewed standards", "Passed the quick quiz"],
  },
  "ex-s1": {
    objectives: ["Use Blossom's safety and escalation protocols correctly."],
    lessons: [
      L("Safety SOPs", "De-escalation and incident reporting.", "Read", 8),
      L("Escalation drills", "Quick role-play.", "Role-Play", 7),
    ],
    checklist: ["Reviewed safety SOPs", "Completed escalation drills"],
  },
  "ex-p1": {
    objectives: ["Communicate with parents inside Blossom boundaries."],
    lessons: [
      L("What to share", "Tone, scope, and boundaries.", "Read", 8),
      L("Boundary drills", "What you escalate vs handle.", "Role-Play", 7),
    ],
    checklist: ["Reviewed communication SOP", "Completed boundary drills"],
  },
  "ex-c1": {
    objectives: ["Walk every assigned client's BIP, programs, and reinforcers with the BCBA."],
    lessons: [
      L("Client review", "Per-client walk-through with the BCBA.", "Discussion", 45),
    ],
    checklist: ["Walked each assigned client's plan"],
    signoffRequired: "BCBA confirms the protocol review is complete.",
  },
  "ex-r1": {
    objectives: ["Confirm readiness for independent assignment."],
    lessons: [
      L("Readiness conversation", "Lead RBT + BCBA sign-off conversation.", "Discussion", 30),
    ],
    signoffRequired: "Lead RBT Trainer and BCBA sign the experienced-RBT readiness item.",
  },
  "ex-o1": {
    objectives: ["Be ready to mentor newer RBTs."],
    lessons: [L("Mentoring basics", "How to model the Blossom standard.", "Read", 20)],
    checklist: ["Reviewed mentoring basics"],
  },
  "ex-o2": {
    objectives: ["Lead a shadow session for a new RBT."],
    lessons: [L("Hosting a shadow", "Pre, during, post.", "Read", 15)],
    checklist: ["Reviewed hosting flow"],
  },
  "ex-o3": {
    objectives: ["Give peers clean, actionable feedback."],
    lessons: [L("Feedback skills", "Specific, observable, action-oriented.", "Video", 20)],
    checklist: ["Watched the feedback video"],
  },
};

/** Lookup with a graceful fallback so unknown modules still render. */
export function getRbtModuleContent(sourceModuleId: string): RBTModuleContent | undefined {
  return RBT_MODULE_CONTENT[sourceModuleId];
}