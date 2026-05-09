import { useEffect, useMemo, useState } from "react";

export type AlertCategory = "task" | "approval" | "overdue";
export type AlertSeverity = "info" | "warning" | "critical";

export interface MobileAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  body: string;
  source: string;       // e.g. "Scheduling", "Auth", "HR"
  href?: string;        // navigation target
  dueLabel?: string;    // "Due today", "2h overdue", etc.
  createdAt: string;    // ISO
}

const minsAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

const SEED: MobileAlert[] = [
  // Tasks
  { id: "a1", category: "task", severity: "info", title: "Review new VOB submissions", body: "3 new VOBs awaiting your eyes from Solum.", source: "Intake", href: "/auth-dashboard", dueLabel: "Due today", createdAt: minsAgo(8) },
  { id: "a2", category: "task", severity: "info", title: "Sign off on Q2 training plan", body: "Operations Academy plan ready for your acceptance.", source: "Academy", href: "/training", dueLabel: "Due tomorrow", createdAt: minsAgo(45) },
  { id: "a3", category: "task", severity: "warning", title: "Acknowledge updated SOP", body: "Authorization Denial Playbook changed — confirm read.", source: "SOP Intel", href: "/enterprise/sop-intelligence", dueLabel: "Due in 1d", createdAt: minsAgo(120) },

  // Approvals
  { id: "a4", category: "approval", severity: "warning", title: "Time-off request — Maria S.", body: "May 18–22 · BCBA · awaiting your decision.", source: "HR", href: "/hr", dueLabel: "Pending 6h", createdAt: minsAgo(360) },
  { id: "a5", category: "approval", severity: "info", title: "Payroll run — Pay period #18", body: "$74,820 across 42 staff. Ready for release.", source: "Payroll", href: "/hr/payroll", dueLabel: "Pending 2h", createdAt: minsAgo(118) },
  { id: "a6", category: "approval", severity: "warning", title: "New course publish request", body: "VOB Mastery v2 ready to send to 8 staff.", source: "Course Studio", href: "/enterprise/course-studio", dueLabel: "Pending 30m", createdAt: minsAgo(30) },

  // Overdue
  { id: "a7", category: "overdue", severity: "critical", title: "Auth resubmission overdue", body: "Client #C-2241 — 3h past 1-business-day SLA.", source: "Authorizations", href: "/auth-dashboard", dueLabel: "3h overdue", createdAt: minsAgo(190) },
  { id: "a8", category: "overdue", severity: "critical", title: "RBT callout uncovered", body: "South Tampa · 9:00am block · still unfilled.", source: "Scheduling", href: "/scheduling-dashboard", dueLabel: "1h overdue", createdAt: minsAgo(60) },
  { id: "a9", category: "overdue", severity: "warning", title: "Compliance acknowledgement missed", body: "5 staff have not signed updated HIPAA policy.", source: "HR", href: "/hr", dueLabel: "1d overdue", createdAt: minsAgo(60 * 26) },
];

const STORAGE_KEY = "mobile-alerts-dismissed";

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set<string>(); }
}

/**
 * Lightweight mock alert store for mobile notification hooks.
 * Returns active alerts grouped by category with counts and a
 * dismiss action that persists in localStorage.
 */
export function useMobileAlerts() {
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set<string>() : loadDismissed(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissed))); } catch {}
  }, [dismissed]);

  const active = useMemo(() => SEED.filter(a => !dismissed.has(a.id)), [dismissed]);

  const counts = useMemo(() => ({
    task: active.filter(a => a.category === "task").length,
    approval: active.filter(a => a.category === "approval").length,
    overdue: active.filter(a => a.category === "overdue").length,
    total: active.length,
    critical: active.filter(a => a.severity === "critical").length,
  }), [active]);

  const dismiss = (id: string) => setDismissed(prev => {
    const next = new Set(prev); next.add(id); return next;
  });
  const reset = () => setDismissed(new Set());

  return { active, counts, dismiss, reset };
}