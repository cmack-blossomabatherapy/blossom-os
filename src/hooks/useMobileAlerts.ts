import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const STORAGE_KEY = "mobile-alerts-dismissed";
const TASK_LIMIT = 25;

const startOfToday = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
};

function dueLabelFor(dueIso: string | null | undefined): string | undefined {
  if (!dueIso) return undefined;
  const due = new Date(dueIso + "T23:59:59");
  const today = startOfToday();
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === -1) return "1d overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays}d`;
}

function isOverdue(dueIso: string | null | undefined): boolean {
  if (!dueIso) return false;
  const due = new Date(dueIso + "T23:59:59");
  return due.getTime() < Date.now();
}

function daysOverdue(dueIso: string): number {
  const due = new Date(dueIso + "T23:59:59");
  return Math.max(0, Math.round((Date.now() - due.getTime()) / 86_400_000));
}

async function fetchAlerts(): Promise<MobileAlert[]> {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const next7 = new Date(today.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

  // Run all queries in parallel.
  const [
    clientTasksRes,
    intakeTasksRes,
    payrollRes,
    flagsRes,
    authsRes,
    reauthRes,
  ] = await Promise.all([
    supabase
      .from("client_tasks")
      .select("id, title, due_date, completed, client_id, created_at, clients:client_id(child_name)")
      .eq("completed", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(TASK_LIMIT),
    supabase
      .from("intake_tasks")
      .select("id, title, owner, due_date, status, created_at, lead_id")
      .in("status", ["Open", "In Progress", "Blocked"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(TASK_LIMIT),
    supabase
      .from("payroll_runs")
      .select("id, name, total_gross, employee_count, status, pay_date, period_end, submitted_at, created_at")
      .in("status", ["ready", "submitted"])
      .order("period_end", { ascending: false })
      .limit(10),
    supabase
      .from("client_compliance_flags")
      .select("id, title, detail, severity, source, owner, due_date, created_at, client_id, clients:client_id(child_name)")
      .eq("status", "Open")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("client_authorizations")
      .select("id, kind, status, expiration_date, payor, client_id, next_action, updated_at, clients:client_id(child_name)")
      .in("status", ["Expiring Soon", "Denied"])
      .order("expiration_date", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("client_reauth_cycles")
      .select("id, status, current_auth_expiration_date, alerts, blockers, payor, client_id, updated_at, clients:client_id(child_name)")
      .in("status", ["Failed / Delayed", "BCBA Notified"])
      .lte("current_auth_expiration_date", next7)
      .order("current_auth_expiration_date", { ascending: true })
      .limit(20),
  ]);

  const out: MobileAlert[] = [];

  // ---- Client tasks: split into task vs overdue ----
  for (const t of clientTasksRes.data ?? []) {
    const childName = (t as any).clients?.child_name as string | undefined;
    const overdue = isOverdue(t.due_date);
    const sev: AlertSeverity = overdue
      ? (daysOverdue(t.due_date!) >= 2 ? "critical" : "warning")
      : "info";
    out.push({
      id: `ct-${t.id}`,
      category: overdue ? "overdue" : "task",
      severity: sev,
      title: t.title,
      body: childName ? `Client: ${childName}` : "Client task",
      source: "Clients",
      href: t.client_id ? `/clients/${t.client_id}?focus=tasks&task=${t.id}&alert=ct-${t.id}` : undefined,
      dueLabel: dueLabelFor(t.due_date),
      createdAt: t.created_at as string,
    });
  }

  // ---- Intake tasks ----
  for (const t of intakeTasksRes.data ?? []) {
    const overdue = isOverdue(t.due_date);
    const sev: AlertSeverity = overdue
      ? (daysOverdue(t.due_date!) >= 2 ? "critical" : "warning")
      : (t.status === "Blocked" ? "warning" : "info");
    out.push({
      id: `it-${t.id}`,
      category: overdue ? "overdue" : "task",
      severity: sev,
      title: t.title,
      body: t.owner ? `Owner: ${t.owner}` : "Intake task",
      source: "Intake",
      href: t.lead_id ? `/leads/${t.lead_id}?focus=tasks&task=${t.id}&alert=it-${t.id}` : undefined,
      dueLabel: dueLabelFor(t.due_date),
      createdAt: t.created_at as string,
    });
  }

  // ---- Payroll runs awaiting release/approval ----
  for (const r of payrollRes.data ?? []) {
    out.push({
      id: `pr-${r.id}`,
      category: "approval",
      severity: r.status === "submitted" ? "warning" : "info",
      title: `Payroll — ${r.name}`,
      body: `${r.employee_count} staff · $${Number(r.total_gross || 0).toLocaleString()} · ${r.status === "submitted" ? "submitted, awaiting post" : "ready for release"}`,
      source: "Payroll",
      href: `/hr/payroll?tab=runs&run=${r.id}&action=${r.status === "submitted" ? "post" : "release"}&alert=pr-${r.id}`,
      dueLabel: r.pay_date ? dueLabelFor(r.pay_date) : undefined,
      createdAt: (r.submitted_at as string) || (r.created_at as string),
    });
  }

  // ---- Compliance flags = approvals/overdue depending on severity ----
  for (const f of flagsRes.data ?? []) {
    const child = (f as any).clients?.child_name as string | undefined;
    const sev: AlertSeverity =
      f.severity === "Red" ? "critical" : f.severity === "Yellow" ? "warning" : "info";
    const cat: AlertCategory = isOverdue(f.due_date) ? "overdue" : "approval";
    out.push({
      id: `cf-${f.id}`,
      category: cat,
      severity: sev,
      title: f.title,
      body: [child && `Client: ${child}`, f.detail].filter(Boolean).join(" · ") || (f.source as string),
      source: f.source as string,
      href: f.client_id ? `/clients/${f.client_id}?focus=compliance&flag=${f.id}&alert=cf-${f.id}` : undefined,
      dueLabel: dueLabelFor(f.due_date),
      createdAt: f.created_at as string,
    });
  }

  // ---- Authorizations expiring / denied ----
  for (const a of authsRes.data ?? []) {
    const child = (a as any).clients?.child_name as string | undefined;
    const denied = a.status === "Denied";
    const overdue = denied || isOverdue(a.expiration_date);
    const sev: AlertSeverity = denied || overdue ? "critical" : "warning";
    out.push({
      id: `au-${a.id}`,
      category: "overdue",
      severity: sev,
      title: denied ? "Authorization denied" : `${a.kind} auth expiring`,
      body: [child && `Client: ${child}`, a.payor, a.next_action].filter(Boolean).join(" · "),
      source: "Authorizations",
      href: a.client_id ? `/authorizations-dashboard?focus=${a.client_id}&tab=submission&alert=au-${a.id}` : undefined,
      dueLabel: a.expiration_date ? dueLabelFor(a.expiration_date) : undefined,
      createdAt: a.updated_at as string,
    });
  }

  // ---- Reauth cycles failed/at-risk ----
  for (const r of reauthRes.data ?? []) {
    const child = (r as any).clients?.child_name as string | undefined;
    const failed = r.status === "Failed / Delayed";
    const sev: AlertSeverity = failed ? "critical" : "warning";
    const detail = (r.alerts && r.alerts[0]) || (r.blockers && r.blockers[0]) || "Reauth window open";
    out.push({
      id: `rc-${r.id}`,
      category: "overdue",
      severity: sev,
      title: failed ? "Reauth at risk" : "Reauth window open",
      body: [child && `Client: ${child}`, r.payor, detail].filter(Boolean).join(" · "),
      source: "Reauth",
      href: r.client_id ? `/reauth-loop?focus=${r.client_id}&cycle=${r.id}&alert=rc-${r.id}` : "/reauth-loop",
      dueLabel: dueLabelFor(r.current_auth_expiration_date as string),
      createdAt: r.updated_at as string,
    });
  }

  // Sort: critical first, then most recent
  const sevRank: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  out.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]
    || (b.createdAt || "").localeCompare(a.createdAt || ""));

  return out;
}

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set<string>(); }
}

/**
 * Real-data alert store. Pulls open tasks, approvals, and overdue items
 * from the backend (client_tasks, intake_tasks, payroll_runs,
 * client_compliance_flags, client_authorizations, client_reauth_cycles)
 * and exposes them as a unified list. Dismissals persist locally per-user.
 */
export function useMobileAlerts() {
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set<string>() : loadDismissed(),
  );
  const [alerts, setAlerts] = useState<MobileAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(dismissed))); } catch {}
  }, [dismissed]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchAlerts();
      setAlerts(next);
    } catch (e) {
      console.error("[useMobileAlerts] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Re-fetch on changes to any of the underlying tables.
    const channel = supabase
      .channel("mobile-alerts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_tasks" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "intake_tasks" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_runs" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_compliance_flags" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_authorizations" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_reauth_cycles" }, () => void refresh())
      .subscribe();
    // Periodic refresh so "due today" → "overdue" transitions show up without a tab change.
    const iv = window.setInterval(() => { void refresh(); }, 5 * 60_000);
    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(iv);
    };
  }, [refresh]);

  const active = useMemo(() => alerts.filter(a => !dismissed.has(a.id)), [alerts, dismissed]);

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

  return { active, counts, dismiss, reset, refresh, loading };
}