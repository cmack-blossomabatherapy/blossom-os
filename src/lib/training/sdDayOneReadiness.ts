/**
 * State Director — Day-One Readiness model.
 *
 * Tracks the small set of evidence signals a new State Director needs to
 * leave behind on their first day so a mentor or admin can tell they had a
 * real first day — not just "logged in".
 *
 * Storage:
 *   - Backend persistence is not wired yet for these reflection signals.
 *   - We persist toggles to localStorage so refreshing the page does not
 *     lose the learner's check marks within their own device. The learner
 *     panel makes it clear this is "saved on this device" — not synced.
 */

export type SdDayOneItemId =
  | "welcome-reviewed"
  | "mission-in-own-words"
  | "value-to-model"
  | "leadership-letter-takeaway"
  | "mentor-check-in"
  | "access-blockers-cleared";

export interface SdDayOneItem {
  id: SdDayOneItemId;
  label: string;
  helper: string;
}

export const SD_DAY_ONE_ITEMS: SdDayOneItem[] = [
  {
    id: "welcome-reviewed",
    label: "Welcome to Blossom reviewed",
    helper: "Opened /training/welcome and read both leadership letters.",
  },
  {
    id: "mission-in-own-words",
    label: "Mission in my own words",
    helper: "One sentence that explains what Blossom is here to do.",
  },
  {
    id: "value-to-model",
    label: "One value I will model",
    helper: "Pick the core value you will use to lead your first 30 days.",
  },
  {
    id: "leadership-letter-takeaway",
    label: "Leadership-letter takeaway",
    helper: "Bring one line from Chad or Shira to your first mentor check-in.",
  },
  {
    id: "mentor-check-in",
    label: "Mentor check-in scheduled or completed",
    helper: "Confirm time on the calendar or note when it happened.",
  },
  {
    id: "access-blockers-cleared",
    label: "No access blockers",
    helper: "Email, calendar, CR, Viventium, and Blossom OS all open.",
  },
];

const STORAGE_KEY = "blossom.sdDayOneReadiness.v1";

export function loadSdDayOneState(): Record<SdDayOneItemId, boolean> {
  const empty: Record<SdDayOneItemId, boolean> = {
    "welcome-reviewed": false,
    "mission-in-own-words": false,
    "value-to-model": false,
    "leadership-letter-takeaway": false,
    "mentor-check-in": false,
    "access-blockers-cleared": false,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Record<SdDayOneItemId, boolean>>;
    return { ...empty, ...parsed };
  } catch {
    return empty;
  }
}

export function saveSdDayOneState(state: Record<SdDayOneItemId, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode failures */
  }
}