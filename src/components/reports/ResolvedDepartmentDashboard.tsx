// =====================================================================
// Resolved Department Dashboard — Pass 02
// ---------------------------------------------------------------------
// Wraps <DepartmentDashboardView /> with source-aware adapters. Each
// department id maps to an adapter that queries live app state, merges
// overrides into the demo definition, and reports a "Live", "Partial",
// or "Setup" source status. Dashboards without a wired adapter fall
// through with status="setup" so the visual layer stays uniform.
// =====================================================================

import { useMemo } from "react";
import {
  DepartmentDashboardView,
  type DashboardSourceInfo,
  type DashboardSourceStatus,
} from "./DepartmentDashboardView";
import type {
  DepartmentDashboardDef,
  DeptKpi,
  DeptWorkQueueRow,
  Tone,
} from "@/data/departmentDashboards";
import { useIntakeTasksLive, type IntakeTaskRow } from "@/hooks/useIntakeTasksLive";
import { useLiveAuthorizations } from "@/hooks/useLiveAuthorizations";
import { useLegacyRecruitingCandidates } from "@/hooks/useLegacyRecruitingCandidates";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import { useQAReviews } from "@/hooks/useQAReviews";

/**
 * Resolver — decides which adapter to render for the given dashboard.
 * Unknown ids fall back to the raw demo view with a Setup badge.
 */
export function ResolvedDepartmentDashboard({ def }: { def: DepartmentDashboardDef }) {
  switch (def.id) {
    case "department-intake-dashboard":      return <IntakeAdapter def={def} />;
    case "department-authorizations-dashboard": return <AuthorizationsAdapter def={def} />;
    case "department-recruiting-dashboard":  return <RecruitingAdapter def={def} />;
    case "department-hr-dashboard":          return <HrAdapter def={def} />;
    case "department-qa-dashboard":          return <QaAdapter def={def} />;
    default:
      return (
        <DepartmentDashboardView
          dashboard={def}
          source={{ status: "setup", sources: ["Demo data"] }}
        />
      );
  }
}

// ---- helpers --------------------------------------------------------

function ageLabel(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return undefined;
  const days = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  return `${days}d`;
}

function overrideKpi(kpis: DeptKpi[], label: string, patch: Partial<DeptKpi>): DeptKpi[] {
  return kpis.map((k) => (k.label === label ? { ...k, ...patch, hint: patch.hint ?? "Live" } : k));
}

function nowIso(): string { return new Date().toISOString(); }

// ---- Intake ---------------------------------------------------------

function IntakeAdapter({ def }: { def: DepartmentDashboardDef }) {
  const { tasks, loading } = useIntakeTasksLive();

  const { dashboard, source } = useMemo(() => {
    if (loading || tasks.length === 0) {
      return {
        dashboard: def,
        source: {
          status: "setup" as DashboardSourceStatus,
          sources: ["intake_tasks"],
        },
      };
    }
    const open = tasks.filter((t) => t.status === "Open" || t.status === "In Progress");
    const blocked = tasks.filter((t) => t.status === "Blocked");
    const overdue = tasks.filter((t) => {
      if (!t.due_date || t.status === "Completed") return false;
      return new Date(t.due_date).getTime() < Date.now();
    });
    const bottleneck = blocked.length + overdue.length;

    const kpis = overrideKpi(def.kpis, "Open Bottlenecks", {
      value: String(bottleneck),
      delta: `${blocked.length} blocked · ${overdue.length} overdue`,
      trend: bottleneck > 0 ? "down" : "up",
    });

    const priority = [...blocked, ...overdue, ...open].slice(0, 6);
    const workQueue: DeptWorkQueueRow[] = priority.map((t) => intakeTaskRow(t));

    return {
      dashboard: { ...def, kpis, workQueue },
      source: {
        status: "live" as DashboardSourceStatus,
        sources: ["intake_tasks"],
        lastRefreshed: nowIso(),
      },
    };
  }, [def, tasks, loading]);

  return <DepartmentDashboardView dashboard={dashboard} source={source} />;
}

function intakeTaskRow(t: IntakeTaskRow): DeptWorkQueueRow {
  const tone: Tone =
    t.status === "Blocked" ? "critical" :
    (t.due_date && new Date(t.due_date).getTime() < Date.now()) ? "critical" :
    t.status === "In Progress" ? "attention" : "neutral";
  const href = t.related_url
    ? t.related_url
    : t.lead_id
      ? `/intake/leads?lead=${encodeURIComponent(t.lead_id)}`
      : `/tasks?task=${encodeURIComponent(t.id)}`;
  return {
    name: t.title,
    status: t.status,
    owner: t.owner ?? undefined,
    age: ageLabel(t.due_date ?? t.created_at),
    detail: t.related_record_label ?? t.task_type,
    tone,
    href,
  };
}

// ---- Authorizations -------------------------------------------------

function AuthorizationsAdapter({ def }: { def: DepartmentDashboardDef }) {
  const { items, loading } = useLiveAuthorizations();

  const { dashboard, source } = useMemo(() => {
    if (loading || items.length === 0) {
      return {
        dashboard: def,
        source: {
          status: "setup" as DashboardSourceStatus,
          sources: ["CentralReach", "authorizations"],
        },
      };
    }
    const pending = items.filter((a) => a.stage === "Awaiting Submission" || a.stage === "In QA Review" || a.stage === "Submitted");
    const denied = items.filter((a) => a.stage === "Denied");
    const now = Date.now();
    const expiring = items.filter((a) => {
      if (!a.expirationDate) return false;
      const t = new Date(a.expirationDate).getTime();
      const days = (t - now) / 86_400_000;
      return days >= 0 && days <= 30;
    });

    let kpis = def.kpis;
    kpis = overrideKpi(kpis, "Pending Auths", { value: String(pending.length), delta: undefined });
    kpis = overrideKpi(kpis, "Expiring <30d", { value: String(expiring.length), delta: undefined });
    kpis = overrideKpi(kpis, "Denials (30d)", { value: String(denied.length), delta: undefined });

    const risky = [...denied, ...pending.filter((a) => a.riskLevel === "High" || a.missingInfo), ...expiring].slice(0, 6);
    const seen = new Set<string>();
    const workQueue: DeptWorkQueueRow[] = [];
    for (const a of risky) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      const tone: Tone =
        a.stage === "Denied" ? "critical" :
        a.missingInfo ? "critical" :
        a.stage === "Expiring Soon" ? "attention" :
        "attention";
      workQueue.push({
        name: `${a.clientName} · ${a.payor}`,
        status: a.stage,
        owner: a.coordinator,
        age: `${a.daysInStage}d`,
        detail: a.nextAction || undefined,
        tone,
        href: `/authorizations?auth=${encodeURIComponent(a.id)}`,
      });
    }

    return {
      dashboard: { ...def, kpis, workQueue },
      source: {
        status: "live" as DashboardSourceStatus,
        sources: ["CentralReach", "authorizations overlay"],
        lastRefreshed: nowIso(),
      },
    };
  }, [def, items, loading]);

  return <DepartmentDashboardView dashboard={dashboard} source={source} />;
}

// ---- Recruiting -----------------------------------------------------

function RecruitingAdapter({ def }: { def: DepartmentDashboardDef }) {
  const candidates = useLegacyRecruitingCandidates();

  const { dashboard, source } = useMemo(() => {
    if (candidates.length === 0) {
      return {
        dashboard: def,
        source: {
          status: "setup" as DashboardSourceStatus,
          sources: ["recruiting_candidates"],
        },
      };
    }
    const stalled = candidates.filter((c) => c.onboardingStatus === "Handoff Needed" || c.onboardingStatus === "Background Pending");
    const workQueue: DeptWorkQueueRow[] = candidates.slice(0, 6).map((c) => ({
      name: c.name,
      status: c.onboardingStatus,
      owner: c.role,
      detail: c.candidateStatus,
      tone: (stalled.includes(c) ? "attention" : "neutral") as Tone,
      href: `/recruiting?candidate=${encodeURIComponent(c.id)}`,
    }));
    return {
      dashboard: { ...def, workQueue },
      source: {
        status: "partial" as DashboardSourceStatus,
        sources: ["recruiting_candidates"],
        lastRefreshed: nowIso(),
      },
    };
  }, [def, candidates]);

  return <DepartmentDashboardView dashboard={dashboard} source={source} />;
}

// ---- HR -------------------------------------------------------------

function HrAdapter({ def }: { def: DepartmentDashboardDef }) {
  const { members, loading } = useEmployeeDirectory();

  const { dashboard, source } = useMemo(() => {
    if (loading || members.length === 0) {
      return {
        dashboard: def,
        source: {
          status: "setup" as DashboardSourceStatus,
          sources: ["employees"],
        },
      };
    }
    const active = members.filter((m) => (m.status ?? "active").toLowerCase() === "active");
    const kpis = def.kpis.map((k, i) =>
      i === 0 ? { ...k, value: String(active.length), delta: `${members.length} total`, hint: "Live" } : k,
    );
    return {
      dashboard: { ...def, kpis },
      source: {
        status: "partial" as DashboardSourceStatus,
        sources: ["employees", "Viventium"],
        lastRefreshed: nowIso(),
      },
    };
  }, [def, members, loading]);

  return <DepartmentDashboardView dashboard={dashboard} source={source} />;
}

// ---- QA -------------------------------------------------------------

function QaAdapter({ def }: { def: DepartmentDashboardDef }) {
  const { items, loading } = useQAReviews();

  const { dashboard, source } = useMemo(() => {
    if (loading || items.length === 0) {
      return {
        dashboard: def,
        source: {
          status: "setup" as DashboardSourceStatus,
          sources: ["qa_reviews"],
        },
      };
    }
    const open = items.filter((r) => r.status !== "Submitted to Auth");
    const stalled = items.filter((r) => (r.daysInStage ?? 0) > 5);
    const workQueue: DeptWorkQueueRow[] = open.slice(0, 6).map((r) => ({
      name: r.clientName,
      status: r.status,
      owner: r.bcba ?? undefined,
      age: `${r.daysInStage ?? 0}d`,
      detail: r.clientState ? `State ${r.clientState}` : undefined,
      tone: ((r.daysInStage ?? 0) > 5 ? "critical" : "attention") as Tone,
      href: `/qa?review=${encodeURIComponent(r.id)}`,
    }));
    const kpis = def.kpis.map((k, i) => {
      if (i === 0) return { ...k, value: String(open.length), delta: `${stalled.length} stalled`, hint: "Live" };
      return k;
    });
    return {
      dashboard: { ...def, kpis, workQueue },
      source: {
        status: "live" as DashboardSourceStatus,
        sources: ["qa_reviews"],
        lastRefreshed: nowIso(),
      },
    };
  }, [def, items, loading]);

  return <DepartmentDashboardView dashboard={dashboard} source={source} />;
}