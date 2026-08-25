/**
 * Phase 2A — Cancellation Command Center calculation tests.
 *
 * These lock the operational truth rules: explicit CentralReach flags win,
 * deleted events never count, undocumented reasons stay undocumented, and
 * hours fall back to the exported scheduled duration when clock times are
 * missing (which is the case for the live curated view today).
 */
import { describe, it, expect } from "vitest";
import {
  cancellationTruth,
  eventDurationHours,
  isActiveEvent,
  isCancelledEventStrict,
  isCountableEvent,
  isDeletedEvent,
  cleanReasonText,
  dayOfWeekLabel,
  scheduleTruthCoverage,
} from "@/lib/os/reports/crPrimary/scheduleTruth";
import {
  NOT_DOCUMENTED,
  cancellationReasonBucket,
  computeCancellationCenter,
  eventCode,
  type CancellationCenterRow,
} from "@/lib/os/reports/crPrimary/metrics/cancellationCenter";

const row = (over: Partial<CancellationCenterRow> = {}): CancellationCenterRow => ({
  event_date: "2026-01-05",
  scheduled_hours: 2,
  client_name: "Client A",
  provider_name: "Provider A",
  state: "GA",
  payor: "Aetna",
  service_code: "97153",
  ...over,
});

describe("scheduleTruth — explicit flags win", () => {
  it("trusts cancelled=false even when the status text says cancelled", () => {
    const t = cancellationTruth(row({ cancelled: false, status: "Cancelled by client" }));
    expect(t).toEqual({ cancelled: false, source: "explicit_flag" });
    expect(isCancelledEventStrict(row({ cancelled: false, status: "Cancelled" }))).toBe(false);
  });

  it("infers from attendance, then status, then documented reason", () => {
    expect(cancellationTruth(row({ attendance: "No Show" })).source).toBe("attendance_text");
    expect(cancellationTruth(row({ status: "Cancelled" })).source).toBe("status_text");
    expect(cancellationTruth(row({ cancellation_reason: "Client sick" })).source).toBe(
      "reason_text",
    );
    expect(cancellationTruth(row()).cancelled).toBe(false);
  });

  it("never counts a deleted event as cancelled, active, or countable", () => {
    const deleted = row({ deleted: true, cancelled: true });
    expect(isDeletedEvent(deleted)).toBe(true);
    expect(isCancelledEventStrict(deleted)).toBe(false);
    expect(isActiveEvent(deleted)).toBe(false);
    expect(isCountableEvent(deleted)).toBe(false);
  });

  it("treats CentralReach text placeholders as not documented", () => {
    for (const v of ["0", "false", "N/A", "none", "-", "  "]) {
      expect(cleanReasonText(v)).toBeNull();
    }
    expect(cleanReasonText("Client sick")).toBe("Client sick");
  });
});

describe("scheduleTruth — durations and dates", () => {
  it("prefers wall-clock start/end and falls back to scheduled hours", () => {
    expect(eventDurationHours(row({ start_time: "09:00", end_time: "11:30" }))).toBe(2.5);
    expect(eventDurationHours(row({ start_time: "1:00 pm", end_time: "2:00 pm" }))).toBe(1);
    // Null clock times (the live curated view today) → exported hours.
    expect(eventDurationHours(row({ start_time: null, end_time: null, scheduled_hours: 3.25 }))).toBe(
      3.25,
    );
    // Non-positive span is ignored rather than producing negative hours.
    expect(eventDurationHours(row({ start_time: "11:00", end_time: "09:00" }))).toBe(2);
    expect(eventDurationHours(row({ scheduled_hours: null }))).toBe(0);
  });

  it("labels weekdays Monday-first in UTC", () => {
    expect(dayOfWeekLabel("2026-01-05")).toBe("Monday");
    expect(dayOfWeekLabel("2026-01-11")).toBe("Sunday");
    expect(dayOfWeekLabel("garbage")).toBeNull();
  });

  it("describes truth coverage in plain language", () => {
    expect(scheduleTruthCoverage([]).mode).toBe("empty");
    expect(scheduleTruthCoverage([row({ cancelled: true })]).mode).toBe("explicit");
    expect(scheduleTruthCoverage([row()]).mode).toBe("inferred");
    const mixed = scheduleTruthCoverage([row({ cancelled: true }), row()]);
    expect(mixed.mode).toBe("mixed");
    expect(mixed.explicitPct).toBe(50);
    expect(mixed.label).toContain("50%");
  });
});

describe("cancellationReasonBucket", () => {
  it("keeps undocumented cancellations out of Other", () => {
    expect(cancellationReasonBucket(row({ cancelled: true }))).toBe(NOT_DOCUMENTED);
    expect(cancellationReasonBucket(row({ cancelled: true, cancellation_reason: "0" }))).toBe(
      NOT_DOCUMENTED,
    );
  });

  it("classifies a no-show with no reason text as No Show", () => {
    expect(cancellationReasonBucket(row({ attendance: "No Show" }))).toBe("No Show");
  });

  it("maps documented reason text into a shared reason bucket", () => {
    expect(cancellationReasonBucket(row({ cancellation_reason: "Client illness" }))).toBe("Illness");
  });

  it("resolves a service code from the first usable column", () => {
    expect(eventCode(row({ service_code: null, procedure_code: "97155" }))).toBe("97155");
    expect(eventCode(row({ service_code: null, procedure_code: null }))).toBe("Unknown code");
  });
});

describe("computeCancellationCenter", () => {
  const dataset: CancellationCenterRow[] = [
    row({ cancelled: false }),
    row({ cancelled: false, client_name: "Client B" }),
    row({ cancelled: true, cancellation_reason: "Client sick", event_date: "2026-01-06" }),
    row({ cancelled: true, attendance: "No Show", event_date: "2026-01-07" }),
    row({ cancelled: true, event_date: "2026-01-08" }),
    row({ cancelled: true, deleted: true, event_date: "2026-01-09" }),
  ];

  const m = computeCancellationCenter(dataset);

  it("excludes deleted rows from the denominator and the numerator", () => {
    expect(m.loadedEvents).toBe(6);
    expect(m.deletedEvents).toBe(1);
    expect(m.activeScheduleEvents).toBe(5);
    expect(m.cancelledEvents).toBe(3);
    expect(m.keptEvents).toBe(2);
  });

  it("computes rate, hours, and no-shows from countable rows only", () => {
    expect(m.cancellationRate).toBe(60);
    expect(m.cancelledHours).toBe(6);
    expect(m.keptHours).toBe(4);
    expect(m.noShowEvents).toBe(1);
  });

  it("counts undocumented reasons explicitly", () => {
    expect(m.undocumentedReasons).toBe(1);
    expect(m.documentedReasons).toBe(2);
    expect(m.byReason.some((g) => g.name === NOT_DOCUMENTED)).toBe(true);
  });

  it("returns no metrics rather than fake zeros when there is no data", () => {
    const empty = computeCancellationCenter([]);
    expect(empty.cancellationRate).toBeNull();
    expect(empty.documentedPct).toBeNull();
    expect(empty.topReason).toBeNull();
    expect(empty.followUps).toEqual([]);
    expect(empty.truth.mode).toBe("empty");
  });

  it("queues only clients with repeat cancellations, with a plain-language reason", () => {
    expect(m.followUps).toHaveLength(1);
    expect(m.followUps[0].client).toBe("Client A");
    expect(m.followUps[0].cancellations).toBe(3);
    expect(m.followUps[0].reason).toBe("1 cancellation without a documented reason");
    // Client B has zero cancellations, so it never enters the queue.
    expect(m.followUps.some((f) => f.client === "Client B")).toBe(false);

    const single = computeCancellationCenter([
      row({ cancelled: true }),
      row({ cancelled: false }),
    ]);
    expect(single.followUps).toEqual([]);

    const repeat = computeCancellationCenter([
      row({ cancelled: true, event_date: "2026-01-06" }),
      row({ cancelled: true, event_date: "2026-01-20" }),
    ]);
    expect(repeat.followUps).toHaveLength(1);
    expect(repeat.followUps[0].cancellations).toBe(2);
    expect(repeat.followUps[0].weeksAffected).toBe(2);
    expect(repeat.followUps[0].lastCancellation).toBe("2026-01-20");
  });

  it("compares against a prior window when one is supplied", () => {
    const withPrev = computeCancellationCenter(dataset, {
      previous: [row({ cancelled: true }), row({ cancelled: false }), row({ cancelled: false }), row({ cancelled: false })],
    });
    expect(withPrev.comparison).not.toBeNull();
    expect(withPrev.comparison!.previousCancellations).toBe(1);
    expect(withPrev.comparison!.previousRate).toBe(25);
    expect(withPrev.comparison!.rateDelta).toBe(35);
    expect(withPrev.comparison!.countDelta).toBe(2);
    expect(computeCancellationCenter(dataset).comparison).toBeNull();
  });

  it("keeps weekday buckets in Monday-first order", () => {
    const labels = m.byDayOfWeek.map((d) => d.label);
    expect(labels[0]).toBe("Monday");
    expect(labels).toEqual([...labels].filter(Boolean));
  });
});

describe("reason text is never a cancellation truth source", () => {
  it("does not treat a documented reason alone as a cancellation", () => {
    const m = computeCancellationCenter([
      row({ cancelled: null, cancellation_reason: "Client sick" }),
    ]);
    expect(m.activeScheduleEvents).toBe(1);
    expect(m.cancelledEvents).toBe(0);
    expect(m.keptEvents).toBe(1);
    expect(m.cancellationRate).toBe(0);
  });

  it("still allows legacy status / attendance text as a fallback", () => {
    const viaStatus = computeCancellationCenter([row({ cancelled: null, status: "Cancelled" })]);
    const viaAttendance = computeCancellationCenter([
      row({ cancelled: null, attendance: "No Show" }),
    ]);
    expect(viaStatus.cancelledEvents).toBe(1);
    expect(viaAttendance.cancelledEvents).toBe(1);
  });

  it("lets an explicit false flag win over cancellation-looking status text", () => {
    const m = computeCancellationCenter([row({ cancelled: false, status: "Cancelled" })]);
    expect(m.cancelledEvents).toBe(0);
  });
});

describe("reconciliation control: 3,568 active / 748 cancelled / 2,422 cancelled hours", () => {
  const fixture: CancellationCenterRow[] = [];
  let day = 0;
  const nextDate = () => {
    day += 1;
    const d = new Date(Date.UTC(2026, 0, 1) + (day % 90) * 86_400_000);
    return d.toISOString().slice(0, 10);
  };
  // 178 four-hour cancellations + 570 three-hour cancellations = 2,422 hours.
  for (let i = 0; i < 178; i += 1) {
    fixture.push(
      row({ cancelled: true, scheduled_hours: 4, event_date: nextDate(), client_name: `C${i % 40}` }),
    );
  }
  for (let i = 0; i < 570; i += 1) {
    fixture.push(
      row({ cancelled: true, scheduled_hours: 3, event_date: nextDate(), client_name: `C${i % 40}` }),
    );
  }
  // Kept events to reach 3,568 nondeleted events.
  for (let i = 0; i < 3568 - 748; i += 1) {
    fixture.push(
      row({ cancelled: false, scheduled_hours: 2, event_date: nextDate(), client_name: `C${i % 40}` }),
    );
  }
  // Deleted noise must never move any number.
  for (let i = 0; i < 120; i += 1) {
    fixture.push(row({ cancelled: true, deleted: true, scheduled_hours: 5, event_date: nextDate() }));
  }

  const m = computeCancellationCenter(fixture);

  it("matches the control totals exactly", () => {
    expect(m.activeScheduleEvents).toBe(3568);
    expect(m.cancelledEvents).toBe(748);
    expect(m.keptEvents).toBe(2820);
    expect(m.cancelledHours).toBe(2422);
    expect(m.deletedEvents).toBe(120);
    expect(Number(m.cancellationRate!.toFixed(1))).toBe(21.0);
  });

  it("emits an event-level follow-up row per cancelled event", () => {
    expect(m.followUpEvents).toHaveLength(748);
    for (const e of m.followUpEvents.slice(0, 5)) {
      expect(e.client).toBeTruthy();
      expect(e.eventDate).toBeTruthy();
      expect(e.cancelledHours).toBeGreaterThan(0);
      expect(e.action).toBeTruthy();
    }
  });
});
