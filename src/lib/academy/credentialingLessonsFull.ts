/**
 * Full lesson content for the Credentialing Department onboarding journey.
 * Keyed by `credentialing::cred-w{n}d{n}::w{n}d{n}-l{n}` and merged into
 * lessonContent.ts. Trained on today's Blossom Credentialing process
 * (payer portals, CAQH, state Medicaid, expirables tracking, and clean
 * handoffs to HR, Scheduling, and Billing).
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

export const CREDENTIALING_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Credentialing Role Orientation =====
  "credentialing::cred-w1d1::w1d1-l1": mk(
    "What Credentialing owns today — apply it inside today's Credentialing workflow.",
    "Provider/BCBA info collection, payer enrollment/status tracking, missing item follow-up, payer portal review, effective date confirmation, billing/RCM visibility, auth impact, renewals. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Provider/BCBA info collection, payer enrollment/status tracking, missing item follow-up, payer portal review, effective date confirmation, billing/RCM visibility, auth impact, renewals. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (What Credentialing owns today). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Credentialing owns today' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d1::w1d1-l2": mk(
    "What Credentialing does not own — apply it inside today's Credentialing workflow.",
    "Not clinical supervision, auth submission, billing collections, payroll, HR onboarding compliance, or payer contract decisions. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Not clinical supervision, auth submission, billing collections, payroll, HR onboarding compliance, or payer contract decisions. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (What Credentialing does not own). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'What Credentialing does not own' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d1::w1d1-l3": mk(
    "Credentialing lifecycle overview — apply it inside today's Credentialing workflow.",
    "Provider info → payer enrollment → status tracking → missing-item follow-up → effective date/status → billing/auth visibility → renewals. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Provider info → payer enrollment → status tracking → missing-item follow-up → effective date/status → billing/auth visibility → renewals. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Credentialing lifecycle overview). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Credentialing lifecycle overview' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d1::w1d1-l4": mk(
    "Confidentiality and accuracy standards — apply it inside today's Credentialing workflow.",
    "Provider/payer information is sensitive; nothing should sit without owner, status, next action, and follow-up date. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Provider/payer information is sensitive; nothing should sit without owner, status, next action, and follow-up date. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Confidentiality and accuracy standards). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confidentiality and accuracy standards' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 1 Day 2 · Current Credentialing Systems Tour — Trackers, Payer Portals, Outlook, TMS/Billing, CentralReach Awareness =====
  "credentialing::cred-w1d2::w1d2-l1": mk(
    "Current credentialing tracker basics — apply it inside today's Credentialing workflow.",
    "Provider/BCBA, state, payer, status, effective date, missing items, follow-up, owner, notes, billing/auth impact. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Provider/BCBA, state, payer, status, effective date, missing items, follow-up, owner, notes, billing/auth impact. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Current credentialing tracker basics). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Current credentialing tracker basics' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d2::w1d2-l2": mk(
    "Payer portal basics — apply it inside today's Credentialing workflow.",
    "Each payer uses different status language and workflows. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Each payer uses different status language and workflows. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer portal basics). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer portal basics' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d2::w1d2-l3": mk(
    "Outlook / email communication basics — apply it inside today's Credentialing workflow.",
    "Professional payer / cross-department communication norms. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Professional payer / cross-department communication norms. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Outlook / email communication basics). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Outlook / email communication basics' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d2::w1d2-l4": mk(
    "TMS / billing tracker visibility — apply it inside today's Credentialing workflow.",
    "Where credentialing status affects billing or claim issues. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Where credentialing status affects billing or claim issues. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (TMS / billing tracker visibility). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'TMS / billing tracker visibility' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d2::w1d2-l5": mk(
    "CentralReach provider/client awareness — apply it inside today's Credentialing workflow.",
    "CentralReach is for provider/client visibility only — not a replacement credentialing system. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "CentralReach is for provider/client visibility only — not a replacement credentialing system. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (CentralReach provider/client awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'CentralReach provider/client awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 1 Day 3 · Provider / BCBA Credentialing Basics =====
  "credentialing::cred-w1d3::w1d3-l1": mk(
    "Provider profile basics — apply it inside today's Credentialing workflow.",
    "What a provider/BCBA credentialing profile contains. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "What a provider/BCBA credentialing profile contains. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Provider profile basics). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Provider profile basics' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d3::w1d3-l2": mk(
    "BCBA credentialing awareness — apply it inside today's Credentialing workflow.",
    "Credentialing tracks readiness — Clinical owns supervision and clinical quality. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Credentialing tracks readiness — Clinical owns supervision and clinical quality. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (BCBA credentialing awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'BCBA credentialing awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d3::w1d3-l3": mk(
    "Common credentialing data points — apply it inside today's Credentialing workflow.",
    "License/credential, NPI, CAQH, malpractice, state/payer requirements, contact info, effective dates, payer forms. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "License/credential, NPI, CAQH, malpractice, state/payer requirements, contact info, effective dates, payer forms. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Common credentialing data points). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Common credentialing data points' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d3::w1d3-l4": mk(
    "Missing information follow-up — apply it inside today's Credentialing workflow.",
    "Route missing items to HR, Clinical, provider/BCBA, manager, or RCM/Billing. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Route missing items to HR, Clinical, provider/BCBA, manager, or RCM/Billing. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Missing information follow-up). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing information follow-up' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 1 Day 4 · Payer Enrollment / Panel Status Basics =====
  "credentialing::cred-w1d4::w1d4-l1": mk(
    "Payer enrollment basics — apply it inside today's Credentialing workflow.",
    "Why enrollment/panel status matters for billing. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Why enrollment/panel status matters for billing. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer enrollment basics). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer enrollment basics' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d4::w1d4-l2": mk(
    "Panel status terms — apply it inside today's Credentialing workflow.",
    "Not started, info needed, submitted, pending, approved/active, denied, terminated, revalidation, manager review. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Not started, info needed, submitted, pending, approved/active, denied, terminated, revalidation, manager review. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Panel status terms). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Panel status terms' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d4::w1d4-l3": mk(
    "Effective date awareness — apply it inside today's Credentialing workflow.",
    "Effective dates determine when billing can occur. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Effective dates determine when billing can occur. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Effective date awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Effective date awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d4::w1d4-l4": mk(
    "Payer follow-up documentation — apply it inside today's Credentialing workflow.",
    "Capture attempt, outcome, next action, next follow-up date. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Capture attempt, outcome, next action, next follow-up date. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer follow-up documentation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer follow-up documentation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "credentialing::cred-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Credentialing workflow.",
    "5–7 questions covering provider/payer status, owner/status/next action, confidentiality, systems, billing/auth impact, role boundaries. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering provider/payer status, owner/status/next action, confidentiality, systems, billing/auth impact, role boundaries. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Week 1 knowledge review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Week 1 knowledge review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d5::w1d5-l2": mk(
    "Credentialing role boundary check — apply it inside today's Credentialing workflow.",
    "Credentialing vs Auth vs Billing/RCM vs HR vs Clinical vs State Ops. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Credentialing vs Auth vs Billing/RCM vs HR vs Clinical vs State Ops. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Credentialing role boundary check). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Credentialing role boundary check' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d5::w1d5-l3": mk(
    "Provider/payer status walkthrough — apply it inside today's Credentialing workflow.",
    "Walk 3 items end-to-end with mentor. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end-to-end with mentor. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Provider/payer status walkthrough). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Provider/payer status walkthrough' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Credentialing workflow.",
    "Strengths and coaching areas for Week 2. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Strengths and coaching areas for Week 2. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Mentor feedback). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Mentor feedback' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 2 Day 1 · Credentialing Status Tracking Process =====
  "credentialing::cred-w2d1::w2d1-l1": mk(
    "Status tracking purpose — apply it inside today's Credentialing workflow.",
    "Why current status is Credentialing's most important output. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Why current status is Credentialing's most important output. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Status tracking purpose). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Status tracking purpose' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d1::w2d1-l2": mk(
    "Required status fields — apply it inside today's Credentialing workflow.",
    "Provider/BCBA, payer, state, status, last update, next follow-up, missing items, effective date, impact. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Provider/BCBA, payer, state, status, last update, next follow-up, missing items, effective date, impact. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Required status fields). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Required status fields' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d1::w2d1-l3": mk(
    "Follow-up cadence — apply it inside today's Credentialing workflow.",
    "How often to follow up based on status and urgency. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "How often to follow up based on status and urgency. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Follow-up cadence). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up cadence' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d1::w2d1-l4": mk(
    "Status note quality — apply it inside today's Credentialing workflow.",
    "Specific, dated, actionable notes. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Specific, dated, actionable notes. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Status note quality). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Status note quality' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 2 Day 2 · Missing Information Workflow =====
  "credentialing::cred-w2d2::w2d2-l1": mk(
    "Missing item types — apply it inside today's Credentialing workflow.",
    "License, NPI, CAQH, forms, attestations, contact info, payer-specific. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "License, NPI, CAQH, forms, attestations, contact info, payer-specific. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Missing item types). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item types' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d2::w2d2-l2": mk(
    "Owner identification — apply it inside today's Credentialing workflow.",
    "Who owns each type of missing item. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Who owns each type of missing item. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Owner identification). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Owner identification' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d2::w2d2-l3": mk(
    "Requesting missing information — apply it inside today's Credentialing workflow.",
    "Approved wording, tone, and specifics. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Approved wording, tone, and specifics. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Requesting missing information). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Requesting missing information' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d2::w2d2-l4": mk(
    "Escalation for delays — apply it inside today's Credentialing workflow.",
    "When and how to escalate stalled requests. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "When and how to escalate stalled requests. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Escalation for delays). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation for delays' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 2 Day 3 · Payer Portal and Email Follow-Up =====
  "credentialing::cred-w2d3::w2d3-l1": mk(
    "Payer portal follow-up — apply it inside today's Credentialing workflow.",
    "Where to look and what to capture. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Where to look and what to capture. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer portal follow-up). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer portal follow-up' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d3::w2d3-l2": mk(
    "Email / Outlook follow-up — apply it inside today's Credentialing workflow.",
    "Professional payer email norms and cadence. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Professional payer email norms and cadence. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Email / Outlook follow-up). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Email / Outlook follow-up' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d3::w2d3-l3": mk(
    "Phone follow-up if used — apply it inside today's Credentialing workflow.",
    "Documenting call outcomes and reference numbers. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Documenting call outcomes and reference numbers. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Phone follow-up if used). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Phone follow-up if used' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d3::w2d3-l4": mk(
    "Follow-up outcome documentation — apply it inside today's Credentialing workflow.",
    "Exact wording, next action, next follow-up date. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Exact wording, next action, next follow-up date. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Follow-up outcome documentation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up outcome documentation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 2 Day 4 · Billing / RCM Visibility =====
  "credentialing::cred-w2d4::w2d4-l1": mk(
    "Credentialing impact on billing — apply it inside today's Credentialing workflow.",
    "Enrollment/status gaps cause denials and collection delays. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Enrollment/status gaps cause denials and collection delays. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Credentialing impact on billing). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Credentialing impact on billing' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d4::w2d4-l2": mk(
    "TMS / billing tracker awareness — apply it inside today's Credentialing workflow.",
    "Where credentialing intersects billing visibility. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Where credentialing intersects billing visibility. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (TMS / billing tracker awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'TMS / billing tracker awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d4::w2d4-l3": mk(
    "RCM escalation criteria — apply it inside today's Credentialing workflow.",
    "What warrants escalation to Director of RCM / Controller / Finance. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "What warrants escalation to Director of RCM / Controller / Finance. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (RCM escalation criteria). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'RCM escalation criteria' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d4::w2d4-l4": mk(
    "Clean handoff to Billing/RCM — apply it inside today's Credentialing workflow.",
    "Specific, dated, actionable handoff notes. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Specific, dated, actionable handoff notes. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Clean handoff to Billing/RCM). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clean handoff to Billing/RCM' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "credentialing::cred-w2d5::w2d5-l1": mk(
    "Status tracking review — apply it inside today's Credentialing workflow.",
    "Move status items forward accurately. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Move status items forward accurately. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Status tracking review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Status tracking review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d5::w2d5-l2": mk(
    "Missing information review — apply it inside today's Credentialing workflow.",
    "Draft and route missing-info requests. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Draft and route missing-info requests. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Missing information review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing information review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d5::w2d5-l3": mk(
    "Payer follow-up review — apply it inside today's Credentialing workflow.",
    "Document payer outcomes cleanly. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Document payer outcomes cleanly. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer follow-up review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer follow-up review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w2d5::w2d5-l4": mk(
    "Billing/RCM visibility review — apply it inside today's Credentialing workflow.",
    "Mentor reviews written handoffs. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Mentor reviews written handoffs. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Billing/RCM visibility review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Billing/RCM visibility review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 3 Day 1 · State and Payer Variation =====
  "credentialing::cred-w3d1::w3d1-l1": mk(
    "State-specific credentialing awareness — apply it inside today's Credentialing workflow.",
    "State-specific insurance/payer notes and requirements. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "State-specific insurance/payer notes and requirements. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (State-specific credentialing awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'State-specific credentialing awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d1::w3d1-l2": mk(
    "Payer-specific differences — apply it inside today's Credentialing workflow.",
    "Each payer has different forms, panels, and status wording. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Each payer has different forms, panels, and status wording. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer-specific differences). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer-specific differences' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d1::w3d1-l3": mk(
    "Insurance / state operations references — apply it inside today's Credentialing workflow.",
    "Where to look up state/payer specifics. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Where to look up state/payer specifics. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Insurance / state operations references). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Insurance / state operations references' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d1::w3d1-l4": mk(
    "When to ask for manager review — apply it inside today's Credentialing workflow.",
    "Escalate rather than guess on state/payer requirements. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Escalate rather than guess on state/payer requirements. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (When to ask for manager review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'When to ask for manager review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 3 Day 2 · Authorizations Impact and Provider Readiness =====
  "credentialing::cred-w3d2::w3d2-l1": mk(
    "Credentialing and authorization connection — apply it inside today's Credentialing workflow.",
    "Auth work depends on provider/payer readiness. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Auth work depends on provider/payer readiness. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Credentialing and authorization connection). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Credentialing and authorization connection' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d2::w3d2-l2": mk(
    "BCBA assignment awareness — apply it inside today's Credentialing workflow.",
    "Which provider can be assigned depends on credentialing status. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Which provider can be assigned depends on credentialing status. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (BCBA assignment awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'BCBA assignment awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d2::w3d2-l3": mk(
    "Provider readiness for auth — apply it inside today's Credentialing workflow.",
    "What Auth needs from Credentialing to move forward. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "What Auth needs from Credentialing to move forward. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Provider readiness for auth). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Provider readiness for auth' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d2::w3d2-l4": mk(
    "Authorizations handoff — apply it inside today's Credentialing workflow.",
    "Clean, specific credentialing status handoff. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Clean, specific credentialing status handoff. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Authorizations handoff). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Authorizations handoff' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 3 Day 3 · HR and Clinical Handoffs =====
  "credentialing::cred-w3d3::w3d3-l1": mk(
    "HR handoff for employee/provider info — apply it inside today's Credentialing workflow.",
    "What HR owns vs what Credentialing needs. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "What HR owns vs what Credentialing needs. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (HR handoff for employee/provider info). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'HR handoff for employee/provider info' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d3::w3d3-l2": mk(
    "Clinical handoff for BCBA/provider info — apply it inside today's Credentialing workflow.",
    "How to request info from Clinical without overreach. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "How to request info from Clinical without overreach. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Clinical handoff for BCBA/provider info). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clinical handoff for BCBA/provider info' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d3::w3d3-l3": mk(
    "Confidentiality in cross-department requests — apply it inside today's Credentialing workflow.",
    "Share only what's needed to move the item forward. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Share only what's needed to move the item forward. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Confidentiality in cross-department requests). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Confidentiality in cross-department requests' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d3::w3d3-l4": mk(
    "Follow-up and escalation — apply it inside today's Credentialing workflow.",
    "Track follow-ups and escalate stalls. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Track follow-ups and escalate stalls. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Follow-up and escalation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up and escalation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 3 Day 4 · Credentialing Maintenance, Expirations, and Revalidations =====
  "credentialing::cred-w3d4::w3d4-l1": mk(
    "Maintenance basics — apply it inside today's Credentialing workflow.",
    "Credentialing is ongoing, not one-time. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Credentialing is ongoing, not one-time. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Maintenance basics). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Maintenance basics' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d4::w3d4-l2": mk(
    "Expiration tracking — apply it inside today's Credentialing workflow.",
    "License, malpractice, panel expirations. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "License, malpractice, panel expirations. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Expiration tracking). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Expiration tracking' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d4::w3d4-l3": mk(
    "Revalidation / renewal awareness — apply it inside today's Credentialing workflow.",
    "Payer-specific revalidation windows. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Payer-specific revalidation windows. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Revalidation / renewal awareness). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Revalidation / renewal awareness' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d4::w3d4-l4": mk(
    "Proactive follow-up — apply it inside today's Credentialing workflow.",
    "Set follow-ups well before deadlines. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Set follow-ups well before deadlines. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Proactive follow-up). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Proactive follow-up' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 3 Day 5 · Escalation and End-of-Day Credentialing Cleanup =====
  "credentialing::cred-w3d5::w3d5-l1": mk(
    "Escalation criteria — apply it inside today's Credentialing workflow.",
    "Billing risk, auth blocker, payer deadline, missing provider info, state growth blocker, stale follow-up. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Billing risk, auth blocker, payer deadline, missing provider info, state growth blocker, stale follow-up. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Escalation criteria). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation criteria' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d5::w3d5-l2": mk(
    "Queue cleanup — apply it inside today's Credentialing workflow.",
    "Nothing left silently pending. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Queue cleanup). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Queue cleanup' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d5::w3d5-l3": mk(
    "Stale follow-up review — apply it inside today's Credentialing workflow.",
    "Catch drifting items before they harden into blockers. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Catch drifting items before they harden into blockers. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Stale follow-up review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Stale follow-up review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w3d5::w3d5-l4": mk(
    "Tomorrow's priority list — apply it inside today's Credentialing workflow.",
    "Set a focused start for the next day. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Set a focused start for the next day. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Tomorrow's priority list). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Tomorrow's priority list' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Credentialing Queue Ownership — Part 1 =====
  "credentialing::cred-w4d1::w4d1-l1": mk(
    "Morning credentialing queue review — apply it inside today's Credentialing workflow.",
    "Set the day's priorities. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Set the day's priorities. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Morning credentialing queue review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Morning credentialing queue review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d1::w4d1-l2": mk(
    "Prioritizing credentialing work — apply it inside today's Credentialing workflow.",
    "Billing/auth blockers, payer follow-ups, missing info, deadlines, stale items. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Billing/auth blockers, payer follow-ups, missing info, deadlines, stale items. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Prioritizing credentialing work). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Prioritizing credentialing work' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d1::w4d1-l3": mk(
    "Updating current trackers — apply it inside today's Credentialing workflow.",
    "Keep systems accurate as you work. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Keep systems accurate as you work. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Updating current trackers). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Updating current trackers' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Credentialing workflow.",
    "Nothing left silently pending. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (End-of-day cleanup). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'End-of-day cleanup' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Credentialing Queue Ownership — Part 2 =====
  "credentialing::cred-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Credentialing workflow.",
    "Follow-up dates land, don't drift. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Follow-up dates land, don't drift. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Follow-up discipline). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Follow-up discipline' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d2::w4d2-l2": mk(
    "Payer status accuracy — apply it inside today's Credentialing workflow.",
    "Capture exact payer wording, don't summarize loosely. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Capture exact payer wording, don't summarize loosely. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer status accuracy). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer status accuracy' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d2::w4d2-l3": mk(
    "Missing item follow-up — apply it inside today's Credentialing workflow.",
    "Own follow-through on missing info requests. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Own follow-through on missing info requests. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Missing item follow-up). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item follow-up' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Credentialing workflow.",
    "Escalate to right owner with facts, impact, requested next step. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Escalate to right owner with facts, impact, requested next step. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Escalation notes). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation notes' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 4 Day 3 · Credentialing Communication Quality Day =====
  "credentialing::cred-w4d3::w4d3-l1": mk(
    "Clear credentialing notes — apply it inside today's Credentialing workflow.",
    "Provider, payer, state, status, what happened, what's missing, owner, impact, follow-up. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Provider, payer, state, status, what happened, what's missing, owner, impact, follow-up. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Clear credentialing notes). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Clear credentialing notes' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d3::w4d3-l2": mk(
    "Payer follow-up note quality — apply it inside today's Credentialing workflow.",
    "Exact wording + next action. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Exact wording + next action. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer follow-up note quality). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer follow-up note quality' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d3::w4d3-l3": mk(
    "Missing item request quality — apply it inside today's Credentialing workflow.",
    "Specific, dated, professional. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Specific, dated, professional. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Missing item request quality). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing item request quality' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d3::w4d3-l4": mk(
    "RCM/Auth handoff quality — apply it inside today's Credentialing workflow.",
    "Actionable, specific, dated. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Actionable, specific, dated. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (RCM/Auth handoff quality). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'RCM/Auth handoff quality' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Credentialing Simulation =====
  "credentialing::cred-w4d4::w4d4-l1": mk(
    "Provider profile review simulation — apply it inside today's Credentialing workflow.",
    "Fresh provider profile review. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Fresh provider profile review. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Provider profile review simulation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Provider profile review simulation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d4::w4d4-l2": mk(
    "Payer status review simulation — apply it inside today's Credentialing workflow.",
    "Payer status + effective date confirmation. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Payer status + effective date confirmation. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Payer status review simulation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Payer status review simulation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d4::w4d4-l3": mk(
    "Missing information simulation — apply it inside today's Credentialing workflow.",
    "Route and follow-up missing items. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Route and follow-up missing items. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Missing information simulation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Missing information simulation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d4::w4d4-l4": mk(
    "Billing/auth impact simulation — apply it inside today's Credentialing workflow.",
    "Communicate impact to RCM/Auth. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Communicate impact to RCM/Auth. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Billing/auth impact simulation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Billing/auth impact simulation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d4::w4d4-l5": mk(
    "Escalation / handoff simulation — apply it inside today's Credentialing workflow.",
    "Escalate to correct owner with facts and impact. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Escalate to correct owner with facts and impact. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Escalation / handoff simulation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Escalation / handoff simulation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "credentialing::cred-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Credentialing workflow.",
    "10–15 questions covering the full journey. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Final knowledge review). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Final knowledge review' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Credentialing workflow.",
    "What can be owned independently vs still reviewed. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Readiness conversation). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Readiness conversation' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Credentialing workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Strengths and coaching areas). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Strengths and coaching areas' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
  "credentialing::cred-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Credentialing workflow.",
    "Concrete targets for the first month of independent work. If this step slips, providers can't bill, sessions can't be scheduled, revenue is lost, and payer compliance risk grows.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Credentialing runs through payer portals (Availity, GAMMIS, Optum, Aetna, Anthem, Cigna, Humana, TriCare, etc.), CAQH, state Medicaid systems, CentralReach (provider records + service authorization impact), secure credentialing files, and Outlook/Teams for internal coordination. Nothing lives only in your head — if it isn't in the payer portal, credentialing tracker, or provider file, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the provider record in the credentialing tracker + provider file and confirm current stage + owner.\\n2) Verify baseline: license, NPI, CAQH profile current, background, CPR, malpractice, W-9, and any state Medicaid requirements.\\n3) Take the next action on the correct payer portal (submit, follow up, appeal, revalidate).\\n4) Log the payer interaction: portal, rep name, reference number, date, and result.\\n5) Set next status, next action, follow-up date, and expirable reminders.\\n6) Communicate cleanly: notify Scheduling + Billing when a provider becomes billable, blocked, or expiring; hand off employment items to HR." },
      { heading: "What good looks like", body: "Any Credentialing teammate can open the provider record and see license status, payer enrollments, effective dates, expirables (license, CPR, background), current stage, owner, and next action — without asking you." },
    ],
    {
      examples: [
        { heading: "Good credentialing note", body: "\"7/15 Availity portal — submitted [provider] enrollment for Aetna. Ref #ENR-77821. CAQH re-attested 7/14, license 12/31, CPR 6/30. Effective ETA 30-45d. Owner: me. Next: follow up 7/29.\"" },
        { heading: "Bad credentialing note", body: "\"Submitted, waiting.\"" },
      ],
      commonMistakes: ["Submitting to a payer without confirming license, NPI, CAQH, and required documents are current.", "Missing an expirable (license, CPR, background, malpractice) that blocks billing or scheduling.", "Not tracking payer follow-ups with rep name, reference number, and date.", "Owning work that belongs to HR (employment readiness), Recruiting, Billing, or Scheduling.", "Not communicating credentialing status to Scheduling and Billing when a provider becomes billable or is blocked."],
      practiceActivity: { prompt: "Open 2-3 sample providers that match this lesson (Next 30-day growth plan). For each, confirm expirables, check payer enrollment status, take the correct next action, and write one clean credentialing note." },
      knowledgeCheck: [
        { q: "Where do payer enrollments live today at Blossom?", options: ["Payer portals + credentialing tracker + provider file", "Personal spreadsheet", "Email only"], answer: 0 },
        { q: "A provider can bill a payer only when:", options: ["Enrollment is approved, effective date reached, and license/expirables current", "They were hired", "Scheduling assigned a client"], answer: 0 },
      ],
      reflectionPrompt: "How will you make sure your work on 'Next 30-day growth plan' never leaves a provider without current expirables, payer status, owner, and next action?",
      checklist: ["I confirmed license, NPI, CAQH, and required documents before the payer action.", "I logged the payer interaction with rep name, reference number, and next follow-up.", "I notified Scheduling + Billing of any billable/blocked/expiring status changes."],
    },
  ),
};
