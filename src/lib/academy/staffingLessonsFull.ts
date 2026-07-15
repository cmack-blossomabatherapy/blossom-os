/**
 * Full lesson content for the Staffing Department onboarding journey.
 * Keyed by `staffing::staff-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom Staffing process
 * (CentralReach, open-shift tracker, credentialing/availability checks,
 * clean handoffs to Scheduling, Authorizations, HR/Credentialing, QA).
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

export const STAFFING_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Staffing Role Orientation =====
  "staffing::staff-w1d1::w1d1-l1": mk(
    "What Staffing owns today — apply it inside today's Staffing workflow.",
    "Open case review, RBT/BT availability, case matching, pairing, coverage/open hours, follow-up, escalation, and scheduling handoff. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Open case review, RBT/BT availability, case matching, pairing, coverage/open hours, follow-up, escalation, and scheduling handoff. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (What Staffing owns today). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Staffing owns today' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d1::w1d1-l2": mk(
    "What Staffing does not own — apply it inside today's Staffing workflow.",
    "Not intake conversion, auth approval, clinical treatment, recruiting pipeline execution, payroll, or final CR schedule entry unless assigned. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Not intake conversion, auth approval, clinical treatment, recruiting pipeline execution, payroll, or final CR schedule entry unless assigned. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (What Staffing does not own). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Staffing does not own' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d1::w1d1-l3": mk(
    "Staffing vs Scheduling vs Recruiting vs State Ops — apply it inside today's Staffing workflow.",
    "Staffing matches; Scheduling builds the schedule; Recruiting owns candidates; State Ops owns state health. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Staffing matches; Scheduling builds the schedule; Recruiting owns candidates; State Ops owns state health. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staffing vs Scheduling vs Recruiting vs State Ops). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staffing vs Scheduling vs Recruiting vs State Ops' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 2 · Current Staffing Systems Tour — Monday, CR-Related Data, Outlook, Phone, Trackers =====
  "staffing::staff-w1d2::w1d2-l1": mk(
    "Monday / current staffing tracker basics — apply it inside today's Staffing workflow.",
    "Client, state, service location, service type, auth/needed hours, hours serviced, availability, staffing status, owner, next action. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Client, state, service location, service type, auth/needed hours, hours serviced, availability, staffing status, owner, next action. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Monday / current staffing tracker basics). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Monday / current staffing tracker basics' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d2::w1d2-l2": mk(
    "CentralReach-related schedule/service data awareness — apply it inside today's Staffing workflow.",
    "How CR schedule/service reality can affect a staffing decision (Staffing does not own CR entry). If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How CR schedule/service reality can affect a staffing decision (Staffing does not own CR entry). Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (CentralReach-related schedule/service data awareness). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach-related schedule/service data awareness' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d2::w1d2-l3": mk(
    "Outlook / email communication basics — apply it inside today's Staffing workflow.",
    "Family, staff, and cross-department staffing threads. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Family, staff, and cross-department staffing threads. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Outlook / email communication basics). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / email communication basics' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d2::w1d2-l4": mk(
    "Phone, family/staff messages + tracker reality — apply it inside today's Staffing workflow.",
    "Where calls, texts, and manual updates get documented today. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Where calls, texts, and manual updates get documented today. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Phone, family/staff messages + tracker reality). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Phone, family/staff messages + tracker reality' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 3 · Open Case Basics and Staffing Readiness =====
  "staffing::staff-w1d3::w1d3-l1": mk(
    "What counts as an open case — apply it inside today's Staffing workflow.",
    "New client, added hours, coverage gap, lost staff, or partial staffing. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "New client, added hours, coverage gap, lost staff, or partial staffing. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (What counts as an open case). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What counts as an open case' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d3::w1d3-l2": mk(
    "Staffing readiness checklist — apply it inside today's Staffing workflow.",
    "State, location, service model, auth/needed hours, family availability, staff availability, clinical/BCBA readiness. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "State, location, service model, auth/needed hours, family availability, staff availability, clinical/BCBA readiness. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staffing readiness checklist). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staffing readiness checklist' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d3::w1d3-l3": mk(
    "Authorized / needed hours awareness — apply it inside today's Staffing workflow.",
    "How auth/needed hours shape match urgency and coverage priorities. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How auth/needed hours shape match urgency and coverage priorities. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Authorized / needed hours awareness). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Authorized / needed hours awareness' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d3::w1d3-l4": mk(
    "Owner and next action — apply it inside today's Staffing workflow.",
    "Every open case gets an owner and a next action before you leave it. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Every open case gets an owner and a next action before you leave it. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Owner and next action). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Owner and next action' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 4 · RBT/BT Availability and Fit =====
  "staffing::staff-w1d4::w1d4-l1": mk(
    "RBT/BT availability basics — apply it inside today's Staffing workflow.",
    "Where availability lives today and how it's kept current. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Where availability lives today and how it's kept current. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (RBT/BT availability basics). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'RBT/BT availability basics' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d4::w1d4-l2": mk(
    "Availability updates — apply it inside today's Staffing workflow.",
    "How and when to refresh availability information. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How and when to refresh availability information. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Availability updates). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Availability updates' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d4::w1d4-l3": mk(
    "Fit factors — apply it inside today's Staffing workflow.",
    "Location, travel, service model, hours capacity, clinic vs field, restrictions. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Location, travel, service model, hours capacity, clinic vs field, restrictions. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Fit factors). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Fit factors' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d4::w1d4-l4": mk(
    "Documentation and follow-up — apply it inside today's Staffing workflow.",
    "Document potential match, blocker, or follow-up needed. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Document potential match, blocker, or follow-up needed. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Documentation and follow-up). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation and follow-up' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "staffing::staff-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Staffing workflow.",
    "5–7 questions covering open cases, owner/status/next action, availability, current systems, and role boundaries. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering open cases, owner/status/next action, availability, current systems, and role boundaries. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Week 1 knowledge review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d5::w1d5-l2": mk(
    "Staffing role boundary check — apply it inside today's Staffing workflow.",
    "Staffing vs Scheduling vs Recruiting vs State Ops vs Clinical. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Staffing vs Scheduling vs Recruiting vs State Ops vs Clinical. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staffing role boundary check). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staffing role boundary check' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d5::w1d5-l3": mk(
    "Open case walkthrough — apply it inside today's Staffing workflow.",
    "Walk 3 items end to end with mentor. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end to end with mentor. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Open case walkthrough). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Open case walkthrough' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Staffing workflow.",
    "What went well; what to sharpen next week. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What went well; what to sharpen next week. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Mentor feedback). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 1 · Case Staffing Match Process =====
  "staffing::staff-w2d1::w2d1-l1": mk(
    "Case need review — apply it inside today's Staffing workflow.",
    "What does this case actually require? If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What does this case actually require? Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Case need review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Case need review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d1::w2d1-l2": mk(
    "Staff availability review — apply it inside today's Staffing workflow.",
    "What can each candidate realistically do? If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What can each candidate realistically do? Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staff availability review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staff availability review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d1::w2d1-l3": mk(
    "Match criteria — apply it inside today's Staffing workflow.",
    "How Blossom decides today whether a match is strong. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How Blossom decides today whether a match is strong. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Match criteria). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Match criteria' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d1::w2d1-l4": mk(
    "Match documentation — apply it inside today's Staffing workflow.",
    "Document why the match works or why it does not. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Document why the match works or why it does not. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Match documentation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Match documentation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 2 · Pairing Process — Current Operations =====
  "staffing::staff-w2d2::w2d2-l1": mk(
    "Pairing purpose — apply it inside today's Staffing workflow.",
    "Why we pair carefully instead of quickly. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Why we pair carefully instead of quickly. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Pairing purpose). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pairing purpose' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d2::w2d2-l2": mk(
    "Pairing statuses — apply it inside today's Staffing workflow.",
    "What each current status means. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What each current status means. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Pairing statuses). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pairing statuses' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d2::w2d2-l3": mk(
    "Confirmation steps — apply it inside today's Staffing workflow.",
    "How family and staff confirmations happen today. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How family and staff confirmations happen today. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Confirmation steps). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confirmation steps' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d2::w2d2-l4": mk(
    "Scheduling handoff — apply it inside today's Staffing workflow.",
    "What Scheduling needs to receive a ready match cleanly. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What Scheduling needs to receive a ready match cleanly. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Scheduling handoff). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Scheduling handoff' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 3 · Coverage and Open Hours Review =====
  "staffing::staff-w2d3::w2d3-l1": mk(
    "Coverage basics — apply it inside today's Staffing workflow.",
    "What counts as a coverage gap today. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What counts as a coverage gap today. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Coverage basics). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Coverage basics' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d3::w2d3-l2": mk(
    "Open hours basics — apply it inside today's Staffing workflow.",
    "What counts as open hours and why they matter. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What counts as open hours and why they matter. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Open hours basics). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Open hours basics' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d3::w2d3-l3": mk(
    "Prioritizing staffing gaps — apply it inside today's Staffing workflow.",
    "How to sort urgency without missing quiet risks. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How to sort urgency without missing quiet risks. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Prioritizing staffing gaps). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing staffing gaps' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d3::w2d3-l4": mk(
    "Coverage documentation — apply it inside today's Staffing workflow.",
    "Owner, status, next action, follow-up date for coverage. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Owner, status, next action, follow-up date for coverage. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Coverage documentation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Coverage documentation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 4 · Family and Staff Communication for Staffing =====
  "staffing::staff-w2d4::w2d4-l1": mk(
    "Family availability confirmation — apply it inside today's Staffing workflow.",
    "Warm, clear, specific — no promises. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Warm, clear, specific — no promises. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family availability confirmation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family availability confirmation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d4::w2d4-l2": mk(
    "Staff availability confirmation — apply it inside today's Staffing workflow.",
    "Direct, professional, dated. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Direct, professional, dated. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staff availability confirmation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staff availability confirmation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d4::w2d4-l3": mk(
    "Match communication — apply it inside today's Staffing workflow.",
    "How and when to communicate a proposed match. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How and when to communicate a proposed match. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Match communication). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Match communication' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d4::w2d4-l4": mk(
    "Documentation after communication — apply it inside today's Staffing workflow.",
    "Log attempt, outcome, next follow-up. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Log attempt, outcome, next follow-up. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Documentation after communication). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation after communication' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "staffing::staff-w2d5::w2d5-l1": mk(
    "Case match review — apply it inside today's Staffing workflow.",
    "Match decisions on real / sample items. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Match decisions on real / sample items. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Case match review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Case match review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d5::w2d5-l2": mk(
    "Pairing review — apply it inside today's Staffing workflow.",
    "Move pairings toward confirmation or escalation. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Move pairings toward confirmation or escalation. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Pairing review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pairing review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d5::w2d5-l3": mk(
    "Coverage / open hours review — apply it inside today's Staffing workflow.",
    "Prioritize and document. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Prioritize and document. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Coverage / open hours review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Coverage / open hours review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w2d5::w2d5-l4": mk(
    "Family / staff communication review — apply it inside today's Staffing workflow.",
    "Manager reviews written and verbal comms. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Manager reviews written and verbal comms. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family / staff communication review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family / staff communication review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 1 · Staffing Escalation to Recruiting =====
  "staffing::staff-w3d1::w3d1-l1": mk(
    "When recruiting escalation is needed — apply it inside today's Staffing workflow.",
    "Real gap vs stale tracker vs missed match. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Real gap vs stale tracker vs missed match. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (When recruiting escalation is needed). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'When recruiting escalation is needed' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d1::w3d1-l2": mk(
    "What Recruiting needs to know — apply it inside today's Staffing workflow.",
    "State, location, service, days/times, hours, urgency, case type, start target, special fit. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "State, location, service, days/times, hours, urgency, case type, start target, special fit. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (What Recruiting needs to know). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Recruiting needs to know' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d1::w3d1-l3": mk(
    "Writing a clear staffing need — apply it inside today's Staffing workflow.",
    "Concise, specific, actionable. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Concise, specific, actionable. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Writing a clear staffing need). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Writing a clear staffing need' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d1::w3d1-l4": mk(
    "Follow-up on recruiting escalations — apply it inside today's Staffing workflow.",
    "Confirm receipt, set follow-up date, track outcome. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Confirm receipt, set follow-up date, track outcome. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Follow-up on recruiting escalations). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up on recruiting escalations' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 2 · State Ops and Manager Handoffs =====
  "staffing::staff-w3d2::w3d2-l1": mk(
    "State health impact — apply it inside today's Staffing workflow.",
    "Which staffing issues actually move state metrics. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Which staffing issues actually move state metrics. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (State health impact). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'State health impact' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d2::w3d2-l2": mk(
    "State Ops handoff criteria — apply it inside today's Staffing workflow.",
    "When to loop State Ops. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "When to loop State Ops. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (State Ops handoff criteria). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'State Ops handoff criteria' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d2::w3d2-l3": mk(
    "Manager review criteria — apply it inside today's Staffing workflow.",
    "When to loop your Staffing manager. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "When to loop your Staffing manager. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Manager review criteria). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Manager review criteria' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d2::w3d2-l4": mk(
    "Clear escalation notes — apply it inside today's Staffing workflow.",
    "Issue, impact, attempts, blocker, owner, requested decision. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Issue, impact, attempts, blocker, owner, requested decision. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clear escalation notes). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear escalation notes' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 3 · Hours Serviced and Staffing Review =====
  "staffing::staff-w3d3::w3d3-l1": mk(
    "Hours serviced basics — apply it inside today's Staffing workflow.",
    "Why hours serviced matters beyond the schedule. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Why hours serviced matters beyond the schedule. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Hours serviced basics). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Hours serviced basics' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d3::w3d3-l2": mk(
    "Scheduled vs needed hours awareness — apply it inside today's Staffing workflow.",
    "How to read the gap fairly. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How to read the gap fairly. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Scheduled vs needed hours awareness). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Scheduled vs needed hours awareness' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d3::w3d3-l3": mk(
    "Open hours pattern review — apply it inside today's Staffing workflow.",
    "Look for recurring patterns, not just single misses. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Look for recurring patterns, not just single misses. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Open hours pattern review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Open hours pattern review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d3::w3d3-l4": mk(
    "Staffing action plan — apply it inside today's Staffing workflow.",
    "Match, confirm, cover, escalate, or manager-review. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Match, confirm, cover, escalate, or manager-review. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staffing action plan). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staffing action plan' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 4 · Hard-to-Staff Cases and Fit Problems =====
  "staffing::staff-w3d4::w3d4-l1": mk(
    "Hard-to-staff case types — apply it inside today's Staffing workflow.",
    "Common patterns Blossom sees today. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Common patterns Blossom sees today. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Hard-to-staff case types). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Hard-to-staff case types' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d4::w3d4-l2": mk(
    "Fit problem review — apply it inside today's Staffing workflow.",
    "Why did this pairing fail — and what did we learn? If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Why did this pairing fail — and what did we learn? Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Fit problem review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Fit problem review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d4::w3d4-l3": mk(
    "Option building — apply it inside today's Staffing workflow.",
    "Alternate schedule, partial staffing, recruiting, state outreach, manager review, or clinical/BCBA input. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Alternate schedule, partial staffing, recruiting, state outreach, manager review, or clinical/BCBA input. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Option building). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Option building' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d4::w3d4-l4": mk(
    "Escalation and follow-up — apply it inside today's Staffing workflow.",
    "How to escalate a hard case with facts and options. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "How to escalate a hard case with facts and options. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Escalation and follow-up). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation and follow-up' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 5 · Staffing Cleanup and End-of-Day Discipline =====
  "staffing::staff-w3d5::w3d5-l1": mk(
    "End-of-day open case review — apply it inside today's Staffing workflow.",
    "The last pass of the day. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "The last pass of the day. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (End-of-day open case review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day open case review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d5::w3d5-l2": mk(
    "Stale follow-up cleanup — apply it inside today's Staffing workflow.",
    "Find and fix silent items. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Find and fix silent items. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Stale follow-up cleanup). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Stale follow-up cleanup' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d5::w3d5-l3": mk(
    "Owner and next action check — apply it inside today's Staffing workflow.",
    "Nothing leaves the day without owner and next action. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Nothing leaves the day without owner and next action. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Owner and next action check). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Owner and next action check' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w3d5::w3d5-l4": mk(
    "Tomorrow's priority list — apply it inside today's Staffing workflow.",
    "Urgent coverage, open hours, no-match, family waiting, escalation follow-up. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Urgent coverage, open hours, no-match, family waiting, escalation follow-up. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Tomorrow's priority list). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Tomorrow's priority list' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Staffing Queue Ownership — Part 1 =====
  "staffing::staff-w4d1::w4d1-l1": mk(
    "Morning staffing queue review — apply it inside today's Staffing workflow.",
    "Set the day's priorities. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Set the day's priorities. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Morning staffing queue review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning staffing queue review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d1::w4d1-l2": mk(
    "Prioritizing staffing work — apply it inside today's Staffing workflow.",
    "Urgent coverage, longest-open, high-hours, family concern. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Urgent coverage, longest-open, high-hours, family concern. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Prioritizing staffing work). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing staffing work' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d1::w4d1-l3": mk(
    "Updating current trackers — apply it inside today's Staffing workflow.",
    "Keep Monday / trackers accurate as you work. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Keep Monday / trackers accurate as you work. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Updating current trackers). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating current trackers' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Staffing workflow.",
    "Repeat the Day 15 discipline. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Repeat the Day 15 discipline. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (End-of-day cleanup). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Staffing Queue Ownership — Part 2 =====
  "staffing::staff-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Staffing workflow.",
    "Follow-up dates land, don't drift. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Follow-up dates land, don't drift. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Follow-up discipline). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d2::w4d2-l2": mk(
    "Match quality — apply it inside today's Staffing workflow.",
    "Match decisions get sharper with reps. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Match decisions get sharper with reps. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Match quality). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Match quality' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d2::w4d2-l3": mk(
    "Family / staff communication — apply it inside today's Staffing workflow.",
    "Keep tone warm, specific, documented. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Keep tone warm, specific, documented. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family / staff communication). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family / staff communication' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Staffing workflow.",
    "Escalate the right way, to the right owner. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Escalate the right way, to the right owner. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Escalation notes). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 3 · Staffing Communication Quality Day =====
  "staffing::staff-w4d3::w4d3-l1": mk(
    "Clear staffing notes — apply it inside today's Staffing workflow.",
    "What is needed, who is available, what was attempted, owner, follow-up date. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What is needed, who is available, what was attempted, owner, follow-up date. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clear staffing notes). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear staffing notes' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d3::w4d3-l2": mk(
    "Family / staff update quality — apply it inside today's Staffing workflow.",
    "Warm, specific, honest — never overpromise. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, honest — never overpromise. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family / staff update quality). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family / staff update quality' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d3::w4d3-l3": mk(
    "Recruiting escalation quality — apply it inside today's Staffing workflow.",
    "Specific need, urgency, follow-up date. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Specific need, urgency, follow-up date. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Recruiting escalation quality). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Recruiting escalation quality' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d3::w4d3-l4": mk(
    "State Ops escalation quality — apply it inside today's Staffing workflow.",
    "Impact, attempts, requested decision. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Impact, attempts, requested decision. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (State Ops escalation quality). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'State Ops escalation quality' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Staffing Simulation =====
  "staffing::staff-w4d4::w4d4-l1": mk(
    "Open case review simulation — apply it inside today's Staffing workflow.",
    "Start from a fresh open case. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Start from a fresh open case. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Open case review simulation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Open case review simulation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d4::w4d4-l2": mk(
    "Match and pairing simulation — apply it inside today's Staffing workflow.",
    "Decide, document, and confirm. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Decide, document, and confirm. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Match and pairing simulation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Match and pairing simulation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d4::w4d4-l3": mk(
    "Coverage / open hours simulation — apply it inside today's Staffing workflow.",
    "Prioritize and act. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Prioritize and act. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Coverage / open hours simulation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Coverage / open hours simulation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d4::w4d4-l4": mk(
    "Escalation / handoff simulation — apply it inside today's Staffing workflow.",
    "Hand off to Scheduling or escalate to Recruiting / State Ops. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Hand off to Scheduling or escalate to Recruiting / State Ops. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Escalation / handoff simulation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation / handoff simulation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "staffing::staff-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Staffing workflow.",
    "10–15 questions covering the full journey. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Final knowledge review). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Staffing workflow.",
    "What can be owned independently vs still reviewed. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Readiness conversation). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Staffing workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Strengths and coaching areas). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
  "staffing::staff-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Staffing workflow.",
    "Concrete targets for the first month of independent work. If this step slips, cases sit unstaffed, authorized hours go unused, staff lose hours, and families lose services.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Staffing runs through CentralReach (client + staff records, appointments, authorizations), the shared open-shift / match tracker, Outlook + Teams for internal coordination, and phone/email for staff outreach. Nothing lives only in your head — if it isn't in CentralReach or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm client, authorized hours/service codes, location, and clinical needs.\\n2) Pull staff options: confirm credentials, availability, drive time/location, and client fit.\\n3) Outreach in the approved channel (phone/text/email) with a clear, warm offer — availability, expectations, start.\\n4) Log every attempt: who, when, response, why declined if applicable.\\n5) When matched, update CentralReach + shared tracker and notify family, staff, and clinical lead in the same update.\\n6) Hand off cleanly: Scheduling to build the calendar, Authorizations for unit issues, HR/Credentialing for staff eligibility, QA for clinical concerns." },
      { heading: "What good looks like", body: "Any Staffing teammate can open the case, see the client, authorized hours, current match, gaps to fill, staff options considered, outreach attempts, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good staffing note", body: "\"7/15 offered [client] Tue/Thu 3-6pm to RBT [name] — confirmed creds, 12mi drive, GA. Accepted. Notified family + BCBA. Scheduling to build calendar.\"" },
        { heading: "Bad staffing note", body: "\"Asked someone, waiting.\"" },
      ],
      commonMistakes: ["Matching a staff member without confirming credentials, availability, drive time, and client fit.", "Leaving an open shift or unfilled case without owner, outreach log, and next action.", "Skipping communication to family, staff, or clinical lead when a match changes.", "Owning work that belongs to Scheduling, Authorizations, HR/Credentialing, or QA instead of a clean handoff.", "Not documenting why a staff option was declined or a match failed."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Next 30-day growth plan). For each, confirm client + hours, pull staff options with credentials/availability/drive, run outreach, and log one clean staffing note." },
      knowledgeCheck: [
        { q: "Where do staffing matches and open cases live today at Blossom?", options: ["CentralReach + shared tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before offering a case to a staff member you must confirm:", options: ["Credentials + availability + drive time + client fit", "Only their preferred hours", "Only the family's preferred day"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves a case without owner, outreach log, next action, and clean handoff?",
      checklist: ["I confirmed credentials + availability + drive time + client fit before offering.", "I logged outreach attempts and outcome on the case.", "I notified family, staff, and clinical lead in the same update and handed off cleanly."],
    },
  ),
};
