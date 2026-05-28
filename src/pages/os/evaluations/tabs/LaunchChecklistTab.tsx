import { useMemo } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvaluationsData } from "../useEvaluationsData";

export default function LaunchChecklistTab({ data }: { data: EvaluationsData }) {
  const items = useMemo(() => {
    const activeStaff = data.staff.filter((s) => s.active_status && !(s.notes ?? "").startsWith("[TEST]"));
    const reviewersAssigned = activeStaff.filter((s) => s.supervisor_id).length;
    const testEvalDone = data.evaluations.some((e) => e.final_status === "Complete");
    const formsReviewed = data.forms.length >= 8;
    const templatesReviewed = data.templates.length >= 7;

    return [
      { label: "Staff list imported", done: activeStaff.length >= 1, detail: `${activeStaff.length} active staff` },
      { label: "Reviewers assigned to staff", done: reviewersAssigned > 0 && reviewersAssigned >= Math.ceil(activeStaff.length * 0.5), detail: `${reviewersAssigned}/${activeStaff.length} have a reviewer` },
      { label: "Email integration connected", done: !!data.settings?.email_connected, detail: data.settings?.email_connected ? "Connected" : "Not connected — emails are queued only" },
      { label: "Form templates reviewed", done: formsReviewed, detail: `${data.forms.length} templates available` },
      { label: "Email templates reviewed", done: templatesReviewed, detail: `${data.templates.length} templates available` },
      { label: "At least one evaluation completed end-to-end", done: testEvalDone, detail: testEvalDone ? "Verified" : "Pending" },
      { label: "Reports reviewed", done: data.evaluations.length > 0, detail: data.evaluations.length > 0 ? "Data flowing" : "No evaluations yet" },
    ];
  }, [data]);

  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Launch readiness</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Confirm each item before going live with Evaluations.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{pct}%</div>
            <div className="text-[11px] text-muted-foreground">{done} of {items.length} complete</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
        {items.map((i) => (
          <div key={i.label} className="flex items-start gap-3 px-5 py-3.5">
            {i.done
              ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              : <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm", i.done ? "text-foreground" : "text-foreground/80")}>{i.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{i.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}