import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Play, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { EvaluationsData } from "../useEvaluationsData";
import { CycleBadge, fmtDate } from "../statusBadges";

export default function CyclesTab({ data, onNewCycle }: { data: EvaluationsData; onNewCycle: () => void }) {
  const evalsByCycle = useMemo(() => {
    const m = new Map<string, number>();
    data.evaluations.forEach((e) => { if (e.cycle_id) m.set(e.cycle_id, (m.get(e.cycle_id) ?? 0) + 1); });
    return m;
  }, [data.evaluations]);

  async function activate(cycleId: string, staffType: string) {
    const targets = data.staff.filter((s) => s.active_status && (staffType === "Both" || s.role === staffType));
    if (targets.length === 0) {
      toast({ title: "No active staff match this cycle." });
      return;
    }
    const cycle = data.cycles.find((c) => c.id === cycleId);
    if (!cycle) return;
    const rows = targets.map((s) => ({
      staff_id: s.id,
      cycle_id: cycleId,
      evaluation_type: cycle.evaluation_type,
      next_review_date: cycle.final_due_date ?? cycle.self_due_date,
      final_status: "In Progress",
    }));
    const { error } = await supabase.from("evaluations").insert(rows);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await supabase.from("evaluation_cycles").update({ status: "Active" }).eq("id", cycleId);
    toast({ title: "Cycle activated", description: `${rows.length} evaluation records created.` });
    data.refresh();
  }

  async function archive(cycleId: string) {
    await supabase.from("evaluation_cycles").update({ status: "Archived" }).eq("id", cycleId);
    data.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{data.cycles.length} cycles</p>
        <Button size="sm" onClick={onNewCycle}><Plus className="h-3.5 w-3.5 mr-1.5" /> New Cycle</Button>
      </div>
      {data.cycles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 p-10 text-center">
          <p className="text-sm font-medium">No evaluation cycles yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create quarterly or annual cycles to batch-schedule evaluations.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.cycles.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.evaluation_type} · {c.staff_type}</p>
                </div>
                <CycleBadge s={c.status} />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                <div>Start: <span className="text-foreground">{fmtDate(c.start_date)}</span></div>
                <div>Self due: <span className="text-foreground">{fmtDate(c.self_due_date)}</span></div>
                <div>Leadership: <span className="text-foreground">{fmtDate(c.leadership_due_date)}</span></div>
                <div>Meeting: <span className="text-foreground">{fmtDate(c.meeting_due_date)}</span></div>
                <div>Final: <span className="text-foreground">{fmtDate(c.final_due_date)}</span></div>
                <div>Evaluations: <span className="text-foreground">{evalsByCycle.get(c.id) ?? 0}</span></div>
              </div>
              <div className="flex gap-2">
                {c.status === "Draft" && (
                  <Button size="sm" variant="outline" onClick={() => activate(c.id, c.staff_type)}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Activate
                  </Button>
                )}
                {c.status !== "Archived" && (
                  <Button size="sm" variant="ghost" onClick={() => archive(c.id)}>
                    <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}