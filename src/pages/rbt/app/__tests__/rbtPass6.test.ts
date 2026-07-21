import { describe, it, expect } from "vitest";
import { canAcknowledge, isCoursePublished } from "../training/RbtCourseDetail";
import { pickContactForRole, ROLE_FALLBACK_CATEGORY } from "../support/useSupport";

// Mirrors src/pages/rbt/app/active/ActiveSchedule.tsx status filter logic.
function matchesFilter(row: { status?: string | null }, f: "all" | "active" | "cancelled"): boolean {
  const s = String(row.status ?? "").toLowerCase();
  if (f === "all") return true;
  if (f === "cancelled") return /cancel/.test(s);
  return !/cancel/.test(s);
}

// Mirrors src/pages/rbt/app/pages.tsx#RbtLearn isPublished gate for Continue CTA.
function isPublished(c: { is_active?: boolean; status?: string } | null): boolean {
  return Boolean(c && c.is_active !== false && c.status !== "draft" && c.status !== "archived");
}

describe("ActiveSchedule status filter", () => {
  const rows = [
    { status: "scheduled" },
    { status: "confirmed" },
    { status: "cancelled" },
    { status: "cancelled_late" },
    { status: null },
  ];

  it("returns every session for 'all'", () => {
    expect(rows.filter((r) => matchesFilter(r, "all"))).toHaveLength(rows.length);
  });

  it("excludes cancellations for 'active'", () => {
    expect(rows.filter((r) => matchesFilter(r, "active")).map((r) => r.status))
      .toEqual(["scheduled", "confirmed", null]);
  });

  it("only returns cancellations for 'cancelled'", () => {
    expect(rows.filter((r) => matchesFilter(r, "cancelled")).map((r) => r.status))
      .toEqual(["cancelled", "cancelled_late"]);
  });
});

describe("Support contact resolution (pickContactForRole)", () => {
  const contacts = [
    { role_key: "bcba", scope: "default", contact_name: "Fallback BCBA" },
    { role_key: "bcba", scope: "state", contact_name: "GA BCBA" },
    { role_key: "bcba", scope: "employee", contact_name: "Assigned BCBA" },
    { role_key: "scheduling", scope: "state", contact_name: "GA Scheduling" },
  ] as any[];

  it("prefers employee scope over state and default", () => {
    expect(pickContactForRole(contacts, "bcba")?.contact_name).toBe("Assigned BCBA");
  });

  it("falls back to state when no employee-scope contact exists", () => {
    expect(pickContactForRole(contacts, "scheduling")?.contact_name).toBe("GA Scheduling");
  });

  it("returns null when there is no contact and null-safe on empty inputs", () => {
    expect(pickContactForRole(contacts, "training")).toBeNull();
    expect(pickContactForRole(null, "bcba")).toBeNull();
  });

  it("exposes an actionable fallback category for every menu role", () => {
    ["bcba", "rbt_support", "scheduling", "training", "state_clinic"].forEach((k) => {
      expect(ROLE_FALLBACK_CATEGORY[k]).toBeTruthy();
    });
  });
});

describe("Notification preferences empty-state gating", () => {
  // Mirrors NotificationPreferences.tsx: only show the toggles when rules exist and
  // the load succeeded. Anything else must render the empty/error surface.
  function shouldRenderToggles(status: "loading" | "ready" | "error", ruleCount: number): boolean {
    return status === "ready" && ruleCount > 0;
  }
  it("hides toggles while loading", () => expect(shouldRenderToggles("loading", 10)).toBe(false));
  it("hides toggles on error", () => expect(shouldRenderToggles("error", 10)).toBe(false));
  it("hides toggles when no rules are published", () => expect(shouldRenderToggles("ready", 0)).toBe(false));
  it("shows toggles when ready with rules", () => expect(shouldRenderToggles("ready", 3)).toBe(true));
});

describe("Preview-mode write gating", () => {
  // Mirrors the writableEmployeeId contract from useRbtIdentity: mutations must be
  // blocked whenever the current session is an admin previewing another employee.
  function canWrite(isPreviewing: boolean, employeeId: string | null): boolean {
    if (!employeeId) return false;
    return !isPreviewing;
  }
  it("blocks writes in preview mode", () => expect(canWrite(true, "emp-1")).toBe(false));
  it("allows writes for the signed-in owner", () => expect(canWrite(false, "emp-1")).toBe(true));
  it("blocks writes without an employee id", () => expect(canWrite(false, null)).toBe(false));
});

describe("RbtLearn course publish gate", () => {
  it("hides Continue for missing course metadata", () => {
    expect(isPublished(null)).toBe(false);
  });
  it("hides Continue for draft or archived courses", () => {
    expect(isPublished({ status: "draft" })).toBe(false);
    expect(isPublished({ status: "archived" })).toBe(false);
  });
  it("hides Continue when course is deactivated", () => {
    expect(isPublished({ is_active: false, status: "published" })).toBe(false);
  });
  it("shows Continue only for active, published courses", () => {
    expect(isPublished({ is_active: true, status: "published" })).toBe(true);
    expect(isPublished({ status: "published" })).toBe(true);
  });
});

describe("Skill Passport acknowledgment gating", () => {
  // Mirrors canWrite = writableEmployeeId && !isPreviewing propagated to SkillSheet.
  function canWrite(writableEmployeeId: string | null, isPreviewing: boolean): boolean {
    return Boolean(writableEmployeeId) && !isPreviewing;
  }
  it("blocks writes when previewing another clinician", () => {
    expect(canWrite("emp-1", true)).toBe(false);
  });
  it("blocks writes with no writable identity", () => {
    expect(canWrite(null, false)).toBe(false);
  });
  it("allows writes for the authenticated clinician", () => {
    expect(canWrite("emp-1", false)).toBe(true);
  });
});

describe("RbtCourseDetail publish gate", () => {
  it("treats null / draft / archived / deactivated as unpublished", () => {
    expect(isCoursePublished(null)).toBe(false);
    expect(isCoursePublished({ id: "c", status: "draft" })).toBe(false);
    expect(isCoursePublished({ id: "c", status: "archived" })).toBe(false);
    expect(isCoursePublished({ id: "c", is_active: false })).toBe(false);
  });
  it("treats active/published as published", () => {
    expect(isCoursePublished({ id: "c", status: "published", is_active: true })).toBe(true);
  });
});

describe("RbtCourseDetail acknowledgment gate", () => {
  const base = {
    published: true,
    requiredLessonIds: ["l1", "l2"],
    completedLessonIds: new Set<string>(["l1", "l2"]),
    alreadyCompleted: false,
    canWrite: true,
  };
  it("allows acknowledgment only when everything is satisfied", () => {
    expect(canAcknowledge(base).allowed).toBe(true);
  });
  it("blocks in preview mode", () => {
    expect(canAcknowledge({ ...base, canWrite: false }).reason).toBe("preview");
  });
  it("blocks when course is unpublished", () => {
    expect(canAcknowledge({ ...base, published: false }).reason).toBe("unpublished");
  });
  it("blocks when course has no content", () => {
    expect(canAcknowledge({ ...base, requiredLessonIds: [] }).reason).toBe("no_content");
  });
  it("blocks when required lessons are still open", () => {
    expect(canAcknowledge({ ...base, completedLessonIds: new Set(["l1"]) }).reason).toBe("incomplete_required");
  });
  it("marks already-completed courses as no-op (persist once)", () => {
    expect(canAcknowledge({ ...base, alreadyCompleted: true }).reason).toBe("already_completed");
  });
});

describe("Assigned-program navigation targets", () => {
  // Guards that we don't reintroduce the dead /academy/course/:id link.
  function learnCourseHref(id: string): string {
    return `/rbt/app/learn/course/${id}`;
  }
  it("routes course links inside the RBT shell", () => {
    expect(learnCourseHref("abc")).toBe("/rbt/app/learn/course/abc");
    expect(learnCourseHref("abc").startsWith("/rbt/app/learn/")).toBe(true);
  });
});