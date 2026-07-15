/**
 * Full lesson content for the Marketing and Business Development onboarding journey.
 * Keyed by `mbd-w{n}d{n}::w{n}d{n}-l{n}` and merged into lessonContent.ts.
 * Grounded in today's Blossom process — lead sources (CTM / calls, Facebook / Google
 * Ads, LeadTrap, Mailchimp where applicable), referral partner tracking, provider
 * relationships, event and boots-on-the-ground BD, campaign tracking, and clean
 * handoffs to Intake. Marketing / BD does not own intake execution after handoff.
 */

import type { LessonContent } from "./lessonContent";

function mk(objective: string, whyItMatters: string, sections: { heading: string; body: string }[], extras: Partial<LessonContent> = {}): LessonContent {
  return { objective, whyItMatters, sections, ...extras };
}

export const MARKETING_BD_LESSON_CONTENT: Record<string, LessonContent> = {
  "mbd-w1d1::w1d1-l1": mk(
    "What This Team Owns — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply Marketing and Business Development ownership and core responsibilities. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply Marketing and Business Development ownership and core responsibilities. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"What This Team Owns\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"What This Team Owns\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d1::w1d1-l2": mk(
    "What This Team Does Not Own — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply Marketing and Business Development boundaries and clean handoffs. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply Marketing and Business Development boundaries and clean handoffs. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"What This Team Does Not Own\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"What This Team Does Not Own\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d1::w1d1-l3": mk(
    "The Experience Standard — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how Marketing and Business Development work should feel to families, staff, or internal partners. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how Marketing and Business Development work should feel to families, staff, or internal partners. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"The Experience Standard\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"The Experience Standard\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d2::w1d2-l1": mk(
    "System Map — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply which systems are used and why. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply which systems are used and why. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"System Map\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"System Map\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d2::w1d2-l2": mk(
    "Record Hygiene — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to keep notes, statuses, and owners clean. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to keep notes, statuses, and owners clean. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Record Hygiene\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Record Hygiene\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d2::w1d2-l3": mk(
    "Communication Channels — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply when to use Teams, Outlook, phone, internal comments, and escalation. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply when to use Teams, Outlook, phone, internal comments, and escalation. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Communication Channels\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Communication Channels\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d3::w1d3-l1": mk(
    "Morning Review — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to review assigned work and priorities. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to review assigned work and priorities. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Morning Review\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Morning Review\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d3::w1d3-l2": mk(
    "Task Ownership — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to identify and own today's work. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to identify and own today's work. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Task Ownership\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Task Ownership\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d3::w1d3-l3": mk(
    "End-of-Day Cleanup — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to leave work clear for tomorrow. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to leave work clear for tomorrow. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"End-of-Day Cleanup\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"End-of-Day Cleanup\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d4::w1d4-l1": mk(
    "Writing Useful Notes — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply specific, clear, usable documentation. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply specific, clear, usable documentation. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Writing Useful Notes\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Writing Useful Notes\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d4::w1d4-l2": mk(
    "Internal Updates — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to update managers and partner departments. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to update managers and partner departments. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Internal Updates\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Internal Updates\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d4::w1d4-l3": mk(
    "Escalation Notes — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to write a clean escalation. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to write a clean escalation. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Escalation Notes\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation Notes\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d5::w1d5-l1": mk(
    "Knowledge Review — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply key role and systems concepts. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply key role and systems concepts. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Knowledge Review\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Knowledge Review\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d5::w1d5-l2": mk(
    "Mentor Review — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply review sample records/tasks with mentor. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply review sample records/tasks with mentor. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Mentor Review\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Mentor Review\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w1d5::w1d5-l3": mk(
    "Manager Check-In — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply reflection and readiness for supervised work. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply reflection and readiness for supervised work. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Manager Check-In\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Manager Check-In\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d1::w2d1-l1": mk(
    "Workflow Purpose — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply why this workflow matters. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply why this workflow matters. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Workflow Purpose\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Workflow Purpose\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d1::w2d1-l2": mk(
    "Step-by-Step Execution — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to complete the workflow. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to complete the workflow. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Step-by-Step Execution\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Step-by-Step Execution\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d1::w2d1-l3": mk(
    "Practice Scenarios — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to apply the workflow to sample cases. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to apply the workflow to sample cases. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Practice Scenarios\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Practice Scenarios\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d2::w2d2-l1": mk(
    "Inputs and Required Info — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what information is needed before action. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what information is needed before action. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Inputs and Required Info\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Inputs and Required Info\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d2::w2d2-l2": mk(
    "Processing the Work — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to move the work forward. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to move the work forward. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Processing the Work\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Processing the Work\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d2::w2d2-l3": mk(
    "Quality Check — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to verify the work is complete. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to verify the work is complete. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Quality Check\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Quality Check\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d3::w2d3-l1": mk(
    "Common Missing Items — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what is usually missing. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what is usually missing. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Common Missing Items\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Common Missing Items\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d3::w2d3-l2": mk(
    "Follow-Up Process — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to request or chase missing items. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to request or chase missing items. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Follow-Up Process\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Follow-Up Process\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d3::w2d3-l3": mk(
    "Blocked Work — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to document and escalate blockers. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to document and escalate blockers. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Blocked Work\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Blocked Work\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d4::w2d4-l1": mk(
    "Handoff Standards — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what every handoff must include. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what every handoff must include. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Handoff Standards\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Handoff Standards\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d4::w2d4-l2": mk(
    "Receiving Handoffs — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to accept and clarify incoming work. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to accept and clarify incoming work. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Receiving Handoffs\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Receiving Handoffs\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d4::w2d4-l3": mk(
    "Sending Handoffs — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to send work without creating confusion. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to send work without creating confusion. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Sending Handoffs\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Sending Handoffs\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d5::w2d5-l1": mk(
    "Mini-Shift Setup — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to prepare for supervised work. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to prepare for supervised work. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Mini-Shift Setup\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Mini-Shift Setup\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d5::w2d5-l2": mk(
    "Accuracy Review — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how mentor reviews quality. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how mentor reviews quality. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Accuracy Review\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Accuracy Review\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w2d5::w2d5-l3": mk(
    "Week 2 Reflection — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what learner can own with support. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what learner can own with support. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Week 2 Reflection\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Week 2 Reflection\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d1::w3d1-l1": mk(
    "Quality Criteria — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how quality is judged. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how quality is judged. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Quality Criteria\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Quality Criteria\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d1::w3d1-l2": mk(
    "Common Errors — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what errors create rework. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what errors create rework. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Common Errors\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Common Errors\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d1::w3d1-l3": mk(
    "Self-Audit — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to check work before marking done. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to check work before marking done. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Self-Audit\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Self-Audit\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d2::w3d2-l1": mk(
    "Priority Rules — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what gets handled first. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what gets handled first. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Priority Rules\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Priority Rules\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d2::w3d2-l2": mk(
    "Aging Work — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to handle stale tasks. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to handle stale tasks. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Aging Work\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Aging Work\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d2::w3d2-l3": mk(
    "Urgent Escalations — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what must be escalated same day. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what must be escalated same day. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Urgent Escalations\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Urgent Escalations\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d3::w3d3-l1": mk(
    "Scenario Patterns — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply common hard situations. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply common hard situations. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Scenario Patterns\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Scenario Patterns\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d3::w3d3-l2": mk(
    "Decision Points — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to choose next action. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to choose next action. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Decision Points\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Decision Points\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d3::w3d3-l3": mk(
    "Role-Play or Case Practice — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply practice responding to difficult scenarios. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply practice responding to difficult scenarios. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Role-Play or Case Practice\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Role-Play or Case Practice\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d4::w3d4-l1": mk(
    "Update Rhythm — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how often to update and who needs to know. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how often to update and who needs to know. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Update Rhythm\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Update Rhythm\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d4::w3d4-l2": mk(
    "Meeting/Check-In Prep — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply what to bring to a check-in. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply what to bring to a check-in. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Meeting/Check-In Prep\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Meeting/Check-In Prep\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d4::w3d4-l3": mk(
    "Escalation Follow-Through — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to confirm escalation was resolved. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to confirm escalation was resolved. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Escalation Follow-Through\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Escalation Follow-Through\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d5::w3d5-l1": mk(
    "Scenario Quiz — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply test judgment. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply test judgment. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Scenario Quiz\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Scenario Quiz\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d5::w3d5-l2": mk(
    "Mentor Feedback — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply review strengths and coaching areas. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply review strengths and coaching areas. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Mentor Feedback\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Mentor Feedback\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w3d5::w3d5-l3": mk(
    "Manager Signoff — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply readiness for week 4 ownership. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply readiness for week 4 ownership. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Manager Signoff\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Manager Signoff\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d1::w4d1-l1": mk(
    "Queue Setup — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to choose assigned work. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to choose assigned work. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Queue Setup\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Queue Setup\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d1::w4d1-l2": mk(
    "Live Work Standards — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to work safely and document. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to work safely and document. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Live Work Standards\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Live Work Standards\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d1::w4d1-l3": mk(
    "Mentor Review — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how feedback is captured. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how feedback is captured. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Mentor Review\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Mentor Review\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d2::w4d2-l1": mk(
    "Independent Prioritization — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how learner chooses order of work. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how learner chooses order of work. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Independent Prioritization\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Independent Prioritization\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d2::w4d2-l2": mk(
    "Midday Checkpoint — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to catch issues early. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to catch issues early. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Midday Checkpoint\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Midday Checkpoint\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d2::w4d2-l3": mk(
    "End-of-Day Signoff — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to close the day. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to close the day. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"End-of-Day Signoff\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"End-of-Day Signoff\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d3::w4d3-l1": mk(
    "Speed Without Sloppiness — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to move faster safely. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to move faster safely. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Speed Without Sloppiness\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Speed Without Sloppiness\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d3::w4d3-l2": mk(
    "Accuracy Habits — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to avoid repeat mistakes. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to avoid repeat mistakes. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Accuracy Habits\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Accuracy Habits\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d3::w4d3-l3": mk(
    "Professional Communication — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply how to sound clear and calm. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply how to sound clear and calm. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Professional Communication\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Professional Communication\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d4::w4d4-l1": mk(
    "Simulation Setup — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply the full scenario. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply the full scenario. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Simulation Setup\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Simulation Setup\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d4::w4d4-l2": mk(
    "Execution — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply complete all steps. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply complete all steps. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Execution\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Execution\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d4::w4d4-l3": mk(
    "Debrief — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply mentor scores work and corrections. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply mentor scores work and corrections. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Debrief\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Debrief\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d5::w4d5-l1": mk(
    "Final Knowledge Review — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply quiz and scenario review. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply quiz and scenario review. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Final Knowledge Review\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Final Knowledge Review\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d5::w4d5-l2": mk(
    "Readiness Decision — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply manager decision and signoff. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply manager decision and signoff. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Readiness Decision\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Readiness Decision\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
  "mbd-w4d5::w4d5-l3": mk(
    "Next 30-Day Plan — apply it inside today's Marketing / BD workflow at Blossom.",
    "Help a new Marketing and Business Development team member understand and apply goals, check-ins, and ownership level. If this slips, leads leak, referral partners cool off, campaign spend is wasted, and Intake receives dirty handoffs.",
    [
      { heading: "Plain-English explanation", body: "Help a new Marketing and Business Development team member understand and apply goals, check-ins, and ownership level. At Blossom today, Marketing / BD runs on CTM and call-source tracking, Facebook and Google Ads lead sources, LeadTrap and Mailchimp where applicable, a referral partner tracker for providers and community partners, event checklists for boots-on-the-ground activities, and clean handoffs to Intake. Marketing / BD does NOT own intake execution after the handoff." },
      { heading: "Step-by-step (today's process)", body: "1) Open the source of truth for this task — CTM / lead-source dashboard, referral partner tracker, campaign tracker, or event checklist.\n2) Confirm the record has owner, status, source, next action, and follow-up date.\n3) Do the Marketing / BD work this lesson covers — outreach, campaign tuning, referral touch, event prep, or content push.\n4) Document what happened in clear notes: what was said, what was sent, what is missing, and when the next touch is due.\n5) Hand off cleanly to Intake with source, parent name, insurance if known, best contact, and consent to be contacted — then let Intake own execution from there." },
      { heading: "What good looks like", body: "Any teammate can open the referral tracker, campaign log, or event checklist and see exactly where each lead / partner / campaign stands, who owns it, what happens next, and when Intake picked it up." },
    ],
    {
      examples: [
        { heading: "Good Marketing / BD note", body: "\"7/15 — Metro Peds referral partner call. Interested in in-home ABA for 2 families. Sent Blossom overview + intake link. Handed off to Intake with parent names, insurance, best contact. Next touch: 7/22 lunch drop-off. Logged in referral tracker + CTM source noted.\"" },
        { heading: "Bad Marketing / BD note", body: "\"Called partner, went well.\"" },
      ],
      commonMistakes: ["Doing Intake, Scheduling, Auth, or Clinical work instead of handing off cleanly with source and contact info.", "Leaving lead-source, referral, event, or campaign notes without owner, next action, and follow-up date.", "Promising families a start date, benefits, or clinical outcomes — that's Intake / Clinical / RCM to own.", "Skipping the CTM / call-source or lead-source tagging so the funnel becomes untraceable.", "Letting a referral partner conversation stall without a documented next touch and owner."],
      practiceActivity: { prompt: "Pick 2-3 real Marketing / BD situations that match \"Next 30-Day Plan\". For each, pull the source of truth, write the note with owner / source / next action / follow-up date, and decide: nurture, escalate, or hand off to Intake." },
      knowledgeCheck: [
        { q: "Where does Marketing / BD activity live today at Blossom?", options: ["CTM, lead-source dashboards, referral tracker, campaign trackers, event checklist", "Personal spreadsheet", "Text threads only"], answer: 0 },
        { q: "Marketing / BD vs Intake ownership:", options: ["Own top-of-funnel + partnerships; clean handoff to Intake", "Own the full family journey through therapy start", "Only report ad spend"], answer: 0 },
      ],
      reflectionPrompt: "How will you apply \"Next 30-Day Plan\" as Marketing / BD — driving top-of-funnel and partnerships without stepping into Intake's execution?",
      checklist: [
        "I logged this in the correct tracker (CTM, referral, campaign, or event).",
        "I captured owner, source, next action, and follow-up date.",
        "I handed off cleanly to Intake with source and contact info when appropriate.",
      ],
    },
  ),
};
