import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MapPin, Clock, User, Info, AlertTriangle } from "lucide-react";
import type { SupervisionRow } from "./useSupervisionMonth";
import { monthBounds } from "./supervisionLogic";

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d as string; }
}
function fmtTime(t?: string | null) {
  if (!t) return "—";
  const [h, m] = String(t).split(":");
  if (!h) return "—";
  const hh = Number(h) % 12 || 12;
  const suf = Number(h) >= 12 ? "PM" : "AM";
  return `${hh}:${m ?? "00"} ${suf}`;
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d as string; }
}

export interface SupervisionSessionsDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row: SupervisionRow | null;
  monthDate: Date;
  readOnly: boolean;
}

/**
 * Session-level detail drawer for a supervision row. Shows every logged
 * supervision session (BCBA record) together with the imported CentralReach
 * RBT sessions that back the "service hours" number, with per-row source and
 * freshness. Read-only in preview mode — this drawer never writes.
 */
export default function SupervisionSessionsDrawer(props: SupervisionSessionsDrawerProps) {
  const { open, onOpenChange, row, monthDate, readOnly } = props;
  const { start, end } = monthBounds(monthDate);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const startDate = startIso.slice(0, 10);
  const endDate = endIso.slice(0, 10);
  const rbtId = row?.rbtEmployeeId ?? null;

  const supQ = useQuery({
    queryKey: ["bcba-supervision-sessions", rbtId, startIso, endIso],
    enabled: open && !!rbtId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bcba_supervision_logs")
        .select("id, occurred_at, client_name, provider_name, service_code, modality, supervision_format, individual_or_group, observation_completed, minutes, next_supervision_date, bcba_signed_at, rbt_acknowledged_at, centralreach_sync_status, updated_at, feedback")
        .eq("provider_id", rbtId!)
        .gte("occurred_at", startIso).lt("occurred_at", endIso)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rbtQ = useQuery({
    queryKey: ["bcba-supervision-rbt-sessions", rbtId, startDate, endDate],
    enabled: open && !!rbtId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rbt_sessions")
        .select("id, session_date, start_time, end_time, location, service_code, session_status, client_name, centralreach_last_synced_at, centralreach_sync_status")
        .eq("rbt_employee_id", rbtId!)
        .gte("session_date", startDate).lt("session_date", endDate)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const supRows = supQ.data ?? [];
  const rbtRows = rbtQ.data ?? [];

  const ratioSourceDate =
    supRows.map((r: any) => r.updated_at).sort().slice(-1)[0] ??
    rbtRows.map((r: any) => r.centralreach_last_synced_at).filter(Boolean).sort().slice(-1)[0] ??
    null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto" data-testid="bcba-supervision-sessions-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {row?.rbtName ?? "Supervision detail"}
            {readOnly && <Badge variant="outline" className="text-[10px]">Read-only preview</Badge>}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {monthDate.toLocaleString(undefined, { month: "long", year: "numeric" })} · {row?.assignedClientCount ?? 0} assigned clients ·
            {" "}completed {(row?.completedMinutes ?? 0)} min of {(row?.requiredMinutes ?? 0)} min required
            {ratioSourceDate && <> · ratio source updated {fmtDate(ratioSourceDate)}</>}
          </SheetDescription>
        </SheetHeader>

        {!row ? null : (
          <div className="mt-4 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Supervision sessions (BCBA log)</h3>
                <span className="text-[11px] text-muted-foreground">Source: Blossom · bcba_supervision_logs</span>
              </div>
              {supQ.isLoading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</div>
              ) : supQ.error ? (
                <div className="text-sm text-rose-600 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Couldn't load supervision sessions.</div>
              ) : supRows.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground flex items-center gap-2"><Info className="h-3.5 w-3.5" />No supervision sessions logged this month.</div>
              ) : (
                <ScrollArea className="max-h-72">
                  <ul className="divide-y divide-border/60 rounded-lg border">
                    {supRows.map((s: any) => (
                      <li key={s.id} className="p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <div className="font-medium truncate">{s.client_name || "—"}</div>
                          <div className="tabular-nums text-xs">{s.minutes ?? 0} min</div>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{fmt(s.occurred_at)}</span>
                          <span>·</span>
                          <span>{s.service_code || "no code"}</span>
                          <span>·</span>
                          <span className="capitalize">{s.supervision_format || s.modality || "in-person"}</span>
                          <span>·</span>
                          <span className="capitalize">{s.individual_or_group || "individual"}</span>
                          {s.observation_completed && <><span>·</span><span>Observation ✓</span></>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          BCBA signed {fmtDate(s.bcba_signed_at)} · RBT ack {fmtDate(s.rbt_acknowledged_at)} · updated {fmtDate(s.updated_at)}
                          {s.centralreach_sync_status && <> · CR sync {s.centralreach_sync_status}</>}
                        </div>
                        {s.feedback && <div className="text-xs text-muted-foreground line-clamp-2">{s.feedback}</div>}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">RBT sessions (CentralReach import)</h3>
                <span className="text-[11px] text-muted-foreground">Source: CentralReach · rbt_sessions</span>
              </div>
              {rbtQ.isLoading ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</div>
              ) : rbtQ.error ? (
                <div className="text-sm text-rose-600 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Couldn't load imported RBT sessions.</div>
              ) : rbtRows.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground flex items-center gap-2"><Info className="h-3.5 w-3.5" />No RBT sessions imported for this month.</div>
              ) : (
                <ScrollArea className="max-h-72">
                  <ul className="divide-y divide-border/60 rounded-lg border">
                    {rbtRows.map((s: any) => (
                      <li key={s.id} className="p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <div className="font-medium truncate flex items-center gap-1"><User className="h-3 w-3" />{s.client_name || "—"}</div>
                          <Badge variant="outline" className="text-[10px] capitalize">{s.session_status ?? "scheduled"}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2">
                          <span>{fmtDate(s.session_date)}</span>
                          <span>·</span>
                          <span>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                          {s.service_code && <><span>·</span><span>{s.service_code}</span></>}
                          {s.location && <><span>·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span></>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          CR sync {s.centralreach_sync_status ?? "—"} · imported {fmtDate(s.centralreach_last_synced_at)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </section>

            <p className="text-[11px] text-muted-foreground">
              Supervision minutes and ratio are computed from these two lists. Blossom OS tracks operational supervision — the record of record still lives in CentralReach.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}