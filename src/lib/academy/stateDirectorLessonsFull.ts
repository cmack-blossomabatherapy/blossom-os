/**
 * Full lesson content for the State Director onboarding journey.
 * Keyed by `sd-w{n}d{n}::w{n}d{n}-l{n}` and merged into lessonContent.ts.
 * Trained on today's Blossom process — state health, hours serviced, growth,
 * local relationships, escalation accountability, and cross-department
 * accountability — using CentralReach visibility, Bloom Growth scorecard/L10,
 * Monday.com / state trackers, Viventium staff status, and Outlook/Teams.
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

export const STATE_DIRECTOR_LESSON_CONTENT: Record<string, LessonContent> = {
  "sd-w1d1::w1d1-l1": mk(
    "What the State Director owns today — apply it inside today's State Director workflow.",
    "State health, state growth, hours serviced, local relationships, escalation accountability, state performance, staff/client state visibility, and cross-department accountability. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "State health, state growth, hours serviced, local relationships, escalation accountability, state performance, staff/client state visibility, and cross-department accountability. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"What the State Director owns today\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"What the State Director owns today\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d1::w1d1-l2": mk(
    "What the State Director does not own — apply it inside today's State Director workflow.",
    "Not the permanent operator of Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, HR, Credentialing, Billing/RCM, Finance, or Clinical execution. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Not the permanent operator of Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, HR, Credentialing, Billing/RCM, Finance, or Clinical execution. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"What the State Director does not own\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"What the State Director does not own\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d1::w1d1-l3": mk(
    "State health and hours serviced — apply it inside today's State Director workflow.",
    "Hours serviced is the ultimate state operating metric. State health inputs feed it: leads, conversion, staffing capacity, open cases, auth readiness, family experience. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Hours serviced is the ultimate state operating metric. State health inputs feed it: leads, conversion, staffing capacity, open cases, auth readiness, family experience. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State health and hours serviced\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State health and hours serviced\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d1::w1d1-l4": mk(
    "Leadership mindset: own outcomes, not every task — apply it inside today's State Director workflow.",
    "Every state issue must have owner, status, next action, and follow-up date. Drive accountability without becoming the bottleneck. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Every state issue must have owner, status, next action, and follow-up date. Drive accountability without becoming the bottleneck. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Leadership mindset: own outcomes, not every task\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Leadership mindset: own outcomes, not every task\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d2::w1d2-l1": mk(
    "Monday / current tracker basics — apply it inside today's State Director workflow.",
    "State, lead/client/candidate, family, staff/RBT/BCBA, department owner, issue type, status, urgency, owner, next action, follow-up date, state impact. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "State, lead/client/candidate, family, staff/RBT/BCBA, department owner, issue type, status, urgency, owner, next action, follow-up date, state impact. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Monday / current tracker basics\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Monday / current tracker basics\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d2::w1d2-l2": mk(
    "CentralReach visibility basics — apply it inside today's State Director workflow.",
    "Read-only visibility into clinical/schedule/client info by permission. Not the state operating layer. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Read-only visibility into clinical/schedule/client info by permission. Not the state operating layer. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"CentralReach visibility basics\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"CentralReach visibility basics\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d2::w1d2-l3": mk(
    "Outlook and Teams communication basics — apply it inside today's State Director workflow.",
    "Documented, professional leadership communication with departments, staff, families, referral partners. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Documented, professional leadership communication with departments, staff, families, referral partners. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Outlook and Teams communication basics\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Outlook and Teams communication basics\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d2::w1d2-l4": mk(
    "Phone / family / staff communication basics — apply it inside today's State Director workflow.",
    "Document contact attempts and outcomes. Never leave leadership follow-up in memory. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Document contact attempts and outcomes. Never leave leadership follow-up in memory. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Phone / family / staff communication basics\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Phone / family / staff communication basics\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d2::w1d2-l5": mk(
    "State notes and leadership summaries — apply it inside today's State Director workflow.",
    "Where state leadership notes and department handoffs live today. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Where state leadership notes and department handoffs live today. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State notes and leadership summaries\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State notes and leadership summaries\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d3::w1d3-l1": mk(
    "State health definition — apply it inside today's State Director workflow.",
    "Leads, conversion, intake status, recruiting / staffing needs, open cases, hours serviced, auth blockers, schedule / staffing issues, clinical / QA concerns, family / staff issues, local marketing / BD activity, escalations. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Leads, conversion, intake status, recruiting / staffing needs, open cases, hours serviced, auth blockers, schedule / staffing issues, clinical / QA concerns, family / staff issues, local marketing / BD activity, escalations. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State health definition\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State health definition\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d3::w1d3-l2": mk(
    "State health inputs — apply it inside today's State Director workflow.",
    "Where each input lives today and who owns it. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Where each input lives today and who owns it. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State health inputs\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State health inputs\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d3::w1d3-l3": mk(
    "Hours serviced and growth — apply it inside today's State Director workflow.",
    "Read hours serviced trends, connect them to staffing capacity, open cases, and family experience. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Read hours serviced trends, connect them to staffing capacity, open cases, and family experience. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Hours serviced and growth\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Hours serviced and growth\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d3::w1d3-l4": mk(
    "Risk and blocker review — apply it inside today's State Director workflow.",
    "Categorize department-owned vs state-owned vs leadership-owned vs escalation. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Categorize department-owned vs state-owned vs leadership-owned vs escalation. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Risk and blocker review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Risk and blocker review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d4::w1d4-l1": mk(
    "Department ownership map — apply it inside today's State Director workflow.",
    "Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, Clinical, Case Management, HR, Credentialing, Billing/RCM, Marketing/BD, State Ops, leadership. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Intake, Recruiting, Authorizations, Scheduling, Staffing, QA, Clinical, Case Management, HR, Credentialing, Billing/RCM, Marketing/BD, State Ops, leadership. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Department ownership map\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Department ownership map\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d4::w1d4-l2": mk(
    "Accountability without chaos — apply it inside today's State Director workflow.",
    "Firm follow-up, respectful tone, no bypass of department owners. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Firm follow-up, respectful tone, no bypass of department owners. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Accountability without chaos\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Accountability without chaos\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d4::w1d4-l3": mk(
    "Clean handoff standards — apply it inside today's State Director workflow.",
    "Issue, state, client/candidate/family/staff, department owner, requested action, urgency, due/follow-up date, context. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Issue, state, client/candidate/family/staff, department owner, requested action, urgency, due/follow-up date, context. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Clean handoff standards\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Clean handoff standards\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d4::w1d4-l4": mk(
    "Escalation when work is stuck — apply it inside today's State Director workflow.",
    "Escalate through the correct department leader or executive path — never blast every issue. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Escalate through the correct department leader or executive path — never blast every issue. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Escalation when work is stuck\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation when work is stuck\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's State Director workflow.",
    "5–7 questions covering state health, hours serviced, current systems, department ownership, owner/status/next action, and escalation. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering state health, hours serviced, current systems, department ownership, owner/status/next action, and escalation. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Week 1 knowledge review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Week 1 knowledge review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d5::w1d5-l2": mk(
    "State Director boundary check — apply it inside today's State Director workflow.",
    "State Director vs Assistant State Director vs VA vs departments. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "State Director vs Assistant State Director vs VA vs departments. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State Director boundary check\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State Director boundary check\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d5::w1d5-l3": mk(
    "State health walkthrough — apply it inside today's State Director workflow.",
    "Walk 3 items end-to-end with mentor. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end-to-end with mentor. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State health walkthrough\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State health walkthrough\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's State Director workflow.",
    "Strengths and coaching areas for Week 2. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Strengths and coaching areas for Week 2. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Mentor feedback\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Mentor feedback\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d1::w2d1-l1": mk(
    "State growth inputs — apply it inside today's State Director workflow.",
    "Leads / referrals, marketing / BD activity, intake conversion, recruiting pipeline, staffing capacity, open cases, auth readiness, family experience, hours serviced. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Leads / referrals, marketing / BD activity, intake conversion, recruiting pipeline, staffing capacity, open cases, auth readiness, family experience, hours serviced. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State growth inputs\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State growth inputs\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d1::w2d1-l2": mk(
    "Lead flow and conversion visibility — apply it inside today's State Director workflow.",
    "Read lead sources, conversion, stalls — without becoming Intake. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Read lead sources, conversion, stalls — without becoming Intake. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Lead flow and conversion visibility\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Lead flow and conversion visibility\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d1::w2d1-l3": mk(
    "Staffing capacity as growth constraint — apply it inside today's State Director workflow.",
    "When capacity limits growth, escalate to Recruiting / Staffing with specific asks. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "When capacity limits growth, escalate to Recruiting / Staffing with specific asks. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Staffing capacity as growth constraint\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Staffing capacity as growth constraint\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d1::w2d1-l4": mk(
    "Growth blocker tracking — apply it inside today's State Director workflow.",
    "Assign owner and next action to every growth blocker; nothing sits. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Assign owner and next action to every growth blocker; nothing sits. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Growth blocker tracking\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Growth blocker tracking\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d2::w2d2-l1": mk(
    "Local relationship purpose — apply it inside today's State Director workflow.",
    "Referral partners, pediatricians, schools, community organizations, clinics, local providers. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Referral partners, pediatricians, schools, community organizations, clinics, local providers. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Local relationship purpose\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Local relationship purpose\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d2::w2d2-l2": mk(
    "Referral partner awareness — apply it inside today's State Director workflow.",
    "State contacts, local vendors / resources, and state-specific relationship notes. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "State contacts, local vendors / resources, and state-specific relationship notes. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Referral partner awareness\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Referral partner awareness\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d2::w2d2-l3": mk(
    "BD / boots-on-the-ground support — apply it inside today's State Director workflow.",
    "Coordinate with Marketing / BD when local support exists or is planned. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Coordinate with Marketing / BD when local support exists or is planned. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"BD / boots-on-the-ground support\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"BD / boots-on-the-ground support\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d2::w2d2-l4": mk(
    "Follow-up and relationship notes — apply it inside today's State Director workflow.",
    "Every relationship touch has owner, outcome, next action, follow-up date. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Every relationship touch has owner, outcome, next action, follow-up date. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Follow-up and relationship notes\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Follow-up and relationship notes\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d3::w2d3-l1": mk(
    "Intake visibility for state health — apply it inside today's State Director workflow.",
    "State leads, intake status, family follow-up, VOB readiness, stale follow-ups. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "State leads, intake status, family follow-up, VOB readiness, stale follow-ups. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Intake visibility for state health\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Intake visibility for state health\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d3::w2d3-l2": mk(
    "Lead conversion and family experience — apply it inside today's State Director workflow.",
    "Track conversion and family experience without owning every step. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Track conversion and family experience without owning every step. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Lead conversion and family experience\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Lead conversion and family experience\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d3::w2d3-l3": mk(
    "Intake support in growing states — apply it inside today's State Director workflow.",
    "Current scaling reality — support pattern only, not permanent ownership. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Current scaling reality — support pattern only, not permanent ownership. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Intake support in growing states\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Intake support in growing states\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d3::w2d3-l4": mk(
    "Intake department boundary — apply it inside today's State Director workflow.",
    "Intake exists today. State support is not a replacement for Intake ownership. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Intake exists today. State support is not a replacement for Intake ownership. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Intake department boundary\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Intake department boundary\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d4::w2d4-l1": mk(
    "State staffing need review — apply it inside today's State Director workflow.",
    "Open cases, open hours, hard-to-staff cases, staff availability, upcoming needs. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Open cases, open hours, hard-to-staff cases, staff availability, upcoming needs. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State staffing need review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State staffing need review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d4::w2d4-l2": mk(
    "Recruiting pipeline visibility — apply it inside today's State Director workflow.",
    "Read recruiting pipeline as it affects state capacity — without taking over the funnel. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Read recruiting pipeline as it affects state capacity — without taking over the funnel. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Recruiting pipeline visibility\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Recruiting pipeline visibility\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d4::w2d4-l3": mk(
    "Open cases and open hours — apply it inside today's State Director workflow.",
    "Track state open hours / cases weekly with clear owners. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Track state open hours / cases weekly with clear owners. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Open cases and open hours\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Open cases and open hours\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d4::w2d4-l4": mk(
    "Escalation to Recruiting / Staffing — apply it inside today's State Director workflow.",
    "Specific asks: role, location, schedule, hours, urgency, start target, fit considerations. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Specific asks: role, location, schedule, hours, urgency, start target, fit considerations. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Escalation to Recruiting / Staffing\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation to Recruiting / Staffing\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d5::w2d5-l1": mk(
    "Growth blocker review — apply it inside today's State Director workflow.",
    "Assigned growth-blocker set with mentor review. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Assigned growth-blocker set with mentor review. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Growth blocker review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Growth blocker review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d5::w2d5-l2": mk(
    "Local relationship review — apply it inside today's State Director workflow.",
    "Assigned relationship touchpoints. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Assigned relationship touchpoints. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Local relationship review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Local relationship review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d5::w2d5-l3": mk(
    "Intake visibility review — apply it inside today's State Director workflow.",
    "Assigned intake / lead visibility set. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Assigned intake / lead visibility set. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Intake visibility review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Intake visibility review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w2d5::w2d5-l4": mk(
    "Recruiting / staffing visibility review — apply it inside today's State Director workflow.",
    "Assigned capacity set with mentor review. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Assigned capacity set with mentor review. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Recruiting / staffing visibility review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Recruiting / staffing visibility review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d1::w3d1-l1": mk(
    "Assistant State Director leadership — apply it inside today's State Director workflow.",
    "What the Assistant State Director owns and where they need coaching. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "What the Assistant State Director owns and where they need coaching. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Assistant State Director leadership\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Assistant State Director leadership\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d1::w3d1-l2": mk(
    "VA task oversight model — apply it inside today's State Director workflow.",
    "How VA tasks are assigned, reviewed, and quality-checked. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "How VA tasks are assigned, reviewed, and quality-checked. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"VA task oversight model\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"VA task oversight model\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d1::w3d1-l3": mk(
    "Scaling state support — apply it inside today's State Director workflow.",
    "Grow support as volume grows — do not permanently absorb department work. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Grow support as volume grows — do not permanently absorb department work. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Scaling state support\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Scaling state support\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d1::w3d1-l4": mk(
    "Coaching and accountability — apply it inside today's State Director workflow.",
    "Repeated misses escalate. Unclear ownership gets clarified in writing. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Repeated misses escalate. Unclear ownership gets clarified in writing. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Coaching and accountability\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Coaching and accountability\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d2::w3d2-l1": mk(
    "Escalation types — apply it inside today's State Director workflow.",
    "Family, staff / RBT, BCBA, clinical, scheduling, staffing, auth, intake, recruiting, billing / RCM, local vendor, compliance, leadership. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Family, staff / RBT, BCBA, clinical, scheduling, staffing, auth, intake, recruiting, billing / RCM, local vendor, compliance, leadership. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Escalation types\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation types\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d2::w3d2-l2": mk(
    "Urgency and impact — apply it inside today's State Director workflow.",
    "Assess state impact and urgency before routing. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Assess state impact and urgency before routing. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Urgency and impact\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Urgency and impact\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d2::w3d2-l3": mk(
    "Escalation notes — apply it inside today's State Director workflow.",
    "Issue, state impact, attempted actions, owner, requested decision, follow-up date. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Issue, state impact, attempted actions, owner, requested decision, follow-up date. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Escalation notes\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation notes\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d2::w3d2-l4": mk(
    "Closing the loop — apply it inside today's State Director workflow.",
    "Confirm resolution back to departments and leadership; do not leave escalations hanging. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Confirm resolution back to departments and leadership; do not leave escalations hanging. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Closing the loop\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Closing the loop\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d3::w3d3-l1": mk(
    "Clinical / QA risk awareness — apply it inside today's State Director workflow.",
    "Delayed reports, treatment plan QA, family service disruption. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Delayed reports, treatment plan QA, family service disruption. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Clinical / QA risk awareness\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Clinical / QA risk awareness\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d3::w3d3-l2": mk(
    "Authorization risk awareness — apply it inside today's State Director workflow.",
    "Auth expiration, pending auth follow-up, denials. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Auth expiration, pending auth follow-up, denials. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Authorization risk awareness\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Authorization risk awareness\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d3::w3d3-l3": mk(
    "Scheduling / staffing risk awareness — apply it inside today's State Director workflow.",
    "Coverage gaps, pairing issues, RBT / BCBA availability shifts. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Coverage gaps, pairing issues, RBT / BCBA availability shifts. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Scheduling / staffing risk awareness\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Scheduling / staffing risk awareness\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d3::w3d3-l4": mk(
    "Billing / RCM / credentialing risk awareness — apply it inside today's State Director workflow.",
    "Credentialing lapses, billing errors, denials trend — escalate to the correct owner. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Credentialing lapses, billing errors, denials trend — escalate to the correct owner. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Billing / RCM / credentialing risk awareness\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Billing / RCM / credentialing risk awareness\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d4::w3d4-l1": mk(
    "State contacts — apply it inside today's State Director workflow.",
    "Key state contacts, escalation paths, local leadership. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Key state contacts, escalation paths, local leadership. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State contacts\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State contacts\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d4::w3d4-l2": mk(
    "State insurance / local requirements — apply it inside today's State Director workflow.",
    "Payer nuances, state-specific documentation, coverage rules. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Payer nuances, state-specific documentation, coverage rules. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State insurance / local requirements\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State insurance / local requirements\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d4::w3d4-l3": mk(
    "State scheduling / forms — apply it inside today's State Director workflow.",
    "Local scheduling patterns and required forms. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Local scheduling patterns and required forms. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State scheduling / forms\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State scheduling / forms\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d4::w3d4-l4": mk(
    "Local vendors and local knowledge — apply it inside today's State Director workflow.",
    "Local vendors, community resources, referral partners. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Local vendors, community resources, referral partners. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Local vendors and local knowledge\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Local vendors and local knowledge\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d5::w3d5-l1": mk(
    "Daily state check — apply it inside today's State Director workflow.",
    "Priority items, escalations, staffing capacity, hours serviced trend. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Priority items, escalations, staffing capacity, hours serviced trend. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Daily state check\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Daily state check\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d5::w3d5-l2": mk(
    "Weekly state review — apply it inside today's State Director workflow.",
    "Wins, numbers, hours serviced, growth blockers, staffing needs, clinical / auth / scheduling risks, family / staff issues, decisions needed. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Wins, numbers, hours serviced, growth blockers, staffing needs, clinical / auth / scheduling risks, family / staff issues, decisions needed. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Weekly state review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Weekly state review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d5::w3d5-l3": mk(
    "Scorecard / KPI awareness — apply it inside today's State Director workflow.",
    "Simple scorecard mindset even when current tools are imperfect. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Simple scorecard mindset even when current tools are imperfect. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Scorecard / KPI awareness\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Scorecard / KPI awareness\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w3d5::w3d5-l4": mk(
    "Leadership summary — apply it inside today's State Director workflow.",
    "Send / prepare a leadership summary according to today's process. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Send / prepare a leadership summary according to today's process. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Leadership summary\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Leadership summary\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d1::w4d1-l1": mk(
    "Morning state review — apply it inside today's State Director workflow.",
    "Review assigned state issues / tasks. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Review assigned state issues / tasks. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Morning state review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Morning state review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d1::w4d1-l2": mk(
    "Prioritizing state leadership work — apply it inside today's State Director workflow.",
    "Family escalations, growth blockers, hours-serviced risks first. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Family escalations, growth blockers, hours-serviced risks first. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Prioritizing state leadership work\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Prioritizing state leadership work\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d1::w4d1-l3": mk(
    "Department follow-up — apply it inside today's State Director workflow.",
    "Move stuck items with departments — do not take them over. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Move stuck items with departments — do not take them over. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Department follow-up\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Department follow-up\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d1::w4d1-l4": mk(
    "End-of-day leadership summary — apply it inside today's State Director workflow.",
    "Wrap the day with a leadership-ready summary of state status. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Wrap the day with a leadership-ready summary of state status. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"End-of-day leadership summary\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"End-of-day leadership summary\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's State Director workflow.",
    "Every touch has next step; nothing sits. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Every touch has next step; nothing sits. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Follow-up discipline\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Follow-up discipline\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d2::w4d2-l2": mk(
    "Department accountability — apply it inside today's State Director workflow.",
    "Firm, respectful, structured follow-up. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Firm, respectful, structured follow-up. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Department accountability\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Department accountability\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d2::w4d2-l3": mk(
    "Assistant / VA leadership — apply it inside today's State Director workflow.",
    "Coach and unblock support structure. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Coach and unblock support structure. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Assistant / VA leadership\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Assistant / VA leadership\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's State Director workflow.",
    "Escalate urgent family, staff, recruiting / staffing, pipeline, and growth blockers. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Escalate urgent family, staff, recruiting / staffing, pipeline, and growth blockers. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Escalation notes\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation notes\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d3::w4d3-l1": mk(
    "Clear state notes — apply it inside today's State Director workflow.",
    "Issue, context, owner, state impact, next action, follow-up date. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Issue, context, owner, state impact, next action, follow-up date. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Clear state notes\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Clear state notes\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d3::w4d3-l2": mk(
    "Leadership update quality — apply it inside today's State Director workflow.",
    "Facts, risks, blockers, decisions needed, next actions. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Facts, risks, blockers, decisions needed, next actions. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Leadership update quality\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Leadership update quality\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d3::w4d3-l3": mk(
    "Department accountability tone — apply it inside today's State Director workflow.",
    "Firm and respectful; no passive-aggressive escalation. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Firm and respectful; no passive-aggressive escalation. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Department accountability tone\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Department accountability tone\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d3::w4d3-l4": mk(
    "Family / staff / partner communication boundary — apply it inside today's State Director workflow.",
    "Professional and within role boundaries. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Professional and within role boundaries. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Family / staff / partner communication boundary\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Family / staff / partner communication boundary\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d4::w4d4-l1": mk(
    "State health review simulation — apply it inside today's State Director workflow.",
    "Simulated state operations scenario provided by mentor. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Simulated state operations scenario provided by mentor. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"State health review simulation\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"State health review simulation\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d4::w4d4-l2": mk(
    "Growth / hours-serviced simulation — apply it inside today's State Director workflow.",
    "Growth blocker categorization and next actions. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Growth blocker categorization and next actions. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Growth / hours-serviced simulation\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Growth / hours-serviced simulation\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d4::w4d4-l3": mk(
    "Department accountability + Assistant / VA simulation — apply it inside today's State Director workflow.",
    "Handoffs and coaching notes. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Handoffs and coaching notes. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Department accountability + Assistant / VA simulation\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Department accountability + Assistant / VA simulation\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d4::w4d4-l4": mk(
    "Escalation + leadership summary — apply it inside today's State Director workflow.",
    "Escalation note and final leadership summary. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Escalation note and final leadership summary. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Escalation + leadership summary\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation + leadership summary\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's State Director workflow.",
    "10–15 questions covering state health, hours serviced, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA vs Regional State Director, department boundaries, growth coordination, local relationships / referral / BD support, intake visibility, recruiting / staffing capacity visibility, Assistant / VA leadership, state escalation management, state-specific resources, weekly rhythm and scorecard, and executive communication quality. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering state health, hours serviced, current systems, owner/status/next action/follow-up, State Director vs Assistant State Director vs VA vs Regional State Director, department boundaries, growth coordination, local relationships / referral / BD support, intake visibility, recruiting / staffing capacity visibility, Assistant / VA leadership, state escalation management, state-specific resources, weekly rhythm and scorecard, and executive communication quality. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Final knowledge review\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Final knowledge review\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's State Director workflow.",
    "What can be owned independently vs still reviewed. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Readiness conversation\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Readiness conversation\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's State Director workflow.",
    "Name 2 strengths and 2 coaching areas. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Strengths and coaching areas\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Strengths and coaching areas\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
  "sd-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's State Director workflow.",
    "Concrete targets for the first month of independent ownership. If this slips, hours serviced drops, families feel it, staff burn out, and executives lose confidence in the state.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent ownership. At Blossom today, the State Director runs the state through CentralReach (clients, auths, scheduling, staffing visibility), Bloom Growth (state scorecard, rocks, issues, L10), Monday.com / state trackers, Viventium for staff status, and Outlook/Teams for regional coordination. If it isn't in CentralReach, the tracker, or the scorecard, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open CentralReach + your state tracker + the Bloom Growth scorecard for your state.\n2) Review today's health: hours serviced trend, caseload, auths, staffing, QA, at-risk families, open issues.\n3) Do the leadership work this lesson covers — decide, coordinate, escalate, or hold a department accountable; do NOT take over their execution.\n4) Log every state issue with owner, status, next action, and follow-up date; promote real risks into the Bloom Growth issues list for L10.\n5) Close the loop with the correct department leader and, when needed, escalate cleanly to Regional / Operations Leadership." },
      { heading: "What good looks like", body: "Any executive can open your state view and instantly see hours serviced trend, staffing capacity, open auths, QA findings, at-risk families, top 3 state issues, and who owns what next — without asking you." },
    ],
    {
      examples: [
        { heading: "Good state entry", body: "\"7/15 [state] — Hours serviced trending -8% WoW. Root cause: 4 open BCBA cases in metro. Owner: Staffing Lead + Recruiting Lead. Action: joint staffing/recruiting huddle 7/16 9a; ASD to confirm assignments by 7/18. Added to L10 issues.\"" },
        { heading: "Bad state entry", body: "\"State is behind, need to figure it out.\"" },
      ],
      commonMistakes: ["Doing Intake, Auth, Scheduling, HR, Credentialing, or QA work instead of routing and holding those owners accountable.", "Leaving state issues without an owner, next action, and follow-up date.", "Skipping the weekly scorecard / L10 review and losing the state health signal.", "Talking to families about clinical decisions instead of routing to the BCBA / Clinical.", "Not escalating capacity, staffing, or compliance risk to Regional / Operations Leadership in time."],
      practiceActivity: { prompt: "Pick 2-3 real state situations that match \"Next 30-day growth plan\". For each, pull the source of truth (CR, tracker, scorecard), write the state entry with owner/next action/follow-up date, and decide: decide, coordinate, hold accountable, or escalate." },
      knowledgeCheck: [
        { q: "Where does state-level operational activity live today at Blossom?", options: ["CentralReach + state trackers + Bloom Growth scorecard", "Personal spreadsheet", "Text threads"], answer: 0 },
        { q: "State Director role vs departments:", options: ["Own state outcomes; coordinate, unblock, and hold departments accountable", "Do every department's work personally", "Only report numbers to executives"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Next 30-day growth plan\" as state leadership — owning outcomes without becoming the operator for another department?",
      checklist: [
        "I reviewed CentralReach + state tracker + scorecard for today.",
        "I logged issues with owner, next action, and follow-up date.",
        "I coordinated with the right department and escalated real risk to Regional / Operations.",
      ],
    },
  ),
};
