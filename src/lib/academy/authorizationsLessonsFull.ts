/**
 * Full lesson content for the Authorizations Department onboarding journey.
 * Keyed by `authorizations::auth-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom Authorizations process
 * (CentralReach, payer portals, expiration tracking, clean handoffs to
 * Intake, Scheduling, QA, and Billing).
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

export const AUTHORIZATIONS_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Authorizations Role Orientation =====
  "authorizations::auth-w1d1::w1d1-l1": mk(
    "What Authorizations owns today — apply it inside today's Authorizations workflow.",
    "Auth readiness, submission, pending follow-up, approval updates, expirations, denials, and status accuracy. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Auth readiness, submission, pending follow-up, approval updates, expirations, denials, and status accuracy. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (What Authorizations owns today). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Authorizations owns today' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d1::w1d1-l2": mk(
    "What Authorizations does not own — apply it inside today's Authorizations workflow.",
    "Not intake conversion, final clinical quality, payroll, recruiting, scheduling execution, staffing execution, or payer contract decisions. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Not intake conversion, final clinical quality, payroll, recruiting, scheduling execution, staffing execution, or payer contract decisions. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (What Authorizations does not own). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Authorizations does not own' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d1::w1d1-l3": mk(
    "The authorization lifecycle — apply it inside today's Authorizations workflow.",
    "Intake / VOB readiness → initial auth → assessment / treatment auth → renewals / reassessments → approval updates → scheduling / billing visibility → denial / escalation if needed. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Intake / VOB readiness → initial auth → assessment / treatment auth → renewals / reassessments → approval updates → scheduling / billing visibility → denial / escalation if needed. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (The authorization lifecycle). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'The authorization lifecycle' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 1 Day 2 · Current Authorizations Systems Tour — Monday, CentralReach, Payer Portals, Email, Trackers =====
  "authorizations::auth-w1d2::w1d2-l1": mk(
    "Monday / Auth tracker basics — apply it inside today's Authorizations workflow.",
    "Client, state, payer, auth type, BCBA, status, submission date, pending date, follow-up date, approval details, missing docs, denial reason, QA status, notes. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Client, state, payer, auth type, BCBA, status, submission date, pending date, follow-up date, approval details, missing docs, denial reason, QA status, notes. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Monday / Auth tracker basics). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Monday / Auth tracker basics' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d2::w1d2-l2": mk(
    "CentralReach basics for Authorizations — apply it inside today's Authorizations workflow.",
    "What auth-related information may need to be verified in CR today. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "What auth-related information may need to be verified in CR today. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (CentralReach basics for Authorizations). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach basics for Authorizations' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d2::w1d2-l3": mk(
    "Payer portal basics — apply it inside today's Authorizations workflow.",
    "Portals vary by state / payer. Where status is checked today. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Portals vary by state / payer. Where status is checked today. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Payer portal basics). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer portal basics' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d2::w1d2-l4": mk(
    "Outlook / email + Excel manual tracker reality — apply it inside today's Authorizations workflow.",
    "Where email communication and manual updates happen and how to avoid drift. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Where email communication and manual updates happen and how to avoid drift. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Outlook / email + Excel manual tracker reality). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / email + Excel manual tracker reality' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 1 Day 3 · Authorization Types and Basic Readiness =====
  "authorizations::auth-w1d3::w1d3-l1": mk(
    "Initial authorization — apply it inside today's Authorizations workflow.",
    "Purpose and typical readiness inputs. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Purpose and typical readiness inputs. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial authorization). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial authorization' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d3::w1d3-l2": mk(
    "Treatment authorization — apply it inside today's Authorizations workflow.",
    "Clinical dependency and typical readiness inputs. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Clinical dependency and typical readiness inputs. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Treatment authorization). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Treatment authorization' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d3::w1d3-l3": mk(
    "Reassessment and renewal / reauthorization — apply it inside today's Authorizations workflow.",
    "Ongoing work that keeps services from lapsing. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Ongoing work that keeps services from lapsing. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Reassessment and renewal / reauthorization). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Reassessment and renewal / reauthorization' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d3::w1d3-l4": mk(
    "Readiness checklist — apply it inside today's Authorizations workflow.",
    "Payer, client details, BCBA assignment, clinical docs, diagnosis / required docs, primary / secondary insurance, and state-specific rules. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Payer, client details, BCBA assignment, clinical docs, diagnosis / required docs, primary / secondary insurance, and state-specific rules. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Readiness checklist). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness checklist' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 1 Day 4 · BCBA Assignment and Clinical Documentation Dependency =====
  "authorizations::auth-w1d4::w1d4-l1": mk(
    "Why BCBA assignment matters — apply it inside today's Authorizations workflow.",
    "Assignment drives clinical accountability, documentation, and payer submission. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Assignment drives clinical accountability, documentation, and payer submission. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Why BCBA assignment matters). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Why BCBA assignment matters' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d4::w1d4-l2": mk(
    "Confirming BCBA assignment — apply it inside today's Authorizations workflow.",
    "Where to verify and how to confirm the assigned BCBA is correct. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Where to verify and how to confirm the assigned BCBA is correct. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Confirming BCBA assignment). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confirming BCBA assignment' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d4::w1d4-l3": mk(
    "Progress report / treatment plan dependency — apply it inside today's Authorizations workflow.",
    "What documentation is needed and when. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "What documentation is needed and when. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Progress report / treatment plan dependency). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Progress report / treatment plan dependency' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d4::w1d4-l4": mk(
    "Following up without owning clinical work — apply it inside today's Authorizations workflow.",
    "Drive readiness while keeping ownership with clinical / QA. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Drive readiness while keeping ownership with clinical / QA. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Following up without owning clinical work). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Following up without owning clinical work' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "authorizations::auth-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Authorizations workflow.",
    "5–7 questions covering systems, auth type, owner/status/next action, BCBA, docs, and role boundaries. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering systems, auth type, owner/status/next action, BCBA, docs, and role boundaries. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Week 1 knowledge review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d5::w1d5-l2": mk(
    "Role boundary check — apply it inside today's Authorizations workflow.",
    "Authorizations vs Intake vs Clinical / QA vs Scheduling vs Billing / RCM. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Authorizations vs Intake vs Clinical / QA vs Scheduling vs Billing / RCM. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Role boundary check). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Role boundary check' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d5::w1d5-l3": mk(
    "Auth queue walkthrough — apply it inside today's Authorizations workflow.",
    "Walk 3 auth items end to end with mentor. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 auth items end to end with mentor. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Auth queue walkthrough). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Auth queue walkthrough' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Authorizations workflow.",
    "What went well, what to sharpen next week. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "What went well, what to sharpen next week. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Mentor feedback). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 2 Day 1 · Initial Authorization — Current Process =====
  "authorizations::auth-w2d1::w2d1-l1": mk(
    "Initial authorization purpose — apply it inside today's Authorizations workflow.",
    "Why initial auths matter and what they unlock. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Why initial auths matter and what they unlock. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial authorization purpose). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial authorization purpose' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d1::w2d1-l2": mk(
    "Initial auth readiness checklist — apply it inside today's Authorizations workflow.",
    "Payer, state, client, docs, BCBA, primary / secondary insurance. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Payer, state, client, docs, BCBA, primary / secondary insurance. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial auth readiness checklist). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial auth readiness checklist' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d1::w2d1-l3": mk(
    "Initial auth submission steps — apply it inside today's Authorizations workflow.",
    "Observe or perform submission through today's payer portal / process. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Observe or perform submission through today's payer portal / process. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial auth submission steps). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial auth submission steps' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d1::w2d1-l4": mk(
    "Initial auth status update — apply it inside today's Authorizations workflow.",
    "Update Monday / tracker with submission date, status, next follow-up, notes, owner. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Update Monday / tracker with submission date, status, next follow-up, notes, owner. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial auth status update). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial auth status update' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 2 Day 2 · Treatment Authorization — Current Process =====
  "authorizations::auth-w2d2::w2d2-l1": mk(
    "Treatment authorization purpose — apply it inside today's Authorizations workflow.",
    "Where treatment auths sit in the lifecycle. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Where treatment auths sit in the lifecycle. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Treatment authorization purpose). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Treatment authorization purpose' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d2::w2d2-l2": mk(
    "Required clinical documentation — apply it inside today's Authorizations workflow.",
    "Treatment plan / report, supporting docs, payer requirements. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Treatment plan / report, supporting docs, payer requirements. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Required clinical documentation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Required clinical documentation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d2::w2d2-l3": mk(
    "Treatment auth submission steps — apply it inside today's Authorizations workflow.",
    "Submit or observe submission through current process. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Submit or observe submission through current process. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Treatment auth submission steps). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Treatment auth submission steps' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d2::w2d2-l4": mk(
    "Handoff impact — apply it inside today's Authorizations workflow.",
    "How treatment auth accuracy affects scheduling and services. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "How treatment auth accuracy affects scheduling and services. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Handoff impact). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Handoff impact' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 2 Day 3 · Pending Authorization Follow-Up =====
  "authorizations::auth-w2d3::w2d3-l1": mk(
    "What pending status means — apply it inside today's Authorizations workflow.",
    "Submitted but not yet approved / denied. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Submitted but not yet approved / denied. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (What pending status means). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What pending status means' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d3::w2d3-l2": mk(
    "Follow-up cadence — apply it inside today's Authorizations workflow.",
    "Expected payer timing and follow-up rhythm. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Expected payer timing and follow-up rhythm. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Follow-up cadence). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up cadence' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d3::w2d3-l3": mk(
    "Payer portal / call / email follow-up — apply it inside today's Authorizations workflow.",
    "Confirm status through today's channels. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Confirm status through today's channels. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Payer portal / call / email follow-up). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer portal / call / email follow-up' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d3::w2d3-l4": mk(
    "Updating the tracker — apply it inside today's Authorizations workflow.",
    "Log attempt, outcome, next follow-up, and escalation trigger. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Log attempt, outcome, next follow-up, and escalation trigger. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Updating the tracker). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating the tracker' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 2 Day 4 · Approved Authorization Updates =====
  "authorizations::auth-w2d4::w2d4-l1": mk(
    "What approval means — apply it inside today's Authorizations workflow.",
    "Approval unlocks services and billing visibility. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Approval unlocks services and billing visibility. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (What approval means). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What approval means' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d4::w2d4-l2": mk(
    "Approval details to capture — apply it inside today's Authorizations workflow.",
    "Payer, auth number, approved dates, units / hours / services, provider / BCBA, limitations, effective dates. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Payer, auth number, approved dates, units / hours / services, provider / BCBA, limitations, effective dates. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Approval details to capture). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Approval details to capture' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d4::w2d4-l3": mk(
    "Updating current systems — apply it inside today's Authorizations workflow.",
    "Tracker + CR fields per current process; attach documentation if required. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Tracker + CR fields per current process; attach documentation if required. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Updating current systems). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating current systems' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d4::w2d4-l4": mk(
    "Handoff to scheduling / billing visibility — apply it inside today's Authorizations workflow.",
    "Notify or route to correct owner. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Notify or route to correct owner. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Handoff to scheduling / billing visibility). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Handoff to scheduling / billing visibility' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "authorizations::auth-w2d5::w2d5-l1": mk(
    "Initial authorization review — apply it inside today's Authorizations workflow.",
    "Assigned initial-auth tasks under review. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Assigned initial-auth tasks under review. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial authorization review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial authorization review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d5::w2d5-l2": mk(
    "Treatment authorization review — apply it inside today's Authorizations workflow.",
    "Assigned treatment-auth tasks under review. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Assigned treatment-auth tasks under review. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Treatment authorization review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Treatment authorization review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d5::w2d5-l3": mk(
    "Pending follow-up review — apply it inside today's Authorizations workflow.",
    "Follow-up cadence discipline. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Follow-up cadence discipline. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Pending follow-up review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pending follow-up review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w2d5::w2d5-l4": mk(
    "Approved update review — apply it inside today's Authorizations workflow.",
    "Approval accuracy and handoff quality. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Approval accuracy and handoff quality. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Approved update review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Approved update review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 3 Day 1 · Renewals and Reauthorizations =====
  "authorizations::auth-w3d1::w3d1-l1": mk(
    "Renewal purpose — apply it inside today's Authorizations workflow.",
    "Why renewals prevent service interruptions. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Why renewals prevent service interruptions. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Renewal purpose). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Renewal purpose' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d1::w3d1-l2": mk(
    "Renewal timing — apply it inside today's Authorizations workflow.",
    "How far in advance renewals must be worked. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "How far in advance renewals must be worked. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Renewal timing). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Renewal timing' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d1::w3d1-l3": mk(
    "Required documentation — apply it inside today's Authorizations workflow.",
    "Progress / report readiness and payer requirements. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Progress / report readiness and payer requirements. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Required documentation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Required documentation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d1::w3d1-l4": mk(
    "Renewal tracker updates — apply it inside today's Authorizations workflow.",
    "Status, owner, next action, follow-up, escalation. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Status, owner, next action, follow-up, escalation. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Renewal tracker updates). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Renewal tracker updates' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 3 Day 2 · Reassessment — Current Process =====
  "authorizations::auth-w3d2::w3d2-l1": mk(
    "Reassessment purpose — apply it inside today's Authorizations workflow.",
    "Why reassessments drive ongoing auth. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Why reassessments drive ongoing auth. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Reassessment purpose). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Reassessment purpose' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d2::w3d2-l2": mk(
    "Reassessment documentation — apply it inside today's Authorizations workflow.",
    "What documentation is required and when. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "What documentation is required and when. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Reassessment documentation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Reassessment documentation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d2::w3d2-l3": mk(
    "Reassessment → auth workflow — apply it inside today's Authorizations workflow.",
    "How reassessment feeds submission. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "How reassessment feeds submission. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Reassessment → auth workflow). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Reassessment → auth workflow' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d2::w3d2-l4": mk(
    "Escalation for delays — apply it inside today's Authorizations workflow.",
    "When and how to escalate documentation delays. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "When and how to escalate documentation delays. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Escalation for delays). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation for delays' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 3 Day 3 · Expiring Authorizations and Service-Risk Awareness =====
  "authorizations::auth-w3d3::w3d3-l1": mk(
    "Expiring auth queue — apply it inside today's Authorizations workflow.",
    "Sort and prioritize expiring items. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Sort and prioritize expiring items. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Expiring auth queue). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Expiring auth queue' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d3::w3d3-l2": mk(
    "Service and billing risk — apply it inside today's Authorizations workflow.",
    "Why expirations threaten families and revenue. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Why expirations threaten families and revenue. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Service and billing risk). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Service and billing risk' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d3::w3d3-l3": mk(
    "Prioritization — apply it inside today's Authorizations workflow.",
    "Closest to expiration, missing docs, active services. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Closest to expiration, missing docs, active services. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Prioritization). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritization' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d3::w3d3-l4": mk(
    "Same-day escalation — apply it inside today's Authorizations workflow.",
    "Escalate urgent risks to manager / clinical / state / scheduling. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Escalate urgent risks to manager / clinical / state / scheduling. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Same-day escalation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Same-day escalation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 3 Day 4 · Denials, Missing Documentation, and Escalation =====
  "authorizations::auth-w3d4::w3d4-l1": mk(
    "Denial review basics — apply it inside today's Authorizations workflow.",
    "Read the payer response carefully. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Read the payer response carefully. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Denial review basics). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Denial review basics' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d4::w3d4-l2": mk(
    "Denial reason documentation — apply it inside today's Authorizations workflow.",
    "Vague 'denied' is not acceptable — capture the reason. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Vague 'denied' is not acceptable — capture the reason. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Denial reason documentation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Denial reason documentation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d4::w3d4-l3": mk(
    "Missing documentation workflow — apply it inside today's Authorizations workflow.",
    "Exact missing item + owner + next follow-up. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Exact missing item + owner + next follow-up. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Missing documentation workflow). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing documentation workflow' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d4::w3d4-l4": mk(
    "Escalation and follow-up — apply it inside today's Authorizations workflow.",
    "When to escalate and to whom. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "When to escalate and to whom. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Escalation and follow-up). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation and follow-up' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 3 Day 5 · QA Submission, Georgia Process, Multi-State, and Insurance Variations =====
  "authorizations::auth-w3d5::w3d5-l1": mk(
    "QA submission awareness — apply it inside today's Authorizations workflow.",
    "When QA reviews are part of readiness. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "When QA reviews are part of readiness. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (QA submission awareness). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'QA submission awareness' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d5::w3d5-l2": mk(
    "Georgia process awareness — apply it inside today's Authorizations workflow.",
    "Where GA differs today. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Where GA differs today. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Georgia process awareness). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Georgia process awareness' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d5::w3d5-l3": mk(
    "Multi-state process awareness — apply it inside today's Authorizations workflow.",
    "NC / TN / VA / MD / GA payer / portal variations. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "NC / TN / VA / MD / GA payer / portal variations. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Multi-state process awareness). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Multi-state process awareness' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w3d5::w3d5-l4": mk(
    "Primary / secondary insurance awareness — apply it inside today's Authorizations workflow.",
    "When both apply and how it changes readiness. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "When both apply and how it changes readiness. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Primary / secondary insurance awareness). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Primary / secondary insurance awareness' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Authorization Queue Ownership — Part 1 =====
  "authorizations::auth-w4d1::w4d1-l1": mk(
    "Morning auth queue review — apply it inside today's Authorizations workflow.",
    "Structured start-of-day queue check. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Structured start-of-day queue check. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Morning auth queue review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning auth queue review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d1::w4d1-l2": mk(
    "Prioritizing authorization work — apply it inside today's Authorizations workflow.",
    "Risk-based prioritization. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Risk-based prioritization. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Prioritizing authorization work). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing authorization work' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d1::w4d1-l3": mk(
    "Updating current systems — apply it inside today's Authorizations workflow.",
    "Clean tracker + CR updates. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Clean tracker + CR updates. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Updating current systems). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating current systems' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Authorizations workflow.",
    "No stale items, all follow-ups dated. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "No stale items, all follow-ups dated. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (End-of-day cleanup). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Authorization Queue Ownership — Part 2 =====
  "authorizations::auth-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Authorizations workflow.",
    "Own the cadence. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Own the cadence. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Follow-up discipline). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d2::w4d2-l2": mk(
    "Documentation accuracy — apply it inside today's Authorizations workflow.",
    "Notes that another department can trust. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Notes that another department can trust. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Documentation accuracy). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation accuracy' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d2::w4d2-l3": mk(
    "Payer / portal status checks — apply it inside today's Authorizations workflow.",
    "Efficient status confirmation. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Efficient status confirmation. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Payer / portal status checks). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer / portal status checks' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Authorizations workflow.",
    "Clean escalation to correct owner. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Clean escalation to correct owner. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Escalation notes). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 4 Day 3 · Cross-Department Communication Quality Day =====
  "authorizations::auth-w4d3::w4d3-l1": mk(
    "Clear auth notes — apply it inside today's Authorizations workflow.",
    "Specific, actionable, dated. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Specific, actionable, dated. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Clear auth notes). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear auth notes' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d3::w4d3-l2": mk(
    "Handoff to Clinical / QA — apply it inside today's Authorizations workflow.",
    "Route documentation gaps cleanly. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Route documentation gaps cleanly. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Handoff to Clinical / QA). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Handoff to Clinical / QA' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d3::w4d3-l3": mk(
    "Handoff to Scheduling / Billing visibility — apply it inside today's Authorizations workflow.",
    "Close the loop after approval. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Close the loop after approval. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Handoff to Scheduling / Billing visibility). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Handoff to Scheduling / Billing visibility' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d3::w4d3-l4": mk(
    "Escalation tone and urgency — apply it inside today's Authorizations workflow.",
    "Calm, specific, actionable. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Calm, specific, actionable. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Escalation tone and urgency). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation tone and urgency' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Authorization Simulation =====
  "authorizations::auth-w4d4::w4d4-l1": mk(
    "Readiness simulation — apply it inside today's Authorizations workflow.",
    "Confirm all inputs. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Confirm all inputs. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Readiness simulation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness simulation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d4::w4d4-l2": mk(
    "Initial / treatment submission simulation — apply it inside today's Authorizations workflow.",
    "Submit through current process. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Submit through current process. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Initial / treatment submission simulation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Initial / treatment submission simulation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d4::w4d4-l3": mk(
    "Pending follow-up simulation — apply it inside today's Authorizations workflow.",
    "Follow-up cadence. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Follow-up cadence. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Pending follow-up simulation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pending follow-up simulation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d4::w4d4-l4": mk(
    "Approval / denial + handoff simulation — apply it inside today's Authorizations workflow.",
    "Close the loop. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Close the loop. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Approval / denial + handoff simulation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Approval / denial + handoff simulation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "authorizations::auth-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Authorizations workflow.",
    "10–15 questions covering the full journey. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Final knowledge review). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Authorizations workflow.",
    "What can be owned independently vs still reviewed. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Readiness conversation). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Authorizations workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Strengths and coaching areas). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
  "authorizations::auth-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Authorizations workflow.",
    "Concrete targets for the first month of independent work. If this step slips, families lose covered sessions, staff can't be scheduled, and the company loses revenue that is already earned.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Authorizations runs through CentralReach (auth records, service codes, unit tracking), payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), Outlook/Teams for internal comms, and shared trackers for pending/expiring auths. Nothing lives only in your head — if it is not in CentralReach or the auth tracker, it did not happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the auth record in CentralReach and confirm owner + current status.\\n2) Verify payer, service codes, units, effective + expiration dates, and required documentation.\\n3) Take the next action on the correct payer portal or channel (submit, follow up, appeal, or renew).\\n4) Log the outcome directly on the auth record — payer, rep name, reference number, date, and result.\\n5) Set the next status, next action, and follow-up date (never leave an auth without one).\\n6) Hand off cleanly: Intake for missing docs, Scheduling for approved units, QA for clinical questions, Billing for posted units." },
      { heading: "What good looks like", body: "Any Authorizations teammate can open the auth, see the payer, service codes, units approved vs used, expiration date, current status, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good auth note", body: "\"7/15 called Availity re: auth #12345 — spoke with Maria (ref #ABC987). 40 of 80 units used, expires 8/30. Renewal packet due 8/1. Owner: me. Next: pull progress note 7/22.\"" },
        { heading: "Bad auth note", body: "\"Called payer, waiting.\"" },
      ],
      commonMistakes: ["Letting an auth sit pending without a follow-up cadence.", "Missing an expiring auth window and creating a service gap.", "Submitting to the wrong payer portal or with the wrong service codes.", "Not documenting the payer conversation, rep name, and reference number.", "Owning work that belongs to Intake, Scheduling, QA, or Billing instead of handing off cleanly."],
      practiceActivity: { prompt: "Open 2-3 sample auths that match this lesson (Next 30-day growth plan). For each, write payer, service codes, units approved vs used, expiration, owner, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does the authorization live today at Blossom?", options: ["CentralReach", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "If an auth is denied or missing documentation, what do you do first?", options: ["Escalate quietly later", "Document the reason, owner, and next action immediately", "Resubmit without changes"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves an auth without owner, status, next action, and follow-up date?",
      checklist: ["I updated CentralReach status + note after this action.", "I set a next action and follow-up date.", "If a handoff is needed (Intake, Scheduling, QA, Billing), I completed it cleanly."],
    },
  ),
};
