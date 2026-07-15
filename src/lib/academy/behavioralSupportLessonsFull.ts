/**
 * Full lesson content for the Behavioral Support onboarding journey.
 * Keyed by `bs-w{n}d{n}::w{n}d{n}-l{n}` and merged into lessonContent.ts.
 * Trained on today's Blossom Behavioral Support process (CentralReach
 * behavior plans/notes/ABC/incidents, shared BS tracker, BCBA-led clinical
 * decisions, RBT coaching within-plan, family coordination through the BCBA).
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

export const BEHAVIORAL_SUPPORT_LESSON_CONTENT: Record<string, LessonContent> = {
  // ===== Week 1 Day 1 · Behavioral Support Role Orientation =====
  "bs-w1d1::w1d1-l1": mk(
    "What Behavioral Support owns today — apply it inside today's Behavioral Support workflow.",
    "Support-need visibility, RBT support routing, family support (bounded), behavior/treatment plan awareness, escalation routing, follow-up. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Support-need visibility, RBT support routing, family support (bounded), behavior/treatment plan awareness, escalation routing, follow-up. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (What Behavioral Support owns today). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What Behavioral Support owns today' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d1::w1d1-l2": mk(
    "What Behavioral Support does not own — apply it inside today's Behavioral Support workflow.",
    "Not clinical supervision, not writing plans, not final clinical decisions, not intake, not auths, not scheduling, not staffing, not billing/payroll. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Not clinical supervision, not writing plans, not final clinical decisions, not intake, not auths, not scheduling, not staffing, not billing/payroll. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (What Behavioral Support does not own). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'What Behavioral Support does not own' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d1::w1d1-l3": mk(
    "BCBA clinical ownership boundary — apply it inside today's Behavioral Support workflow.",
    "The BCBA owns clinical direction; Behavioral Support reinforces approved guidance and routes questions. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "The BCBA owns clinical direction; Behavioral Support reinforces approved guidance and routes questions. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (BCBA clinical ownership boundary). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BCBA clinical ownership boundary' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d1::w1d1-l4": mk(
    "Behavioral support lifecycle — apply it inside today's Behavioral Support workflow.",
    "Concern identified → context reviewed → BCBA/clinical owner confirmed → action documented → RBT/family/team follow-up → escalation when needed. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Concern identified → context reviewed → BCBA/clinical owner confirmed → action documented → RBT/family/team follow-up → escalation when needed. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavioral support lifecycle). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavioral support lifecycle' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 1 Day 2 · Current Behavioral Support Systems Tour — CentralReach, Clinical Documents, Outlook, Teams, and Trackers =====
  "bs-w1d2::w1d2-l1": mk(
    "CentralReach basics for clinical visibility — apply it inside today's Behavioral Support workflow.",
    "Where client, session, documentation, and clinical information may be viewed by role. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Where client, session, documentation, and clinical information may be viewed by role. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (CentralReach basics for clinical visibility). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'CentralReach basics for clinical visibility' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d2::w1d2-l2": mk(
    "Behavior plan / treatment plan document awareness — apply it inside today's Behavioral Support workflow.",
    "Where plans live and how to reference — not edit. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Where plans live and how to reference — not edit. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavior plan / treatment plan document awareness). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavior plan / treatment plan document awareness' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d2::w1d2-l3": mk(
    "Current clinical / case trackers — apply it inside today's Behavioral Support workflow.",
    "Client, state, BCBA, RBT/staff, family contact, concern/support need, plan status, owner, next action, notes. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Client, state, BCBA, RBT/staff, family contact, concern/support need, plan status, owner, next action, notes. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Current clinical / case trackers). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Current clinical / case trackers' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d2::w1d2-l4": mk(
    "Outlook / Teams communication basics — apply it inside today's Behavioral Support workflow.",
    "Documented, professional family and internal communication. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Documented, professional family and internal communication. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Outlook / Teams communication basics). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Outlook / Teams communication basics' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d2::w1d2-l5": mk(
    "Documentation and confidentiality — apply it inside today's Behavioral Support workflow.",
    "Behavior/clinical info is sensitive; share on a need-to-know basis. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Behavior/clinical info is sensitive; share on a need-to-know basis. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Documentation and confidentiality). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documentation and confidentiality' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 1 Day 3 · Behavior Plan Awareness =====
  "bs-w1d3::w1d3-l1": mk(
    "Behavior plan purpose — apply it inside today's Behavioral Support workflow.",
    "What behavior plans do for clients, families, and the clinical program. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What behavior plans do for clients, families, and the clinical program. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavior plan purpose). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavior plan purpose' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d3::w1d3-l2": mk(
    "BCBA ownership of behavior plans — apply it inside today's Behavioral Support workflow.",
    "Only the BCBA authors and changes clinical plan content. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Only the BCBA authors and changes clinical plan content. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (BCBA ownership of behavior plans). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BCBA ownership of behavior plans' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d3::w1d3-l3": mk(
    "Support need identification — apply it inside today's Behavioral Support workflow.",
    "Understanding, implementation, missing/unclear info, family/RBT question, escalation. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Understanding, implementation, missing/unclear info, family/RBT question, escalation. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Support need identification). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Support need identification' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d3::w1d3-l4": mk(
    "Routing questions and concerns — apply it inside today's Behavioral Support workflow.",
    "Route plan content questions to assigned BCBA/Clinical leadership. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route plan content questions to assigned BCBA/Clinical leadership. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Routing questions and concerns). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Routing questions and concerns' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 1 Day 4 · Session Expectations and RBT Support Basics =====
  "bs-w1d4::w1d4-l1": mk(
    "Session expectations basics — apply it inside today's Behavioral Support workflow.",
    "What healthy sessions look like from a behavioral support view. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What healthy sessions look like from a behavioral support view. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Session expectations basics). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Session expectations basics' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d4::w1d4-l2": mk(
    "RBT support and retention purpose — apply it inside today's Behavioral Support workflow.",
    "How RBT support affects client care and case health. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "How RBT support affects client care and case health. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (RBT support and retention purpose). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'RBT support and retention purpose' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d4::w1d4-l3": mk(
    "Identifying RBT support needs — apply it inside today's Behavioral Support workflow.",
    "Spot signals without overstepping supervision. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Spot signals without overstepping supervision. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Identifying RBT support needs). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Identifying RBT support needs' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d4::w1d4-l4": mk(
    "Routing concerns — apply it inside today's Behavioral Support workflow.",
    "Send to correct owner with a clear note. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Send to correct owner with a clear note. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Routing concerns). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Routing concerns' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 1 Day 5 · Week 1 Review + First Manager Check-In =====
  "bs-w1d5::w1d5-l1": mk(
    "Week 1 knowledge review — apply it inside today's Behavioral Support workflow.",
    "5–7 questions covering behavior plans, BCBA ownership, CentralReach / current documents, RBT support, owner/status/next action, and confidentiality. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "5–7 questions covering behavior plans, BCBA ownership, CentralReach / current documents, RBT support, owner/status/next action, and confidentiality. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Week 1 knowledge review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Week 1 knowledge review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d5::w1d5-l2": mk(
    "Behavioral Support role boundary check — apply it inside today's Behavioral Support workflow.",
    "Behavioral Support vs BCBA/Clinical vs QA vs Case Management vs State Ops. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Behavioral Support vs BCBA/Clinical vs QA vs Case Management vs State Ops. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavioral Support role boundary check). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavioral Support role boundary check' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d5::w1d5-l3": mk(
    "Support item walkthrough — apply it inside today's Behavioral Support workflow.",
    "Walk 3 items end-to-end with mentor. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Walk 3 items end-to-end with mentor. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Support item walkthrough). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Support item walkthrough' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w1d5::w1d5-l4": mk(
    "Mentor feedback — apply it inside today's Behavioral Support workflow.",
    "Strengths and coaching areas for Week 2. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Strengths and coaching areas for Week 2. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Mentor feedback). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Mentor feedback' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 2 Day 1 · Family Clinical Communication for Behavioral Support =====
  "bs-w2d1::w2d1-l1": mk(
    "Family communication standard — apply it inside today's Behavioral Support workflow.",
    "Warm, specific, documented — never casual about clinical information. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, documented — never casual about clinical information. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Family communication standard). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family communication standard' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d1::w2d1-l2": mk(
    "Behavioral concern intake — apply it inside today's Behavioral Support workflow.",
    "Capture concern, context, family need, and clinical relevance. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Capture concern, context, family need, and clinical relevance. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavioral concern intake). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavioral concern intake' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d1::w2d1-l3": mk(
    "Clinical boundary in family communication — apply it inside today's Behavioral Support workflow.",
    "Route clinical questions to BCBA / Clinical leadership. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route clinical questions to BCBA / Clinical leadership. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clinical boundary in family communication). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical boundary in family communication' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d1::w2d1-l4": mk(
    "Documentation and escalation — apply it inside today's Behavioral Support workflow.",
    "Family concern, owner, next action, follow-up date. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Family concern, owner, next action, follow-up date. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Documentation and escalation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documentation and escalation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 2 Day 2 · Parent Training Visibility =====
  "bs-w2d2::w2d2-l1": mk(
    "Parent training purpose — apply it inside today's Behavioral Support workflow.",
    "Why parent training matters to outcomes. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Why parent training matters to outcomes. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Parent training purpose). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Parent training purpose' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d2::w2d2-l2": mk(
    "Parent training status awareness — apply it inside today's Behavioral Support workflow.",
    "Where and how to see status today. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Where and how to see status today. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Parent training status awareness). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Parent training status awareness' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d2::w2d2-l3": mk(
    "Behavior support connection — apply it inside today's Behavioral Support workflow.",
    "How parent training supports behavior plans in the home. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "How parent training supports behavior plans in the home. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavior support connection). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavior support connection' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d2::w2d2-l4": mk(
    "BCBA follow-up — apply it inside today's Behavioral Support workflow.",
    "Route clinical content and delays to BCBA/Clinical. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route clinical content and delays to BCBA/Clinical. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (BCBA follow-up). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BCBA follow-up' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 2 Day 3 · Treatment Plan Awareness =====
  "bs-w2d3::w2d3-l1": mk(
    "Treatment plan purpose — apply it inside today's Behavioral Support workflow.",
    "What treatment plans do for clients, families, and clinical direction. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What treatment plans do for clients, families, and clinical direction. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Treatment plan purpose). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Treatment plan purpose' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d3::w2d3-l2": mk(
    "Treatment plan vs behavior plan — apply it inside today's Behavioral Support workflow.",
    "Different documents, different purposes, same BCBA ownership. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Different documents, different purposes, same BCBA ownership. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Treatment plan vs behavior plan). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Treatment plan vs behavior plan' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d3::w2d3-l3": mk(
    "Support questions and gaps — apply it inside today's Behavioral Support workflow.",
    "What Behavioral Support can help route. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What Behavioral Support can help route. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Support questions and gaps). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Support questions and gaps' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d3::w2d3-l4": mk(
    "QA / BCBA routing — apply it inside today's Behavioral Support workflow.",
    "Send quality questions to QA; clinical questions to BCBA. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Send quality questions to QA; clinical questions to BCBA. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (QA / BCBA routing). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'QA / BCBA routing' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 2 Day 4 · Clinical Documentation Awareness =====
  "bs-w2d4::w2d4-l1": mk(
    "Clinical documentation purpose — apply it inside today's Behavioral Support workflow.",
    "Why documentation matters for care continuity and QA. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Why documentation matters for care continuity and QA. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clinical documentation purpose). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical documentation purpose' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d4::w2d4-l2": mk(
    "Documentation visibility — apply it inside today's Behavioral Support workflow.",
    "What Behavioral Support can see and cite. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What Behavioral Support can see and cite. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Documentation visibility). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documentation visibility' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d4::w2d4-l3": mk(
    "Missing / unclear documentation — apply it inside today's Behavioral Support workflow.",
    "Identify and route without overstepping. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Identify and route without overstepping. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Missing / unclear documentation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Missing / unclear documentation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d4::w2d4-l4": mk(
    "QA / Clinical routing — apply it inside today's Behavioral Support workflow.",
    "Route to the correct owner with follow-up. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route to the correct owner with follow-up. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (QA / Clinical routing). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'QA / Clinical routing' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 2 Day 5 · Week 2 Supervised Execution Review =====
  "bs-w2d5::w2d5-l1": mk(
    "Family behavioral concern review — apply it inside today's Behavioral Support workflow.",
    "Draft warm, boundaried family communication. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Draft warm, boundaried family communication. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Family behavioral concern review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family behavioral concern review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d5::w2d5-l2": mk(
    "Parent training visibility review — apply it inside today's Behavioral Support workflow.",
    "Route parent-training follow-up. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route parent-training follow-up. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Parent training visibility review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Parent training visibility review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d5::w2d5-l3": mk(
    "Treatment / behavior plan awareness review — apply it inside today's Behavioral Support workflow.",
    "Track visibility without editing clinical content. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Track visibility without editing clinical content. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Treatment / behavior plan awareness review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Treatment / behavior plan awareness review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w2d5::w2d5-l4": mk(
    "Clinical documentation awareness review — apply it inside today's Behavioral Support workflow.",
    "Mentor reviews notes for clarity and boundary. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Mentor reviews notes for clarity and boundary. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clinical documentation awareness review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical documentation awareness review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 3 Day 1 · Clinical Escalation and Case Review =====
  "bs-w3d1::w3d1-l1": mk(
    "Escalation criteria — apply it inside today's Behavioral Support workflow.",
    "Safety concerns, increased behavior concerns, family concerns, RBT support needs, repeated implementation issues, doc gaps, service pauses, parent training concerns, clinical uncertainty. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Safety concerns, increased behavior concerns, family concerns, RBT support needs, repeated implementation issues, doc gaps, service pauses, parent training concerns, clinical uncertainty. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Escalation criteria). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation criteria' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d1::w3d1-l2": mk(
    "Behavioral concern summary — apply it inside today's Behavioral Support workflow.",
    "Concise, factual, respectful summary. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Concise, factual, respectful summary. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavioral concern summary). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavioral concern summary' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d1::w3d1-l3": mk(
    "Clinical vs operational escalations — apply it inside today's Behavioral Support workflow.",
    "BCBA, Clinical leadership, QA, Case Manager, State Ops, Scheduling/Staffing, or manager. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "BCBA, Clinical leadership, QA, Case Manager, State Ops, Scheduling/Staffing, or manager. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clinical vs operational escalations). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical vs operational escalations' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d1::w3d1-l4": mk(
    "Case review notes — apply it inside today's Behavioral Support workflow.",
    "Facts, impact, requested decision, follow-up date. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Facts, impact, requested decision, follow-up date. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Case review notes). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Case review notes' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 3 Day 2 · Services on Pause and Behavioral Support =====
  "bs-w3d2::w3d2-l1": mk(
    "Services on pause basics — apply it inside today's Behavioral Support workflow.",
    "Why paused services need active ownership. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Why paused services need active ownership. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Services on pause basics). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Services on pause basics' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d2::w3d2-l2": mk(
    "Behavior-related pause reasons — apply it inside today's Behavioral Support workflow.",
    "Common behavior-linked pause scenarios. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Common behavior-linked pause scenarios. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavior-related pause reasons). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavior-related pause reasons' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d2::w3d2-l3": mk(
    "Restart support visibility — apply it inside today's Behavioral Support workflow.",
    "What Behavioral Support can help track for restart. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What Behavioral Support can help track for restart. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Restart support visibility). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Restart support visibility' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d2::w3d2-l4": mk(
    "Escalation and follow-up — apply it inside today's Behavioral Support workflow.",
    "Route clinical concerns to BCBA/Clinical leadership. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route clinical concerns to BCBA/Clinical leadership. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Escalation and follow-up). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation and follow-up' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 3 Day 3 · Discharge Awareness and Behavioral Support =====
  "bs-w3d3::w3d3-l1": mk(
    "Discharge awareness — apply it inside today's Behavioral Support workflow.",
    "Why respectful, organized discharge matters. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Why respectful, organized discharge matters. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Discharge awareness). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Discharge awareness' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d3::w3d3-l2": mk(
    "Behavioral context in discharge — apply it inside today's Behavioral Support workflow.",
    "What Behavioral Support may surface for the clinical owner. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What Behavioral Support may surface for the clinical owner. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavioral context in discharge). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavioral context in discharge' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d3::w3d3-l3": mk(
    "Family communication boundary — apply it inside today's Behavioral Support workflow.",
    "Warm, specific, non-clinical support communication. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, non-clinical support communication. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Family communication boundary). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family communication boundary' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d3::w3d3-l4": mk(
    "Documentation and handoff — apply it inside today's Behavioral Support workflow.",
    "Clear, dated, respectful handoff to clinical owner. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Clear, dated, respectful handoff to clinical owner. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Documentation and handoff). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Documentation and handoff' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 3 Day 4 · Cross-Department Behavioral Support Handoffs =====
  "bs-w3d4::w3d4-l1": mk(
    "Case Management handoff — apply it inside today's Behavioral Support workflow.",
    "When to loop in Case Management. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "When to loop in Case Management. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Case Management handoff). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Case Management handoff' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d4::w3d4-l2": mk(
    "QA / Documentation handoff — apply it inside today's Behavioral Support workflow.",
    "When to loop in QA. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "When to loop in QA. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (QA / Documentation handoff). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'QA / Documentation handoff' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d4::w3d4-l3": mk(
    "Scheduling / Staffing handoff — apply it inside today's Behavioral Support workflow.",
    "When behavior support needs schedule/staffing coordination. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "When behavior support needs schedule/staffing coordination. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Scheduling / Staffing handoff). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Scheduling / Staffing handoff' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d4::w3d4-l4": mk(
    "HR / Training / State Ops handoff — apply it inside today's Behavioral Support workflow.",
    "When to loop in HR, Training, or State Ops. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "When to loop in HR, Training, or State Ops. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (HR / Training / State Ops handoff). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'HR / Training / State Ops handoff' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 3 Day 5 · Behavioral Support Trend Awareness and End-of-Day Cleanup =====
  "bs-w3d5::w3d5-l1": mk(
    "Trend awareness — apply it inside today's Behavioral Support workflow.",
    "Patterns leaders need to see. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Patterns leaders need to see. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Trend awareness). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Trend awareness' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d5::w3d5-l2": mk(
    "Repeated support needs — apply it inside today's Behavioral Support workflow.",
    "Spot recurrences across items. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Spot recurrences across items. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Repeated support needs). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Repeated support needs' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d5::w3d5-l3": mk(
    "End-of-day queue cleanup — apply it inside today's Behavioral Support workflow.",
    "Nothing left silently pending. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (End-of-day queue cleanup). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'End-of-day queue cleanup' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w3d5::w3d5-l4": mk(
    "Tomorrow's priority list — apply it inside today's Behavioral Support workflow.",
    "Set up tomorrow before you leave. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Set up tomorrow before you leave. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Tomorrow's priority list). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Tomorrow's priority list' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 4 Day 1 · Controlled Behavioral Support Queue Ownership — Part 1 =====
  "bs-w4d1::w4d1-l1": mk(
    "Morning support queue review — apply it inside today's Behavioral Support workflow.",
    "Set the day's priorities. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Set the day's priorities. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Morning support queue review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Morning support queue review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d1::w4d1-l2": mk(
    "Prioritizing behavioral support work — apply it inside today's Behavioral Support workflow.",
    "Urgent family concerns, RBT support needs, behavior plan questions, escalations, pauses, repeated patterns, doc/comm blockers. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Urgent family concerns, RBT support needs, behavior plan questions, escalations, pauses, repeated patterns, doc/comm blockers. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Prioritizing behavioral support work). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Prioritizing behavioral support work' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d1::w4d1-l3": mk(
    "Updating current notes / trackers — apply it inside today's Behavioral Support workflow.",
    "Keep systems accurate as you work. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Keep systems accurate as you work. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Updating current notes / trackers). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Updating current notes / trackers' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d1::w4d1-l4": mk(
    "End-of-day cleanup — apply it inside today's Behavioral Support workflow.",
    "Nothing left silently pending. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Nothing left silently pending. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (End-of-day cleanup). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'End-of-day cleanup' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 4 Day 2 · Controlled Behavioral Support Queue Ownership — Part 2 =====
  "bs-w4d2::w4d2-l1": mk(
    "Follow-up discipline — apply it inside today's Behavioral Support workflow.",
    "Follow-up dates land, don't drift. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Follow-up dates land, don't drift. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Follow-up discipline). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up discipline' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d2::w4d2-l2": mk(
    "Clinical boundary — apply it inside today's Behavioral Support workflow.",
    "Route clinical decisions to Clinical / BCBA owner. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Route clinical decisions to Clinical / BCBA owner. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clinical boundary). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical boundary' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d2::w4d2-l3": mk(
    "RBT / family support communication — apply it inside today's Behavioral Support workflow.",
    "Warm, specific, boundaried. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, boundaried. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (RBT / family support communication). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'RBT / family support communication' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d2::w4d2-l4": mk(
    "Escalation notes — apply it inside today's Behavioral Support workflow.",
    "Facts, impact, requested next step. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Facts, impact, requested next step. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Escalation notes). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Escalation notes' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 4 Day 3 · Behavioral Support Communication Quality Day =====
  "bs-w4d3::w4d3-l1": mk(
    "Clear behavioral support notes — apply it inside today's Behavioral Support workflow.",
    "Concern, context, plan/status if known, owner, impact, follow-up date. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Concern, context, plan/status if known, owner, impact, follow-up date. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clear behavioral support notes). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clear behavioral support notes' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d3::w4d3-l2": mk(
    "Family communication tone — apply it inside today's Behavioral Support workflow.",
    "Warm, specific, boundaried. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Warm, specific, boundaried. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Family communication tone). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Family communication tone' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d3::w4d3-l3": mk(
    "RBT support tone — apply it inside today's Behavioral Support workflow.",
    "Supportive, non-supervisory, respectful. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Supportive, non-supervisory, respectful. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (RBT support tone). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'RBT support tone' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d3::w4d3-l4": mk(
    "BCBA / Clinical handoff quality — apply it inside today's Behavioral Support workflow.",
    "Specific, dated, respectful — no clinical overreach. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Specific, dated, respectful — no clinical overreach. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (BCBA / Clinical handoff quality). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'BCBA / Clinical handoff quality' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 4 Day 4 · End-to-End Behavioral Support Simulation =====
  "bs-w4d4::w4d4-l1": mk(
    "Support need intake simulation — apply it inside today's Behavioral Support workflow.",
    "Capture concern, context, owner, next step. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Capture concern, context, owner, next step. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Support need intake simulation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Support need intake simulation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d4::w4d4-l2": mk(
    "Behavior plan / treatment plan awareness simulation — apply it inside today's Behavioral Support workflow.",
    "Reference plans without editing. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Reference plans without editing. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Behavior plan / treatment plan awareness simulation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Behavior plan / treatment plan awareness simulation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d4::w4d4-l3": mk(
    "RBT or family support simulation — apply it inside today's Behavioral Support workflow.",
    "Draft warm, boundaried support communication. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Draft warm, boundaried support communication. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (RBT or family support simulation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'RBT or family support simulation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d4::w4d4-l4": mk(
    "Clinical escalation simulation — apply it inside today's Behavioral Support workflow.",
    "Escalate to BCBA/Clinical with facts, impact, requested decision. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Escalate to BCBA/Clinical with facts, impact, requested decision. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Clinical escalation simulation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Clinical escalation simulation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d4::w4d4-l5": mk(
    "Follow-up and cleanup simulation — apply it inside today's Behavioral Support workflow.",
    "Close cleanly with owner, status, next action, follow-up. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Close cleanly with owner, status, next action, follow-up. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Follow-up and cleanup simulation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Follow-up and cleanup simulation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  // ===== Week 4 Day 5 · Graduation, Readiness Review, and Next 30 Days =====
  "bs-w4d5::w4d5-l1": mk(
    "Final knowledge review — apply it inside today's Behavioral Support workflow.",
    "10–15 questions covering the full journey. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "10–15 questions covering the full journey. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Final knowledge review). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Final knowledge review' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d5::w4d5-l2": mk(
    "Readiness conversation — apply it inside today's Behavioral Support workflow.",
    "What can be owned independently vs still reviewed. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "What can be owned independently vs still reviewed. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Readiness conversation). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Readiness conversation' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d5::w4d5-l3": mk(
    "Strengths and coaching areas — apply it inside today's Behavioral Support workflow.",
    "Name 2 strengths and 2 coaching areas. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Name 2 strengths and 2 coaching areas. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Strengths and coaching areas). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Strengths and coaching areas' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
  "bs-w4d5::w4d5-l4": mk(
    "Next 30-day growth plan — apply it inside today's Behavioral Support workflow.",
    "Concrete targets for the first month of independent work. If this step slips, RBTs run inconsistent strategies, incidents go unlogged, families lose trust, and the BCBA loses visibility into what's really happening in-session.",
    [
      { heading: "Plain-English explanation", body: "Concrete targets for the first month of independent work. Today at Blossom, Behavioral Support works alongside the BCBA and RBT team through CentralReach (behavior plans, session notes, ABC data, incident logs, treatment plans), the shared behavior support tracker (client, target behavior, strategy, owner, next check-in), and Outlook/Teams for BCBA and family coordination. If a strategy, incident, or family conversation isn't in CentralReach or the tracker, it didn't happen." },
      { heading: "Step-by-step (today's process)", body: "1) Open the client in CentralReach and review current behavior plan, target behaviors, active strategies, and recent ABC/incident data.\\n2) Check the behavior support tracker for owner, last check-in, RBT coaching status, and family touchpoints.\\n3) Do the work this lesson covers within scope: coach RBTs on in-plan strategies, model, observe, document.\\n4) Log every strategy attempt, RBT coaching moment, incident, and family communication in CentralReach and the tracker the same day.\\n5) Escalate to the BCBA immediately for: any incident, requested plan change, safety concern, or family clinical question. Behavioral Support supports — the BCBA decides clinically." },
      { heading: "What good looks like", body: "Any BCBA or teammate can open the client and see the current behavior plan, active strategies, recent incidents, parent training touchpoints, owner, next check-in date, and what's been tried — without asking you." },
    ],
    {
      examples: [
        { heading: "Good tracker entry", body: "\"7/15 [client] — target: elopement. In-plan strategy: transition warning + choice. Coached RBT [name] live 3:00-4:30, 2 successful transitions, 1 elopement (logged incident, BCBA [name] notified 4:35). Next check-in: 7/17.\"" },
        { heading: "Bad tracker entry", body: "\"Session was hard, tried some stuff.\"" },
      ],
      commonMistakes: ["Adjusting a behavior plan or strategy without BCBA sign-off — clinical judgment stays with the BCBA.", "Coaching RBTs on techniques not written in the current behavior plan.", "Leaving incidents undocumented or without immediate BCBA notification.", "Talking to families about clinical decisions instead of routing to the BCBA.", "Skipping the tracker entry so no one else knows what was tried, what worked, or what's next."],
      practiceActivity: { prompt: "Pick 2-3 real clients that match this lesson (Next 30-day growth plan). For each, review the current behavior plan, plan one in-plan coaching moment for the RBT, and write the tracker entry with owner, strategy, outcome, incident (if any), and next check-in." },
      knowledgeCheck: [
        { q: "Where do behavior plans, incidents, and BSP activity live today at Blossom?", options: ["CentralReach + behavior support tracker", "Personal notebook", "Text messages"], answer: 0 },
        { q: "Who owns clinical decisions on behavior plans?", options: ["The BCBA — Behavioral Support coordinates and supports", "Behavioral Support alone", "The RBT"], answer: 0 },
      ],
      reflectionPrompt: "How will you keep 'Next 30-day growth plan' inside BCBA-owned clinical scope while still moving the case forward same day?",
      checklist: ["I stayed within the current BCBA-approved behavior plan.", "I logged strategies, coaching, incidents, and family contact same day.", "I escalated incidents and clinical questions to the BCBA immediately."],
    },
  ),
};
