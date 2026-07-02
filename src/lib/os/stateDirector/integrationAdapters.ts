/**
 * Integration adapter contracts for the State Director operating layer.
 *
 * These are typed contracts only — no live network calls. Each adapter maps
 * a source system into the shapes defined in `types.ts` so downstream UI
 * always reads from a normalized model. Wire real fetchers when the
 * integrations are connected; until then they return empty results and the
 * seed dataset carries the UI.
 */

import type { StateCode, StateMetrics } from "./types";

export interface CentralReachClinicalFeed {
  fetchStateMetrics(state: StateCode): Promise<Partial<StateMetrics>>;
}

export interface CtmPhoneFeed {
  fetchStateCallSummary(state: StateCode): Promise<{
    totalCalls: number; missedCalls: number; avgHandleSec: number;
  }>;
}

export interface ApploiRecruitingFeed {
  fetchRecruitingPipeline(state: StateCode): Promise<{
    newApplicants: number; interviewed: number; offersOut: number;
  }>;
}

export interface BloomGrowthAccountabilityFeed {
  fetchL10Items(state: StateCode): Promise<{ open: number; overdue: number }>;
}

/** Placeholder implementations — return neutral data so the UI does not crash
 *  when a caller tries to compose them. Swap when integrations go live. */
export const stubCentralReach: CentralReachClinicalFeed = {
  async fetchStateMetrics() { return {}; },
};
export const stubCtm: CtmPhoneFeed = {
  async fetchStateCallSummary() { return { totalCalls: 0, missedCalls: 0, avgHandleSec: 0 }; },
};
export const stubApploi: ApploiRecruitingFeed = {
  async fetchRecruitingPipeline() { return { newApplicants: 0, interviewed: 0, offersOut: 0 }; },
};
export const stubBloomGrowth: BloomGrowthAccountabilityFeed = {
  async fetchL10Items() { return { open: 0, overdue: 0 }; },
};