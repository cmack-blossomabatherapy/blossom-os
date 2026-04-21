import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, Clock, GraduationCap, AlertTriangle, TrendingUp, Star } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatMoney, type HRSavedReport } from "@/lib/hr/types";

interface Counts {
  total: number;
  active: number;
  byState: Record<string, number>;
  byEmploymentType: Record<string, number>;
  byStatus: Record<string, number>;
  reviewsOpen: number;
  reviewsOverdue: number;
  trainingsOverdue: number;
  trainingsExpiringSoon: number;
  bonusesPaid: number;
  payChangesEffective: number;
  openCases: number;
  exceptionsOpen: number;
}

export default function HRReports() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [reports, setReports] = useState<HRSavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const [emps, reviews, trainings, bonuses, payCh, cases, except, savedReports] = await Promise.all([
      supabase.from("employees").select("status, state, employment_type"),
      supabase.from("employee_reviews").select("status, due_date"),
      supabase.from("employee_trainings").select("status, due_date, expires_on"),
      supabase.from("employee_bonuses").select("amount, status"),
      supabase.from("employee_pay_changes").select("status"),
      supabase.from("employee_cases").select("status"),
      supabase.from("attendance_exceptions").select("status"),
      supabase.from("hr_saved_reports").select("*").order("created_at", { ascending: false }),
    ]);

    const empRows = (emps.data ?? []) as Array<{ status: string; state: string; employment_type: string }>;
    const byState: Record<string, number> = {};
    const byEmp: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    empRows.forEach((e) => {
      byState[e.state] = (byState[e.state] ?? 0) + 1;
      byEmp[e.employment_type] = (byEmp[e.employment_type] ?? 0) + 1;
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    });

    const reviewRows = (reviews.data ?? []) as Array<{ status: string; due_date: string | null }>;
    const trainRows = (trainings.data ?? []) as Array<{ status: string; due_date: string | null; expires_on: string | null }>;
    const bonusRows = (bonuses.data ?? []) as Array<{ amount: number; status: string }>;

    setCounts({
      total: empRows.length,
      active: empRows.filter((e) => e.status === "active").length,
      byState, byEmploymentType: byEmp, byStatus,
      reviewsOpen: reviewRows.filter((r) => !["completed", "cancelled"].includes(r.status)).length,
      reviewsOverdue: reviewRows.filter((r) => r.due_date && r.due_date < today && !["completed", "cancelled"].includes(r.status)).length,
      trainingsOverdue: trainRows.filter((t) => t.due_date && t.due_date < today && t.status !== "completed").length,
      trainingsExpiringSoon: trainRows.filter((t) => t.expires_on && t.expires_on >= today && t.expires_on <= in30).length,
      bonusesPaid: bonusRows.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.amount), 0),
      payChangesEffective: ((payCh.data ?? []) as Array<{ status: string }>).filter((p) => p.status === "effective").length,
      openCases: ((cases.data ?? []) as Array<{ status: string }>).filter((c) => !["resolved", "closed"].includes(c.status)).length,
      exceptionsOpen: ((except.data ?? []) as Array<{ status: string }>).filter((e) => e.status === "open").length,
    });
    setReports((savedReports.data ?? []) as HRSavedReport[]);
    setLoading(false);
  }

  const stateRows = useMemo(() => {
    if (!counts) return [];
    return Object.entries(counts.byState).sort((a, b) => b[1] - a[1]);
  }, [counts]);

  if (loading || !counts) {
    return (
      <PageShell title="HR Reports" description="People analytics across the entire workforce." icon={BarChart3}>
        <Skeleton className="h-64" />
      </PageShell>
    );
  }

  return (
    <PageShell title="HR Reports" description="People analytics across the entire workforce." icon={BarChart3}>
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Users} label="Active employees" value={counts.active} sub={`of ${counts.total} total`} />
        <KPI icon={Star} label="Open reviews" value={counts.reviewsOpen} sub={`${counts.reviewsOverdue} overdue`} tone={counts.reviewsOverdue > 0 ? "warning" : undefined} />
        <KPI icon={GraduationCap} label="Training overdue" value={counts.trainingsOverdue} sub={`${counts.trainingsExpiringSoon} expiring ≤ 30d`} tone={counts.trainingsOverdue > 0 ? "warning" : undefined} />
        <KPI icon={AlertTriangle} label="Open HR cases" value={counts.openCases} sub={`${counts.exceptionsOpen} attendance flags`} tone={counts.openCases > 0 ? "warning" : undefined} />
      </div>

      <Tabs defaultValue="workforce" className="space-y-3">
        <TabsList>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="time">Time & Attendance</TabsTrigger>
          <TabsTrigger value="comp">Compensation</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="workforce" className="space-y-3">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Headcount by state</h3>
            <div className="space-y-2">
              {stateRows.map(([state, n]) => {
                const pct = (n / counts.total) * 100;
                return (
                  <div key={state} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-10">{state}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-foreground w-10 text-right">{n}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BreakdownCard title="By employment type" data={counts.byEmploymentType} />
            <BreakdownCard title="By employee status" data={counts.byStatus} />
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KPI icon={Clock} label="Open attendance exceptions" value={counts.exceptionsOpen} tone={counts.exceptionsOpen > 0 ? "warning" : undefined} />
            <KPI icon={GraduationCap} label="Training expiring ≤ 30 days" value={counts.trainingsExpiringSoon} tone={counts.trainingsExpiringSoon > 0 ? "warning" : undefined} />
            <KPI icon={GraduationCap} label="Training overdue" value={counts.trainingsOverdue} tone={counts.trainingsOverdue > 0 ? "warning" : undefined} />
          </div>
        </TabsContent>

        <TabsContent value="comp" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KPI icon={TrendingUp} label="Pay changes effective" value={counts.payChangesEffective} />
            <KPI icon={BarChart3} label="Bonuses paid (total)" value={formatMoney(counts.bonusesPaid)} tone="success" />
            <KPI icon={Star} label="Reviews completed" value={counts.reviewsOpen === 0 ? "All caught up" : `${counts.reviewsOpen} open`} />
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-2">
          {reports.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">No saved reports yet.</Card>
          ) : reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.category} · saved by {r.created_by_name ?? "—"}</p>
                  {r.description && <p className="text-xs text-muted-foreground mt-1.5">{r.description}</p>}
                </div>
                {r.is_shared && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-info/10 text-info border-info/30">Shared</span>}
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function KPI({ icon: Icon, label, value, sub, tone }: { icon: typeof Users; label: string; value: number | string; sub?: string; tone?: "warning" | "success" }) {
  const cls = tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      </div>
      <p className={cn("text-2xl font-semibold tabular-nums", cls)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((s, n) => s + n, 0);
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.map(([k, n]) => {
          const pct = total > 0 ? (n / total) * 100 : 0;
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-28 truncate capitalize">{k.replace(/_/g, " ")}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs tabular-nums text-foreground w-10 text-right">{n}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}