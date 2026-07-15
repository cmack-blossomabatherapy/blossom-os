/**
 * Rich per-lesson content for the Training Academy lesson runtime.
 *
 * Content is keyed by `${moduleId}::${lessonId}` (moduleId is the fully
 * qualified academy id, e.g. `intake::intake-w1d1`). When no explicit
 * content exists we synthesize a structured lesson shell from the lesson
 * title/summary — every lesson click opens something useful, never a
 * dead card.
 *
 * Week 1 Day 1 Intake lessons are defined inline below. The rest of the
 * Intake journey (76 lessons across 19 days) is authored in
 * `./intakeLessonsFull.ts` and merged into the CONTENT record below.
 * The shell renders for any other lesson across every journey.
 */

import { INTAKE_LESSON_CONTENT } from "./intakeLessonsFull";
import { RECRUITING_LESSON_CONTENT } from "./recruitingLessonsFull";
import { AUTHORIZATIONS_LESSON_CONTENT } from "./authorizationsLessonsFull";

export interface LessonSection {
  heading: string;
  body: string;
}

export interface LessonQuizQuestion {
  q: string;
  options: string[];
  answer: number; // index into options
}

export interface LessonContent {
  objective: string;
  whyItMatters: string;
  sections: LessonSection[];
  examples?: { heading: string; body: string }[];
  commonMistakes?: string[];
  practiceActivity?: { prompt: string; guidance?: string };
  knowledgeCheck?: LessonQuizQuestion[];
  reflectionPrompt?: string;
  checklist?: string[];
}

export interface LessonMeta {
  id: string;
  title: string;
  summary: string;
  kind: string;
  minutes: number;
}

const CONTENT: Record<string, LessonContent> = {
  // ---- Intake · Week 1 Day 1 · Intake Role Orientation ----
  "intake::intake-w1d1::w1d1-l1": {
    objective:
      "Understand the current Intake responsibilities and what must happen before a lead can move forward.",
    whyItMatters:
      "Intake is the first operational trust point for families. If Intake is unclear, slow, or incomplete, every next team receives messy information.",
    sections: [
      {
        heading: "What Intake owns",
        body:
          "Intake owns the front end of the family journey — receiving leads, making first contact, gathering required family and child information, collecting insurance information, tracking forms and consents, cleaning up missing information, reviewing after-hours AI calls, and preparing clean VOB/benefits handoffs. Intake also owns keeping Monday updated today. Monday is the current shared source of truth for leads. If Monday is wrong, the team is wrong.",
      },
      {
        heading: "Step-by-step",
        body:
          "1) Open the assigned Intake lead queue.\n2) Confirm the lead has an owner.\n3) Confirm current status.\n4) Review the latest contact attempt and notes.\n5) Identify what is missing.\n6) Contact the family or route the next action.\n7) Update Monday with what happened.\n8) Set the next follow-up date.",
      },
    ],
    examples: [
      {
        heading: "What a good Monday note looks like",
        body:
          '"7/15 — Spoke with mom. Family is seeking in-home ABA in GA. Missing front/back insurance card and diagnosis report. Sent reminder email and text. Follow-up set for 7/17 if not received."',
      },
    ],
    commonMistakes: [
      "Updating the status without adding a note.",
      'Writing "called mom" without outcome.',
      "Forgetting the next follow-up date.",
      "Moving a lead forward with missing insurance or forms without approval.",
    ],
    practiceActivity: {
      prompt:
        'Write a Monday note for this scenario: "A parent answered your call. They are interested in ABA in Georgia. They have insurance but have not sent the card yet. They have a diagnosis report but need to email it."',
      guidance:
        "Include: what happened, what is missing, who owns the next step, and when follow-up will happen.",
    },
    knowledgeCheck: [
      {
        q: "What four things should every lead have?",
        options: [
          "Owner, status, next action, follow-up date",
          "Insurance, diagnosis, address, phone",
          "BCBA, RBT, schedule, authorization",
          "Lead source, campaign, ad set, medium",
        ],
        answer: 0,
      },
      {
        q: "Is Monday today's Intake source of truth?",
        options: ["Yes", "No"],
        answer: 0,
      },
      {
        q: "Should Intake collect insurance information?",
        options: ["Yes", "No — that is RCM only"],
        answer: 0,
      },
    ],
    reflectionPrompt: "Why does Intake accuracy matter to the next department?",
    checklist: [
      "I can explain what Intake owns.",
      "I can identify missing lead information.",
      "I can write a clear Monday note.",
      "I can set a next follow-up date.",
    ],
  },

  "intake::intake-w1d1::w1d1-l2": {
    objective:
      "Understand role boundaries so Intake supports the next step without taking over other departments.",
    whyItMatters:
      "When Intake promises things it does not own, families get confused and departments lose trust in the process.",
    sections: [
      {
        heading: "What Intake does not own",
        body:
          "Intake prepares clean information and moves the lead to the correct next step. Intake does NOT make final financial approval decisions, submit or manage authorizations independently, create schedules, staff cases, make clinical decisions, manage active cases, run QA review, or handle billing/payroll. Know enough about the next steps to explain the process clearly — but never promise outcomes outside the role.",
      },
      {
        heading: "Scenario",
        body:
          'A parent asks: "Are we approved and when can therapy start?"\n\nDo not say: "Yes, you should be approved and we can start soon."\n\nBetter: "I can help make sure your information is complete and ready for review. Once benefits are reviewed, the next team will confirm what services can move forward and what the next steps are."',
      },
    ],
    commonMistakes: [
      "Promising start dates.",
      "Telling a family they are approved before benefits/RCM review.",
      "Answering clinical questions that should go to a BCBA or Clinical leader.",
      "Sending a vague handoff to another department.",
    ],
    practiceActivity: {
      prompt:
        "For each item, name the correct owner: (1) Final benefits approval, (2) Authorization submission, (3) Clinical treatment question, (4) Missing insurance card, (5) First family contact.",
      guidance:
        "Expected: RCM/Finance · Authorizations · Clinical/BCBA · Intake · Intake.",
    },
    knowledgeCheck: [
      {
        q: "Does Intake own final financial approval?",
        options: ["Yes", "No"],
        answer: 1,
      },
      {
        q: "Does Intake own collecting information needed for benefits review?",
        options: ["Yes", "No"],
        answer: 0,
      },
      {
        q: "Should Intake answer clinical treatment questions?",
        options: ["Yes, whenever asked", "No — route to Clinical/BCBA"],
        answer: 1,
      },
    ],
    reflectionPrompt: "What is one thing Intake should never promise a family?",
    checklist: [
      "I can explain what Intake does not own.",
      "I can avoid overpromising.",
      "I can route questions to the right owner.",
    ],
  },

  "intake::intake-w1d1::w1d1-l3": {
    objective: "Learn how families should feel when working with Intake.",
    whyItMatters:
      "Families are often overwhelmed when reaching out for ABA services. A clear, warm Intake process helps them trust Blossom.",
    sections: [
      {
        heading: "The standard",
        body:
          "Families should feel guided, not chased. Every message should make it clear what is needed, why it is needed, and what happens next. Good Intake communication is warm, clear, specific, calm, helpful, and documented.",
      },
      {
        heading: "Do / don't",
        body:
          "Do: use the parent's name when possible; say exactly what is missing; explain the next step; set expectation for follow-up.\n\nDon't: use vague language; make families guess what to send; sound annoyed; leave the lead without documentation.",
      },
    ],
    examples: [
      {
        heading: "Bad message",
        body: '"Hi, need docs."',
      },
      {
        heading: "Better message",
        body:
          '"Hi Mrs. Cohen, this is Blossom ABA. We received your inquiry and are missing the front and back of your insurance card and your child\'s diagnosis report. You can reply here or send them by email. Once received, we can prepare the benefits review. I\'ll follow up again Thursday if I don\'t see them come through."',
      },
    ],
    commonMistakes: [
      "Vague language that leaves families guessing.",
      "Not naming the specific documents required.",
      "Skipping the next-step and follow-up expectation.",
      "Not documenting the interaction in Monday.",
    ],
    practiceActivity: {
      prompt:
        'Rewrite this message so it meets the family experience standard: "Please send forms. We can\'t move forward."',
    },
    knowledgeCheck: [
      {
        q: "Should families have to guess what is missing?",
        options: ["Yes", "No"],
        answer: 1,
      },
      {
        q: "Should every family contact be documented?",
        options: ["Yes", "No"],
        answer: 0,
      },
      {
        q: "A good message includes…",
        options: [
          "What is needed, why or next step, and follow-up expectation",
          "Just what is missing",
          "A greeting and a signature",
          "A calendar link",
        ],
        answer: 0,
      },
    ],
    reflectionPrompt: '"Guided, not chased." What does that mean in your own words?',
    checklist: [
      "I can write a warm family message.",
      "I can explain what is missing.",
      "I can document the interaction clearly.",
    ],
  },
};

export function getLessonContent(moduleId: string, lessonId: string): LessonContent | null {
  const key = `${moduleId}::${lessonId}`;
  return (
    CONTENT[key] ??
    INTAKE_LESSON_CONTENT[key] ??
    RECRUITING_LESSON_CONTENT[key] ??
    AUTHORIZATIONS_LESSON_CONTENT[key] ??
    null
  );
}

/**
 * Structured shell used when no rich content is authored yet — every lesson
 * click opens something useful. Uses the lesson's own title/summary so it
 * still reads specifically, not as generic filler.
 */
export function getLessonShell(meta: LessonMeta, moduleTitle: string): LessonContent {
  return {
    objective: `Understand "${meta.title}" and how it applies to your day-to-day work in ${moduleTitle}.`,
    whyItMatters:
      meta.summary ||
      "This lesson supports the operational standard for this module. Read carefully, then complete the practice activity below.",
    sections: [
      {
        heading: "Overview",
        body:
          meta.summary ||
          "Full lesson content is being finalized. Use the module SOPs and resources on the right to work through this lesson, then complete the checklist and knowledge check below.",
      },
      {
        heading: "How this fits into the module",
        body:
          `This lesson is part of the "${moduleTitle}" module. Complete it in order — each lesson builds on the previous one.`,
      },
    ],
    practiceActivity: {
      prompt: `In your own words, describe how "${meta.title}" shows up in your role today.`,
    },
    knowledgeCheck: [
      {
        q: `Do you feel confident applying "${meta.title}" in your work?`,
        options: ["Yes", "Not yet — I need to review with my mentor"],
        answer: 0,
      },
    ],
    reflectionPrompt: `What is one thing you'll do differently after completing "${meta.title}"?`,
    checklist: [
      `I understand "${meta.title}".`,
      "I know how to find the SOP or resource for this lesson.",
      "I can explain this to a mentor or teammate.",
    ],
  };
}