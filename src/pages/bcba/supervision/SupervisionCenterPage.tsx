import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, ClipboardList, Search, ExternalLink, AlertTriangle } from "lucide-react";
import { useSupervisionMonth, type SupervisionRow } from "./useSupervisionMonth";
import { useBcbaIdentity } from "../useBcbaIdentity";
import { BcbaMappingDiagnostic } from "../BcbaMappingDiagnostic";
import { STATUS_LABELS, STATUS_STYLES } from "./supervisionLogic";
import { PostSupervisionDialog } from "./PostSupervisionDialog";
import { SupervisionBriefDrawer } from "./SupervisionBriefDrawer";

function fmt(d?: string | null) { try { return d ? new Date(d).toLocaleDateString() : "—"; } catch { return "—"; } }
function fmtMinutes(m: number) { const h = Math.floor(m / 60); const r = m % 60; return h ? `${h}h ${r}m` : `${r}m`; }

export default function SupervisionCenterPage() {
  const now = new Date();
  const identity = useBcbaIdentity();
  const { data, isLoading, error, refetch, isFetching } = useSupervisionMonth(
    identity.scopedAuthUserId,
    now,
  );
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SupervisionRow | null>(null);
  const [logging, setLogging]   = useState<SupervisionRow | null>(null);

  const rows = useMemo(() => {
    const list = data?.rows ?? [];
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter(r => r.rbtName.toLowerCase().includes(s) || r.clientNames.some(c => c.toLowerCase().includes(s)));
  }, [data, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data?.rows ?? []).forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Supervision Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {now.toLocaleString(undefined, { month: "long", year: "numeric" })} · operational tracking. Required documentation of record still lives in CentralReach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56" placeholder="Search RBT or client…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Status roll-up */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map(k => (
          <div key={k} className="rounded-xl border border-border/70 bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{STATUS_LABELS[k]}</div>
            <div className="text-2xl font-semibold mt-1">{counts[k] ?? 0}</div>
          </div>
        ))}
      </div>

      <BcbaMappingDiagnostic onRetry={() => refetch()} />

      {(identity.loading || (isLoading && identity.scopedAuthUserId)) ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading supervision picture…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {(error as Error).message}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No RBTs assigned to you this month.
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">RBT</th>
                  <th className="text-left px-3 py-3">Clients</th>
                  <th className="text-right px-3 py-3">Service hrs</th>
                  <th className="text-right px-3 py-3">Required</th>
                  <th className="text-right px-3 py-3">Completed</th>
                  <th className="text-center px-3 py-3">Ind.</th>
                  <th className="text-center px-3 py-3">Grp.</th>
                  <th className="text-center px-3 py-3">Obs.</th>
                  <th className="text-left px-3 py-3">Last</th>
                  <th className="text-left px-3 py-3">Next</th>
                  <th className="text-right px-3 py-3">Remaining</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Missing</th>
                  <th className="text-left px-3 py-3">Action</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map(r => (
                  <tr key={r.rbtEmployeeId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{r.rbtName}</td>
                    <td className="px-3 py-3 text-muted-foreground max-w-[180px] truncate" title={r.clientNames.join(", ")}>
                      {r.assignedClientCount} · {r.clientNames.slice(0, 2).join(", ")}{r.clientNames.length > 2 && "…"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{r.serviceHoursThisMonth}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtMinutes(r.requiredMinutes)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtMinutes(r.completedMinutes)}</td>
                    <td className="px-3 py-3 text-center">{r.individualContacts}</td>
                    <td className="px-3 py-3 text-center">{r.groupContacts}</td>
                    <td className="px-3 py-3 text-center">{r.observationCompleted ? "✓" : "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{fmt(r.lastSupervisionDate)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{fmt(r.nextSupervisionDate)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtMinutes(r.remainingMinutes)}</td>
                    <td className="px-3 py-3">
                      <span className={"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium " + STATUS_STYLES[r.status]}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px]">
                      {r.missingDocumentation.length ? r.missingDocumentation.join(" · ") : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs">{r.actionRequired}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => setSelected(r)} className="mr-1">
                        <ClipboardList className="h-3.5 w-3.5 mr-1" /> Brief
                      </Button>
                      <Button size="sm" onClick={() => setLogging(r)} disabled={identity.readOnly} title={identity.readOnly ? "Read-only in preview mode" : undefined}>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Log
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs text-muted-foreground flex items-start gap-2">
        <ExternalLink className="h-3.5 w-3.5 mt-0.5" />
        <span>
          Blossom OS supervision tracking supports operations; it does not replace CentralReach or BACB records.
          Administrators configure which fields count as required documentation in{" "}
          <a className="underline" href="/admin/bcba-supervision-config">Admin → Supervision configuration</a>.
        </span>
      </div>

      {selected && (
        <SupervisionBriefDrawer
          open={!!selected}
          onOpenChange={o => !o && setSelected(null)}
          rbtEmployeeId={selected.rbtEmployeeId}
          rbtName={selected.rbtName}
        />
      )}
      {logging && (
        <PostSupervisionDialog
          open={!!logging}
          onOpenChange={o => !o && setLogging(null)}
          rbtEmployeeId={logging.rbtEmployeeId}
          rbtName={logging.rbtName}
          clientOptions={logging.clientNames}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}