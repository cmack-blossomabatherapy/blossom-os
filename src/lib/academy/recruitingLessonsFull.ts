/**
 * Full lesson content for the Recruiting Department onboarding journey.
 * Keyed by `recruiting::recruiting-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom recruiting process
 * (Apploi, Calendly, Outlook/Teams, phone/email, clean HR handoff).
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

export const RECRUITING_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Recruiting Role Orientation =====
  "recruiting::recruiting-w1d1::w1d1-l1": mk(
    "What Recruiting owns today — apply it inside today's Recruiting workflow.",
    "Candidate pipeline movement, communication, interview scheduling, clean HR handoff. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Candidate pipeline movement, communication, interview scheduling, clean HR handoff. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (What Recruiting owns today). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Recruiting owns today' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d1::w1d1-l2": mk(
    "What Recruiting does not own — apply it inside today's Recruiting workflow.",
    "Not payroll, final HR compliance, clinical credentialing, CentralReach clinical setup, or performance management. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Not payroll, final HR compliance, clinical credentialing, CentralReach clinical setup, or performance management. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (What Recruiting does not own). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Recruiting does not own' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d1::w1d1-l3": mk(
    "The candidate experience standard — apply it inside today's Recruiting workflow.",
    "Warm, direct, professional. No candidate sits without owner, status, next action, follow-up date. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Warm, direct, professional. No candidate sits without owner, status, next action, follow-up date. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (The candidate experience standard). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'The candidate experience standard' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 1 Day 2 · Current Systems Tour — Apploi, Calendly, Outlook, Teams, Phone, and Trackers =====
  "recruiting::recruiting-w1d2::w1d2-l1": mk(
    "Apploi basics — apply it inside today's Recruiting workflow.",
    "Where candidates live, current status/pipeline fields, and candidate notes. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Where candidates live, current status/pipeline fields, and candidate notes. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Apploi basics). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Apploi basics' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d2::w1d2-l2": mk(
    "Calendly scheduling basics — apply it inside today's Recruiting workflow.",
    "Interview links, availability, booking flow. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Interview links, availability, booking flow. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Calendly scheduling basics). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Calendly scheduling basics' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d2::w1d2-l3": mk(
    "Outlook & Teams interview coordination — apply it inside today's Recruiting workflow.",
    "Invites, meeting links, and reminders. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Invites, meeting links, and reminders. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Outlook & Teams interview coordination). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook & Teams interview coordination' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d2::w1d2-l4": mk(
    "Phone/email + state need tracker awareness — apply it inside today's Recruiting workflow.",
    "Where current state staffing needs are communicated today. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Where current state staffing needs are communicated today. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Phone/email + state need tracker awareness). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Phone/email + state need tracker awareness' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 1 Day 3 · Candidate Pipeline Basics =====
  "recruiting::recruiting-w1d3::w1d3-l1": mk(
    "What counts as a candidate — apply it inside today's Recruiting workflow.",
    "Sources and when an application becomes a candidate. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Sources and when an application becomes a candidate. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (What counts as a candidate). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What counts as a candidate' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d3::w1d3-l2": mk(
    "Pipeline statuses — apply it inside today's Recruiting workflow.",
    "Application received → screen → interview scheduled/completed → follow-up → offer/handoff → not selected/ghosted. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Application received → screen → interview scheduled/completed → follow-up → offer/handoff → not selected/ghosted. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Pipeline statuses). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Pipeline statuses' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d3::w1d3-l3": mk(
    "Candidate owner and next action — apply it inside today's Recruiting workflow.",
    "Every candidate has an owner, status, next action, and follow-up date. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Every candidate has an owner, status, next action, and follow-up date. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate owner and next action). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate owner and next action' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d3::w1d3-l4": mk(
    "Duplicate / existing record check — apply it inside today's Recruiting workflow.",
    "Search by name, phone, email before creating a duplicate or duplicate outreach. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Search by name, phone, email before creating a duplicate or duplicate outreach. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Duplicate / existing record check). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Duplicate / existing record check' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 1 Day 4 · Candidate Communication and Follow-Up =====
  "recruiting::recruiting-w1d4::w1d4-l1": mk(
    "Candidate communication tone — apply it inside today's Recruiting workflow.",
    "Fast, warm, direct, professional, and specific. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Fast, warm, direct, professional, and specific. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate communication tone). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate communication tone' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d4::w1d4-l2": mk(
    "First response expectations — apply it inside today's Recruiting workflow.",
    "How quickly and how the first contact goes. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "How quickly and how the first contact goes. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (First response expectations). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'First response expectations' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d4::w1d4-l3": mk(
    "Interview confirmation and reminders — apply it inside today's Recruiting workflow.",
    "Approved wording; when to text vs email. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Approved wording; when to text vs email. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview confirmation and reminders). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview confirmation and reminders' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d4::w1d4-l4": mk(
    "Documenting calls, emails, texts — apply it inside today's Recruiting workflow.",
    "Log attempt, outcome, and next follow-up date every time. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Log attempt, outcome, and next follow-up date every time. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Documenting calls, emails, texts). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documenting calls, emails, texts' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "recruiting::recruiting-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Recruiting workflow.",
    "5–7 questions covering systems, owner/status, communication documentation, next action, scheduling, boundaries. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering systems, owner/status, communication documentation, next action, scheduling, boundaries. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Week 1 knowledge review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d5::w1d5-l2": mk(
    "Recruiting role boundary check — apply it inside today's Recruiting workflow.",
    "Recruiting vs HR vs Clinical vs State leadership. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Recruiting vs HR vs Clinical vs State leadership. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Recruiting role boundary check). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Recruiting role boundary check' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d5::w1d5-l3": mk(
    "Candidate pipeline walkthrough — apply it inside today's Recruiting workflow.",
    "Walk 3 candidate records end to end with mentor. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 candidate records end to end with mentor. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate pipeline walkthrough). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate pipeline walkthrough' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Recruiting workflow.",
    "What went well, what to sharpen next week. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What went well, what to sharpen next week. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Mentor feedback). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 2 Day 1 · State Recruiting Needs and Job Posting Awareness =====
  "recruiting::recruiting-w2d1::w2d1-l1": mk(
    "State recruiting need review — apply it inside today's Recruiting workflow.",
    "Where and how state needs are communicated today. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Where and how state needs are communicated today. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (State recruiting need review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'State recruiting need review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d1::w2d1-l2": mk(
    "Role and location awareness — apply it inside today's Recruiting workflow.",
    "RBT/BT, BCBA, office, state-support roles. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "RBT/BT, BCBA, office, state-support roles. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Role and location awareness). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Role and location awareness' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d1::w2d1-l3": mk(
    "Job posting basics — apply it inside today's Recruiting workflow.",
    "Why postings must match the real need. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Why postings must match the real need. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Job posting basics). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Job posting basics' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d1::w2d1-l4": mk(
    "When to ask for clarification — apply it inside today's Recruiting workflow.",
    "Escalation points for unclear needs. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Escalation points for unclear needs. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (When to ask for clarification). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'When to ask for clarification' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 2 Day 2 · Resume and Application Review =====
  "recruiting::recruiting-w2d2::w2d2-l1": mk(
    "Application review basics — apply it inside today's Recruiting workflow.",
    "What fields to confirm first. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What fields to confirm first. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Application review basics). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Application review basics' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d2::w2d2-l2": mk(
    "Resume review basics — apply it inside today's Recruiting workflow.",
    "Experience, employment history, notes. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Experience, employment history, notes. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Resume review basics). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Resume review basics' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d2::w2d2-l3": mk(
    "Qualification / experience signals — apply it inside today's Recruiting workflow.",
    "Role-specific requirements. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Role-specific requirements. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Qualification / experience signals). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Qualification / experience signals' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d2::w2d2-l4": mk(
    "Red flags and manager review — apply it inside today's Recruiting workflow.",
    "When to escalate before moving forward. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "When to escalate before moving forward. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Red flags and manager review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Red flags and manager review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 2 Day 3 · Phone Screen / Initial Candidate Screen =====
  "recruiting::recruiting-w2d3::w2d3-l1": mk(
    "Phone screen purpose — apply it inside today's Recruiting workflow.",
    "Why a screen protects both parties. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Why a screen protects both parties. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Phone screen purpose). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Phone screen purpose' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d3::w2d3-l2": mk(
    "What to confirm — apply it inside today's Recruiting workflow.",
    "Identity, role, location, availability, qualifications. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Identity, role, location, availability, qualifications. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (What to confirm). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What to confirm' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d3::w2d3-l3": mk(
    "Candidate questions and expectations — apply it inside today's Recruiting workflow.",
    "What you can/can't promise on pay/benefits. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What you can/can't promise on pay/benefits. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate questions and expectations). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate questions and expectations' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d3::w2d3-l4": mk(
    "Screen notes and next step — apply it inside today's Recruiting workflow.",
    "Notes specific enough for the next person to act on. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Notes specific enough for the next person to act on. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Screen notes and next step). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Screen notes and next step' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 2 Day 4 · Interview Scheduling, Reminders, Reschedules, and No-Shows =====
  "recruiting::recruiting-w2d4::w2d4-l1": mk(
    "Scheduling with Calendly — apply it inside today's Recruiting workflow.",
    "Booking links and availability. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Booking links and availability. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Scheduling with Calendly). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Scheduling with Calendly' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d4::w2d4-l2": mk(
    "Outlook / Teams invitations — apply it inside today's Recruiting workflow.",
    "Correct date/time, candidate info, meeting link, interviewer. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Correct date/time, candidate info, meeting link, interviewer. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Outlook / Teams invitations). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / Teams invitations' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d4::w2d4-l3": mk(
    "Candidate reminders — apply it inside today's Recruiting workflow.",
    "Approved wording and timing. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Approved wording and timing. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate reminders). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate reminders' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d4::w2d4-l4": mk(
    "Reschedule and no-show process — apply it inside today's Recruiting workflow.",
    "Document outcome, set next action. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Document outcome, set next action. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Reschedule and no-show process). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Reschedule and no-show process' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "recruiting::recruiting-w2d5::w2d5-l1": mk(
    "State need review — apply it inside today's Recruiting workflow.",
    "Confirm today's needs before advancing candidates. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Confirm today's needs before advancing candidates. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (State need review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'State need review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d5::w2d5-l2": mk(
    "Application review — apply it inside today's Recruiting workflow.",
    "Move forward vs more info vs not selected. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Move forward vs more info vs not selected. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Application review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Application review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d5::w2d5-l3": mk(
    "Phone screen practice — apply it inside today's Recruiting workflow.",
    "Complete supervised screens. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Complete supervised screens. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Phone screen practice). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Phone screen practice' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w2d5::w2d5-l4": mk(
    "Interview scheduling practice — apply it inside today's Recruiting workflow.",
    "Book, verify, remind, document. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Book, verify, remind, document. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview scheduling practice). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview scheduling practice' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 3 Day 1 · Interview Preparation and Interview Notes =====
  "recruiting::recruiting-w3d1::w3d1-l1": mk(
    "Interview prep checklist — apply it inside today's Recruiting workflow.",
    "Everything ready before the meeting. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Everything ready before the meeting. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview prep checklist). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview prep checklist' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d1::w3d1-l2": mk(
    "Candidate context for interviewers — apply it inside today's Recruiting workflow.",
    "What the interviewer needs to see. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What the interviewer needs to see. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate context for interviewers). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate context for interviewers' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d1::w3d1-l3": mk(
    "Interview outcome notes — apply it inside today's Recruiting workflow.",
    "Move forward, hold, second interview, not selected, offer recommendation. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Move forward, hold, second interview, not selected, offer recommendation. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview outcome notes). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview outcome notes' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d1::w3d1-l4": mk(
    "Next step decision — apply it inside today's Recruiting workflow.",
    "Set the next action so nothing drifts. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Set the next action so nothing drifts. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Next step decision). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next step decision' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 3 Day 2 · Interview Follow-Up and Candidate Experience =====
  "recruiting::recruiting-w3d2::w3d2-l1": mk(
    "Post-interview follow-up — apply it inside today's Recruiting workflow.",
    "Cadence and content. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Cadence and content. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Post-interview follow-up). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Post-interview follow-up' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d2::w3d2-l2": mk(
    "Candidate status updates — apply it inside today's Recruiting workflow.",
    "Keep Apploi/current tracker current. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Keep Apploi/current tracker current. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate status updates). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate status updates' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d2::w3d2-l3": mk(
    "Holding-pattern communication — apply it inside today's Recruiting workflow.",
    "How to communicate when a decision is pending. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "How to communicate when a decision is pending. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Holding-pattern communication). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Holding-pattern communication' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d2::w3d2-l4": mk(
    "Not-selected communication awareness — apply it inside today's Recruiting workflow.",
    "Approved process and template. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Approved process and template. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Not-selected communication awareness). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Not-selected communication awareness' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 3 Day 3 · Can't Reach, Ghosted, Rescheduled, and No-Show Candidates =====
  "recruiting::recruiting-w3d3::w3d3-l1": mk(
    "Candidate follow-up cadence — apply it inside today's Recruiting workflow.",
    "How many attempts and over what window. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "How many attempts and over what window. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate follow-up cadence). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate follow-up cadence' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d3::w3d3-l2": mk(
    "No-show documentation — apply it inside today's Recruiting workflow.",
    "Missed interview + next action. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Missed interview + next action. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (No-show documentation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'No-show documentation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d3::w3d3-l3": mk(
    "Ghosted / can't reach status — apply it inside today's Recruiting workflow.",
    "When to move a candidate there. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "When to move a candidate there. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Ghosted / can't reach status). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Ghosted / can't reach status' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d3::w3d3-l4": mk(
    "When to close or manager-review — apply it inside today's Recruiting workflow.",
    "Judgment points before closing. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Judgment points before closing. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (When to close or manager-review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'When to close or manager-review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 3 Day 4 · Offer Recommendation and Offer Handoff =====
  "recruiting::recruiting-w3d4::w3d4-l1": mk(
    "Offer recommendation basics — apply it inside today's Recruiting workflow.",
    "What triggers an offer recommendation. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What triggers an offer recommendation. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Offer recommendation basics). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Offer recommendation basics' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d4::w3d4-l2": mk(
    "Required candidate details — apply it inside today's Recruiting workflow.",
    "The information HR needs to move. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "The information HR needs to move. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Required candidate details). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Required candidate details' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d4::w3d4-l3": mk(
    "Offer letter awareness — apply it inside today's Recruiting workflow.",
    "Recruiting prepares the recommendation; HR owns compliance. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Recruiting prepares the recommendation; HR owns compliance. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Offer letter awareness). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Offer letter awareness' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d4::w3d4-l4": mk(
    "HR / manager handoff — apply it inside today's Recruiting workflow.",
    "Where and how to route. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Where and how to route. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (HR / manager handoff). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'HR / manager handoff' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 3 Day 5 · HR Onboarding Handoff and Recruiting Boundaries =====
  "recruiting::recruiting-w3d5::w3d5-l1": mk(
    "Accepted candidate handoff — apply it inside today's Recruiting workflow.",
    "What Recruiting confirms before handoff. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What Recruiting confirms before handoff. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Accepted candidate handoff). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Accepted candidate handoff' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d5::w3d5-l2": mk(
    "Background check awareness — apply it inside today's Recruiting workflow.",
    "HR owns background checks and employee file requirements. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "HR owns background checks and employee file requirements. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Background check awareness). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Background check awareness' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d5::w3d5-l3": mk(
    "Onboarding logistics awareness — apply it inside today's Recruiting workflow.",
    "What Recruiting supports vs owns. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What Recruiting supports vs owns. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Onboarding logistics awareness). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Onboarding logistics awareness' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w3d5::w3d5-l4": mk(
    "Recruiting boundary review — apply it inside today's Recruiting workflow.",
    "Recruiting vs HR ownership in 5 scenarios. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Recruiting vs HR ownership in 5 scenarios. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Recruiting boundary review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Recruiting boundary review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Recruiting Queue Ownership — Part 1 =====
  "recruiting::recruiting-w4d1::w4d1-l1": mk(
    "Morning recruiting queue review — apply it inside today's Recruiting workflow.",
    "New applicants, overdue follow-ups, reminders, no-shows, post-interviews, offer/handoff items. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "New applicants, overdue follow-ups, reminders, no-shows, post-interviews, offer/handoff items. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Morning recruiting queue review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning recruiting queue review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d1::w4d1-l2": mk(
    "Prioritizing candidates — apply it inside today's Recruiting workflow.",
    "What to work first. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "What to work first. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Prioritizing candidates). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing candidates' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d1::w4d1-l3": mk(
    "Updating Apploi / current trackers — apply it inside today's Recruiting workflow.",
    "Keep every required system aligned. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Keep every required system aligned. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Updating Apploi / current trackers). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating Apploi / current trackers' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Recruiting workflow.",
    "No candidate closes the day without a next step. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "No candidate closes the day without a next step. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (End-of-day cleanup). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Recruiting Queue Ownership — Part 2 =====
  "recruiting::recruiting-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Recruiting workflow.",
    "No candidate drifts today. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "No candidate drifts today. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Follow-up discipline). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d2::w4d2-l2": mk(
    "Interview scheduling cleanup — apply it inside today's Recruiting workflow.",
    "Keep Calendly/Outlook/Teams/Apploi aligned. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Keep Calendly/Outlook/Teams/Apploi aligned. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview scheduling cleanup). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview scheduling cleanup' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d2::w4d2-l3": mk(
    "Candidate communication documentation — apply it inside today's Recruiting workflow.",
    "Every attempt logged, next follow-up set. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Every attempt logged, next follow-up set. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate communication documentation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate communication documentation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Recruiting workflow.",
    "Escalate blockers and urgent state needs. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Escalate blockers and urgent state needs. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Escalation notes). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 4 Day 3 · Candidate Communication Quality Day =====
  "recruiting::recruiting-w4d3::w4d3-l1": mk(
    "Warm candidate tone — apply it inside today's Recruiting workflow.",
    "Feels human, not scripted. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Feels human, not scripted. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Warm candidate tone). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Warm candidate tone' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d3::w4d3-l2": mk(
    "Clear interview details — apply it inside today's Recruiting workflow.",
    "When, where, how, with whom. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "When, where, how, with whom. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Clear interview details). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear interview details' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d3::w4d3-l3": mk(
    "Difficult or confused candidate questions — apply it inside today's Recruiting workflow.",
    "Route detail-heavy questions correctly. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Route detail-heavy questions correctly. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Difficult or confused candidate questions). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Difficult or confused candidate questions' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d3::w4d3-l4": mk(
    "Documentation after communication — apply it inside today's Recruiting workflow.",
    "Outcome, next follow-up, and any escalation. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Outcome, next follow-up, and any escalation. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Documentation after communication). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Documentation after communication' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Recruiting Simulation =====
  "recruiting::recruiting-w4d4::w4d4-l1": mk(
    "Application review simulation — apply it inside today's Recruiting workflow.",
    "Full applicant workup. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Full applicant workup. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Application review simulation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Application review simulation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d4::w4d4-l2": mk(
    "Candidate screen simulation — apply it inside today's Recruiting workflow.",
    "Screen + notes. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Screen + notes. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Candidate screen simulation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Candidate screen simulation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d4::w4d4-l3": mk(
    "Interview scheduling simulation — apply it inside today's Recruiting workflow.",
    "Book, verify, remind. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Book, verify, remind. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview scheduling simulation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview scheduling simulation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d4::w4d4-l4": mk(
    "Interview follow-up + offer/handoff simulation — apply it inside today's Recruiting workflow.",
    "Close the loop through HR handoff. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Close the loop through HR handoff. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Interview follow-up + offer/handoff simulation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Interview follow-up + offer/handoff simulation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "recruiting::recruiting-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Recruiting workflow.",
    "10–15 questions across Apploi, pipeline, state needs, review, communication, scheduling, no-shows, follow-up, offer, handoff, boundaries. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions across Apploi, pipeline, state needs, review, communication, scheduling, no-shows, follow-up, offer, handoff, boundaries. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Final knowledge review). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Recruiting workflow.",
    "Frank conversation with manager. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Frank conversation with manager. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Readiness conversation). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Recruiting workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Strengths and coaching areas). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
  "recruiting::recruiting-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Recruiting workflow.",
    "Concrete targets for the first month of independent work. If this step slips, candidates stall, states can't staff cases, and the family experience is delayed.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Recruiting runs this through Apploi (candidate source of truth), Calendly (interview scheduling), Outlook + Teams (invites, meeting links), and phone/email for warm outreach. Nothing lives only in your head — if it isn't in Apploi or the shared tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the candidate record in Apploi and confirm owner + current status.
2) Review what's missing (resume, credentials, availability, state, contact info).
3) Take the next action using the approved channel (Calendly invite, Outlook/Teams meeting, phone/email outreach).
4) Log the outcome directly on the candidate record in clear language.
5) Set the next status, next action, and follow-up date.
6) If the candidate is ready for offer/hire, hand off cleanly to HR with the full packet — Recruiting does not own HR paperwork after acceptance." },
      { heading: "What good looks like", body: "Any Recruiting teammate can open the candidate, see exactly what happened, what's missing, who owns the next step, and when it's due — with no need to ask you." },
    ],
    {
      examples: [
        { heading: "Good candidate note", body: "\"7/15 phone screen with [name] — RBT-eligible, GA, available M-F afternoons. Sent Calendly for BCBA interview 7/17. Owner: me. Next: interview 7/17 2pm.\"" },
        { heading: "Bad candidate note", body: "\"Talked to candidate.\"" },
      ],
      commonMistakes: ["Leaving Apploi status stale after a call, interview, or offer.", "Sending a Calendly link without also updating the candidate record.", "Handing off to HR without confirming resume, credentials, availability, state, and start date.", "Losing candidate source (Apploi / referral / job board) when moving stages.", "Taking over work that belongs to HR, credentialing, or the hiring manager instead of a clean handoff."],
      practiceActivity: { prompt: "Open 2-3 sample candidates that match this lesson (Next 30-day growth plan). For each, write the correct owner, current status, next action, follow-up date, and one clean note." },
      knowledgeCheck: [
        { q: "Where does a Recruiting candidate live today at Blossom?", options: ["Apploi", "CentralReach", "Personal notebook"], answer: 0 },
        { q: "Recruiting owns HR paperwork after offer acceptance.", options: ["True", "False — clean handoff to HR"], answer: 1 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves a candidate without an owner, status, next action, and follow-up date?",
      checklist: ["I updated Apploi status + note after this action.", "I set a next action and follow-up date.", "If it's an HR handoff, the packet is complete."],
    },
  ),
};