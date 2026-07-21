import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildActionQueue,
  type ActionItem,
  type RawSignal,
  type ReasonCode,
} from "./priority";
import {
  fetchCanonicalProviderSummary,
  summarizeProviderRows,
} from "@/lib/os/reporting/canonicalConsumer";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TodayEvent = {
  id: string;
  kind:
    | "session" | "assessment" | "parent_training"
    | "supervision" | "meeting" | "deadline" | "schedule_change";
  title: string;
  time?: string;
  clientName?: string;
  deepLink?: string;
};

export type CaseloadHealth = {
  total: number;
  onTrack: number;
  attentionNeeded: number;
  authorizationRisk: number;
  staffingRisk: number | null;
  documentationRisk: number;
  underutilization: number | null;
  parentTrainingConcern: number;
  onHold: number | null;
};

export type RbtTeamHealth = {
  total: number;
  onTrack: number;
  needSupervision: number;
  newToCase: number | null;
  requestedSupport: number | null;
  trainingOverdue: number | null;
  performanceFollowUp: number | null;
};

export type MyMonth = {
  clinicalHours: number;
  assessments: number | null;
  parentTraining: number;
  supervision: number;
  reportsSubmitted: number | null;
  qaReturns: number;
  documentationTimelinessPct: number;
  openRisks: number;
  filledFromCanonical: boolean;
};

export type SupportSnapshot = {
  openTickets: number;
  urgentIssues: number;
  credentialAlerts: number;
  systemAlerts: number;
  freshness: FreshnessSummary[];
};

export type FreshnessSummary = {
  key: string;
  label: string;
  minutesSinceSync: number | null;
  isStale: boolean;
};

export type BcbaHomeData = {
  today: TodayEvent[];
  queue: ActionItem[];
  caseload: CaseloadHealth;
  rbtTeam: RbtTeamHealth;
  month: MyMonth;
  support: SupportSnapshot;
};

/* -------------------------------------------------------------------------- */
/*  Freshness helper — used to cap urgency on derived items                    */
/* -------------------------------------------------------------------------- */

function isStaleFor(minutesSinceSync: number | null, thresholdMinutes: number | null) {
  if (minutesSinceSync == null || thresholdMinutes == null) return false;
  return minutesSinceSync > thresholdMinutes;
}

/* -------------------------------------------------------------------------- */
/*  Fetcher                                                                    */
/* -------------------------------------------------------------------------- */

async function fetchAll(userId: string): Promise<BcbaHomeData> {
  const now  = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    actionTasksR, treatmentR, parentTrainR, supervisionR,
    freshnessR, notificationsR, clinicalWorkR, authR,
  ] = await Promise.all([
    supabase.from("bcba_action_tasks")
      .select("id,title,description,client_id,client_name,due_date,priority,status,source_area")
      .eq("assigned_bcba", userId)
      .neq("status", "completed"),
    supabase.from("bcba_treatment_plan_items")
      .select("id,client_id,client_name,due_date,status,missing_items,authorization_id")
      .eq("bcba_id", userId)
      .neq("status", "completed"),
    supabase.from("bcba_parent_training_logs")
      .select("id,client_id,client_name,next_due_date,occurred_at")
      .eq("bcba_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase.from("bcba_supervision_logs")
      .select("id,client_id,client_name,provider_id,provider_name,occurred_at,minutes")
      .eq("bcba_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(300),
    supabase.from("cr_freshness_config")
      .select("type_key,current_minutes,threshold_minutes"),
    supabase.from("user_notifications")
      .select("id,title,body,kind,category,link,created_at,read_at")
      .eq("user_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("clinical_work_items")
      .select("id,title,client_id,client_name,due_at,priority,status,source_type")
      .eq("bcba_id", userId)
      .neq("status", "completed")
      .limit(200),
    supabase.from("client_authorizations")
      .select("id,client_id,status,expiration_date,approved_hours,hours,qa_status,missing_docs")
      .not("expiration_date", "is", null)
      .limit(500),
  ]);

  const actionTasks   = actionTasksR.data   ?? [];
  const treatment     = treatmentR.data     ?? [];
  const parentTrain   = parentTrainR.data   ?? [];
  const supervision   = supervisionR.data   ?? [];
  const freshnessRows = freshnessR.data     ?? [];
  const notifications = notificationsR.data ?? [];
  const clinicalWork  = clinicalWorkR.data  ?? [];
  const auths         = authR.data          ?? [];

  /* ---- freshness map ---------------------------------------------------- */
  const freshnessByKey = new Map(freshnessRows.map((r: any) => [r.type_key, r]));
  const freshness: FreshnessSummary[] = freshnessRows.map((r: any) => ({
    key: r.type_key,
    label: r.type_key.replace(/_/g, " "),
    minutesSinceSync: r.current_minutes ?? null,
    isStale: isStaleFor(r.current_minutes ?? null, r.threshold_minutes ?? null),
  }));
  const schedStale  = freshness.find((f) => f.key.includes("schedule"))?.isStale ?? false;
  const authStale   = freshness.find((f) => f.key.includes("auth"))?.isStale ?? false;

  /* ---- Today ------------------------------------------------------------ */
  const today: TodayEvent[] = [];
  for (const s of supervision) {
    if (s.occurred_at && s.occurred_at >= todayStart && s.occurred_at < todayEnd) {
      today.push({
        id: `sup-${s.id}`, kind: "supervision",
        title: `Supervision — ${s.provider_name ?? "RBT"}`,
        clientName: s.client_name, time: s.occurred_at,
        deepLink: `/bcba/clinical?item=${s.id}`,
      });
    }
  }
  for (const p of parentTrain) {
    if (p.occurred_at && p.occurred_at >= todayStart && p.occurred_at < todayEnd) {
      today.push({
        id: `pt-${p.id}`, kind: "parent_training",
        title: `Parent training — ${p.client_name ?? "Client"}`,
        time: p.occurred_at, clientName: p.client_name,
      });
    }
  }
  for (const t of [...actionTasks, ...treatment, ...clinicalWork]) {
    const due = (t as any).due_date ?? (t as any).due_at;
    if (due && due >= todayStart && due < todayEnd) {
      today.push({
        id: `deadline-${t.id}`, kind: "deadline",
        title: (t as any).title ?? `Deadline — ${t.client_name ?? ""}`,
        clientName: t.client_name ?? undefined, time: due,
        deepLink: `/bcba/clinical?item=${t.id}`,
      });
    }
  }
  today.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  /* ---- Action Queue signals -------------------------------------------- */
  const signals: RawSignal[] = [];

  for (const t of actionTasks) {
    const reasons: ReasonCode[] = [];
    if ((t as any).priority === "high" || (t as any).priority === "urgent") reasons.push("priority_flag");
    if ((t as any).source_area === "safety") reasons.push("safety");
    if ((t as any).source_area === "qa") reasons.push("qa_return");
    signals.push({
      sourceId: `at-${t.id}`, kind: "action_task",
      title: (t as any).title,
      subtitle: (t as any).description ?? undefined,
      clientId: (t as any).client_id ?? undefined,
      clientName: (t as any).client_name ?? undefined,
      dueDate: (t as any).due_date, reasons,
      owner: "bcba",
      deepLink: `/bcba/clinical?task=${t.id}`,
      context: (t as any).source_area,
    });
  }

  for (const p of treatment) {
    signals.push({
      sourceId: `tp-${p.id}`, kind: "treatment_plan",
      title: `Treatment plan — ${p.client_name ?? "Client"}`,
      subtitle: Array.isArray((p as any).missing_items) && (p as any).missing_items.length
        ? `Missing: ${(p as any).missing_items.join(", ")}` : undefined,
      clientId: (p as any).client_id ?? undefined,
      clientName: (p as any).client_name ?? undefined,
      dueDate: (p as any).due_date, reasons: ["overdue_documentation"],
      owner: "bcba",
      deepLink: `/bcba/caseload?client=${(p as any).client_id ?? ""}`,
    });
  }

  /* Parent training: latest per client → if next_due_date overdue, flag. */
  const latestPtByClient = new Map<string, any>();
  for (const p of parentTrain) {
    if (!p.client_id) continue;
    if (!latestPtByClient.has(p.client_id)) latestPtByClient.set(p.client_id, p);
  }
  for (const p of latestPtByClient.values()) {
    if (p.next_due_date && new Date(p.next_due_date).getTime() < now.getTime()) {
      signals.push({
        sourceId: `pt-${p.id}`, kind: "parent_training",
        title: `Parent training due — ${p.client_name ?? "Client"}`,
        clientId: p.client_id, clientName: p.client_name,
        dueDate: p.next_due_date,
        reasons: ["missing_parent_signature"],
        owner: "bcba",
        deepLink: `/bcba/caseload?client=${p.client_id}`,
      });
    }
  }

  /* Supervision: last per RBT → if >30 days, flag missing supervision. */
  const lastSupByRbt = new Map<string, any>();
  for (const s of supervision) {
    if (!s.provider_id) continue;
    if (!lastSupByRbt.has(s.provider_id)) lastSupByRbt.set(s.provider_id, s);
  }
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  for (const s of lastSupByRbt.values()) {
    const last = new Date(s.occurred_at).getTime();
    if (last < thirtyDaysAgo) {
      signals.push({
        sourceId: `sup-${s.provider_id}`, kind: "supervision",
        title: `Supervision needed — ${s.provider_name ?? "RBT"}`,
        clientName: s.client_name,
        reasons: ["missing_supervision"],
        owner: "bcba",
        deepLink: `/bcba/my-rbts?rbt=${s.provider_id}`,
      });
    }
  }

  /* Authorization risk — expiring in ≤30 days, active. */
  const in30 = now.getTime() + 30 * 24 * 60 * 60 * 1000;
  for (const a of auths) {
    if (!a.expiration_date) continue;
    const exp = new Date(a.expiration_date).getTime();
    if (exp <= in30 && (a.status ?? "").toLowerCase() !== "expired") {
      signals.push({
        sourceId: `auth-${a.id}`, kind: "authorization",
        title: `Authorization expiring — client ${a.client_id?.slice(0, 8) ?? ""}`,
        clientId: a.client_id ?? undefined,
        dueDate: a.expiration_date,
        reasons: ["authorization_risk"],
        owner: "bcba", stale: authStale,
        deepLink: `/bcba/caseload?client=${a.client_id ?? ""}`,
      });
    }
  }

  /* Notifications → surface urgent items into queue. */
  for (const n of notifications) {
    const k = (n as any).kind ?? "";
    if (k === "urgent" || k === "critical" || k === "alert") {
      signals.push({
        sourceId: `notif-${n.id}`, kind: "action_task",
        title: (n as any).title,
        subtitle: (n as any).body ?? undefined,
        reasons: [(n as any).category === "safety" ? "safety" : "priority_flag"],
        owner: "bcba",
        deepLink: (n as any).link ?? undefined,
      });
    }
  }

  const queue = buildActionQueue(signals);

  /* ---- Caseload health -------------------------------------------------- */
  // Distinct client ids we touch (best-effort proxy for caseload).
  const clientIds = new Set<string>();
  for (const t of actionTasks)   if ((t as any).client_id) clientIds.add((t as any).client_id);
  for (const t of treatment)     if ((t as any).client_id) clientIds.add((t as any).client_id);
  for (const p of parentTrain)   if (p.client_id) clientIds.add(p.client_id);
  for (const s of supervision)   if (s.client_id) clientIds.add(s.client_id);

  const authRiskClients = new Set(
    auths.filter((a) => a.expiration_date && new Date(a.expiration_date).getTime() <= in30)
         .map((a) => a.client_id).filter(Boolean),
  );
  const docRiskClients = new Set(treatment.map((t: any) => t.client_id).filter(Boolean));
  const ptConcernClients = new Set(
    Array.from(latestPtByClient.values())
      .filter((p) => p.next_due_date && new Date(p.next_due_date).getTime() < now.getTime())
      .map((p) => p.client_id),
  );

  const attention = new Set<string>([
    ...authRiskClients, ...docRiskClients, ...ptConcernClients,
  ]);

  const caseload: CaseloadHealth = {
    total: clientIds.size,
    onTrack: Math.max(0, clientIds.size - attention.size),
    attentionNeeded: attention.size,
    authorizationRisk: authRiskClients.size,
    staffingRisk: null, // requires staffing feed — surfaced when available
    documentationRisk: docRiskClients.size,
    underutilization: null,
    parentTrainingConcern: ptConcernClients.size,
    onHold: null,
  };

  /* ---- RBT team --------------------------------------------------------- */
  const rbtIds = new Set<string>();
  for (const s of supervision) if (s.provider_id) rbtIds.add(s.provider_id);
  const needSupervision = Array.from(lastSupByRbt.values())
    .filter((s) => new Date(s.occurred_at).getTime() < thirtyDaysAgo).length;

  const rbtTeam: RbtTeamHealth = {
    total: rbtIds.size,
    onTrack: Math.max(0, rbtIds.size - needSupervision),
    needSupervision,
    newToCase: null,
    requestedSupport: null,
    trainingOverdue: null,
    performanceFollowUp: null,
  };

  /* ---- My Month --------------------------------------------------------- */
  const monthSup   = supervision.filter((s) => s.occurred_at && s.occurred_at >= monthStart);
  const monthPt    = parentTrain.filter((p) => p.occurred_at && p.occurred_at >= monthStart);
  const clinicalHrs = monthSup.reduce((acc, s) => acc + ((s.minutes ?? 0) / 60), 0);

  let mClinical = Math.round(clinicalHrs * 10) / 10;
  let mParent = monthPt.length;
  let mSup = monthSup.length;
  let filledFromCanonical = false;
  if (mClinical === 0 && mParent === 0 && mSup === 0) {
    try {
      const rows = await fetchCanonicalProviderSummary({
        authUserId: userId,
        start: monthStart.slice(0, 10),
      });
      const t = summarizeProviderRows(rows);
      if (t.rowCount > 0) {
        mClinical = Math.round((t.directHours + t.supervisionHours + t.parentTrainingHours) * 10) / 10;
        mParent = Math.round(t.parentTrainingHours);
        mSup = Math.round(t.supervisionHours);
        filledFromCanonical = true;
      }
    } catch {
      /* leave role-derived zeros */
    }
  }

  const month: MyMonth = {
    clinicalHours: mClinical,
    assessments: null,
    parentTraining: mParent,
    supervision: mSup,
    reportsSubmitted: null,
    qaReturns: notifications.filter((n: any) => n.category === "qa").length,
    documentationTimelinessPct: treatment.length === 0 ? 100 :
      Math.round((1 - treatment.filter((t: any) =>
        t.due_date && new Date(t.due_date).getTime() < now.getTime()).length / treatment.length) * 100),
    openRisks: caseload.attentionNeeded,
    filledFromCanonical,
  };

  /* ---- Support snapshot ------------------------------------------------- */
  const support: SupportSnapshot = {
    openTickets: notifications.filter((n: any) => n.category === "support").length,
    urgentIssues: notifications.filter((n: any) => n.kind === "urgent" || n.kind === "critical" || n.kind === "alert").length,
    credentialAlerts: notifications.filter((n: any) => n.category === "credential").length,
    systemAlerts: notifications.filter((n: any) => n.category === "system").length,
    freshness,
  };

  return { today, queue, caseload, rbtTeam, month, support };
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useBcbaHomeData() {
  return useBcbaHomeDataFor(null);
}

/**
 * Scoped variant — accepts the resolved BCBA auth uid so preview mode fetches
 * the previewed subject's data (not the admin's). Returns disabled/empty until
 * identity is ready to prevent unscoped or cross-subject fetches.
 */
export function useBcbaHomeDataFor(scopedAuthUserId: string | null) {
  return useQuery({
    queryKey: ["bcba-home", scopedAuthUserId],
    enabled: !!scopedAuthUserId,
    staleTime: 60_000,
    queryFn: async () => fetchAll(scopedAuthUserId!),
  });
}