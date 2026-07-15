/**
 * Full lesson content for the Assistant State Director onboarding journey.
 * Keyed by `asd-w{n}d{n}::w{n}d{n}-l{n}` and merged into lessonContent.ts.
 * Trained on today's Blossom process (CentralReach ops data, Bloom Growth
 * scorecard/L10, state trackers, Viventium staff status) and the ASD's job
 * to coordinate the state with the State Director — not replace departments.
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

export const ASSISTANT_STATE_DIRECTOR_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Assistant State Director Role Orientation =====
  "asd-w1d1::w1d1-l1": mk(
    "What the Assistant State Director owns today — apply it inside today's Assistant State Director workflow.",
    "Support execution, state issue follow-up, communication support, intake/recruiting support where currently assigned, and VA task oversight where a VA exists. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Support execution, state issue follow-up, communication support, intake/recruiting support where currently assigned, and VA task oversight where a VA exists. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (What the Assistant State Director owns today). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What the Assistant State Director owns today' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d1::w1d1-l2": mk(
    "What the Assistant State Director does not own — apply it inside today's Assistant State Director workflow.",
    "Not the permanent owner of Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, HR, Credentialing, Billing/RCM, or Clinical execution. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Not the permanent owner of Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, HR, Credentialing, Billing/RCM, or Clinical execution. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (What the Assistant State Director does not own). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What the Assistant State Director does not own' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d1::w1d1-l3": mk(
    "State Director vs Assistant State Director vs VA — apply it inside today's Assistant State Director workflow.",
    "State Director owns state health / growth / relationships / outcomes / escalation accountability. Assistant State Director supports execution and follow-up. VA supports assigned tasks as volume grows. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "State Director owns state health / growth / relationships / outcomes / escalation accountability. Assistant State Director supports execution and follow-up. VA supports assigned tasks as volume grows. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State Director vs Assistant State Director vs VA). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State Director vs Assistant State Director vs VA' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d1::w1d1-l4": mk(
    "State health and daily execution — apply it inside today's Assistant State Director workflow.",
    "No state issue, support task, lead/candidate item, case follow-up, or VA task should sit without owner, status, next action, and follow-up date. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "No state issue, support task, lead/candidate item, case follow-up, or VA task should sit without owner, status, next action, and follow-up date. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State health and daily execution). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State health and daily execution' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 1 Day 2 · Current State Operations Systems Tour — Monday, CentralReach Visibility, Outlook, Teams, Phone, and State Notes =====
  "asd-w1d2::w1d2-l1": mk(
    "Monday / current tracker basics — apply it inside today's Assistant State Director workflow.",
    "State, client/family, lead/candidate, staff/RBT/BCBA, department owner, issue type, status, urgency, owner, next action, follow-up date, notes. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "State, client/family, lead/candidate, staff/RBT/BCBA, department owner, issue type, status, urgency, owner, next action, follow-up date, notes. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Monday / current tracker basics). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Monday / current tracker basics' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d2::w1d2-l2": mk(
    "CentralReach visibility basics — apply it inside today's Assistant State Director workflow.",
    "Read-only visibility into clinical / schedule / client info by permission. Not the state ops CRM. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Read-only visibility into clinical / schedule / client info by permission. Not the state ops CRM. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (CentralReach visibility basics). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'CentralReach visibility basics' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d2::w1d2-l3": mk(
    "Outlook and Teams communication basics — apply it inside today's Assistant State Director workflow.",
    "Documented, professional communication with departments, staff, families, and state leadership. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Documented, professional communication with departments, staff, families, and state leadership. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Outlook and Teams communication basics). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Outlook and Teams communication basics' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d2::w1d2-l4": mk(
    "Phone and follow-up basics — apply it inside today's Assistant State Director workflow.",
    "Document contact attempts and outcomes; never leave follow-up in memory. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Document contact attempts and outcomes; never leave follow-up in memory. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Phone and follow-up basics). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Phone and follow-up basics' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d2::w1d2-l5": mk(
    "State notes and issue tracking — apply it inside today's Assistant State Director workflow.",
    "Where state issue notes and handoffs are captured today. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Where state issue notes and handoffs are captured today. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State notes and issue tracking). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State notes and issue tracking' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 1 Day 3 · State Health Review Basics =====
  "asd-w1d3::w1d3-l1": mk(
    "What state health means — apply it inside today's Assistant State Director workflow.",
    "Lead flow, intake status, recruiting/staffing needs, open cases, hours serviced, auth blockers, schedule/staffing issues, clinical/QA concerns, family issues, RBT/BCBA concerns, local marketing/BD support, escalations. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Lead flow, intake status, recruiting/staffing needs, open cases, hours serviced, auth blockers, schedule/staffing issues, clinical/QA concerns, family issues, RBT/BCBA concerns, local marketing/BD support, escalations. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (What state health means). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What state health means' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d3::w1d3-l2": mk(
    "State health inputs — apply it inside today's Assistant State Director workflow.",
    "Where each input lives today. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Where each input lives today. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State health inputs). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State health inputs' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d3::w1d3-l3": mk(
    "Daily / weekly review discipline — apply it inside today's Assistant State Director workflow.",
    "Cadence and what to look at. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Cadence and what to look at. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Daily / weekly review discipline). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Daily / weekly review discipline' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d3::w1d3-l4": mk(
    "State Director handoff — apply it inside today's Assistant State Director workflow.",
    "Prepare a concise, structured summary. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Prepare a concise, structured summary. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State Director handoff). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State Director handoff' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 1 Day 4 · Department Boundaries and Handoff Discipline =====
  "asd-w1d4::w1d4-l1": mk(
    "Department ownership map — apply it inside today's Assistant State Director workflow.",
    "Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, Clinical, Case Management, HR, Credentialing, Billing/RCM, Marketing/BD, State Ops, and leadership. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, Clinical, Case Management, HR, Credentialing, Billing/RCM, Marketing/BD, State Ops, and leadership. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Department ownership map). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Department ownership map' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d4::w1d4-l2": mk(
    "Clean handoff standards — apply it inside today's Assistant State Director workflow.",
    "Issue, state, client/candidate/family/staff, department owner, requested action, urgency, due/follow-up date, context. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Issue, state, client/candidate/family/staff, department owner, requested action, urgency, due/follow-up date, context. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Clean handoff standards). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clean handoff standards' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d4::w1d4-l3": mk(
    "Follow-up without taking over — apply it inside today's Assistant State Director workflow.",
    "Make sure items move without becoming the silent permanent owner. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Make sure items move without becoming the silent permanent owner. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Follow-up without taking over). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up without taking over' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d4::w1d4-l4": mk(
    "Escalation when departments are blocked — apply it inside today's Assistant State Director workflow.",
    "Escalate cleanly — not stress-forward every issue. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Escalate cleanly — not stress-forward every issue. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Escalation when departments are blocked). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation when departments are blocked' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "asd-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Assistant State Director workflow.",
    "5–7 questions covering state health, current systems, department ownership, owner/status/next action, and escalation. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering state health, current systems, department ownership, owner/status/next action, and escalation. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Week 1 knowledge review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Week 1 knowledge review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d5::w1d5-l2": mk(
    "Assistant State Director boundary check — apply it inside today's Assistant State Director workflow.",
    "Assistant State Director vs State Director vs VA vs departments. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Assistant State Director vs State Director vs VA vs departments. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Assistant State Director boundary check). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Assistant State Director boundary check' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d5::w1d5-l3": mk(
    "State health walkthrough — apply it inside today's Assistant State Director workflow.",
    "Walk 3 items end-to-end with mentor. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end-to-end with mentor. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State health walkthrough). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State health walkthrough' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Assistant State Director workflow.",
    "Strengths and coaching areas for Week 2. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Strengths and coaching areas for Week 2. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Mentor feedback). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Mentor feedback' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 2 Day 1 · Intake Support in a Growing State =====
  "asd-w2d1::w2d1-l1": mk(
    "Intake support purpose — apply it inside today's Assistant State Director workflow.",
    "Why state support helps intake in growing states. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Why state support helps intake in growing states. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Intake support purpose). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Intake support purpose' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d1::w2d1-l2": mk(
    "Current state scaling reality — apply it inside today's Assistant State Director workflow.",
    "State Director → Assistant State Director → VA support → additional VA → BD as volume grows. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "State Director → Assistant State Director → VA support → additional VA → BD as volume grows. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Current state scaling reality). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Current state scaling reality' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d1::w2d1-l3": mk(
    "Lead follow-up basics — apply it inside today's Assistant State Director workflow.",
    "Confirm owner, status, family contact needs, missing info, follow-up date, VOB/benefits readiness awareness, next action. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Confirm owner, status, family contact needs, missing info, follow-up date, VOB/benefits readiness awareness, next action. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Lead follow-up basics). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Lead follow-up basics' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d1::w2d1-l4": mk(
    "Handoff to Intake department — apply it inside today's Assistant State Director workflow.",
    "Clean handoff when Intake owns or when state support is no longer appropriate. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Clean handoff when Intake owns or when state support is no longer appropriate. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Handoff to Intake department). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Handoff to Intake department' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 2 Day 2 · Recruiting Support in a Growing State =====
  "asd-w2d2::w2d2-l1": mk(
    "Recruiting support purpose — apply it inside today's Assistant State Director workflow.",
    "Why state support helps recruiting in growing states. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Why state support helps recruiting in growing states. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Recruiting support purpose). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Recruiting support purpose' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d2::w2d2-l2": mk(
    "State hiring need awareness — apply it inside today's Assistant State Director workflow.",
    "Role / state / location need, urgency, staffing gap, open hours, hiring priority. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Role / state / location need, urgency, staffing gap, open hours, hiring priority. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State hiring need awareness). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State hiring need awareness' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d2::w2d2-l3": mk(
    "Candidate / interview follow-up awareness — apply it inside today's Assistant State Director workflow.",
    "Support follow-up where assigned; do not permanently own the pipeline. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Support follow-up where assigned; do not permanently own the pipeline. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Candidate / interview follow-up awareness). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Candidate / interview follow-up awareness' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d2::w2d2-l4": mk(
    "Handoff to Recruiting — apply it inside today's Assistant State Director workflow.",
    "Send state needs to Recruiting in a specific, actionable way. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Send state needs to Recruiting in a specific, actionable way. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Handoff to Recruiting). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Handoff to Recruiting' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 2 Day 3 · State Growth Coordination =====
  "asd-w2d3::w2d3-l1": mk(
    "What state growth means — apply it inside today's Assistant State Director workflow.",
    "Growth is more than lead volume — capacity, clinical, family experience, hours. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Growth is more than lead volume — capacity, clinical, family experience, hours. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (What state growth means). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What state growth means' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d3::w2d3-l2": mk(
    "Growth inputs — apply it inside today's Assistant State Director workflow.",
    "Leads, referrals, marketing/BD activity, recruiting/staffing capacity, open cases, clinical capacity, auth readiness, family experience, hours serviced. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Leads, referrals, marketing/BD activity, recruiting/staffing capacity, open cases, clinical capacity, auth readiness, family experience, hours serviced. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Growth inputs). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Growth inputs' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d3::w2d3-l3": mk(
    "BD / local support awareness — apply it inside today's Assistant State Director workflow.",
    "How BD / local support ties into growth. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "How BD / local support ties into growth. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (BD / local support awareness). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BD / local support awareness' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d3::w2d3-l4": mk(
    "Growth blocker tracking — apply it inside today's Assistant State Director workflow.",
    "Blocker, owner, action, follow-up date. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Blocker, owner, action, follow-up date. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Growth blocker tracking). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Growth blocker tracking' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 2 Day 4 · Client Pipeline and Case Follow-Up Support =====
  "asd-w2d4::w2d4-l1": mk(
    "Client pipeline overview — apply it inside today's Assistant State Director workflow.",
    "What the state client pipeline looks like today. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "What the state client pipeline looks like today. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Client pipeline overview). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Client pipeline overview' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d4::w2d4-l2": mk(
    "Open case / staffing awareness — apply it inside today's Assistant State Director workflow.",
    "Where open cases live and who owns them. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Where open cases live and who owns them. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Open case / staffing awareness). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Open case / staffing awareness' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d4::w2d4-l3": mk(
    "Auth / scheduling / clinical blocker awareness — apply it inside today's Assistant State Director workflow.",
    "How to see stuck items and route. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "How to see stuck items and route. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Auth / scheduling / clinical blocker awareness). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Auth / scheduling / clinical blocker awareness' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d4::w2d4-l4": mk(
    "Follow-up notes — apply it inside today's Assistant State Director workflow.",
    "Clear notes with owner, action, follow-up, state impact. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Clear notes with owner, action, follow-up, state impact. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Follow-up notes). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up notes' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "asd-w2d5::w2d5-l1": mk(
    "Intake support review — apply it inside today's Assistant State Director workflow.",
    "Handle intake support items and hand off cleanly. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Handle intake support items and hand off cleanly. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Intake support review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Intake support review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d5::w2d5-l2": mk(
    "Recruiting support review — apply it inside today's Assistant State Director workflow.",
    "Handle recruiting support items and hand off cleanly. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Handle recruiting support items and hand off cleanly. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Recruiting support review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Recruiting support review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d5::w2d5-l3": mk(
    "State growth blocker review — apply it inside today's Assistant State Director workflow.",
    "Update blockers with owner / action / follow-up. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Update blockers with owner / action / follow-up. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State growth blocker review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State growth blocker review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w2d5::w2d5-l4": mk(
    "Client pipeline follow-up review — apply it inside today's Assistant State Director workflow.",
    "Mentor reviews notes for clarity and boundary. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Mentor reviews notes for clarity and boundary. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Client pipeline follow-up review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Client pipeline follow-up review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 3 Day 1 · State VA Task Oversight =====
  "asd-w3d1::w3d1-l1": mk(
    "VA role awareness — apply it inside today's Assistant State Director workflow.",
    "What VAs support today and how their scope may expand with volume. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "What VAs support today and how their scope may expand with volume. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (VA role awareness). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'VA role awareness' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d1::w3d1-l2": mk(
    "VA task assignment — apply it inside today's Assistant State Director workflow.",
    "Clear task, instructions, due date, quality expectation, follow-up. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Clear task, instructions, due date, quality expectation, follow-up. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (VA task assignment). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'VA task assignment' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d1::w3d1-l3": mk(
    "VA work review — apply it inside today's Assistant State Director workflow.",
    "Review completed work; give specific feedback. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Review completed work; give specific feedback. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (VA work review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'VA work review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d1::w3d1-l4": mk(
    "Coaching and escalation — apply it inside today's Assistant State Director workflow.",
    "Escalate repeated quality issues or scope confusion. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Escalate repeated quality issues or scope confusion. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Coaching and escalation). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Coaching and escalation' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 3 Day 2 · State Escalation Management =====
  "asd-w3d2::w3d2-l1": mk(
    "What counts as a state escalation — apply it inside today's Assistant State Director workflow.",
    "Family, staff/RBT, BCBA, clinical, scheduling, staffing, auth, intake, recruiting, billing/RCM, local vendor, state compliance, or leadership issue. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Family, staff/RBT, BCBA, clinical, scheduling, staffing, auth, intake, recruiting, billing/RCM, local vendor, state compliance, or leadership issue. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (What counts as a state escalation). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What counts as a state escalation' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d2::w3d2-l2": mk(
    "Escalation triage — apply it inside today's Assistant State Director workflow.",
    "Urgency and owner. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Urgency and owner. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Escalation triage). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation triage' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d2::w3d2-l3": mk(
    "Escalation notes — apply it inside today's Assistant State Director workflow.",
    "Issue, state impact, attempted actions, owner, requested decision, follow-up date. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Issue, state impact, attempted actions, owner, requested decision, follow-up date. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Escalation notes). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation notes' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d2::w3d2-l4": mk(
    "Closing the loop — apply it inside today's Assistant State Director workflow.",
    "Update State Director and department on outcomes. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Update State Director and department on outcomes. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Closing the loop). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Closing the loop' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 3 Day 3 · State Communication and Follow-Up Discipline =====
  "asd-w3d3::w3d3-l1": mk(
    "Communication channels — apply it inside today's Assistant State Director workflow.",
    "When to use which channel today. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "When to use which channel today. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Communication channels). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Communication channels' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d3::w3d3-l2": mk(
    "Clear state updates — apply it inside today's Assistant State Director workflow.",
    "What happened, who owns next step, due date, state impact. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "What happened, who owns next step, due date, state impact. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Clear state updates). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clear state updates' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d3::w3d3-l3": mk(
    "Follow-up cadence — apply it inside today's Assistant State Director workflow.",
    "Set the next check and honor it. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Set the next check and honor it. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Follow-up cadence). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up cadence' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d3::w3d3-l4": mk(
    "Documentation after communication — apply it inside today's Assistant State Director workflow.",
    "Capture contact, outcome, and next action. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Capture contact, outcome, and next action. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Documentation after communication). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documentation after communication' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 3 Day 4 · State-Specific Knowledge — Contacts, Insurance, Scheduling, Local Requirements, Forms, Vendors =====
  "asd-w3d4::w3d4-l1": mk(
    "State contacts — apply it inside today's Assistant State Director workflow.",
    "Key contacts for the assigned state. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Key contacts for the assigned state. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State contacts). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State contacts' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d4::w3d4-l2": mk(
    "State insurance / local requirements — apply it inside today's Assistant State Director workflow.",
    "Payer nuances and local rules. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Payer nuances and local rules. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State insurance / local requirements). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State insurance / local requirements' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d4::w3d4-l3": mk(
    "State scheduling / forms — apply it inside today's Assistant State Director workflow.",
    "Forms and scheduling differences. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Forms and scheduling differences. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State scheduling / forms). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State scheduling / forms' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d4::w3d4-l4": mk(
    "Local vendors and local knowledge — apply it inside today's Assistant State Director workflow.",
    "Vendors and process differences. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Vendors and process differences. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Local vendors and local knowledge). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Local vendors and local knowledge' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 3 Day 5 · End-of-Day State Cleanup and Priority Planning =====
  "asd-w3d5::w3d5-l1": mk(
    "State queue cleanup — apply it inside today's Assistant State Director workflow.",
    "Sweep assigned items for missing fields. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Sweep assigned items for missing fields. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State queue cleanup). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State queue cleanup' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d5::w3d5-l2": mk(
    "Stale item review — apply it inside today's Assistant State Director workflow.",
    "Identify and act on stale items. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Identify and act on stale items. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Stale item review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Stale item review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d5::w3d5-l3": mk(
    "Tomorrow priority list — apply it inside today's Assistant State Director workflow.",
    "Top items with owner / action / expected outcome. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Top items with owner / action / expected outcome. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Tomorrow priority list). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Tomorrow priority list' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w3d5::w3d5-l4": mk(
    "State Director summary — apply it inside today's Assistant State Director workflow.",
    "Wins, risks, blockers, decisions needed, tomorrow priorities. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Wins, risks, blockers, decisions needed, tomorrow priorities. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State Director summary). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State Director summary' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled State Support Queue Ownership — Part 1 =====
  "asd-w4d1::w4d1-l1": mk(
    "Morning state queue review — apply it inside today's Assistant State Director workflow.",
    "Start each day by triaging the queue. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Start each day by triaging the queue. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Morning state queue review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Morning state queue review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d1::w4d1-l2": mk(
    "Prioritizing state work — apply it inside today's Assistant State Director workflow.",
    "Family escalations, lead/candidate follow-up, open cases, staffing/recruiting needs, auth/scheduling blockers, VA tasks, growth blockers, SD requests. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Family escalations, lead/candidate follow-up, open cases, staffing/recruiting needs, auth/scheduling blockers, VA tasks, growth blockers, SD requests. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Prioritizing state work). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Prioritizing state work' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d1::w4d1-l3": mk(
    "Updating current trackers / notes — apply it inside today's Assistant State Director workflow.",
    "Consistent updates with owner / action / follow-up. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Consistent updates with owner / action / follow-up. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Updating current trackers / notes). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Updating current trackers / notes' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Assistant State Director workflow.",
    "Nothing left without a next action. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Nothing left without a next action. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (End-of-day cleanup). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'End-of-day cleanup' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled State Support Queue Ownership — Part 2 =====
  "asd-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Assistant State Director workflow.",
    "Honor every follow-up date. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Honor every follow-up date. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Follow-up discipline). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up discipline' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d2::w4d2-l2": mk(
    "Department boundary discipline — apply it inside today's Assistant State Director workflow.",
    "Support without silently owning. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Support without silently owning. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Department boundary discipline). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Department boundary discipline' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d2::w4d2-l3": mk(
    "VA task oversight — apply it inside today's Assistant State Director workflow.",
    "Confirm VA work quality and coach as needed. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Confirm VA work quality and coach as needed. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (VA task oversight). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'VA task oversight' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Assistant State Director workflow.",
    "Escalate urgent items with structure. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Escalate urgent items with structure. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Escalation notes). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation notes' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 4 Day 3 · Assistant State Director Communication Quality Day =====
  "asd-w4d3::w4d3-l1": mk(
    "Clear state notes — apply it inside today's Assistant State Director workflow.",
    "Structure and specificity. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Structure and specificity. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Clear state notes). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clear state notes' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d3::w4d3-l2": mk(
    "Family / staff communication tone — apply it inside today's Assistant State Director workflow.",
    "Warm, professional, boundaried. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Warm, professional, boundaried. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Family / staff communication tone). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family / staff communication tone' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d3::w4d3-l3": mk(
    "Department handoff quality — apply it inside today's Assistant State Director workflow.",
    "Handoffs that departments can act on immediately. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Handoffs that departments can act on immediately. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Department handoff quality). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Department handoff quality' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d3::w4d3-l4": mk(
    "State Director update quality — apply it inside today's Assistant State Director workflow.",
    "Facts, risks, blockers, decisions needed. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Facts, risks, blockers, decisions needed. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State Director update quality). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State Director update quality' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Assistant State Director Simulation =====
  "asd-w4d4::w4d4-l1": mk(
    "State health review simulation — apply it inside today's Assistant State Director workflow.",
    "Full state health scan. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Full state health scan. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (State health review simulation). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'State health review simulation' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d4::w4d4-l2": mk(
    "Intake / recruiting support simulation — apply it inside today's Assistant State Director workflow.",
    "Route and follow up cleanly. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Route and follow up cleanly. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Intake / recruiting support simulation). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Intake / recruiting support simulation' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d4::w4d4-l3": mk(
    "Client pipeline / open case simulation — apply it inside today's Assistant State Director workflow.",
    "Identify blockers and route. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Identify blockers and route. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Client pipeline / open case simulation). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Client pipeline / open case simulation' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d4::w4d4-l4": mk(
    "VA task oversight + escalation + SD summary — apply it inside today's Assistant State Director workflow.",
    "Review VA work, escalate cleanly, deliver a State Director summary. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Review VA work, escalate cleanly, deliver a State Director summary. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (VA task oversight + escalation + SD summary). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'VA task oversight + escalation + SD summary' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "asd-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Assistant State Director workflow.",
    "10–15 questions covering state health, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA, department boundaries, intake support, recruiting support, state growth, client pipeline / open case follow-up, VA task oversight, state escalation management, state-specific resources, end-of-day cleanup, communication quality, and the scaling model. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering state health, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA, department boundaries, intake support, recruiting support, state growth, client pipeline / open case follow-up, VA task oversight, state escalation management, state-specific resources, end-of-day cleanup, communication quality, and the scaling model. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Final knowledge review). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Final knowledge review' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Assistant State Director workflow.",
    "What can be owned independently vs still reviewed. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Readiness conversation). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Readiness conversation' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Assistant State Director workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Strengths and coaching areas). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Strengths and coaching areas' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
  "asd-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Assistant State Director workflow.",
    "Concrete targets for the first month of independent work. If this step slips, state numbers drift, families feel it, staff burn out, and the State Director loses visibility into what's really happening in the state.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, the Assistant State Director runs the state day-to-day alongside the State Director through CentralReach (clients, auths, scheduling, staffing), Bloom Growth (state scorecard, rocks, issues, L10 prep), Monday.com/state trackers for open work, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + the state tracker + the Bloom Growth scorecard for your state.\\n2) Scan today's health: caseload/auth/staffing/QA/at-risk families/open issues.\\n3) Do the coordination work this lesson covers: unblock owners, route to the right department, prep the L10/scorecard, or run a state check-in.\\n4) Log every issue in the state tracker with owner, status, next action, follow-up date, and note in Bloom Growth issues when it's a real L10 issue.\\n5) Hand off cleanly: Intake, Authorizations, Scheduling, Staffing, HR, QA, or Clinical own their work — ASD holds them accountable and escalates to the State Director or Ops Leadership when a risk is real." },
      { heading: "What good looks like", body: "Any leader can open the state dashboard and see caseload health, staffing gaps, open auths, QA findings, at-risk families, top 3 issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state issue entry", body: "\"7/15 [state] — 3 clients w/ <10 auth units + no renewal in flight. Owner: Auth Team Lead. Action: renewal packets by 7/17, ASD to confirm sent. Follow-up: 7/17 AM. Added to L10 issues list.\"" },
        { heading: "Bad state issue entry", body: "\"Auths look bad, need to check.\"" },
      ],
      commonMistakes: ["Doing work that belongs to Intake, Auth, Scheduling, HR, or QA instead of routing and holding them accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the daily/weekly scorecard review with the State Director.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Not escalating capacity, staffing, or compliance risk to the State Director / Ops Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match this lesson (Next 30-day growth plan). For each, pull the source of truth (CR, tracker, scorecard), write the state issue entry with owner/next action/follow-up date, and decide: coordinate, route, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "Assistant State Director role vs departments:", options: ["Coordinate, unblock, hold owners accountable — not do their work", "Do the work themselves", "Only report numbers"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Next 30-day growth plan' as coordination and accountability instead of doing another team's work for them?",
      checklist: ["I reviewed CentralReach + state tracker + scorecard for today.", "I logged issues with owner, next action, and follow-up date.", "I unblocked owners and escalated real risk to the State Director / Ops."],
    },
  ),
};
