import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardFrame } from "../CardFrame";
import { useRbtIdentity } from "../useRbtIdentity";
import { Sparkles, CheckCircle2, AlertCircle, Target, GraduationCap, Award } from "lucide-react";
import {
  derivePerformanceTotalsFromCanonical,
  type CanonicalPerformanceTotals,
} from "@/lib/os/reporting/canonicalRoleBridge";

const SECTIONS: {
  key: string; title: string; icon: any; empty: string;
}[] = [
  { key: "strength",           title: "Strengths",           icon: Sparkles,      empty: "Your BCBA will note strengths after your next observation." },
  { key: "on_track",           title: "On-track areas",      icon: CheckCircle2,  empty: "Nothing flagged as on-track yet." },
  { key: "needs_attention",    title: "Needs attention",     icon: AlertCircle,   empty: "Nothing needs attention right now." },
  { key: "development_goal",   title: "Current development goal", icon: Target,   empty: "No active goal set." },
  { key: "completed_coaching", title: "Completed coaching",  icon: GraduationCap, empty: "No coaching completed yet." },
  { key: "recognition",        title: "Recognition",         icon: Award,         empty: "No recognition entries yet." },
];

export default function Performance() {
  const { employeeId, loading: idLoading } = useRbtIdentity();
  const [rows, setRows] = useState<any[] | null>(null);
  const [canon, setCanon] = useState<CanonicalPerformanceTotals | null>(null);

  useEffect(() => {
    if (idLoading) return;
    if (!employeeId) { setRows([]); return; }
    supabase.from("rbt_performance_notes" as any)
      .select("id,category,title,detail,source,source_reference,source_date")
      .eq("employee_id", employeeId)
      .eq("is_active", true)
      .order("source_date", { ascending: false })
      .then(({ data }) => setRows((data as any[]) ?? []));
    derivePerformanceTotalsFromCanonical({ employeeId }).then(setCanon);
  }, [employeeId, idLoading]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        We show supportive categories with the source and date behind each one — no single opaque score.
      </div>

      {canon && (
        <CardFrame
          title="Delivered activity — from CentralReach billing"
          subtitle={`${canon.firstServiceDate ?? "?"} → ${canon.lastServiceDate ?? "?"} · ${canon.rowCount.toLocaleString()} rows · ${canon.distinctClients} clients`}
          state="success"
        >
          <div className="grid grid-cols-2 gap-3">
            <PerfStat label="Direct hours" value={canon.directHours} />
            <PerfStat label="Supervision hours" value={canon.supervisionHours} />
            <PerfStat label="Parent training" value={canon.parentTrainingHours} />
            <PerfStat label="Cancelled hours" value={canon.cancellationHours} tone="muted" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
            Attendance % and productivity-target % aren't available from the CentralReach billing
            export — it doesn't carry a scheduled-session denominator. Ask your BCBA for the
            productivity view when needed.
          </p>
        </CardFrame>
      )}

      {SECTIONS.map((s) => {
        const items = (rows ?? []).filter((r) => r.category === s.key);
        const state = rows === null ? "loading" : items.length === 0 ? "empty" : "success";
        const Icon = s.icon;
        return (
          <CardFrame key={s.key} title={s.title} state={state} emptyLabel={s.empty}>
            <ul className="space-y-2">
              {items.map((r) => (
                <li key={r.id} className="rounded-xl border border-border/70 bg-card p-3">
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{r.title}</p>
                      {r.detail && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.detail}</p>}
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                        {(r.source ?? "internal").replace(/_/g, " ")}
                        {r.source_date && ` · ${new Date(r.source_date).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardFrame>
        );
      })}
    </div>
  );
}

function PerfStat({ label, value, tone }: { label: string; value: number; tone?: "muted" }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold tabular-nums mt-0.5 ${tone === "muted" ? "text-muted-foreground" : ""}`}>
        {value.toFixed(1)}
      </p>
    </div>
  );
}