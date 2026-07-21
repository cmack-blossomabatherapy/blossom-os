import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { fmtDate } from "./pipeline";
import type { ProductivitySnapshot } from "./pipeline";
import { fetchCanonicalSessionRows } from "@/lib/os/reporting/canonicalConsumer";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  snapshot: ProductivitySnapshot | null;
}

interface ReconRow {
  id: string;
  service_date: string | null;
  client_name: string | null;
  provider_name: string | null;
  procedure_code: string | null;
  billed_units: number;
  billed_hours: number;
  scheduled_units: number | null;
  scheduled_hours: number | null;
  variance_hours: number;
  reason: string;
  status: "match" | "over_billed" | "under_billed" | "unscheduled" | "unbilled";
  freshness: string | null;
  source: "role" | "canonical";
}

function bucketReason(billed: number, scheduled: number | null): { reason: string; status: ReconRow["status"] } {
  if ((scheduled ?? 0) === 0 && billed > 0) return { reason: "Billed with no matching scheduled session", status: "unscheduled" };
  if (billed === 0 && (scheduled ?? 0) > 0) return { reason: "Scheduled session with no billing row yet", status: "unbilled" };
  const diff = Math.round((billed - (scheduled ?? 0)) * 100) / 100;
  if (Math.abs(diff) < 0.05) return { reason: "Billed matches scheduled", status: "match" };
  if (diff > 0) return { reason: `Over-billed by ${diff.toFixed(2)}h`, status: "over_billed" };
  return { reason: `Under-billed by ${Math.abs(diff).toFixed(2)}h`, status: "under_billed" };
}

const STATUS_STYLES: Record<ReconRow["status"], string> = {
  match: "bg-emerald-50 text-emerald-800 border-emerald-200",
  over_billed: "bg-rose-50 text-rose-800 border-rose-200",
  under_billed: "bg-amber-50 text-amber-800 border-amber-200",
  unscheduled: "bg-rose-50 text-rose-800 border-rose-200",
  unbilled: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function BillingReconciliationDialog({ open, onOpenChange, snapshot }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | ReconRow["status"]>("all");

  const query = useQuery({
    queryKey: ["bcba-billing-recon", snapshot?.id, snapshot?.period_start, snapshot?.period_end],
    enabled: open && !!snapshot,
    queryFn: async (): Promise<ReconRow[]> => {
      const start = snapshot!.period_start;
      const end = snapshot!.period_end;
      const bcbaName = snapshot!.bcba_name ?? "";
      const bcbaId = snapshot!.bcba_id;

      const [billedR, schedR] = await Promise.all([
        (async () => {
          let q = supabase.from("bcba_billable_sessions")
            .select("id, date_of_service, client_full, bcba_name, procedure_code, procedure_description, hours, units, created_at")
            .gte("date_of_service", start).lte("date_of_service", end)
            .order("date_of_service", { ascending: false })
            .limit(500);
          if (bcbaName) q = q.eq("bcba_name", bcbaName);
          return q;
        })(),
        supabase.from("bcba_supervision_logs")
          .select("id, occurred_at, client_name, provider_name, service_code, minutes")
          .eq("bcba_id", bcbaId)
          .gte("occurred_at", start).lte("occurred_at", `${end}T23:59:59`)
          .limit(500),
      ]);

      if (billedR.error) throw billedR.error;
      if (schedR.error) throw schedR.error;

      const scheduledMap = new Map<string, { hours: number; units: number; source: string }>();
      for (const s of (schedR.data ?? []) as any[]) {
        const day = String(s.occurred_at ?? "").slice(0, 10);
        const key = `${day}|${(s.client_name ?? "").toLowerCase()}|${(s.service_code ?? "").toLowerCase()}`;
        const b = scheduledMap.get(key) ?? { hours: 0, units: 0, source: s.occurred_at };
        b.hours += Number(s.minutes ?? 0) / 60;
        b.units += Math.ceil(Number(s.minutes ?? 0) / 15);
        scheduledMap.set(key, b);
      }

      const rows: ReconRow[] = [];
      const seenKeys = new Set<string>();

      for (const r of (billedR.data ?? []) as any[]) {
        const day = String(r.date_of_service ?? "").slice(0, 10);
        const key = `${day}|${(r.client_full ?? "").toLowerCase()}|${(r.procedure_code ?? "").toLowerCase()}`;
        seenKeys.add(key);
        const sched = scheduledMap.get(key);
        const billedH = Number(r.hours ?? 0);
        const { reason, status } = bucketReason(billedH, sched?.hours ?? null);
        rows.push({
          id: r.id,
          service_date: r.date_of_service,
          client_name: r.client_full,
          provider_name: r.bcba_name,
          procedure_code: r.procedure_code,
          billed_units: Number(r.units ?? 0),
          billed_hours: billedH,
          scheduled_units: sched?.units ?? null,
          scheduled_hours: sched?.hours ?? null,
          variance_hours: Math.round((billedH - (sched?.hours ?? 0)) * 100) / 100,
          reason, status,
          freshness: r.created_at ?? null,
          source: "role",
        });
      }

      for (const [key, sched] of scheduledMap.entries()) {
        if (seenKeys.has(key)) continue;
        const [day, client, code] = key.split("|");
        const { reason, status } = bucketReason(0, sched.hours);
        rows.push({
          id: `sched-${key}`,
          service_date: day,
          client_name: client,
          provider_name: null,
          procedure_code: code || null,
          billed_units: 0, billed_hours: 0,
          scheduled_units: sched.units,
          scheduled_hours: Math.round(sched.hours * 100) / 100,
          variance_hours: Math.round(-sched.hours * 100) / 100,
          reason, status,
          freshness: sched.source,
          source: "role",
        });
      }

      // Canonical fallback: when `bcba_billable_sessions` returned no rows
      // for this scoped BCBA/period, source billed-side entries from the
      // canonical view (v_cr_canonical_sessions). Scheduled_* fields stay
      // null — the billing export does not carry scheduled time, and we
      // never fabricate values.
      if ((rows.length === 0 || (billedR.data ?? []).length === 0) && bcbaId) {
        try {
          const canonicalRows = await fetchCanonicalSessionRows({
            authUserId: bcbaId,
            employeeId: null,
            start,
            end,
            limit: 500,
          });
          for (const r of canonicalRows) {
            const day = String(r.serviceDate ?? "").slice(0, 10);
            const key = `${day}|${(r.clientName ?? "").toLowerCase()}|${(r.procedureCode ?? "").toLowerCase()}`;
            if (seenKeys.has(key)) continue;
            const sched = scheduledMap.get(key);
            const billedH = Number(r.hours ?? 0);
            const { reason, status } = bucketReason(billedH, sched?.hours ?? null);
            rows.push({
              id: `canon-${r.rowId}`,
              service_date: r.serviceDate,
              client_name: r.clientName,
              provider_name: r.providerName,
              procedure_code: r.procedureCode,
              billed_units: Number(r.units ?? 0),
              billed_hours: billedH,
              scheduled_units: sched?.units ?? null,
              scheduled_hours: sched?.hours ?? null,
              variance_hours: Math.round((billedH - (sched?.hours ?? 0)) * 100) / 100,
              reason,
              status,
              freshness: r.batchUploadedAt,
              source: "canonical",
            });
          }
        } catch {
          // Canonical RPC unreachable — leave rows as they are; UI already
          // handles the empty state with an actionable owner message.
        }
      }

      rows.sort((a, b) => (b.service_date ?? "").localeCompare(a.service_date ?? ""));
      return rows;
    },
  });

  const rows = query.data ?? [];
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (r.client_name ?? "").toLowerCase().includes(s)
        || (r.procedure_code ?? "").toLowerCase().includes(s)
        || (r.provider_name ?? "").toLowerCase().includes(s);
    });
  }, [rows, q, filter]);

  const totals = useMemo(() => {
    const t = { billed: 0, scheduled: 0, variance: 0 };
    for (const r of rows) {
      t.billed += r.billed_hours;
      t.scheduled += r.scheduled_hours ?? 0;
      t.variance += r.variance_hours;
    }
    return t;
  }, [rows]);

  const latest = rows.map(r => r.freshness).filter(Boolean).sort().slice(-1)[0] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl" data-testid="bcba-billing-recon-dialog">
        <DialogHeader>
          <DialogTitle>Billing reconciliation</DialogTitle>
          <DialogDescription className="text-xs">
            Period {fmtDate(snapshot?.period_start)}–{fmtDate(snapshot?.period_end)}
            {latest && <> · newest source row {fmtDate(latest)}</>}
            {" · "}Source: bcba_billable_sessions · scheduled from bcba_supervision_logs
            {rows.some(r => r.source === "canonical") && (
              <> · <span className="text-teal-700">canonical fallback: v_cr_canonical_sessions</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Input placeholder="Search client / code…" className="w-56 h-8" value={q} onChange={(e) => setQ(e.target.value)} />
          <select
            className="text-xs border rounded-md h-8 px-2 bg-background"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All variances</option>
            <option value="match">Matches</option>
            <option value="over_billed">Over-billed</option>
            <option value="under_billed">Under-billed</option>
            <option value="unscheduled">Unscheduled</option>
            <option value="unbilled">Unbilled</option>
          </select>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{filtered.length} rows</span>
            <span>Billed {totals.billed.toFixed(2)}h · Scheduled {totals.scheduled.toFixed(2)}h · Δ {totals.variance.toFixed(2)}h</span>
            <Button variant="ghost" size="sm" className="h-7" disabled={query.isFetching} onClick={() => query.refetch()}>
              <RefreshCw className={"h-3.5 w-3.5 " + (query.isFetching ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 -mx-6 px-6 pt-3">
          {query.isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading source records…
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-rose-600 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Failed to load billing rows. <Button size="sm" variant="ghost" onClick={() => query.refetch()}>Retry</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Info className="h-4 w-4" />
              <div>No source rows for this period or filter.</div>
              <div className="text-xs">Try clearing the filter, or wait for the nightly CentralReach sync.</div>
            </div>
          ) : (
            <ScrollArea className="max-h-[440px]">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 pr-2">Date</th>
                    <th className="text-left py-2 pr-2">Client</th>
                    <th className="text-left py-2 pr-2">Code</th>
                    <th className="text-right py-2 pr-2">Billed h</th>
                    <th className="text-right py-2 pr-2">Sched h</th>
                    <th className="text-right py-2 pr-2">Δ h</th>
                    <th className="text-left py-2 pr-2">Status</th>
                    <th className="text-left py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map(r => (
                    <tr key={r.id} className="align-top">
                      <td className="py-1.5 pr-2 whitespace-nowrap">{fmtDate(r.service_date)}</td>
                      <td className="py-1.5 pr-2">{r.client_name ?? "—"}</td>
                      <td className="py-1.5 pr-2">{r.procedure_code ?? "—"}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{r.billed_hours.toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{r.scheduled_hours != null ? r.scheduled_hours.toFixed(2) : "—"}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{r.variance_hours.toFixed(2)}</td>
                      <td className="py-1.5 pr-2">
                        <Badge variant="outline" className={"text-[10px] " + STATUS_STYLES[r.status]}>{r.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-1.5 text-muted-foreground">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Exported for tests
export const __test_bucketReason = bucketReason;