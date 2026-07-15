/**
 * Full lesson content for the HR Department onboarding journey.
 * Keyed by `hr::hr-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom HR process
 * (Viventium, I-9/W-4/direct deposit, background checks, policy
 * acknowledgements, lifecycle events, and clean handoffs).
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

export const HR_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · HR Role Orientation =====
  "hr::hr-w1d1::w1d1-l1": mk(
    "What HR owns today — apply it inside today's HR workflow.",
    "Employee lifecycle, onboarding, background checks, records, reviews, benefits questions, corrective-action support, offboarding, confidentiality. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Employee lifecycle, onboarding, background checks, records, reviews, benefits questions, corrective-action support, offboarding, confidentiality. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (What HR owns today). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What HR owns today' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d1::w1d1-l2": mk(
    "What HR does not own — apply it inside today's HR workflow.",
    "Not Recruiting's candidate pipeline, Payroll processing, Clinical supervision, or State Ops execution. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Not Recruiting's candidate pipeline, Payroll processing, Clinical supervision, or State Ops execution. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (What HR does not own). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What HR does not own' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d1::w1d1-l3": mk(
    "The employee lifecycle — apply it inside today's HR workflow.",
    "Hiring handoff → onboarding → background checks → orientation → records → training visibility → reviews → HR support → corrective action → offboarding. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Hiring handoff → onboarding → background checks → orientation → records → training visibility → reviews → HR support → corrective action → offboarding. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (The employee lifecycle). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'The employee lifecycle' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d1::w1d1-l4": mk(
    "Confidentiality and professional judgment — apply it inside today's HR workflow.",
    "HR info is shared only with people who need it for their role, per current policy and leadership direction. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "HR info is shared only with people who need it for their role, per current policy and leadership direction. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Confidentiality and professional judgment). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confidentiality and professional judgment' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 2 · Current HR Systems Tour — Employee Records, Outlook, Microsoft 365, Viventium Awareness, Trackers =====
  "hr::hr-w1d2::w1d2-l1": mk(
    "Employee record basics — apply it inside today's HR workflow.",
    "Where employee records live and how they should be maintained. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Where employee records live and how they should be maintained. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Employee record basics). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Employee record basics' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d2::w1d2-l2": mk(
    "Outlook / Microsoft 365 communication basics — apply it inside today's HR workflow.",
    "Email, files, and communication norms. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Email, files, and communication norms. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Outlook / Microsoft 365 communication basics). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / Microsoft 365 communication basics' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d2::w1d2-l3": mk(
    "Viventium awareness — apply it inside today's HR workflow.",
    "What Viventium is used for at a high level — HR supports readiness, not payroll processing. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What Viventium is used for at a high level — HR supports readiness, not payroll processing. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Viventium awareness). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Viventium awareness' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d2::w1d2-l4": mk(
    "Current HR trackers — apply it inside today's HR workflow.",
    "Onboarding, background, offboarding, training visibility. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Onboarding, background, offboarding, training visibility. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Current HR trackers). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Current HR trackers' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d2::w1d2-l5": mk(
    "Training and document record awareness — apply it inside today's HR workflow.",
    "Where training and document status shows up today. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Where training and document status shows up today. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Training and document record awareness). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Training and document record awareness' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 3 · HR Support Task Intake =====
  "hr::hr-w1d3::w1d3-l1": mk(
    "What counts as an HR support task — apply it inside today's HR workflow.",
    "Onboarding, background, benefits, policy, employment questions, performance, offboarding, manager support, payroll-adjacent. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Onboarding, background, benefits, policy, employment questions, performance, offboarding, manager support, payroll-adjacent. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (What counts as an HR support task). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What counts as an HR support task' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d3::w1d3-l2": mk(
    "Intake and categorization — apply it inside today's HR workflow.",
    "How to log and label a new HR request. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "How to log and label a new HR request. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Intake and categorization). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Intake and categorization' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d3::w1d3-l3": mk(
    "Priority and confidentiality — apply it inside today's HR workflow.",
    "Some HR items are urgent; some are sensitive; some are both. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Some HR items are urgent; some are sensitive; some are both. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Priority and confidentiality). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Priority and confidentiality' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d3::w1d3-l4": mk(
    "Owner and follow-up — apply it inside today's HR workflow.",
    "Every HR item gets an owner, status, next action, and follow-up date. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Every HR item gets an owner, status, next action, and follow-up date. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Owner and follow-up). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Owner and follow-up' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 4 · Hiring Handoff From Recruiting =====
  "hr::hr-w1d4::w1d4-l1": mk(
    "Recruiting → HR boundary — apply it inside today's HR workflow.",
    "Recruiting owns candidates; HR owns employees post-hire. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Recruiting owns candidates; HR owns employees post-hire. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Recruiting → HR boundary). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Recruiting → HR boundary' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d4::w1d4-l2": mk(
    "Hiring handoff checklist — apply it inside today's HR workflow.",
    "Name, role, dept/state, manager, start date, offer, contact, docs, background needs. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Name, role, dept/state, manager, start date, offer, contact, docs, background needs. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Hiring handoff checklist). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Hiring handoff checklist' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d4::w1d4-l3": mk(
    "Candidate-to-employee transition — apply it inside today's HR workflow.",
    "Kicking off HR onboarding tracker only when handoff is clear. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Kicking off HR onboarding tracker only when handoff is clear. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Candidate-to-employee transition). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate-to-employee transition' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d4::w1d4-l4": mk(
    "Missing handoff information — apply it inside today's HR workflow.",
    "How to route back cleanly without dropping the candidate. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "How to route back cleanly without dropping the candidate. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Missing handoff information). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing handoff information' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "hr::hr-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's HR workflow.",
    "5–7 questions covering confidentiality, HR ownership, current tools, intake, and handoff. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering confidentiality, HR ownership, current tools, intake, and handoff. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Week 1 knowledge review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d5::w1d5-l2": mk(
    "HR role boundary check — apply it inside today's HR workflow.",
    "HR vs Recruiting vs Payroll vs Office/Admin vs Training vs State Ops. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "HR vs Recruiting vs Payroll vs Office/Admin vs Training vs State Ops. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (HR role boundary check). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'HR role boundary check' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d5::w1d5-l3": mk(
    "Employee lifecycle walkthrough — apply it inside today's HR workflow.",
    "Walk 3 items end to end with mentor. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end to end with mentor. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Employee lifecycle walkthrough). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Employee lifecycle walkthrough' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's HR workflow.",
    "What went well; what to sharpen next week. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What went well; what to sharpen next week. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Mentor feedback). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 1 · Employee Onboarding Logistics =====
  "hr::hr-w2d1::w2d1-l1": mk(
    "Onboarding purpose — apply it inside today's HR workflow.",
    "Why organized onboarding builds employee trust. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Why organized onboarding builds employee trust. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Onboarding purpose). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Onboarding purpose' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d1::w2d1-l2": mk(
    "Onboarding checklist — apply it inside today's HR workflow.",
    "Role, dept/state, manager, start date, forms, background needs, training journey, logistics. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Role, dept/state, manager, start date, forms, background needs, training journey, logistics. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Onboarding checklist). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Onboarding checklist' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d1::w2d1-l3": mk(
    "Start date readiness — apply it inside today's HR workflow.",
    "Everything that has to be true by Day One. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Everything that has to be true by Day One. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Start date readiness). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Start date readiness' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d1::w2d1-l4": mk(
    "Onboarding communication — apply it inside today's HR workflow.",
    "Warm, clear, dated messages to new hires and managers. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Warm, clear, dated messages to new hires and managers. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Onboarding communication). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Onboarding communication' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 2 · Background Checks and Compliance Tracking =====
  "hr::hr-w2d2::w2d2-l1": mk(
    "Background check purpose — apply it inside today's HR workflow.",
    "Why background checks matter and who they protect. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Why background checks matter and who they protect. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Background check purpose). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Background check purpose' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d2::w2d2-l2": mk(
    "Required information — apply it inside today's HR workflow.",
    "What must be collected and when. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What must be collected and when. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Required information). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Required information' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d2::w2d2-l3": mk(
    "Status tracking — apply it inside today's HR workflow.",
    "Pending vs completed vs on-hold vs flagged. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Pending vs completed vs on-hold vs flagged. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Status tracking). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Status tracking' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d2::w2d2-l4": mk(
    "Escalation and follow-up — apply it inside today's HR workflow.",
    "How and when to escalate to HR Lead / leadership. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "How and when to escalate to HR Lead / leadership. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Escalation and follow-up). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation and follow-up' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 3 · Orientation and Training Visibility =====
  "hr::hr-w2d3::w2d3-l1": mk(
    "Orientation basics — apply it inside today's HR workflow.",
    "What Blossom orientation looks like today. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What Blossom orientation looks like today. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Orientation basics). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Orientation basics' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d3::w2d3-l2": mk(
    "Training assignment awareness — apply it inside today's HR workflow.",
    "Which journey matches which role. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Which journey matches which role. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Training assignment awareness). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Training assignment awareness' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d3::w2d3-l3": mk(
    "Training completion visibility — apply it inside today's HR workflow.",
    "How HR sees whether required training is happening. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "How HR sees whether required training is happening. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Training completion visibility). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Training completion visibility' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d3::w2d3-l4": mk(
    "Manager follow-up — apply it inside today's HR workflow.",
    "How to nudge managers/training owners without owning their content. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "How to nudge managers/training owners without owning their content. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Manager follow-up). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Manager follow-up' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 4 · Benefits Basics and Employee Questions =====
  "hr::hr-w2d4::w2d4-l1": mk(
    "Benefits awareness — apply it inside today's HR workflow.",
    "What Blossom benefits look like today at a high level. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What Blossom benefits look like today at a high level. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Benefits awareness). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Benefits awareness' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d4::w2d4-l2": mk(
    "What HR can answer — apply it inside today's HR workflow.",
    "Approved current answers HR is allowed to give directly. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Approved current answers HR is allowed to give directly. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (What HR can answer). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What HR can answer' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d4::w2d4-l3": mk(
    "What needs escalation — apply it inside today's HR workflow.",
    "Eligibility, exceptions, payroll amounts — escalate, don't guess. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Eligibility, exceptions, payroll amounts — escalate, don't guess. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (What needs escalation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What needs escalation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d4::w2d4-l4": mk(
    "Documentation and follow-up — apply it inside today's HR workflow.",
    "Log the question, the answer, the owner, and follow-up. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Log the question, the answer, the owner, and follow-up. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Documentation and follow-up). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation and follow-up' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "hr::hr-w2d5::w2d5-l1": mk(
    "Onboarding review — apply it inside today's HR workflow.",
    "Move onboarding items forward. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Move onboarding items forward. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Onboarding review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Onboarding review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d5::w2d5-l2": mk(
    "Background check review — apply it inside today's HR workflow.",
    "Track and follow up on background items. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Track and follow up on background items. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Background check review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Background check review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d5::w2d5-l3": mk(
    "Orientation / training visibility review — apply it inside today's HR workflow.",
    "Confirm status and route follow-up. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Confirm status and route follow-up. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Orientation / training visibility review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Orientation / training visibility review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w2d5::w2d5-l4": mk(
    "Benefits / employee question review — apply it inside today's HR workflow.",
    "Manager reviews written responses. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Manager reviews written responses. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Benefits / employee question review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Benefits / employee question review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 1 · Employee Record Hygiene and Hierarchy Visibility =====
  "hr::hr-w3d1::w3d1-l1": mk(
    "Employee record basics — apply it inside today's HR workflow.",
    "What fields matter and why. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What fields matter and why. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Employee record basics). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Employee record basics' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d1::w3d1-l2": mk(
    "Role / department / state accuracy — apply it inside today's HR workflow.",
    "Keep the operational picture true. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Keep the operational picture true. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Role / department / state accuracy). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Role / department / state accuracy' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d1::w3d1-l3": mk(
    "Reporting line awareness — apply it inside today's HR workflow.",
    "Managers rely on accurate reporting lines. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Managers rely on accurate reporting lines. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Reporting line awareness). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Reporting line awareness' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d1::w3d1-l4": mk(
    "Record updates and confidentiality — apply it inside today's HR workflow.",
    "How to update records safely and confidentially. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "How to update records safely and confidentially. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Record updates and confidentiality). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Record updates and confidentiality' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 2 · Performance Reviews and Manager Support =====
  "hr::hr-w3d2::w3d2-l1": mk(
    "Performance review purpose — apply it inside today's HR workflow.",
    "Reviews grow people and protect the company. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Reviews grow people and protect the company. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Performance review purpose). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Performance review purpose' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d2::w3d2-l2": mk(
    "Review tracking — apply it inside today's HR workflow.",
    "Schedule, status, due dates, follow-up. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Schedule, status, due dates, follow-up. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Review tracking). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Review tracking' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d2::w3d2-l3": mk(
    "Manager follow-up — apply it inside today's HR workflow.",
    "Warm, specific reminders to managers. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific reminders to managers. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Manager follow-up). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Manager follow-up' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d2::w3d2-l4": mk(
    "Documentation quality — apply it inside today's HR workflow.",
    "Factual, dated, professional. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Factual, dated, professional. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Documentation quality). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation quality' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 3 · Corrective Action and Sensitive Employee Matters =====
  "hr::hr-w3d3::w3d3-l1": mk(
    "Corrective action purpose — apply it inside today's HR workflow.",
    "Why we document and how we protect people. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Why we document and how we protect people. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Corrective action purpose). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Corrective action purpose' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d3::w3d3-l2": mk(
    "Sensitive matter handling — apply it inside today's HR workflow.",
    "Care, discretion, timing, and privacy. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Care, discretion, timing, and privacy. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Sensitive matter handling). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Sensitive matter handling' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d3::w3d3-l3": mk(
    "Documentation standards — apply it inside today's HR workflow.",
    "Factual, dated, complete, professional. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Factual, dated, complete, professional. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Documentation standards). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation standards' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d3::w3d3-l4": mk(
    "Escalation to HR Lead / leadership — apply it inside today's HR workflow.",
    "When to loop in leadership. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "When to loop in leadership. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Escalation to HR Lead / leadership). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation to HR Lead / leadership' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 4 · Offboarding — Current Operations =====
  "hr::hr-w3d4::w3d4-l1": mk(
    "Offboarding purpose — apply it inside today's HR workflow.",
    "Clean exits protect the person and the company. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Clean exits protect the person and the company. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Offboarding purpose). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Offboarding purpose' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d4::w3d4-l2": mk(
    "Departure information — apply it inside today's HR workflow.",
    "Role, dept/state, last day, manager, reason/category. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Role, dept/state, last day, manager, reason/category. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Departure information). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Departure information' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d4::w3d4-l3": mk(
    "Access / equipment / final items — apply it inside today's HR workflow.",
    "IT/security, equipment return, badges, credentials. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "IT/security, equipment return, badges, credentials. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Access / equipment / final items). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Access / equipment / final items' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d4::w3d4-l4": mk(
    "Documentation and communication — apply it inside today's HR workflow.",
    "Professional, confidential, complete. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Professional, confidential, complete. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Documentation and communication). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation and communication' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 3 Day 5 · Cross-Department HR Handoffs =====
  "hr::hr-w3d5::w3d5-l1": mk(
    "Recruiting handoff — apply it inside today's HR workflow.",
    "Both directions — back to Recruiting or over to HR. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Both directions — back to Recruiting or over to HR. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Recruiting handoff). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Recruiting handoff' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d5::w3d5-l2": mk(
    "Payroll / Finance handoff — apply it inside today's HR workflow.",
    "HR supplies readiness; Payroll processes. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "HR supplies readiness; Payroll processes. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Payroll / Finance handoff). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payroll / Finance handoff' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d5::w3d5-l3": mk(
    "Office Manager / Admin handoff — apply it inside today's HR workflow.",
    "Assigned logistics, supplies, mail, scanning. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Assigned logistics, supplies, mail, scanning. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Office Manager / Admin handoff). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Office Manager / Admin handoff' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w3d5::w3d5-l4": mk(
    "IT/Security and Training handoff — apply it inside today's HR workflow.",
    "Access, credentials, training visibility. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Access, credentials, training visibility. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (IT/Security and Training handoff). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'IT/Security and Training handoff' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled HR Queue Ownership — Part 1 =====
  "hr::hr-w4d1::w4d1-l1": mk(
    "Morning HR queue review — apply it inside today's HR workflow.",
    "Set the day's priorities. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Set the day's priorities. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Morning HR queue review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning HR queue review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d1::w4d1-l2": mk(
    "Prioritizing HR work — apply it inside today's HR workflow.",
    "Onboarding starts, background follow-up, urgent employee questions, offboarding, sensitive items. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Onboarding starts, background follow-up, urgent employee questions, offboarding, sensitive items. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Prioritizing HR work). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing HR work' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d1::w4d1-l3": mk(
    "Updating current trackers / records — apply it inside today's HR workflow.",
    "Keep records accurate as you work. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Keep records accurate as you work. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Updating current trackers / records). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating current trackers / records' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's HR workflow.",
    "Nothing left silently pending. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (End-of-day cleanup). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled HR Queue Ownership — Part 2 =====
  "hr::hr-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's HR workflow.",
    "Follow-up dates land, don't drift. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Follow-up dates land, don't drift. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Follow-up discipline). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d2::w4d2-l2": mk(
    "Confidentiality in practice — apply it inside today's HR workflow.",
    "Real reps under a confidentiality lens. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Real reps under a confidentiality lens. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Confidentiality in practice). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confidentiality in practice' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d2::w4d2-l3": mk(
    "Employee communication — apply it inside today's HR workflow.",
    "Warm, plain, professional, dated. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Warm, plain, professional, dated. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Employee communication). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Employee communication' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's HR workflow.",
    "Escalate the right way, to the right owner. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Escalate the right way, to the right owner. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Escalation notes). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 3 · HR Communication Quality Day =====
  "hr::hr-w4d3::w4d3-l1": mk(
    "Clear HR notes — apply it inside today's HR workflow.",
    "What was asked, what was done, what's missing, owner, follow-up. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What was asked, what was done, what's missing, owner, follow-up. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Clear HR notes). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear HR notes' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d3::w4d3-l2": mk(
    "Employee response quality — apply it inside today's HR workflow.",
    "Warm, plain, professional. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Warm, plain, professional. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Employee response quality). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Employee response quality' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d3::w4d3-l3": mk(
    "Manager handoff quality — apply it inside today's HR workflow.",
    "Actionable, specific, dated. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Actionable, specific, dated. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Manager handoff quality). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Manager handoff quality' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d3::w4d3-l4": mk(
    "Confidentiality and tone — apply it inside today's HR workflow.",
    "Sensitive notes stay factual and need-to-know. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Sensitive notes stay factual and need-to-know. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Confidentiality and tone). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confidentiality and tone' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End HR Lifecycle Simulation =====
  "hr::hr-w4d4::w4d4-l1": mk(
    "Hiring handoff simulation — apply it inside today's HR workflow.",
    "Start from a fresh Recruiting handoff. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Start from a fresh Recruiting handoff. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Hiring handoff simulation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Hiring handoff simulation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d4::w4d4-l2": mk(
    "Onboarding / background simulation — apply it inside today's HR workflow.",
    "Move onboarding + background forward cleanly. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Move onboarding + background forward cleanly. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Onboarding / background simulation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Onboarding / background simulation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d4::w4d4-l3": mk(
    "Orientation / training visibility simulation — apply it inside today's HR workflow.",
    "Confirm status and follow up. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Confirm status and follow up. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Orientation / training visibility simulation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Orientation / training visibility simulation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d4::w4d4-l4": mk(
    "Employee support request simulation — apply it inside today's HR workflow.",
    "Handle or route with confidence. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Handle or route with confidence. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Employee support request simulation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Employee support request simulation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d4::w4d4-l5": mk(
    "Offboarding / sensitive issue routing simulation — apply it inside today's HR workflow.",
    "Coordinate cross-department; escalate as needed. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Coordinate cross-department; escalate as needed. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Offboarding / sensitive issue routing simulation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Offboarding / sensitive issue routing simulation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "hr::hr-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's HR workflow.",
    "10–15 questions covering the full journey. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Final knowledge review). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's HR workflow.",
    "What can be owned independently vs still reviewed. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Readiness conversation). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's HR workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Strengths and coaching areas). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
  "hr::hr-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's HR workflow.",
    "Concrete targets for the first month of independent work. If this step slips, employees start unready, compliance risk grows, payroll breaks, and the company's operational trust erodes.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, HR runs through Viventium (employee source of truth: paperwork, I-9, W-4, direct deposit, policy acknowledgements, lifecycle status), Outlook + Teams for internal communication, and secure employee files. HR owns employment readiness — not department skill readiness. Nothing lives only in your head — if it isn't in Viventium or the employee file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the employee record in Viventium and confirm current lifecycle stage + owner.\\n2) Verify required items: offer accepted, I-9, W-4, direct deposit, background check, policy acknowledgements, start date.\\n3) Take the next action in the approved channel (Viventium update, secure file, Outlook/Teams communication).\\n4) Log every action with clear language: who, when, what, next step, follow-up date.\\n5) Communicate lifecycle changes (start, LOA, return, term) to the right stakeholders in one clean update.\\n6) Hand off cleanly: Recruiting owns candidate pipeline, Credentialing owns clinical readiness, Departments own skill readiness, Payroll owns pay processing." },
      { heading: "What good looks like", body: "Any HR teammate can open the employee record and see hire status, paperwork completion, background check, I-9, policy acknowledgements, current lifecycle stage, and the next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good HR note", body: "\"7/15 [employee] — offer accepted, I-9 + W-4 + DD complete, background clear, policy acks signed. Start 7/22. Notified hiring manager + Payroll. Owner: me. Next: Day 1 check-in 7/22.\"" },
        { heading: "Bad HR note", body: "\"Paperwork almost done.\"" },
      ],
      commonMistakes: ["Marking an employee ready without confirming I-9, W-4, direct deposit, background check, and policy acknowledgements.", "Leaving paperwork gaps unlogged with no owner or follow-up date.", "Sharing HR/PHI or payroll details outside the approved channel.", "Owning work that belongs to Recruiting (candidate pipeline), Credentialing (clinical), Scheduling, or Payroll processing.", "Not communicating lifecycle changes (start, LOA, term) to the right stakeholders in the same update."],
      practiceActivity: { prompt: "Open 2-3 sample employees that match this lesson (Next 30-day growth plan). For each, confirm required items, owner, next action, follow-up date, and write one clean HR note." },
      knowledgeCheck: [
        { q: "Where does the employee record live today at Blossom?", options: ["Viventium + secure employee file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "HR owns employment readiness. Department skill readiness is owned by:", options: ["The department + Training Academy", "HR", "Recruiting"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves an employee without complete paperwork, owner, next action, and clean handoff?",
      checklist: ["I updated Viventium + the employee file after this action.", "I confirmed I-9, W-4, DD, background, and policy acks where applicable.", "I communicated lifecycle changes to the right stakeholders and handed off cleanly."],
    },
  ),
};
