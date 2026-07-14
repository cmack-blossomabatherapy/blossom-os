import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OSShell } from "../OSShell";
import { Eye, RefreshCw, Flame, Bell, FileText } from "lucide-react";
import { useCentralReachOps } from "@/hooks/useCentralReachOps";
import { mapPairingsToSupervisionSignals } from "@/lib/integrations/centralreach/behavioralSupportMapper";
import { useBehavioralSupportData } from "./useBehavioralSupportData";
import { BehavioralSupportEscalationDialog, BehavioralSupportFollowupDialog } from "./_dialogs";

type Signal = ReturnType<typeof mapPairingsToSupervisionSignals>[number];

export default function BehavioralSupportSupervisionVisibility() {
  const cr = useCentralReachOps();
  const bs = useBehavioralSupportData();
  const [flagFilter, setFlagFilter] = useState<string>("all");
  const [escalateFor, setEscalateFor] = useState<Signal | null>(null);
  const [followupFor, setFollowupFor] = useState<Signal | null>(null);

  const signals = useMemo(() => {
    return mapPairingsToSupervisionSignals(
      Array.from(cr.pairingsByClient.values()),
      cr.coverageRisks,
    );
  }, [cr.pairingsByClient, cr.coverageRisks]);

  const filtered = signals
    .filter((s) => s.riskFlags.length > 0)
    .filter((s) => flagFilter === "all" || s.riskFlags.includes(flagFilter));

  return (
    <OSShell>
      <div className="space-y-6 p-6 mx-auto w-full max-w-6xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Eye className="h-4 w-4" /> Behavioral Support
            </div>
            <h1 className="text-2xl font-semibold mt-1">Supervision Visibility</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Derived from CentralReach session data. Flags clients that need clinical support outreach.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => cr.refresh()} className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${cr.loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link to="/reports" className="text-xs border border-border rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Deep reports
            </Link>
          </div>
        </header>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Source: CentralReach-derived session data (not live API sync).
          </span>
          {cr.lastSyncedAt && (
            <span>Last synced {new Date(cr.lastSyncedAt).toLocaleString()}</span>
          )}
          <span>Flagged clients: <strong className="text-foreground">{signals.filter((s) => s.riskFlags.length > 0).length}</strong></span>
          <span>No recent BCBA supervision: <strong className="text-foreground">{signals.filter((s) => s.riskFlags.includes("no_recent_bcba_supervision")).length}</strong></span>
          <span>Service instability: <strong className="text-foreground">{signals.filter((s) => s.riskFlags.includes("service_instability")).length}</strong></span>
          <span>Uncovered / at-risk coverage: <strong className="text-foreground">{signals.filter((s) => s.riskFlags.includes("uncovered") || s.riskFlags.includes("at_risk_coverage")).length}</strong></span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Risk flag:</span>
            <select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)} className="bg-background border border-border rounded px-2 py-1">
              <option value="all">All flagged</option>
              <option value="no_recent_bcba_supervision">No recent BCBA supervision</option>
              <option value="service_instability">Service instability</option>
              <option value="uncovered">Uncovered</option>
              <option value="at_risk_coverage">At-risk coverage</option>
            </select>
          </label>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {cr.loading ? (
            <div className="p-4 space-y-2">{[0,1,2,3].map((i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}</div>
          ) : cr.error ? (
            <div className="p-6 text-sm text-destructive">{cr.error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              No flagged clients from CentralReach signals right now.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Client</th>
                  <th className="px-3 py-2 text-left">State</th>
                  <th className="px-3 py-2 text-left">BCBA / RBT</th>
                  <th className="px-3 py-2 text-left">Last BCBA</th>
                  <th className="px-3 py-2 text-left">Cancellations (30d)</th>
                  <th className="px-3 py-2 text-left">Flags</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.clientName}>
                    <td className="px-3 py-2 font-medium">{s.clientName}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{s.state ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {s.bcbaName ?? "—"} / {s.rbtName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {s.daysSinceLastBcbaSupervision === null ? "Never" : `${s.daysSinceLastBcbaSupervision}d ago`}
                    </td>
                    <td className="px-3 py-2 text-xs">{s.cancellationsLast30d}</td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {s.riskFlags.map((f) => (
                          <span key={f} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px]">{f.replace(/_/g," ")}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setEscalateFor(s)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        <Flame className="h-3 w-3 inline mr-0.5" /> Escalate
                      </button>
                      <button
                        onClick={() => setFollowupFor(s)}
                        className="text-xs text-primary hover:underline"
                      >
                        <Bell className="h-3 w-3 inline mr-0.5" /> Follow-up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <BehavioralSupportEscalationDialog
          open={!!escalateFor}
          onOpenChange={(v) => !v && setEscalateFor(null)}
          clientName={escalateFor?.clientName}
          onSubmit={async (description) => {
            if (!escalateFor) return;
            await bs.createEscalation({
              client_name: escalateFor.clientName,
              state: escalateFor.state,
              bcba_name: escalateFor.bcbaName,
              centralreach_reference_id: escalateFor.centralreachClientId ?? null,
              escalation_type: escalateFor.riskFlags.includes("service_instability") ? "service_instability" : "supervision_gap",
              severity: "medium",
              description,
              status: "new",
            });
            await bs.addNote({
              case_id: null,
              escalation_id: null,
              plan_id: null,
              title: `CentralReach supervision signal → ${escalateFor.clientName}`,
              body: `Flags: ${escalateFor.riskFlags.join(", ")}`,
            });
          }}
        />
        <BehavioralSupportFollowupDialog
          open={!!followupFor}
          onOpenChange={(v) => !v && setFollowupFor(null)}
          clientName={followupFor?.clientName}
          onSubmit={async ({ due_at, followup_type, priority, assigned_to_name, notes }) => {
            if (!followupFor) return;
            await bs.createFollowup({
              client_name: followupFor.clientName,
              followup_type,
              priority,
              assigned_to_name: assigned_to_name ?? null,
              due_at,
              status: "open",
            });
            if (notes) {
              await bs.addNote({
                case_id: null,
                escalation_id: null,
                plan_id: null,
                title: `Follow-up notes for ${followupFor.clientName}`,
                body: notes,
              });
            }
          }}
        />
      </div>
    </OSShell>
  );
}