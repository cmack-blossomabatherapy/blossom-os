import { supabase } from "@/integrations/supabase/client";

/**
 * "Remember me" support on top of the default localStorage-backed Supabase client.
 *
 * Strategy:
 *  - When the user signs in with "Remember me" CHECKED, we store
 *    `blossom.remember = "1"` in localStorage. Sessions persist across
 *    browser restarts as normal.
 *  - When CHECKED is OFF, we store `blossom.remember = "0"` and place a
 *    sessionStorage marker `blossom.session-active = "1"`. sessionStorage is
 *    automatically cleared when the browser process closes, so on the next
 *    cold start we detect the missing marker and force a sign-out before
 *    the rest of the app boots.
 *
 * This keeps tokens out of disk-only storage for shared/kiosk devices while
 * still allowing tab refreshes to keep the user logged in.
 */

const REMEMBER_KEY = "blossom.remember";
const SESSION_ACTIVE_KEY = "blossom.session-active";

export function setRememberPreference(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    if (remember) {
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    } else {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
    }
  } catch {
    /* storage unavailable — fall back to default persistence */
  }
}

export function getRememberPreference(): boolean {
  try {
    // Default to "remembered" when no preference exists.
    return localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
}

export function clearRememberPreference() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Call once before restoring the Supabase session. If the user previously
 * opted out of "Remember me" and this is a fresh browser session
 * (sessionStorage marker missing), wipe the persisted session.
 */
export async function enforceRememberPolicyOnBoot(): Promise<void> {
  try {
    const remember = localStorage.getItem(REMEMBER_KEY);
    if (remember !== "0") return;
    const active = sessionStorage.getItem(SESSION_ACTIVE_KEY);
    if (active === "1") return;
    // Cold start without an active tab marker → drop the stored session.
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}

/** Refresh the in-tab activity marker on every load when remember=off. */
export function touchSessionMarker() {
  try {
    if (localStorage.getItem(REMEMBER_KEY) === "0") {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}