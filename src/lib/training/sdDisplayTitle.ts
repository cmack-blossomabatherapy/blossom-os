/**
 * Display-title helpers for State Director learner-facing labels.
 *
 * Internal IDs (sd-w1d1-mission-vision) and DB titles (e.g.
 * "01 W1D2 Company Structure Understanding ... SOP") stay untouched.
 * These helpers only sanitize the visible string so learners see
 * warm names like "Mission & Vision" instead of "W1-D1 — Mission & Vision".
 */

const PREFIX_RE = /^\s*(?:\d{1,3}\s+)?W[1-5]\s*[·\-–—]?\s*D[1-7](?:\b|[^a-zA-Z0-9])\s*[—–\-:·.|]*\s*/i;
const LEADING_NUMBER_RE = /^\s*\d{1,3}\s+(?=[A-Z])/;

export function cleanSdTitle(title: string | null | undefined): string {
  if (!title) return "";
  let t = String(title);
  // Strip W#D# / W#-D# / W# · D# (with optional leading "01 " ordering number)
  if (PREFIX_RE.test(t)) {
    t = t.replace(PREFIX_RE, "");
  } else {
    // Drop any leading numeric ordering prefix like "01 " too.
    t = t.replace(LEADING_NUMBER_RE, "");
  }
  return t.trim();
}

/** Friendly contextual chip like "Week 1 · Day 1" from an SD module id. */
export function sdWeekDayChip(id?: string | null): string | null {
  if (!id) return null;
  const m = /sd-w(\d+)d(\d+)-/i.exec(id);
  return m ? `Week ${m[1]} · Day ${m[2]}` : null;
}
