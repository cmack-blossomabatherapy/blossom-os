import { createContext, useContext } from "react";
import type { UseRbtWalkthrough } from "@/lib/rbt/walkthrough";

/**
 * Context surface consumers use to open/close the RBT walkthrough. The
 * shell mounts the provider (see RbtWalkthroughProvider) and Home /
 * Learn / Me expose a "Take the tour" replay button.
 *
 * When no provider is present (e.g. tests, non-RBT surfaces) the hook
 * returns a safe no-op with available=false so replay buttons render
 * disabled rather than crashing.
 */
export interface RbtWalkthroughContextValue {
  available: boolean;
  controller: UseRbtWalkthrough | null;
  openTour: () => void;
}

export const RbtWalkthroughContext = createContext<RbtWalkthroughContextValue>({
  available: false,
  controller: null,
  openTour: () => {},
});

export function useRbtWalkthrough(): RbtWalkthroughContextValue {
  return useContext(RbtWalkthroughContext);
}
