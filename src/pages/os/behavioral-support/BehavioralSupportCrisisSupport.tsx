import { useState } from "react";
import { OSShell } from "../OSShell";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import { SEVERITY_STYLE, ESC_STATUSES, type BSEscalationStatus } from "./behavioralSupportTypes";
import { BehavioralSupportNoteDialog, BehavioralSupportPlanDialog } from "./_dialogs";
import type { BSEscalation } from "./behavioralSupportTypes";

export default function BehavioralSupportCrisisSupport() {
  const bs = useBehavioralSupportData();
  const [showResolved, setShowResolved] = useState(false);
  const [noteFor, setNoteFor] = useState<BSEscalation | null>(null);
  const [planFor, setPlanFor] = useState<BSEscalation | null>(null);

  const crises = bs.escalations.filter((e) =>
    (e.severity === "crisis" || e.severity === "high")
    && (showResolved ? true : !["resolved", "archived"].includes(e.status))
  );

  return (
    <OSShell>
      <div className="space-y-6 p-6 mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <AlertTriangle className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Crisis Support</h1>
            <p className="text-sm text-muted-foreground mt-1">
              High-severity behavior situations that need immediate support.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs flex items-center gap-1.5">
              <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
              Show resolved
            </label>
            <button onClick={() => void bs.refresh()} className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${bs.loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link to="/behavioral-support/escalations" className="text-xs bg-primary text-primary-foreground rounded-md px-3 py-1.5">
              Open escalations
            </Link>
          </div>
        </header>

        <div className="rounded-lg border border-border bg-card">
          {bs.loading ? (
            <div className="p-4 space-y-2">{[0,1,2].map((i) => <div key={i} className="h-16 rounded bg-muted animate-pulse" />)}</div>
          ) : crises.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              No active crises. When a high or crisis severity escalation is logged, it will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {crises.map((e) => (
                <li key={e.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{e.client_name}</div>
                      <div className="text-xs text-muted-foreground">{e.state ?? "—"} • {e.escalation_type.replace(/_/g," ")}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLE[e.severity]}`}>{e.severity}</span>
                  </div>
                  <div className="text-sm">{e.description}</div>
                  {e.immediate_action && (
                    <div className="text-xs bg-muted/50 rounded px-2 py-1.5">
                      <span className="font-medium">Immediate action:</span> {e.immediate_action}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <select
                      value={e.status}
                      onChange={(ev) => void bs.updateEscalation(e.id, {
                        status: ev.target.value as BSEscalationStatus,
                        ...(ev.target.value === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
                      })}
                      className="bg-background border border-border rounded px-2 py-1"
                    >
                      {ESC_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNoteFor(e)}
                        className="text-primary hover:underline"
                      >Add note</button>
                      <button
                        onClick={() => setPlanFor(e)}
                        className="text-primary hover:underline"
                      >Create support plan</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <BehavioralSupportNoteDialog
          open={!!noteFor}
          onOpenChange={(v) => !v && setNoteFor(null)}
          title={noteFor ? `Crisis note: ${noteFor.client_name}` : "Add note"}
          onSubmit={async (body) => {
            if (!noteFor) return;
            await bs.addNote({ escalation_id: noteFor.id, case_id: noteFor.case_id, title: `Crisis note: ${noteFor.client_name}`, body });
          }}
        />
        <BehavioralSupportPlanDialog
          open={!!planFor}
          onOpenChange={(v) => !v && setPlanFor(null)}
          clientName={planFor?.client_name}
          defaultTitle={planFor ? `Support plan for ${planFor.client_name}` : undefined}
          onSubmit={async ({ plan_title, notes }) => {
            if (!planFor) return;
            await bs.createPlan({
              client_name: planFor.client_name,
              client_id: planFor.client_id,
              case_id: planFor.case_id,
              plan_title,
              reason_for_plan: notes ?? planFor.description,
              plan_status: "draft",
            });
          }}
        />
      </div>
    </OSShell>
  );
}