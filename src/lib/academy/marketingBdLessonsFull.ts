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
};
