/**
 * Full lesson content for the Scheduling Department onboarding journey.
 * Keyed by `scheduling::sched-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom Scheduling process
 * (CentralReach calendar, authorizations, availability, callouts, coverage,
 * and clean handoffs to Authorizations, HR/Credentialing, and Billing).
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

export const SCHEDULING_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Scheduling Role Orientation =====
  "scheduling::sched-w1d1::w1d1-l1": mk(
    "What Scheduling owns today — apply it inside today's Scheduling workflow.",
    "Schedule setup and accuracy, availability coordination, CentralReach updates, family/staff scheduling communication, and readiness escalation. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Schedule setup and accuracy, availability coordination, CentralReach updates, family/staff scheduling communication, and readiness escalation. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (What Scheduling owns today). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Scheduling owns today' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d1::w1d1-l2": mk(
    "What Scheduling does not own — apply it inside today's Scheduling workflow.",
    "Not intake conversion, auth approval, clinical treatment decisions, recruiting pipeline, payroll, or state escalation closure. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Not intake conversion, auth approval, clinical treatment decisions, recruiting pipeline, payroll, or state escalation closure. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (What Scheduling does not own). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Scheduling does not own' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d1::w1d1-l3": mk(
    "The scheduling lifecycle — apply it inside today's Scheduling workflow.",
    "Intake / auth readiness → assessment scheduling → new client setup → therapist/RBT scheduling → clinic / field scheduling → coverage → changes → ongoing maintenance. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Intake / auth readiness → assessment scheduling → new client setup → therapist/RBT scheduling → clinic / field scheduling → coverage → changes → ongoing maintenance. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (The scheduling lifecycle). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'The scheduling lifecycle' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 1 Day 2 · Current Scheduling Systems Tour — CentralReach, Monday, Outlook, Phone, Trackers =====
  "scheduling::sched-w1d2::w1d2-l1": mk(
    "CentralReach schedule basics — apply it inside today's Scheduling workflow.",
    "Where schedules are reviewed and updated today. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Where schedules are reviewed and updated today. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (CentralReach schedule basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach schedule basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d2::w1d2-l2": mk(
    "Monday / current tracker basics — apply it inside today's Scheduling workflow.",
    "Readiness, changes, coverage, open cases. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Readiness, changes, coverage, open cases. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Monday / current tracker basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Monday / current tracker basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d2::w1d2-l3": mk(
    "Outlook / email communication basics — apply it inside today's Scheduling workflow.",
    "Family, staff, and cross-department scheduling threads. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Family, staff, and cross-department scheduling threads. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Outlook / email communication basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / email communication basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d2::w1d2-l4": mk(
    "Phone and family/staff messages + tracker reality — apply it inside today's Scheduling workflow.",
    "Where phone calls, texts, and manual updates are documented today. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Where phone calls, texts, and manual updates are documented today. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Phone and family/staff messages + tracker reality). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Phone and family/staff messages + tracker reality' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 1 Day 3 · Scheduling Readiness Basics =====
  "scheduling::sched-w1d3::w1d3-l1": mk(
    "Authorization readiness — apply it inside today's Scheduling workflow.",
    "Confirm auth status/readiness when required. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Confirm auth status/readiness when required. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Authorization readiness). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Authorization readiness' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d3::w1d3-l2": mk(
    "Family availability — apply it inside today's Scheduling workflow.",
    "Requested schedule, location, service model. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Requested schedule, location, service model. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family availability). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family availability' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d3::w1d3-l3": mk(
    "Therapist / RBT availability — apply it inside today's Scheduling workflow.",
    "Availability and fit for the case. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Availability and fit for the case. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Therapist / RBT availability). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Therapist / RBT availability' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d3::w1d3-l4": mk(
    "Clinical / BCBA readiness + location and service model — apply it inside today's Scheduling workflow.",
    "Confirm BCBA / clinical readiness and setting. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Confirm BCBA / clinical readiness and setting. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clinical / BCBA readiness + location and service model). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinical / BCBA readiness + location and service model' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 1 Day 4 · Family and Staff Scheduling Communication =====
  "scheduling::sched-w1d4::w1d4-l1": mk(
    "Family scheduling communication — apply it inside today's Scheduling workflow.",
    "Warm, clear, specific. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Warm, clear, specific. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family scheduling communication). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family scheduling communication' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d4::w1d4-l2": mk(
    "Staff scheduling communication — apply it inside today's Scheduling workflow.",
    "Direct, professional, dated. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Direct, professional, dated. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staff scheduling communication). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staff scheduling communication' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d4::w1d4-l3": mk(
    "Clear confirmation messages — apply it inside today's Scheduling workflow.",
    "Date, time, location, service, provider, next step. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Date, time, location, service, provider, next step. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clear confirmation messages). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear confirmation messages' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d4::w1d4-l4": mk(
    "Documentation after communication — apply it inside today's Scheduling workflow.",
    "Log attempt, outcome, follow-up. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Log attempt, outcome, follow-up. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Documentation after communication). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation after communication' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "scheduling::sched-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Scheduling workflow.",
    "5–7 questions covering systems, readiness, communication, CR accuracy, boundaries. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering systems, readiness, communication, CR accuracy, boundaries. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Week 1 knowledge review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d5::w1d5-l2": mk(
    "Role boundary check — apply it inside today's Scheduling workflow.",
    "Scheduling vs Intake vs Auth vs Clinical vs Staffing vs Recruiting vs State Ops. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Scheduling vs Intake vs Auth vs Clinical vs Staffing vs Recruiting vs State Ops. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Role boundary check). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Role boundary check' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d5::w1d5-l3": mk(
    "Schedule queue walkthrough — apply it inside today's Scheduling workflow.",
    "Walk 3 items end to end with mentor. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end to end with mentor. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule queue walkthrough). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule queue walkthrough' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Scheduling workflow.",
    "What went well, what to sharpen next week. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "What went well, what to sharpen next week. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Mentor feedback). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 2 Day 1 · Assessment Scheduling =====
  "scheduling::sched-w2d1::w2d1-l1": mk(
    "Assessment scheduling purpose — apply it inside today's Scheduling workflow.",
    "Why this step matters. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Why this step matters. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Assessment scheduling purpose). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Assessment scheduling purpose' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d1::w2d1-l2": mk(
    "Assessment readiness checklist — apply it inside today's Scheduling workflow.",
    "Auth / documentation / owner approval. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Auth / documentation / owner approval. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Assessment readiness checklist). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Assessment readiness checklist' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d1::w2d1-l3": mk(
    "Family / BCBA availability coordination — apply it inside today's Scheduling workflow.",
    "Coordinate availability with clarity. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Coordinate availability with clarity. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family / BCBA availability coordination). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family / BCBA availability coordination' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d1::w2d1-l4": mk(
    "CentralReach / tracker update — apply it inside today's Scheduling workflow.",
    "Update CR and current tracker; send confirmations. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Update CR and current tracker; send confirmations. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (CentralReach / tracker update). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach / tracker update' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 2 Day 2 · New Client Schedule Setup =====
  "scheduling::sched-w2d2::w2d2-l1": mk(
    "New client schedule purpose — apply it inside today's Scheduling workflow.",
    "Why setup quality matters. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Why setup quality matters. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (New client schedule purpose). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'New client schedule purpose' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d2::w2d2-l2": mk(
    "Auth-to-schedule readiness — apply it inside today's Scheduling workflow.",
    "Confirm approvals and constraints. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Confirm approvals and constraints. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Auth-to-schedule readiness). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Auth-to-schedule readiness' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d2::w2d2-l3": mk(
    "Family availability and preferences — apply it inside today's Scheduling workflow.",
    "Location, model, constraints. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Location, model, constraints. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family availability and preferences). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family availability and preferences' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d2::w2d2-l4": mk(
    "First schedule setup — apply it inside today's Scheduling workflow.",
    "Build or observe setup in CR; confirmations. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Build or observe setup in CR; confirmations. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (First schedule setup). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'First schedule setup' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 2 Day 3 · Client Scheduling and Therapist Scheduling =====
  "scheduling::sched-w2d3::w2d3-l1": mk(
    "Client scheduling basics — apply it inside today's Scheduling workflow.",
    "Ongoing client schedule maintenance. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Ongoing client schedule maintenance. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Client scheduling basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Client scheduling basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d3::w2d3-l2": mk(
    "Therapist scheduling basics — apply it inside today's Scheduling workflow.",
    "Availability, fit, location, constraints. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Availability, fit, location, constraints. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Therapist scheduling basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Therapist scheduling basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d3::w2d3-l3": mk(
    "Availability matching — apply it inside today's Scheduling workflow.",
    "Match need with staff when current process allows. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Match need with staff when current process allows. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Availability matching). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Availability matching' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d3::w2d3-l4": mk(
    "Schedule update documentation — apply it inside today's Scheduling workflow.",
    "Clear notes on every change. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Clear notes on every change. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule update documentation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule update documentation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 2 Day 4 · RBT Availability Updates and Schedule Sync =====
  "scheduling::sched-w2d4::w2d4-l1": mk(
    "RBT availability update process — apply it inside today's Scheduling workflow.",
    "How availability comes in and where it lands. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "How availability comes in and where it lands. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (RBT availability update process). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'RBT availability update process' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d4::w2d4-l2": mk(
    "CentralReach schedule sync check — apply it inside today's Scheduling workflow.",
    "Cross-check CR against tracker/comms. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Cross-check CR against tracker/comms. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (CentralReach schedule sync check). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach schedule sync check' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d4::w2d4-l3": mk(
    "Detecting mismatches — apply it inside today's Scheduling workflow.",
    "Wrong date/time/staff/client/location/auth. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Wrong date/time/staff/client/location/auth. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Detecting mismatches). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Detecting mismatches' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d4::w2d4-l4": mk(
    "Correcting or escalating issues — apply it inside today's Scheduling workflow.",
    "Correct where owned, escalate otherwise. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Correct where owned, escalate otherwise. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Correcting or escalating issues). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correcting or escalating issues' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "scheduling::sched-w2d5::w2d5-l1": mk(
    "Assessment scheduling review — apply it inside today's Scheduling workflow.",
    "Assigned assessment tasks under review. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Assigned assessment tasks under review. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Assessment scheduling review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Assessment scheduling review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d5::w2d5-l2": mk(
    "New client schedule setup review — apply it inside today's Scheduling workflow.",
    "Assigned new-client setup tasks. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Assigned new-client setup tasks. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (New client schedule setup review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'New client schedule setup review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d5::w2d5-l3": mk(
    "Client / therapist scheduling review — apply it inside today's Scheduling workflow.",
    "Ongoing scheduling tasks. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Ongoing scheduling tasks. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Client / therapist scheduling review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Client / therapist scheduling review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w2d5::w2d5-l4": mk(
    "Schedule sync review — apply it inside today's Scheduling workflow.",
    "CR sync discipline. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "CR sync discipline. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule sync review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule sync review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 3 Day 1 · Coverage and Open Hours Review =====
  "scheduling::sched-w3d1::w3d1-l1": mk(
    "Coverage basics — apply it inside today's Scheduling workflow.",
    "Why coverage discipline matters. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Why coverage discipline matters. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Coverage basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Coverage basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d1::w3d1-l2": mk(
    "Open hours review — apply it inside today's Scheduling workflow.",
    "Client / state / location / service / staff / urgency. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Client / state / location / service / staff / urgency. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Open hours review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Open hours review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d1::w3d1-l3": mk(
    "Prioritization — apply it inside today's Scheduling workflow.",
    "Urgent disruption, high-hours, clinic coverage, recurring gaps. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Urgent disruption, high-hours, clinic coverage, recurring gaps. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Prioritization). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritization' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d1::w3d1-l4": mk(
    "Documentation and escalation — apply it inside today's Scheduling workflow.",
    "Owner, next action, and escalation. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Owner, next action, and escalation. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Documentation and escalation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation and escalation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 3 Day 2 · Rescheduling and Schedule Change Requests =====
  "scheduling::sched-w3d2::w3d2-l1": mk(
    "Schedule change request intake — apply it inside today's Scheduling workflow.",
    "Capture requester, reason, impact. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Capture requester, reason, impact. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule change request intake). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule change request intake' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d2::w3d2-l2": mk(
    "Rescheduling criteria — apply it inside today's Scheduling workflow.",
    "When and how to reschedule. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "When and how to reschedule. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Rescheduling criteria). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Rescheduling criteria' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d2::w3d2-l3": mk(
    "Family / staff confirmation — apply it inside today's Scheduling workflow.",
    "Confirm new details clearly. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Confirm new details clearly. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family / staff confirmation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family / staff confirmation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d2::w3d2-l4": mk(
    "Current system updates — apply it inside today's Scheduling workflow.",
    "CR + tracker + confirmations. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "CR + tracker + confirmations. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Current system updates). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Current system updates' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 3 Day 3 · Schedule Conflicts and Same-Day Escalations =====
  "scheduling::sched-w3d3::w3d3-l1": mk(
    "Schedule conflict types — apply it inside today's Scheduling workflow.",
    "Double booking, unavailable staff, wrong location, auth / capacity, CR mismatch. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Double booking, unavailable staff, wrong location, auth / capacity, CR mismatch. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule conflict types). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule conflict types' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d3::w3d3-l2": mk(
    "Same-day issues — apply it inside today's Scheduling workflow.",
    "Service risk, payroll / billing risk, family complaint. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Service risk, payroll / billing risk, family complaint. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Same-day issues). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Same-day issues' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d3::w3d3-l3": mk(
    "Escalation paths — apply it inside today's Scheduling workflow.",
    "Where and how to escalate. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Where and how to escalate. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Escalation paths). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation paths' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d3::w3d3-l4": mk(
    "Calm communication — apply it inside today's Scheduling workflow.",
    "Facts first, tone steady. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Facts first, tone steady. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Calm communication). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Calm communication' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 3 Day 4 · Clinic Scheduling and Field Scheduling =====
  "scheduling::sched-w3d4::w3d4-l1": mk(
    "Clinic scheduling basics — apply it inside today's Scheduling workflow.",
    "Capacity, room/space, staff availability. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Capacity, room/space, staff availability. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clinic scheduling basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinic scheduling basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d4::w3d4-l2": mk(
    "Field scheduling basics — apply it inside today's Scheduling workflow.",
    "Location, travel, family availability. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Location, travel, family availability. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Field scheduling basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Field scheduling basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d4::w3d4-l3": mk(
    "Location and capacity awareness — apply it inside today's Scheduling workflow.",
    "How location changes the scheduling call. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "How location changes the scheduling call. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Location and capacity awareness). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Location and capacity awareness' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d4::w3d4-l4": mk(
    "Clinic / field communication — apply it inside today's Scheduling workflow.",
    "Clear details in every message. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Clear details in every message. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clinic / field communication). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinic / field communication' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 3 Day 5 · Pairing Process and Staffing Escalation to Recruiting =====
  "scheduling::sched-w3d5::w3d5-l1": mk(
    "Pairing process basics — apply it inside today's Scheduling workflow.",
    "How pairing works today. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "How pairing works today. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Pairing process basics). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pairing process basics' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d5::w3d5-l2": mk(
    "Case staffing match — apply it inside today's Scheduling workflow.",
    "Client needs vs staff availability. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Client needs vs staff availability. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Case staffing match). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Case staffing match' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d5::w3d5-l3": mk(
    "Open case follow-up — apply it inside today's Scheduling workflow.",
    "Keep the item alive with next action and follow-up. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Keep the item alive with next action and follow-up. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Open case follow-up). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Open case follow-up' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w3d5::w3d5-l4": mk(
    "Staffing escalation to Recruiting — apply it inside today's Scheduling workflow.",
    "Escalate so Recruiting / State Ops can act. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Escalate so Recruiting / State Ops can act. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staffing escalation to Recruiting). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staffing escalation to Recruiting' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Scheduling Queue Ownership — Part 1 =====
  "scheduling::sched-w4d1::w4d1-l1": mk(
    "Morning scheduling queue review — apply it inside today's Scheduling workflow.",
    "Structured start-of-day queue check. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Structured start-of-day queue check. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Morning scheduling queue review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning scheduling queue review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d1::w4d1-l2": mk(
    "Prioritizing scheduling work — apply it inside today's Scheduling workflow.",
    "Risk-based prioritization. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Risk-based prioritization. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Prioritizing scheduling work). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing scheduling work' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d1::w4d1-l3": mk(
    "Updating CentralReach and current trackers — apply it inside today's Scheduling workflow.",
    "Clean, aligned updates. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Clean, aligned updates. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Updating CentralReach and current trackers). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating CentralReach and current trackers' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Scheduling workflow.",
    "No stale items, all follow-ups dated. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "No stale items, all follow-ups dated. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (End-of-day cleanup). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Scheduling Queue Ownership — Part 2 =====
  "scheduling::sched-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Scheduling workflow.",
    "Own the cadence. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Own the cadence. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Follow-up discipline). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d2::w4d2-l2": mk(
    "Schedule accuracy — apply it inside today's Scheduling workflow.",
    "CR mirrors reality. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "CR mirrors reality. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule accuracy). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule accuracy' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d2::w4d2-l3": mk(
    "Family / staff communication — apply it inside today's Scheduling workflow.",
    "Clear, warm, specific. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Clear, warm, specific. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family / staff communication). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family / staff communication' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Scheduling workflow.",
    "Clean escalation to correct owner. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Clean escalation to correct owner. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Escalation notes). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 4 Day 3 · Scheduling Communication Quality Day =====
  "scheduling::sched-w4d3::w4d3-l1": mk(
    "Clear schedule notes — apply it inside today's Scheduling workflow.",
    "Specific, actionable, dated. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Specific, actionable, dated. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Clear schedule notes). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear schedule notes' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d3::w4d3-l2": mk(
    "Family confirmation quality — apply it inside today's Scheduling workflow.",
    "Warm, specific, unambiguous. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, unambiguous. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Family confirmation quality). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Family confirmation quality' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d3::w4d3-l3": mk(
    "Staff confirmation quality — apply it inside today's Scheduling workflow.",
    "Direct, professional, dated. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Direct, professional, dated. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Staff confirmation quality). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Staff confirmation quality' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d3::w4d3-l4": mk(
    "Escalation tone and urgency — apply it inside today's Scheduling workflow.",
    "Calm, specific, actionable. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Calm, specific, actionable. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Escalation tone and urgency). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation tone and urgency' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Scheduling Simulation =====
  "scheduling::sched-w4d4::w4d4-l1": mk(
    "Readiness simulation — apply it inside today's Scheduling workflow.",
    "Confirm all inputs. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Confirm all inputs. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Readiness simulation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness simulation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d4::w4d4-l2": mk(
    "New client schedule setup simulation — apply it inside today's Scheduling workflow.",
    "Build the schedule. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Build the schedule. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (New client schedule setup simulation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'New client schedule setup simulation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d4::w4d4-l3": mk(
    "Availability / pairing simulation — apply it inside today's Scheduling workflow.",
    "Match need to staff. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Match need to staff. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Availability / pairing simulation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Availability / pairing simulation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d4::w4d4-l4": mk(
    "Schedule change / conflict + handoff simulation — apply it inside today's Scheduling workflow.",
    "Close the loop across departments. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Close the loop across departments. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Schedule change / conflict + handoff simulation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Schedule change / conflict + handoff simulation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "scheduling::sched-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Scheduling workflow.",
    "10–15 questions covering the full journey. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Final knowledge review). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Scheduling workflow.",
    "What can be owned independently vs still reviewed. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Readiness conversation). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Scheduling workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Strengths and coaching areas). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
  "scheduling::sched-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Scheduling workflow.",
    "Concrete targets for the first month of independent work. If this step slips, families lose sessions, staff lose hours, authorizations get wasted, and revenue is missed.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Scheduling runs through CentralReach (source of truth for appointments, client availability, staff availability, service codes, and authorizations), Outlook/Teams for internal coordination, and shared trackers for open shifts, callouts, and coverage. Nothing lives only in your head — if it isn't on the CentralReach calendar or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client or staff record in CentralReach and confirm active authorization, available units, and staff availability + credentialing.\\n2) Check for conflicts: overlapping sessions, drive time, service codes, location, and family constraints.\\n3) Build or update the appointment in CentralReach — correct client, staff, service code, location, and duration.\\n4) Communicate the change in the same update: family, staff, and clinical lead (Outlook/Teams as appropriate).\\n5) Log a clear note on the appointment: reason, who was notified, coverage attempted, outcome.\\n6) Hand off cleanly: Authorizations for unit/auth issues, HR/Credentialing for staff eligibility, Billing for posted sessions." },
      { heading: "What good looks like", body: "Any Scheduling teammate can open the client or staff calendar, see appointments, authorized units, current coverage, open shifts, callouts, and next actions — without asking you." },
    ],
    {
      examples: [
        { heading: "Good scheduling note", body: "\"7/15 rescheduled [client] Tue 3pm → Wed 4pm (family conflict). Confirmed 12 units remain on auth #4477. Notified family, RBT [name], BCBA [name]. Coverage secured.\"" },
        { heading: "Bad scheduling note", body: "\"Moved session.\"" },
      ],
      commonMistakes: ["Scheduling sessions without confirming active authorization + available units.", "Overbooking a BCBA/RBT past their availability, drive-time limits, or credentialing.", "Skipping a cancellation/callout note (reason, who was notified, coverage attempt).", "Not communicating changes to the family, staff, and clinical lead in the same update.", "Owning work that belongs to Authorizations, HR/Credentialing, or Billing instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample cases that match this lesson (Next 30-day growth plan). For each, confirm auth + units + availability, note conflicts, take the correct next action, and write one clean appointment note." },
      knowledgeCheck: [
        { q: "Where do appointments and staff availability live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "Before scheduling a session you must confirm:", options: ["Active auth + available units + staff availability + credentialing", "Only the family's preferred time", "Only the staff's preferred time"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves a session without confirmed auth, availability, coverage, and communication?",
      checklist: ["I confirmed active auth + units + staff availability + credentialing before scheduling.", "I updated CentralReach and set a clear appointment note.", "I notified family, staff, and clinical lead in the same update."],
    },
  ),
};
