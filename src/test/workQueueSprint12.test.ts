import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  filterWorkItems,
  getDepartmentOwnerLabel,
  getEscalationLevel,
  getEscalationRoute,
  getRecommendedWorkAction,
  isWorkItemEscalated,
  isWorkItemOverdue,
  normalizeWorkItem,
  seedWorkItems,
  sortWorkItemsByUrgency,
  type WorkItem,
} from "@/lib/workQueue/workQueueModel";
import {
  createWorkItem,
  escalateWorkItem,
  resolveEscalation,
  listWorkItems,
} from "@/lib/workQueue/workQueueStore";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("Sprint 12 — Work Queue model", () => {
  it("normalizes minimal input with safe defaults", () => {
    const w = normalizeWorkItem({ title: "x" });
    expect(w.id).toMatch(/^wi_/);
    expect(w.priority).toBe("normal");
    expect(w.status).toBe("open");
    expect(w.department).toBe("Operations Leadership");
  });

  it("seeds realistic items across many departments", () => {
    const items = seedWorkItems();
    const depts = new Set(items.map((i) => i.department));
    expect(depts.has("Intake")).toBe(true);
    expect(depts.has("Authorizations")).toBe(true);
    expect(depts.has("Staffing")).toBe(true);
    expect(depts.has("Credentialing")).toBe(true);
    expect(depts.has("QA")).toBe(true);
    expect(items.some(isWorkItemEscalated)).toBe(true);
    expect(items.some(isWorkItemOverdue)).toBe(true);
  });

  it("State Operations is the escalation visibility lane — not default executor", () => {
    const label = getDepartmentOwnerLabel("State Operations");
    expect(label.toLowerCase()).toMatch(/monitor|unblock/);
    expect(label.toLowerCase()).not.toMatch(/default executor for/);
  });

  it("routes escalations through department first, with State Director visibility when state impact exists", () => {
    const item: WorkItem = normalizeWorkItem({
      title: "Staffing escalation",
      department: "Staffing",
      state: "NC",
      priority: "urgent",
      status: "escalated",
      escalationLevel: 3,
    });
    const route = getEscalationRoute(item);
    expect(route[0]).toBe("Staffing");
    expect(route).toContain("State Operations");
    expect(route).toContain("Operations Leadership");
    expect(getEscalationLevel(item)).toBe(3);
  });

  it("sorts urgency: escalated > overdue > priority", () => {
    const sorted = sortWorkItemsByUrgency(seedWorkItems());
    const first = sorted[0];
    expect(isWorkItemEscalated(first) || isWorkItemOverdue(first) || first.priority === "critical").toBe(true);
  });

  it("filters by view, department, and search", () => {
    const items = seedWorkItems();
    expect(filterWorkItems(items, { view: "escalations" }).every(isWorkItemEscalated)).toBe(true);
    const intake = filterWorkItems(items, { department: "Intake" });
    expect(intake.every((i) => i.department === "Intake")).toBe(true);
    const hit = filterWorkItems(items, { search: "denial" });
    expect(hit.length).toBeGreaterThan(0);
  });

  it("recommends an action for every common type", () => {
    expect(getRecommendedWorkAction(normalizeWorkItem({ type: "auth_issue" }))).toMatch(/auth/i);
    expect(getRecommendedWorkAction(normalizeWorkItem({ type: "staffing_gap" }))).toMatch(/staff/i);
    expect(getRecommendedWorkAction(normalizeWorkItem({ status: "blocked" }))).toMatch(/unblock|escalate/i);
  });
});

describe("Sprint 12 — store", () => {
  it("create / escalate / resolveEscalation update the store", () => {
    const before = listWorkItems().length;
    const w = createWorkItem({ title: "Test escalation flow", department: "QA" });
    expect(listWorkItems().length).toBe(before + 1);
    const esc = escalateWorkItem(w.id, "test", 2);
    expect(esc?.status).toBe("escalated");
    expect(esc?.escalationLevel).toBe(2);
    const done = resolveEscalation(w.id, "ok");
    expect(done?.status).toBe("resolved");
    expect(done?.resolvedAt).toBeTruthy();
  });
});

describe("Sprint 12 — wiring & protected routes", () => {
  const app = read("src/App.tsx");
  const shell = read("src/pages/os/OSShell.tsx");

  it("mounts /work-queue and /work-queue/escalations", () => {
    expect(app).toMatch(/path="\/work-queue"/);
    expect(app).toMatch(/path="\/work-queue\/escalations"/);
    expect(app).toMatch(/WorkQueuePage/);
    expect(app).toMatch(/EscalationCenterPage/);
  });

  it("super admin menu includes Work Queue and Escalation Center", () => {
    expect(shell).toMatch(/\/work-queue"/);
    expect(shell).toMatch(/\/work-queue\/escalations"/);
  });

  it("preserves protected routes", () => {
    for (const path of [
      "/training",
      "/academy",
      "/resource-library",
      "/reports",
      "/reports/bcba-productivity-report-v3",
      "/system/bcba-productivity-uploads",
      "/user-logins-vault",
      "/admin/login-vault",
      "/nfc-badges",
      "/evaluations",
    ]) {
      expect(app).toContain(path);
    }
  });
});