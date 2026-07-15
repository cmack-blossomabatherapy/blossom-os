/**
 * Full lesson content for the Case Management onboarding journey.
 * Keyed by `cm-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom Case Management process
 * (CentralReach client/auth/scheduling, shared case tracker, family and
 * clinician coordination, clean handoffs to Clinical/Scheduling/Auth/Billing).
 */

import type { LessonContent } from "./lessonContent";

function mk(
  objective: string,
  whyItMatters: string,
  sections: { heading: string; body: string }[],
  extras: Partial<LessonContent> = {},
): LessonContent {
  return { objective, whyItMatters, sections, ...extras };
}

export const CASE_MANAGEMENT_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Case Manager Role Orientation =====
  "cm-w1d1::w1d1-l1": mk(
    "What Case Management owns today — apply it inside today's Case Management workflow.",
    "Coordination, visibility, family communication support, blocker tracking, escalation routing, parent-training/pause/discharge visibility. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Coordination, visibility, family communication support, blocker tracking, escalation routing, parent-training/pause/discharge visibility. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (What Case Management owns today). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What Case Management owns today' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d1::w1d1-l2": mk(
    "What Case Management does not own — apply it inside today's Case Management workflow.",
    "Not clinical supervision, not writing plans for BCBAs, not intake, not auths, not scheduling, not staffing, not billing/payroll. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Not clinical supervision, not writing plans for BCBAs, not intake, not auths, not scheduling, not staffing, not billing/payroll. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (What Case Management does not own). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What Case Management does not own' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d1::w1d1-l3": mk(
    "Current client lifecycle — apply it inside today's Case Management workflow.",
    "Transition to client → assessment → treatment plan → parent training → ongoing sessions → documentation → progress reports → pause/escalation → discharge → follow-up. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Transition to client → assessment → treatment plan → parent training → ongoing sessions → documentation → progress reports → pause/escalation → discharge → follow-up. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Current client lifecycle). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Current client lifecycle' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d1::w1d1-l4": mk(
    "Clinical boundary and confidentiality — apply it inside today's Case Management workflow.",
    "Case information is sensitive; share on a need-to-know basis and stay respectful in every note. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Case information is sensitive; share on a need-to-know basis and stay respectful in every note. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical boundary and confidentiality). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical boundary and confidentiality' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 1 Day 2 · Current Case Management Systems Tour — CentralReach, Current Trackers, Outlook, Teams, Clinical Documents =====
  "cm-w1d2::w1d2-l1": mk(
    "CentralReach basics for case visibility — apply it inside today's Case Management workflow.",
    "Where client, schedule, documentation, and clinical information may be viewed by role. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Where client, schedule, documentation, and clinical information may be viewed by role. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (CentralReach basics for case visibility). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'CentralReach basics for case visibility' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d2::w1d2-l2": mk(
    "Current case / client tracker basics — apply it inside today's Case Management workflow.",
    "Client, state, BCBA, RBT/staff, family contact, service status, schedule/staffing/auth awareness, parent training, clinical/doc blockers, pause, next action, notes. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Client, state, BCBA, RBT/staff, family contact, service status, schedule/staffing/auth awareness, parent training, clinical/doc blockers, pause, next action, notes. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Current case / client tracker basics). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Current case / client tracker basics' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d2::w1d2-l3": mk(
    "Outlook / email basics — apply it inside today's Case Management workflow.",
    "Professional, documented family and internal communication. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Professional, documented family and internal communication. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Outlook / email basics). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Outlook / email basics' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d2::w1d2-l4": mk(
    "Teams / internal communication basics — apply it inside today's Case Management workflow.",
    "Quick coordination without losing the paper trail. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Quick coordination without losing the paper trail. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Teams / internal communication basics). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Teams / internal communication basics' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d2::w1d2-l5": mk(
    "Clinical documents and QA awareness — apply it inside today's Case Management workflow.",
    "Where clinical documents, QA notes, and follow-up information live today. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Where clinical documents, QA notes, and follow-up information live today. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical documents and QA awareness). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical documents and QA awareness' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 1 Day 3 · Client Lifecycle and Transition to Client =====
  "cm-w1d3::w1d3-l1": mk(
    "Transition to client overview — apply it inside today's Case Management workflow.",
    "What happens when a family becomes an active client. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What happens when a family becomes an active client. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Transition to client overview). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Transition to client overview' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d3::w1d3-l2": mk(
    "Client lifecycle stages — apply it inside today's Case Management workflow.",
    "Stages Case Management touches vs stages other departments own. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Stages Case Management touches vs stages other departments own. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Client lifecycle stages). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Client lifecycle stages' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d3::w1d3-l3": mk(
    "Handoff information — apply it inside today's Case Management workflow.",
    "Client/family, state, BCBA, service model, auth status awareness, scheduling/staffing status, family needs, clinical next step, known blockers. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Client/family, state, BCBA, service model, auth status awareness, scheduling/staffing status, family needs, clinical next step, known blockers. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Handoff information). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Handoff information' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d3::w1d3-l4": mk(
    "First case visibility check — apply it inside today's Case Management workflow.",
    "Document what Case Management needs to monitor. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Document what Case Management needs to monitor. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (First case visibility check). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'First case visibility check' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 1 Day 4 · Family Clinical Communication Basics =====
  "cm-w1d4::w1d4-l1": mk(
    "Family communication standard — apply it inside today's Case Management workflow.",
    "Warm, specific, documented — never casual about clinical information. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, documented — never casual about clinical information. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family communication standard). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family communication standard' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d4::w1d4-l2": mk(
    "Clinical boundary in family communication — apply it inside today's Case Management workflow.",
    "Route clinical questions to BCBA / Clinical leadership. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Route clinical questions to BCBA / Clinical leadership. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical boundary in family communication). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical boundary in family communication' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d4::w1d4-l3": mk(
    "Documenting family contact — apply it inside today's Case Management workflow.",
    "Attempt, outcome, owner, next action, follow-up date. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Attempt, outcome, owner, next action, follow-up date. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Documenting family contact). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documenting family contact' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d4::w1d4-l4": mk(
    "Escalating family concerns — apply it inside today's Case Management workflow.",
    "When to loop in BCBA, Clinical leadership, State Ops, or manager. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "When to loop in BCBA, Clinical leadership, State Ops, or manager. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Escalating family concerns). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalating family concerns' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "cm-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Case Management workflow.",
    "5–7 questions covering client lifecycle, CentralReach/current trackers, family communication, owner/status/next action, and clinical boundaries. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering client lifecycle, CentralReach/current trackers, family communication, owner/status/next action, and clinical boundaries. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Week 1 knowledge review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Week 1 knowledge review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d5::w1d5-l2": mk(
    "Case Manager role boundary check — apply it inside today's Case Management workflow.",
    "Case Management vs BCBA/Clinical vs QA vs Auth vs Scheduling vs Staffing vs State Ops. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Case Management vs BCBA/Clinical vs QA vs Auth vs Scheduling vs Staffing vs State Ops. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Case Manager role boundary check). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Case Manager role boundary check' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d5::w1d5-l3": mk(
    "Client lifecycle walkthrough — apply it inside today's Case Management workflow.",
    "Walk 3 items end-to-end with mentor. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end-to-end with mentor. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Client lifecycle walkthrough). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Client lifecycle walkthrough' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Case Management workflow.",
    "Strengths and coaching areas for Week 2. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Strengths and coaching areas for Week 2. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Mentor feedback). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Mentor feedback' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 2 Day 1 · Assessment Current Operations Awareness =====
  "cm-w2d1::w2d1-l1": mk(
    "Assessment purpose — apply it inside today's Case Management workflow.",
    "Why assessments matter for treatment planning and family experience. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Why assessments matter for treatment planning and family experience. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Assessment purpose). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Assessment purpose' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d1::w2d1-l2": mk(
    "Assessment status awareness — apply it inside today's Case Management workflow.",
    "Where to find status without doing the assessment. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Where to find status without doing the assessment. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Assessment status awareness). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Assessment status awareness' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d1::w2d1-l3": mk(
    "Family / BCBA coordination points — apply it inside today's Case Management workflow.",
    "Coordinate visibility without owning the clinical work. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Coordinate visibility without owning the clinical work. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family / BCBA coordination points). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family / BCBA coordination points' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d1::w2d1-l4": mk(
    "Escalation for delays — apply it inside today's Case Management workflow.",
    "Route delays to the correct owner with next action + follow-up. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Route delays to the correct owner with next action + follow-up. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Escalation for delays). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation for delays' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 2 Day 2 · Treatment Plans and Behavior Plans Awareness =====
  "cm-w2d2::w2d2-l1": mk(
    "Treatment plan purpose — apply it inside today's Case Management workflow.",
    "What plans do for the family and clinical program. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What plans do for the family and clinical program. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Treatment plan purpose). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Treatment plan purpose' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d2::w2d2-l2": mk(
    "Behavior plan purpose — apply it inside today's Case Management workflow.",
    "Behavior plan role in ongoing services. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Behavior plan role in ongoing services. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Behavior plan purpose). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavior plan purpose' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d2::w2d2-l3": mk(
    "BCBA ownership — apply it inside today's Case Management workflow.",
    "The BCBA authors clinical content; Case Management tracks visibility. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "The BCBA authors clinical content; Case Management tracks visibility. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (BCBA ownership). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BCBA ownership' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d2::w2d2-l4": mk(
    "Tracking blockers and follow-up — apply it inside today's Case Management workflow.",
    "Missing sections, QA delays, family sign-off, next action. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Missing sections, QA delays, family sign-off, next action. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Tracking blockers and follow-up). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Tracking blockers and follow-up' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 2 Day 3 · Parent Training Visibility =====
  "cm-w2d3::w2d3-l1": mk(
    "Parent training purpose — apply it inside today's Case Management workflow.",
    "Why parent training matters to outcomes. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Why parent training matters to outcomes. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Parent training purpose). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Parent training purpose' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d3::w2d3-l2": mk(
    "Parent training status awareness — apply it inside today's Case Management workflow.",
    "Where and how to see status today. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Where and how to see status today. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Parent training status awareness). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Parent training status awareness' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d3::w2d3-l3": mk(
    "Family follow-up — apply it inside today's Case Management workflow.",
    "Warm, specific, boundaried follow-up. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, boundaried follow-up. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family follow-up). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family follow-up' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d3::w2d3-l4": mk(
    "Escalation to BCBA / Clinical leadership — apply it inside today's Case Management workflow.",
    "When to escalate a parent-training gap. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "When to escalate a parent-training gap. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Escalation to BCBA / Clinical leadership). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation to BCBA / Clinical leadership' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 2 Day 4 · Progress Reports and Clinical Documentation Awareness =====
  "cm-w2d4::w2d4-l1": mk(
    "Progress report purpose — apply it inside today's Case Management workflow.",
    "Why reports matter for families, clinical program, and authorizations. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Why reports matter for families, clinical program, and authorizations. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Progress report purpose). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Progress report purpose' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d4::w2d4-l2": mk(
    "Clinical documentation awareness — apply it inside today's Case Management workflow.",
    "What Case Management may need to see without owning documentation quality. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What Case Management may need to see without owning documentation quality. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical documentation awareness). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical documentation awareness' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d4::w2d4-l3": mk(
    "QA / Auth connection — apply it inside today's Case Management workflow.",
    "How report/documentation delays cascade. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "How report/documentation delays cascade. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (QA / Auth connection). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'QA / Auth connection' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d4::w2d4-l4": mk(
    "Follow-up and escalation — apply it inside today's Case Management workflow.",
    "Correct owner + follow-up date, always. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Correct owner + follow-up date, always. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Follow-up and escalation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up and escalation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "cm-w2d5::w2d5-l1": mk(
    "Assessment status review — apply it inside today's Case Management workflow.",
    "Move assessment visibility forward accurately. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Move assessment visibility forward accurately. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Assessment status review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Assessment status review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d5::w2d5-l2": mk(
    "Treatment / behavior plan status review — apply it inside today's Case Management workflow.",
    "Track plan status without editing clinical content. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Track plan status without editing clinical content. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Treatment / behavior plan status review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Treatment / behavior plan status review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d5::w2d5-l3": mk(
    "Parent training status review — apply it inside today's Case Management workflow.",
    "Draft and route parent-training follow-up. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Draft and route parent-training follow-up. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Parent training status review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Parent training status review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w2d5::w2d5-l4": mk(
    "Progress report / documentation status review — apply it inside today's Case Management workflow.",
    "Mentor reviews notes for clarity and boundary. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Mentor reviews notes for clarity and boundary. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Progress report / documentation status review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Progress report / documentation status review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 3 Day 1 · Session Expectations and RBT Support Awareness =====
  "cm-w3d1::w3d1-l1": mk(
    "Session expectations basics — apply it inside today's Case Management workflow.",
    "What healthy sessions look like from a case-management view. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What healthy sessions look like from a case-management view. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Session expectations basics). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Session expectations basics' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d1::w3d1-l2": mk(
    "RBT support / retention awareness — apply it inside today's Case Management workflow.",
    "How RBT support affects case health. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "How RBT support affects case health. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (RBT support / retention awareness). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'RBT support / retention awareness' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d1::w3d1-l3": mk(
    "Identifying support needs — apply it inside today's Case Management workflow.",
    "Spot signals without overstepping. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Spot signals without overstepping. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Identifying support needs). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Identifying support needs' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d1::w3d1-l4": mk(
    "Routing concerns — apply it inside today's Case Management workflow.",
    "Send to correct owner with a clear note. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Send to correct owner with a clear note. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Routing concerns). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Routing concerns' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 3 Day 2 · Services on Pause =====
  "cm-w3d2::w3d2-l1": mk(
    "What services on pause means — apply it inside today's Case Management workflow.",
    "Why paused services need active ownership. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Why paused services need active ownership. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (What services on pause means). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What services on pause means' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d2::w3d2-l2": mk(
    "Pause reason identification — apply it inside today's Case Management workflow.",
    "Use the current categories consistently. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Use the current categories consistently. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Pause reason identification). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Pause reason identification' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d2::w3d2-l3": mk(
    "Owner and re-start plan — apply it inside today's Case Management workflow.",
    "Every pause has an owner and a restart plan. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Every pause has an owner and a restart plan. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Owner and re-start plan). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Owner and re-start plan' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d2::w3d2-l4": mk(
    "Family / department follow-up — apply it inside today's Case Management workflow.",
    "Warm family contact + department handoffs. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Warm family contact + department handoffs. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family / department follow-up). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family / department follow-up' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 3 Day 3 · Discharges Current Operations =====
  "cm-w3d3::w3d3-l1": mk(
    "Discharge purpose — apply it inside today's Case Management workflow.",
    "Why respectful, organized discharge matters. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Why respectful, organized discharge matters. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Discharge purpose). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Discharge purpose' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d3::w3d3-l2": mk(
    "Discharge reason awareness — apply it inside today's Case Management workflow.",
    "Common reasons and how they change the workflow. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Common reasons and how they change the workflow. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Discharge reason awareness). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Discharge reason awareness' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d3::w3d3-l3": mk(
    "Cross-department coordination — apply it inside today's Case Management workflow.",
    "BCBA / QA / Scheduling / Staffing / Auth / Billing visibility. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "BCBA / QA / Scheduling / Staffing / Auth / Billing visibility. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Cross-department coordination). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Cross-department coordination' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d3::w3d3-l4": mk(
    "Documentation and follow-up — apply it inside today's Case Management workflow.",
    "What must be documented, and by whom. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What must be documented, and by whom. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Documentation and follow-up). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documentation and follow-up' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 3 Day 4 · Clinical Escalation and Case Review =====
  "cm-w3d4::w3d4-l1": mk(
    "Escalation criteria — apply it inside today's Case Management workflow.",
    "Family concerns, clinical risk, service pauses, repeated cancellations, staffing/scheduling blockers, doc delays, RBT concerns, BCBA delays, parent training gaps, discharge concerns, urgent state issues. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Family concerns, clinical risk, service pauses, repeated cancellations, staffing/scheduling blockers, doc delays, RBT concerns, BCBA delays, parent training gaps, discharge concerns, urgent state issues. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Escalation criteria). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation criteria' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d4::w3d4-l2": mk(
    "Clinical vs operational escalations — apply it inside today's Case Management workflow.",
    "Route to the right owner (Clinical, BCBA, QA, State Ops, Scheduling, Staffing, Auth, manager). If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Route to the right owner (Clinical, BCBA, QA, State Ops, Scheduling, Staffing, Auth, manager). Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical vs operational escalations). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical vs operational escalations' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d4::w3d4-l3": mk(
    "Case review notes — apply it inside today's Case Management workflow.",
    "Facts, impact, requested decision, follow-up date. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Facts, impact, requested decision, follow-up date. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Case review notes). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Case review notes' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d4::w3d4-l4": mk(
    "Leadership / manager handoff — apply it inside today's Case Management workflow.",
    "Handoff cleanly with the correct owner named. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Handoff cleanly with the correct owner named. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Leadership / manager handoff). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Leadership / manager handoff' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 3 Day 5 · Cross-Department Handoffs and End-of-Day Case Cleanup =====
  "cm-w3d5::w3d5-l1": mk(
    "Clinical handoff — apply it inside today's Case Management workflow.",
    "Handoffs to BCBA / Clinical / QA. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Handoffs to BCBA / Clinical / QA. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical handoff). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical handoff' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d5::w3d5-l2": mk(
    "Scheduling / Staffing / Auth / QA handoff — apply it inside today's Case Management workflow.",
    "Handoffs to operational owners. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Handoffs to operational owners. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Scheduling / Staffing / Auth / QA handoff). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Scheduling / Staffing / Auth / QA handoff' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d5::w3d5-l3": mk(
    "End-of-day case review — apply it inside today's Case Management workflow.",
    "Nothing left silently pending. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (End-of-day case review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'End-of-day case review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w3d5::w3d5-l4": mk(
    "Tomorrow's priority list — apply it inside today's Case Management workflow.",
    "Set up tomorrow before you leave. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Set up tomorrow before you leave. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Tomorrow's priority list). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Tomorrow's priority list' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Case Queue Ownership — Part 1 =====
  "cm-w4d1::w4d1-l1": mk(
    "Morning case queue review — apply it inside today's Case Management workflow.",
    "Set the day's priorities. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Set the day's priorities. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Morning case queue review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Morning case queue review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d1::w4d1-l2": mk(
    "Prioritizing case-management work — apply it inside today's Case Management workflow.",
    "Family concerns, pauses, blockers, parent-training gaps, staffing/scheduling blockers, escalations, discharges. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Family concerns, pauses, blockers, parent-training gaps, staffing/scheduling blockers, escalations, discharges. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Prioritizing case-management work). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Prioritizing case-management work' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d1::w4d1-l3": mk(
    "Updating current trackers / notes — apply it inside today's Case Management workflow.",
    "Keep systems accurate as you work. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Keep systems accurate as you work. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Updating current trackers / notes). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Updating current trackers / notes' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Case Management workflow.",
    "Nothing left silently pending. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (End-of-day cleanup). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'End-of-day cleanup' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Case Queue Ownership — Part 2 =====
  "cm-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Case Management workflow.",
    "Follow-up dates land, don't drift. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Follow-up dates land, don't drift. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Follow-up discipline). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up discipline' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d2::w4d2-l2": mk(
    "Family communication — apply it inside today's Case Management workflow.",
    "Warm, specific, dated. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, dated. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family communication). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family communication' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d2::w4d2-l3": mk(
    "Clinical boundary — apply it inside today's Case Management workflow.",
    "Route clinical decisions to Clinical leadership / BCBA owner. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Route clinical decisions to Clinical leadership / BCBA owner. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical boundary). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical boundary' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Case Management workflow.",
    "Facts, impact, requested next step. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Facts, impact, requested next step. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Escalation notes). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation notes' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 4 Day 3 · Case Management Communication Quality Day =====
  "cm-w4d3::w4d3-l1": mk(
    "Clear case notes — apply it inside today's Case Management workflow.",
    "What happened, family need, clinical/operational issue, owner, impact, follow-up date. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What happened, family need, clinical/operational issue, owner, impact, follow-up date. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clear case notes). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clear case notes' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d3::w4d3-l2": mk(
    "Family communication tone — apply it inside today's Case Management workflow.",
    "Warm, specific, boundaried. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, boundaried. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family communication tone). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family communication tone' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d3::w4d3-l3": mk(
    "BCBA / Clinical handoff quality — apply it inside today's Case Management workflow.",
    "Specific, dated, respectful — no clinical overreach. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Specific, dated, respectful — no clinical overreach. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (BCBA / Clinical handoff quality). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BCBA / Clinical handoff quality' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d3::w4d3-l4": mk(
    "Cross-department escalation quality — apply it inside today's Case Management workflow.",
    "Impact + examples + requested decision. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Impact + examples + requested decision. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Cross-department escalation quality). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Cross-department escalation quality' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Case Management Simulation =====
  "cm-w4d4::w4d4-l1": mk(
    "Client lifecycle review simulation — apply it inside today's Case Management workflow.",
    "Confirm stage, owner, next step. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Confirm stage, owner, next step. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Client lifecycle review simulation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Client lifecycle review simulation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d4::w4d4-l2": mk(
    "Family concern simulation — apply it inside today's Case Management workflow.",
    "Draft warm, boundaried family communication. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Draft warm, boundaried family communication. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Family concern simulation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family concern simulation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d4::w4d4-l3": mk(
    "Clinical / documentation blocker simulation — apply it inside today's Case Management workflow.",
    "Identify blocker, route to correct owner. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Identify blocker, route to correct owner. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Clinical / documentation blocker simulation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical / documentation blocker simulation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d4::w4d4-l4": mk(
    "Services on pause / discharge simulation — apply it inside today's Case Management workflow.",
    "Coordinate pause / discharge cleanly. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Coordinate pause / discharge cleanly. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Services on pause / discharge simulation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Services on pause / discharge simulation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d4::w4d4-l5": mk(
    "Escalation / handoff simulation — apply it inside today's Case Management workflow.",
    "Escalate with the correct trail and follow-up plan. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Escalate with the correct trail and follow-up plan. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Escalation / handoff simulation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation / handoff simulation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "cm-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Case Management workflow.",
    "10–15 questions covering the full journey. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Final knowledge review). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Final knowledge review' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Case Management workflow.",
    "What can be owned independently vs still reviewed. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Readiness conversation). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Readiness conversation' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Case Management workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Strengths and coaching areas). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Strengths and coaching areas' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
  "cm-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Case Management workflow.",
    "Concrete targets for the first month of independent work. If this step slips, families lose sessions, authorizations lapse, clinical work stalls, and cases drift without an owner.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Case Management runs through CentralReach (client record, authorizations, scheduling, session notes, treatment plans, communications log), the shared case tracker for owner/status/next action/follow-up date, and Outlook/Teams for family and clinician coordination. If it isn't logged in CentralReach or the case tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and confirm auth window, remaining units, scheduled cadence, and open clinical items.\\n2) Check the case tracker: owner, status, next action, follow-up date, and any family/clinician flags.\\n3) Do the work this lesson covers (outreach, scheduling coordination, documentation, escalation, family update).\\n4) Log every communication and decision in CentralReach and the case tracker the same day.\\n5) Hand off cleanly: Clinical (BCBA) for clinical decisions, Scheduling for coverage, Authorizations for units/renewals, Billing for posting/denials, Intake for new-client questions. Escalate risk-of-pause cases to Clinical Leadership immediately." },
      { heading: "What good looks like", body: "Any teammate can open the case and see current status, owner, next action, follow-up date, authorization + unit health, session cadence, family concerns, and last touchpoint — without asking you." },
    ],
    {
      examples: [
        { heading: "Good case entry", body: "\"7/15 [client] — auth 6/1-9/1, 18 units left, cadence 6h/wk, running short. Family requested Tue swap. Action: coord w/ Scheduling for Wed 4p, notify BCBA. Owner: [me]. Follow-up: 7/16.\"" },
        { heading: "Bad case entry", body: "\"Talked to mom, will follow up.\"" },
      ],
      commonMistakes: ["Owning work that belongs to Clinical, Scheduling, Authorizations, Billing, or Intake instead of a clean handoff.", "Leaving a case without owner, status, next action, or follow-up date.", "Not documenting family/clinician communications in the case record same day.", "Missing an authorization renewal or hour utilization drift.", "Escalating too late when a family is at risk of pause or disenrollment."],
      practiceActivity: { prompt: "Pick 2-3 real cases that match this lesson (Next 30-day growth plan). For each, confirm auth/units/cadence, log a case entry with owner/status/next action/follow-up date, and outline the exact handoff or family message." },
      knowledgeCheck: [
        { q: "Where does today's case activity live at Blossom?", options: ["CentralReach + case tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Every case entry must include:", options: ["Owner + status + next action + follow-up date", "Just a comment", "A verbal update"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Next 30-day growth plan' from ever leaving a case without owner, status, next action, and follow-up date?",
      checklist: ["I confirmed auth, unit, and cadence health for this case.", "I logged owner, status, next action, and follow-up date.", "I handed off or escalated cleanly to the right team."],
    },
  ),
};
