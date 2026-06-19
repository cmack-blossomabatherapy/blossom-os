/**
 * BCBA Training curriculum — shared adapter file.
 *
 * The canonical BCBA module data is currently authored inside
 * `src/pages/training/BCBAJourney.tsx`. This file re-exports that data under
 * stable BCBA_* names so the unified Training Academy adapter
 * (`src/lib/academy/journeyContent.ts`) can consume it without coupling to a
 * page file. The legacy /bcba/training-academy page keeps using its own copy.
 */
export { modules as BCBA_MODULES } from "@/pages/training/BCBAJourney";
export type { Module as BCBAModule, Lesson as BCBALesson, Phase as BCBAPhase, LessonKind as BCBALessonKind } from "@/pages/training/BCBAJourney";