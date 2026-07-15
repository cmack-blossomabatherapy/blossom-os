/**
 * Full lesson content for the QA Department onboarding journey.
 * Keyed by `qa-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom QA process
 * (CentralReach note/plan review, payer compliance, findings tracker,
 * clinician coaching, clean handoffs to Clinical, Scheduling, Auth, Billing).
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

export const QA_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · QA Role Orientation =====
  "qa-w1d1::w1d1-l1": mk(
    "What QA owns today — apply it inside today's QA workflow.",
    "Review of clinical reports and treatment plans, documentation standards, missing-item follow-up, corrections, compliance/audits, trend reporting, escalation. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Review of clinical reports and treatment plans, documentation standards, missing-item follow-up, corrections, compliance/audits, trend reporting, escalation. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (What QA owns today). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What QA owns today' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d1::w1d1-l2": mk(
    "What QA does not own — apply it inside today's QA workflow.",
    "Not clinical judgment, not writing the treatment plan for the BCBA, not authorizations, not intake, not scheduling, not payroll. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Not clinical judgment, not writing the treatment plan for the BCBA, not authorizations, not intake, not scheduling, not payroll. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (What QA does not own). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What QA does not own' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d1::w1d1-l3": mk(
    "Current QA lifecycle — apply it inside today's QA workflow.",
    "Item enters queue → review → missing/correction items documented → owner set → follow-up → corrections reviewed → escalated when needed → final status updated. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Item enters queue → review → missing/correction items documented → owner set → follow-up → corrections reviewed → escalated when needed → final status updated. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Current QA lifecycle). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Current QA lifecycle' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d1::w1d1-l4": mk(
    "Confidentiality and clinical sensitivity — apply it inside today's QA workflow.",
    "Clinical QA content is sensitive; share on a need-to-know basis and stay respectful in every note. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Clinical QA content is sensitive; share on a need-to-know basis and stay respectful in every note. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Confidentiality and clinical sensitivity). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confidentiality and clinical sensitivity' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 1 Day 2 · Current QA Systems Tour — CentralReach, QA Trackers, NoteGuard/Amerigroup, Outlook, Teams =====
  "qa-w1d2::w1d2-l1": mk(
    "CentralReach basics for QA — apply it inside today's QA workflow.",
    "Where clinical notes, reports, and client documentation may be reviewed. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Where clinical notes, reports, and client documentation may be reviewed. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (CentralReach basics for QA). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach basics for QA' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d2::w1d2-l2": mk(
    "Current QA tracker / Monday tracker basics — apply it inside today's QA workflow.",
    "Client, BCBA, RBT, state, document type, due date, status, missing items, correction owner, follow-up, reviewer, notes. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Client, BCBA, RBT, state, document type, due date, status, missing items, correction owner, follow-up, reviewer, notes. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Current QA tracker / Monday tracker basics). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Current QA tracker / Monday tracker basics' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d2::w1d2-l3": mk(
    "NoteGuard awareness — apply it inside today's QA workflow.",
    "Assigned workflow (e.g. Anje Grobler) — not universal to every QA task. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Assigned workflow (e.g. Anje Grobler) — not universal to every QA task. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (NoteGuard awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'NoteGuard awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d2::w1d2-l4": mk(
    "Amerigroup review awareness — apply it inside today's QA workflow.",
    "Assigned daily note review workflow. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Assigned daily note review workflow. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Amerigroup review awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Amerigroup review awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d2::w1d2-l5": mk(
    "Outlook / Teams communication basics — apply it inside today's QA workflow.",
    "Professional QA correction and escalation communication norms. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Professional QA correction and escalation communication norms. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Outlook / Teams communication basics). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / Teams communication basics' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 1 Day 3 · Documentation Standards Basics =====
  "qa-w1d3::w1d3-l1": mk(
    "Documentation standards purpose — apply it inside today's QA workflow.",
    "Why standards protect clinical quality and downstream operations. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Why standards protect clinical quality and downstream operations. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Documentation standards purpose). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation standards purpose' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d3::w1d3-l2": mk(
    "Common documentation categories — apply it inside today's QA workflow.",
    "Notes, reports, treatment plans, forms, signatures/dates, payer-specific items. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Notes, reports, treatment plans, forms, signatures/dates, payer-specific items. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Common documentation categories). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Common documentation categories' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d3::w1d3-l3": mk(
    "Missing item identification — apply it inside today's QA workflow.",
    "Read against the current QA checklist or standard. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Read against the current QA checklist or standard. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Missing item identification). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item identification' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d3::w1d3-l4": mk(
    "Correction note quality — apply it inside today's QA workflow.",
    "What is wrong/missing, who owns it, what to fix, follow-up date. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "What is wrong/missing, who owns it, what to fix, follow-up date. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction note quality). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction note quality' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 1 Day 4 · Treatment Plan QA Basics =====
  "qa-w1d4::w1d4-l1": mk(
    "Treatment plan QA purpose — apply it inside today's QA workflow.",
    "Why treatment plan QA protects clinical quality and auth readiness. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Why treatment plan QA protects clinical quality and auth readiness. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Treatment plan QA purpose). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Treatment plan QA purpose' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d4::w1d4-l2": mk(
    "Common treatment plan review points — apply it inside today's QA workflow.",
    "Required sections, standards, signatures/dates, payer/state requirements. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Required sections, standards, signatures/dates, payer/state requirements. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Common treatment plan review points). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Common treatment plan review points' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d4::w1d4-l3": mk(
    "BCBA correction workflow — apply it inside today's QA workflow.",
    "Route correction requests without rewriting clinical content. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route correction requests without rewriting clinical content. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (BCBA correction workflow). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'BCBA correction workflow' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d4::w1d4-l4": mk(
    "Auth readiness impact — apply it inside today's QA workflow.",
    "How treatment plan QA affects authorizations and service delivery. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "How treatment plan QA affects authorizations and service delivery. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Auth readiness impact). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Auth readiness impact' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "qa-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's QA workflow.",
    "5–7 questions covering QA ownership, documentation standards, treatment plan QA, and current systems. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering QA ownership, documentation standards, treatment plan QA, and current systems. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Week 1 knowledge review). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d5::w1d5-l2": mk(
    "QA role boundary check — apply it inside today's QA workflow.",
    "QA vs Clinical vs Auth vs Compliance vs State Ops. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "QA vs Clinical vs Auth vs Compliance vs State Ops. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (QA role boundary check). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'QA role boundary check' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d5::w1d5-l3": mk(
    "QA item walkthrough — apply it inside today's QA workflow.",
    "Walk 3 items end-to-end with mentor. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end-to-end with mentor. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (QA item walkthrough). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'QA item walkthrough' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's QA workflow.",
    "Strengths and coaching areas for Week 2. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Strengths and coaching areas for Week 2. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Mentor feedback). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 2 Day 1 · Clinical Report QA Review =====
  "qa-w2d1::w2d1-l1": mk(
    "Clinical report QA purpose — apply it inside today's QA workflow.",
    "Quality + timeliness protect clients and downstream operations. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Quality + timeliness protect clients and downstream operations. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Clinical report QA purpose). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinical report QA purpose' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d1::w2d1-l2": mk(
    "Report review checklist — apply it inside today's QA workflow.",
    "Use the current QA checklist consistently. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Use the current QA checklist consistently. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Report review checklist). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Report review checklist' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d1::w2d1-l3": mk(
    "Report timeline awareness — apply it inside today's QA workflow.",
    "Late reports cascade into auth and clinical delays. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Late reports cascade into auth and clinical delays. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Report timeline awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Report timeline awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d1::w2d1-l4": mk(
    "Correction request workflow — apply it inside today's QA workflow.",
    "Route to correct owner with clear next action. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route to correct owner with clear next action. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction request workflow). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction request workflow' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 2 Day 2 · Documentation Missing Item Follow-Up =====
  "qa-w2d2::w2d2-l1": mk(
    "Missing item types — apply it inside today's QA workflow.",
    "Notes, signatures, dates, forms, payer-specific items, attestations. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Notes, signatures, dates, forms, payer-specific items, attestations. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Missing item types). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item types' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d2::w2d2-l2": mk(
    "Owner identification — apply it inside today's QA workflow.",
    "Who owns each type of missing item. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Who owns each type of missing item. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Owner identification). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Owner identification' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d2::w2d2-l3": mk(
    "Follow-up cadence — apply it inside today's QA workflow.",
    "How often to follow up based on urgency and impact. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "How often to follow up based on urgency and impact. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Follow-up cadence). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up cadence' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d2::w2d2-l4": mk(
    "Escalation for delay — apply it inside today's QA workflow.",
    "When and how to escalate overdue or high-impact items. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "When and how to escalate overdue or high-impact items. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation for delay). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation for delay' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 2 Day 3 · Corrections Current Operations =====
  "qa-w2d3::w2d3-l1": mk(
    "Correction request standards — apply it inside today's QA workflow.",
    "Specific, respectful, actionable. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Specific, respectful, actionable. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction request standards). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction request standards' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d3::w2d3-l2": mk(
    "Correction owner and due date — apply it inside today's QA workflow.",
    "Every correction has an owner and a date. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Every correction has an owner and a date. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction owner and due date). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction owner and due date' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d3::w2d3-l3": mk(
    "Correction review — apply it inside today's QA workflow.",
    "Verify against original ask. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Verify against original ask. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction review). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction review' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d3::w2d3-l4": mk(
    "Closing or reopening the item — apply it inside today's QA workflow.",
    "Close only when complete; document what remains otherwise. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Close only when complete; document what remains otherwise. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Closing or reopening the item). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Closing or reopening the item' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 2 Day 4 · Fax and External Document Chase =====
  "qa-w2d4::w2d4-l1": mk(
    "External document types — apply it inside today's QA workflow.",
    "Payer, provider, family, external evaluator, prior records. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Payer, provider, family, external evaluator, prior records. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (External document types). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'External document types' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d4::w2d4-l2": mk(
    "Fax / external follow-up process — apply it inside today's QA workflow.",
    "Where and how to send follow-up. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Where and how to send follow-up. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Fax / external follow-up process). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Fax / external follow-up process' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d4::w2d4-l3": mk(
    "Documentation of attempts — apply it inside today's QA workflow.",
    "Exact times, contacts, outcomes. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Exact times, contacts, outcomes. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Documentation of attempts). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation of attempts' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d4::w2d4-l4": mk(
    "Escalation when documents do not arrive — apply it inside today's QA workflow.",
    "When to escalate to manager/leadership. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "When to escalate to manager/leadership. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation when documents do not arrive). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation when documents do not arrive' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "qa-w2d5::w2d5-l1": mk(
    "Clinical report review — apply it inside today's QA workflow.",
    "Move report reviews forward accurately. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Move report reviews forward accurately. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Clinical report review). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinical report review' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d5::w2d5-l2": mk(
    "Missing item follow-up — apply it inside today's QA workflow.",
    "Draft and route missing-item requests. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Draft and route missing-item requests. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Missing item follow-up). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item follow-up' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d5::w2d5-l3": mk(
    "Correction review — apply it inside today's QA workflow.",
    "Verify against original correction ask. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Verify against original correction ask. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction review). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction review' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w2d5::w2d5-l4": mk(
    "External document follow-up — apply it inside today's QA workflow.",
    "Mentor reviews written attempts and escalations. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Mentor reviews written attempts and escalations. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (External document follow-up). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'External document follow-up' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 3 Day 1 · Compliance Reviews =====
  "qa-w3d1::w3d1-l1": mk(
    "Compliance review purpose — apply it inside today's QA workflow.",
    "Protecting clients, the company, and clinical trust. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Protecting clients, the company, and clinical trust. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Compliance review purpose). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Compliance review purpose' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d1::w3d1-l2": mk(
    "Review criteria awareness — apply it inside today's QA workflow.",
    "What today's standard looks like. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "What today's standard looks like. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Review criteria awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Review criteria awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d1::w3d1-l3": mk(
    "Findings documentation — apply it inside today's QA workflow.",
    "Factual, dated, specific — no exaggeration. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Factual, dated, specific — no exaggeration. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Findings documentation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Findings documentation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d1::w3d1-l4": mk(
    "Escalation and follow-up — apply it inside today's QA workflow.",
    "Route to QA Director / Clinical leadership when needed. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route to QA Director / Clinical leadership when needed. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation and follow-up). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation and follow-up' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 3 Day 2 · Audits Current Operations =====
  "qa-w3d2::w3d2-l1": mk(
    "Audit purpose — apply it inside today's QA workflow.",
    "Audits protect quality across many items at once. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Audits protect quality across many items at once. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Audit purpose). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Audit purpose' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d2::w3d2-l2": mk(
    "Audit sample / scope awareness — apply it inside today's QA workflow.",
    "Know what's in and out of scope. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Know what's in and out of scope. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Audit sample / scope awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Audit sample / scope awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d2::w3d2-l3": mk(
    "Audit findings — apply it inside today's QA workflow.",
    "Specific, dated, categorized. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Specific, dated, categorized. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Audit findings). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Audit findings' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d2::w3d2-l4": mk(
    "Correction and trend follow-up — apply it inside today's QA workflow.",
    "Individual corrections + trend visibility. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Individual corrections + trend visibility. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction and trend follow-up). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction and trend follow-up' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 3 Day 3 · NoteGuard / Amerigroup Review Awareness =====
  "qa-w3d3::w3d3-l1": mk(
    "NoteGuard review awareness — apply it inside today's QA workflow.",
    "Purpose and scope of the assigned workflow. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Purpose and scope of the assigned workflow. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (NoteGuard review awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'NoteGuard review awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d3::w3d3-l2": mk(
    "Amerigroup daily note review awareness — apply it inside today's QA workflow.",
    "Payer-specific review process. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Payer-specific review process. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Amerigroup daily note review awareness). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Amerigroup daily note review awareness' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d3::w3d3-l3": mk(
    "Issue documentation — apply it inside today's QA workflow.",
    "Consistent, factual, dated. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Consistent, factual, dated. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Issue documentation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Issue documentation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d3::w3d3-l4": mk(
    "Escalation and follow-up — apply it inside today's QA workflow.",
    "Route serious/repeat issues to QA Director / Clinical leadership. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route serious/repeat issues to QA Director / Clinical leadership. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation and follow-up). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation and follow-up' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 3 Day 4 · New RBT Check-Ins and QA/Compliance Support =====
  "qa-w3d4::w3d4-l1": mk(
    "New RBT check-in purpose — apply it inside today's QA workflow.",
    "Early support prevents downstream quality issues. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Early support prevents downstream quality issues. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (New RBT check-in purpose). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'New RBT check-in purpose' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d4::w3d4-l2": mk(
    "What QA looks for — apply it inside today's QA workflow.",
    "Early documentation habits, expectations, questions, support needs. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Early documentation habits, expectations, questions, support needs. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (What QA looks for). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What QA looks for' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d4::w3d4-l3": mk(
    "Documentation of check-in — apply it inside today's QA workflow.",
    "Specific, respectful, dated. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Specific, respectful, dated. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Documentation of check-in). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation of check-in' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d4::w3d4-l4": mk(
    "Escalation to Training/Clinical/HR — apply it inside today's QA workflow.",
    "Route non-QA concerns to correct owner. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route non-QA concerns to correct owner. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation to Training/Clinical/HR). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation to Training/Clinical/HR' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 3 Day 5 · QA Escalation and Trend Reporting =====
  "qa-w3d5::w3d5-l1": mk(
    "Escalation criteria — apply it inside today's QA workflow.",
    "Repeated issues, delayed reports, missing critical items, compliance concerns, safety/clinical risk, auth blockers. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Repeated issues, delayed reports, missing critical items, compliance concerns, safety/clinical risk, auth blockers. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation criteria). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation criteria' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d5::w3d5-l2": mk(
    "Trend identification — apply it inside today's QA workflow.",
    "Spot recurring patterns across items and owners. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Spot recurring patterns across items and owners. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Trend identification). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Trend identification' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d5::w3d5-l3": mk(
    "QA trend reporting — apply it inside today's QA workflow.",
    "Impact + examples + requested decision + follow-up. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Impact + examples + requested decision + follow-up. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (QA trend reporting). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'QA trend reporting' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w3d5::w3d5-l4": mk(
    "End-of-day QA queue cleanup — apply it inside today's QA workflow.",
    "Every item has owner/status/next action/follow-up date. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Every item has owner/status/next action/follow-up date. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (End-of-day QA queue cleanup). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day QA queue cleanup' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled QA Queue Ownership — Part 1 =====
  "qa-w4d1::w4d1-l1": mk(
    "Morning QA queue review — apply it inside today's QA workflow.",
    "Set the day's priorities. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Set the day's priorities. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Morning QA queue review). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning QA queue review' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d1::w4d1-l2": mk(
    "Prioritizing QA work — apply it inside today's QA workflow.",
    "Reports, treatment plans, urgent auth blockers, compliance, missing items, overdue. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Reports, treatment plans, urgent auth blockers, compliance, missing items, overdue. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Prioritizing QA work). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing QA work' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d1::w4d1-l3": mk(
    "Updating current trackers — apply it inside today's QA workflow.",
    "Keep systems accurate as you work. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Keep systems accurate as you work. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Updating current trackers). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating current trackers' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's QA workflow.",
    "Nothing left silently pending. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (End-of-day cleanup). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled QA Queue Ownership — Part 2 =====
  "qa-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's QA workflow.",
    "Follow-up dates land, don't drift. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Follow-up dates land, don't drift. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Follow-up discipline). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d2::w4d2-l2": mk(
    "Correction quality — apply it inside today's QA workflow.",
    "Specific, respectful, actionable. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Specific, respectful, actionable. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction quality). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction quality' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d2::w4d2-l3": mk(
    "Documentation accuracy — apply it inside today's QA workflow.",
    "Notes reflect exactly what was reviewed and found. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Notes reflect exactly what was reviewed and found. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Documentation accuracy). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation accuracy' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's QA workflow.",
    "Facts, impact, requested next step. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Facts, impact, requested next step. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation notes). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 4 Day 3 · QA Communication Quality Day =====
  "qa-w4d3::w4d3-l1": mk(
    "Clear QA notes — apply it inside today's QA workflow.",
    "What was reviewed, what's missing/corrected, owner, impact, follow-up. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "What was reviewed, what's missing/corrected, owner, impact, follow-up. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Clear QA notes). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear QA notes' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d3::w4d3-l2": mk(
    "Correction request tone — apply it inside today's QA workflow.",
    "Respectful, specific, dated. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Respectful, specific, dated. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Correction request tone). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Correction request tone' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d3::w4d3-l3": mk(
    "Clinical escalation quality — apply it inside today's QA workflow.",
    "Route clinical decisions to Clinical leadership / BCBA owner. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route clinical decisions to Clinical leadership / BCBA owner. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Clinical escalation quality). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinical escalation quality' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d3::w4d3-l4": mk(
    "Trend / leadership update quality — apply it inside today's QA workflow.",
    "Impact + examples + requested decision. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Impact + examples + requested decision. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Trend / leadership update quality). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Trend / leadership update quality' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End QA Simulation =====
  "qa-w4d4::w4d4-l1": mk(
    "QA intake simulation — apply it inside today's QA workflow.",
    "Take an item into the QA queue cleanly. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Take an item into the QA queue cleanly. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (QA intake simulation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'QA intake simulation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d4::w4d4-l2": mk(
    "Treatment plan / report review simulation — apply it inside today's QA workflow.",
    "Apply the checklist end-to-end. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Apply the checklist end-to-end. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Treatment plan / report review simulation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Treatment plan / report review simulation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d4::w4d4-l3": mk(
    "Missing item / correction simulation — apply it inside today's QA workflow.",
    "Route and follow up cleanly. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Route and follow up cleanly. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Missing item / correction simulation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item / correction simulation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d4::w4d4-l4": mk(
    "Compliance / audit scenario simulation — apply it inside today's QA workflow.",
    "Document findings factually. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Document findings factually. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Compliance / audit scenario simulation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Compliance / audit scenario simulation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d4::w4d4-l5": mk(
    "Escalation / closure simulation — apply it inside today's QA workflow.",
    "Escalate or close with the correct trail. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Escalate or close with the correct trail. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Escalation / closure simulation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation / closure simulation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "qa-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's QA workflow.",
    "10–15 questions covering the full journey. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Final knowledge review). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's QA workflow.",
    "What can be owned independently vs still reviewed. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Readiness conversation). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's QA workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Strengths and coaching areas). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
  "qa-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's QA workflow.",
    "Concrete targets for the first month of independent work. If this step slips, notes get denied, audits fail, families lose services, and revenue is clawed back.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, QA runs through CentralReach (session notes, treatment plans, assessments, authorization documentation, audit trails), payer compliance requirements, shared QA trackers for open findings and follow-ups, and Outlook/Teams for clinician coordination. Nothing lives only in your head — if it isn't in CentralReach or the QA tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the case in CentralReach and confirm treatment plan, authorization, and payer requirements.\\n2) Review the session note against medical necessity, plan alignment, service code, duration, and required elements.\\n3) Log a QA finding with severity (info/minor/major/critical), specific issue, and required fix.\\n4) Assign owner + due date; add to the shared QA tracker.\\n5) Coach the clinician: explain what happened, why it matters, how to fix and prevent recurrence.\\n6) Hand off cleanly: Clinical (BCBA) for clinical judgement, Scheduling for session errors, Authorizations for unit issues, Billing for posting/denial impact. Escalate repeat or critical findings to Clinical Leadership." },
      { heading: "What good looks like", body: "Any QA teammate can open a case and see recent notes reviewed, findings, severity, owner, remediation steps, due date, and status — without asking you." },
    ],
    {
      examples: [
        { heading: "Good QA finding", body: "\"7/15 [client] session 7/12 — note missing medical necessity language and one required element (behavior data). Severity: major. Owner: RBT [name] w/ BCBA [name]. Fix: addend by 7/17. Coaching completed 7/15.\"" },
        { heading: "Bad QA finding", body: "\"Note not good.\"" },
      ],
      commonMistakes: ["Reviewing a note without checking treatment plan alignment, medical necessity, and payer requirements.", "Leaving findings unlogged or without a clear owner and due date.", "Skipping the coaching conversation with the clinician on how to fix and prevent recurrence.", "Owning work that belongs to Clinical (BCBA), Scheduling, Authorizations, or Billing instead of a clean handoff.", "Not escalating repeat findings or compliance risk to Clinical Leadership."],
      practiceActivity: { prompt: "Open 2-3 sample notes that match this lesson (Next 30-day growth plan). For each, review against plan/auth/payer, write a specific finding with severity, owner, remediation, and due date, and outline the coaching message." },
      knowledgeCheck: [
        { q: "Where do session notes, treatment plans, and QA findings live today at Blossom?", options: ["CentralReach + QA tracker", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A QA finding must always include:", options: ["Owner + severity + remediation + due date", "Just a comment on the note", "A verbal warning"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves a finding without owner, severity, remediation, and due date?",
      checklist: ["I reviewed the note against plan, auth, and payer requirements.", "I logged a specific finding with severity, owner, remediation, and due date.", "I coached the clinician and handed off/escalated cleanly."],
    },
  ),
};
