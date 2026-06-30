import type { PipelineStage } from "@/hooks/useRecruitingCandidates";

/**
 * Page-specific recruiting board stage keys map to canonical
 * `recruiting_candidates.pipeline_stage` values here. Returning `null`
 * means the board column is a sub-workflow that should NOT change the
 * candidate's canonical pipeline stage — only its child table row.
 *
 * This file exists to make sure page-only substages (offerReady,
 * bgPending, orientationReady, linkSent, etc.) are never written
 * directly into `pipeline_stage`.
 */

export type OffersStageKey =
  | "offerReady" | "offerSent" | "awaitingSig" | "offerSigned"
  | "viventiumSetup" | "onboardingStarted" | "onboardingComplete"
  | "bgPending" | "orientation" | "staffingReady";

export type BackgroundStageKey =
  | "needsSubmission" | "linkSent" | "notStarted" | "initiated"
  | "pending" | "flagged" | "cleared" | "orientationReady";

export type OrientationStageKey =
  | "waitingReadiness" | "readyForOrientation" | "linkSent" | "scheduled"
  | "today" | "attendancePending" | "complete" | "staffingReady" | "blocked";

export type OnboardingStageKey =
  | "offerSigned" | "viventiumSetup" | "onboardingSent" | "onboardingProgress"
  | "missingDocs" | "onboardingComplete" | "addOrientationBoard"
  | "bgNeeded" | "bgPending" | "orientationReady";

export type InterviewStageKey =
  | "needsSchedule" | "linkSent" | "scheduled" | "confirmed" | "completed"
  | "needsDecision" | "offerRec" | "notMoving" | "noShow";

export type RbtStageKey =
  | "newApplicant" | "needsReview" | "bacbVerification" | "interviewReady"
  | "interviewed" | "offerSent" | "onboarding" | "backgroundCheck"
  | "orientationReady" | "staffingReady";

export type BcbaStageKey =
  | "newApplicant" | "needsReview" | "interviewReady" | "interviewed"
  | "offerSent" | "onboarding" | "backgroundCheck" | "orientationReady"
  | "coordination" | "staffingReady";

export type StaffingNeedStageKey =
  | "new" | "review" | "active" | "matchAvail" | "orientation"
  | "coordination" | "confirmed" | "escalated" | "highRisk";

/** Offers board → canonical candidate pipeline (or null = sub-workflow only). */
export function mapOffersStageToCanonical(key: OffersStageKey): PipelineStage | null {
  switch (key) {
    case "offerReady":          return null;            // pre-send, no candidate pipeline change
    case "offerSent":           return "Offer Sent";
    case "awaitingSig":         return "Offer Sent";
    case "offerSigned":         return "Offer Accepted";
    case "viventiumSetup":      return "Onboarding";
    case "onboardingStarted":   return "Onboarding";
    case "onboardingComplete":  return "Onboarding";
    case "bgPending":           return "Background Check";
    case "orientation":         return "Orientation Scheduled";
    case "staffingReady":       return "Ready to Staff";
  }
}

export function mapBackgroundStageToCanonical(key: BackgroundStageKey): PipelineStage | null {
  switch (key) {
    case "needsSubmission":   return "Background Check";
    case "linkSent":          return "Background Check";
    case "notStarted":        return "Background Check";
    case "initiated":         return "Background Check";
    case "pending":           return "Background Check";
    case "flagged":           return "On Hold";
    case "cleared":           return "Background Check";
    case "orientationReady":  return "Orientation Scheduled";
  }
}

export function mapOrientationStageToCanonical(key: OrientationStageKey): PipelineStage | null {
  switch (key) {
    case "waitingReadiness":      return null;
    case "readyForOrientation":   return "Orientation Scheduled";
    case "linkSent":              return "Orientation Scheduled";
    case "scheduled":             return "Orientation Scheduled";
    case "today":                 return "Orientation Scheduled";
    case "attendancePending":     return "Orientation Scheduled";
    case "complete":              return "Ready to Staff";
    case "staffingReady":         return "Ready to Staff";
    case "blocked":               return "On Hold";
  }
}

export function mapOnboardingStageToCanonical(key: OnboardingStageKey): PipelineStage | null {
  switch (key) {
    case "offerSigned":          return "Offer Accepted";
    case "viventiumSetup":       return "Onboarding";
    case "onboardingSent":       return "Onboarding";
    case "onboardingProgress":   return "Onboarding";
    case "missingDocs":          return "Onboarding";
    case "onboardingComplete":   return "Onboarding";
    case "addOrientationBoard":  return "Orientation Scheduled";
    case "bgNeeded":             return "Background Check";
    case "bgPending":            return "Background Check";
    case "orientationReady":     return "Orientation Scheduled";
  }
}

export function mapInterviewStageToCanonical(key: InterviewStageKey): PipelineStage | null {
  switch (key) {
    case "needsSchedule":  return "Phone Screen";
    case "linkSent":       return "Phone Screen";
    case "scheduled":      return "Interview Scheduled";
    case "confirmed":      return "Interview Scheduled";
    case "completed":      return "Interview Complete";
    case "needsDecision":  return "Interview Complete";
    case "offerRec":       return "Interview Complete";
    case "notMoving":      return "Rejected";
    case "noShow":         return "Interview Complete";
  }
}

export function mapRbtStageToCanonical(key: RbtStageKey): PipelineStage | null {
  switch (key) {
    case "newApplicant":       return "New Applicant";
    case "needsReview":        return "Phone Screen";
    case "bacbVerification":   return "Phone Screen";
    case "interviewReady":     return "Interview Scheduled";
    case "interviewed":        return "Interview Complete";
    case "offerSent":          return "Offer Sent";
    case "onboarding":         return "Onboarding";
    case "backgroundCheck":    return "Background Check";
    case "orientationReady":   return "Orientation Scheduled";
    case "staffingReady":      return "Ready to Staff";
  }
}

export function mapBcbaStageToCanonical(key: BcbaStageKey): PipelineStage | null {
  switch (key) {
    case "newApplicant":       return "New Applicant";
    case "needsReview":        return "Phone Screen";
    case "interviewReady":     return "Interview Scheduled";
    case "interviewed":        return "Interview Complete";
    case "offerSent":          return "Offer Sent";
    case "onboarding":         return "Onboarding";
    case "backgroundCheck":    return "Background Check";
    case "orientationReady":   return "Orientation Scheduled";
    case "coordination":       return "Ready to Staff";
    case "staffingReady":      return "Ready to Staff";
  }
}

/**
 * Run a board stage move safely. Writes a child-table side effect when
 * appropriate, then updates the canonical candidate pipeline stage only
 * with a real PipelineStage value (never a page substage key).
 */
export async function runPageStageMove(
  mutations: {
    moveStage: (id: string, stage: PipelineStage) => unknown;
    upsertOfferForCandidate?: (id: string, data: Record<string, unknown>) => unknown;
    sendOfferInternal?: (id: string, data: Record<string, unknown>) => unknown;
    upsertBackgroundForCandidate?: (id: string, data: Record<string, unknown>) => unknown;
    startBackgroundCheck?: (id: string, vendor?: string, notes?: string) => unknown;
    upsertOrientationForCandidate?: (id: string, data: Record<string, unknown>) => unknown;
    ensureDefaultOnboardingTasks?: (id: string) => unknown;
  },
  page: "offers" | "background" | "orientation" | "onboarding" | "interviews" | "rbt" | "bcba",
  candidateId: string,
  pageStage: string,
): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(candidateId)) return;

  let canonical: PipelineStage | null = null;
  try {
    switch (page) {
      case "offers":      canonical = mapOffersStageToCanonical(pageStage as OffersStageKey); break;
      case "background":  canonical = mapBackgroundStageToCanonical(pageStage as BackgroundStageKey); break;
      case "orientation": canonical = mapOrientationStageToCanonical(pageStage as OrientationStageKey); break;
      case "onboarding":  canonical = mapOnboardingStageToCanonical(pageStage as OnboardingStageKey); break;
      case "interviews":  canonical = mapInterviewStageToCanonical(pageStage as InterviewStageKey); break;
      case "rbt":         canonical = mapRbtStageToCanonical(pageStage as RbtStageKey); break;
      case "bcba":        canonical = mapBcbaStageToCanonical(pageStage as BcbaStageKey); break;
    }
  } catch {
    canonical = null;
  }

  // Side effects on the right child table
  try {
    if (page === "offers") {
      if (pageStage === "offerReady" && mutations.upsertOfferForCandidate) {
        await mutations.upsertOfferForCandidate(candidateId, { status: "Draft" });
      } else if ((pageStage === "offerSent" || pageStage === "awaitingSig") && mutations.sendOfferInternal) {
        await mutations.sendOfferInternal(candidateId, {});
      } else if (pageStage === "viventiumSetup" && mutations.ensureDefaultOnboardingTasks) {
        await mutations.ensureDefaultOnboardingTasks(candidateId);
      } else if (pageStage === "bgPending" && mutations.upsertBackgroundForCandidate) {
        await mutations.upsertBackgroundForCandidate(candidateId, {});
      } else if (pageStage === "orientation" && mutations.upsertOrientationForCandidate) {
        await mutations.upsertOrientationForCandidate(candidateId, {});
      }
    } else if (page === "background") {
      if (pageStage === "initiated" && mutations.startBackgroundCheck) {
        await mutations.startBackgroundCheck(candidateId);
      } else if (mutations.upsertBackgroundForCandidate) {
        await mutations.upsertBackgroundForCandidate(candidateId, {});
      }
    } else if (page === "orientation" && mutations.upsertOrientationForCandidate) {
      await mutations.upsertOrientationForCandidate(candidateId, {});
    } else if (page === "onboarding" && mutations.ensureDefaultOnboardingTasks &&
               (pageStage === "viventiumSetup" || pageStage === "onboardingSent")) {
      await mutations.ensureDefaultOnboardingTasks(candidateId);
    }
  } catch (e) {
    console.warn("page stage side-effect failed", e);
  }

  if (canonical) {
    await mutations.moveStage(candidateId, canonical);
  }
}