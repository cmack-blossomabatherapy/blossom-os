import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { findDefinition, fmtDate, fmtHours } from "./pipeline";
import type { ProductivitySnapshot, CapacitySnapshot } from "./pipeline";
import { Loader2, ExternalLink, Info } from "lucide-react";

type Snap = ProductivitySnapshot | CapacitySnapshot;

export interface DrilldownProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  metricKey: string | null;
  snapshot: Snap | null;
  kind: "productivity" | "capacity";
}

interface LineItem {
  id: string;
  date: string | null;
  primary: string;
  secondary?: string;
  value?: string;
  href?: string | null;
}

async function fetchLineItems(metricKey: string, snap: Snap): Promise<LineItem[]> {
  const bcbaId = snap.bcba_id;
  const bcbaName = snap.bcba_name ?? "";
  const start = snap.period_start;
  const end = snap.period_end;

  const billableCodes = (codes?: string[]) => async () => {
    let q = supabase
      .from("bcba_billable_sessions")
      .select("id, date_of_service, client_full, procedure_code, procedure_description, hours")
      .gte("date_of_service", start)
      .lte("date_of_service", end)
      .order("date_of_service", { ascending: false })
      .limit(200);
    if (bcbaName) q = q.eq("bcba_name", bcbaName);
    if (codes && codes.length) q = q.in("procedure_code", codes);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      date: r.date_of_service,
      primary: r.client_full || "—",
      secondary: [r.procedure_code, r.procedure_description].filter(Boolean).join(" · "),
      value: `${Number(r.hours ?? 0).toFixed(2)} h`,
    }));
  };

  switch (metricKey) {
    case "clinical_hours":
    case "billable_hours":
      return billableCodes()();
    case "assessment_hours":
      return billableCodes(["97151", "97152", "0362T"])();
    case "parent_training_hours":
      return billableCodes(["97156", "97157"])();
    case "supervision_hours": {
      const { data, error } = await supabase
        .from("bcba_supervision_logs")
        .select("id, occurred_at, client_name, provider_name, minutes, individual_or_group")
        .eq("bcba_id", bcbaId)
        .gte("occurred_at", start)
        .lte("occurred_at", `${end}T23:59:59`)
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.occurred_at,
        primary: r.provider_name || "RBT",
        secondary: [r.client_name, r.individual_or_group].filter(Boolean).join(" · "),
        value: r.minutes ? `${(r.minutes / 60).toFixed(2)} h` : undefined,
      }));
    }
    case "parent_training_workload":
    case "parent_training_hours_capacity": {
      const { data, error } = await supabase
        .from("bcba_parent_training_logs")
        .select("id, occurred_at, client_name, caregiver_name, service_code")
        .eq("bcba_id", bcbaId)
        .gte("occurred_at", start)
        .lte("occurred_at", `${end}T23:59:59`)
        .order("occurred_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.occurred_at,
        primary: r.client_name || "—",
        secondary: [r.caregiver_name, r.service_code].filter(Boolean).join(" · "),
      }));
    }
    case "progress_reports":
    case "reports_due": {
      const { data, error } = await supabase
        .from("bcba_progress_reports")
        .select("id, client_identifier, progress_report_due_date, report_status, current_risk, centralreach_url, centralreach_source_date")
        .eq("assigned_bcba_id", bcbaId)
        .order("progress_report_due_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.progress_report_due_date,
        primary: r.client_identifier,
        secondary: `${r.report_status} · risk ${r.current_risk}`,
        value: r.centralreach_source_date ? `src ${fmtDate(r.centralreach_source_date)}` : undefined,
        href: r.centralreach_url,
      }));
    }
    case "treatment_plans": {
      const { data, error } = await supabase
        .from("bcba_treatment_plans")
        .select("id, status, status_entered_at, assessment_id, bcba_assessments!inner(client_identifier, assigned_bcba_id)")
        .eq("bcba_assessments.assigned_bcba_id", bcbaId)
        .order("status_entered_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.status_entered_at,
        primary: r.bcba_assessments?.client_identifier ?? "—",
        secondary: r.status,
      }));
    }
    case "cancelled_appointments": {
      let q = supabase
        .from("scheduling_cancellations")
        .select("id, session_date, client_name, duration_hours, cancelled_by, reason")
        .gte("session_date", start)
        .lte("session_date", end)
        .order("session_date", { ascending: false })
        .limit(200);
      if (bcbaName) q = q.eq("bcba_name", bcbaName);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.session_date,
        primary: r.client_name || "—",
        secondary: [r.cancelled_by, r.reason].filter(Boolean).join(" · "),
        value: r.duration_hours ? `${Number(r.duration_hours).toFixed(2)} h` : undefined,
      }));
    }
    case "caseload_size":
    case "active_clients": {
      const { data, error } = await supabase
        .from("rbt_client_assignments")
        .select("id, client_id, start_date, end_date, status, clients:client_id(first_name, last_name)")
        .is("end_date", null)
        .limit(300);
      if (error) throw error;
      // filter later on bcba assignment if column exists
      const seen = new Set<string>();
      const items: LineItem[] = [];
      for (const r of (data ?? []) as any[]) {
        if (!r.client_id || seen.has(r.client_id)) continue;
        seen.add(r.client_id);
        const nm = r.clients ? `${r.clients.first_name ?? ""} ${r.clients.last_name ?? ""}`.trim() : r.client_id.slice(0, 8);
        items.push({ id: r.id, date: r.start_date, primary: nm || "—", secondary: r.status });
      }
      return items;
    }
    case "assigned_rbt_count":
    case "active_rbts": {
      const { data, error } = await supabase
        .from("rbt_client_assignments")
        .select("id, rbt_employee_id, start_date, status, employees:rbt_employee_id(first_name, last_name)")
        .is("end_date", null)
        .limit(500);
      if (error) throw error;
      const seen = new Set<string>();
      const items: LineItem[] = [];
      for (const r of (data ?? []) as any[]) {
        if (!r.rbt_employee_id || seen.has(r.rbt_employee_id)) continue;
        seen.add(r.rbt_employee_id);
        const nm = r.employees ? `${r.employees.first_name ?? ""} ${r.employees.last_name ?? ""}`.trim() : r.rbt_employee_id.slice(0, 8);
        items.push({ id: r.id, date: r.start_date, primary: nm || "—", secondary: r.status });
      }
      return items;
    }
    case "new_assessments":
    case "assessment_hours_capacity": {
      const { data, error } = await supabase
        .from("bcba_assessments")
        .select("id, client_identifier, status, due_date, assessment_date, assessment_type")
        .eq("assigned_bcba_id", bcbaId)
        .order("due_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.due_date ?? r.assessment_date,
        primary: r.client_identifier,
        secondary: `${r.assessment_type} · ${r.status}`,
      }));
    }
    case "qa_return_rate_pct": {
      let q = supabase
        .from("qa_note_monitoring")
        .select("id, client_id, rbt_name, monitoring_type, status, errors_found, notes_checked, updated_at")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (bcbaName) q = q.eq("bcba_name", bcbaName);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.updated_at,
        primary: r.rbt_name || r.client_id?.slice(0, 8) || "—",
        secondary: `${r.monitoring_type} · ${r.status}`,
        value: `${r.errors_found}/${r.notes_checked}`,
      }));
    }
    default:
      return [];
  }
}

export default function MetricDrilldownDialog({ open, onOpenChange, metricKey, snapshot, kind }: DrilldownProps) {
  const def = metricKey ? findDefinition(metricKey) : undefined;
  const q = useQuery({
    queryKey: ["bcba-metric-drilldown", metricKey, snapshot?.id, kind],
    enabled: open && !!metricKey && !!snapshot,
    queryFn: () => fetchLineItems(metricKey!, snapshot!),
  });

  const items = q.data ?? [];
  const sourceDate = metricKey && snapshot ? snapshot.source_dates?.[metricKey] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {def?.label ?? metricKey}
            {sourceDate && (
              <Badge variant="outline" className="text-[11px] font-normal">as of {fmtDate(sourceDate)}</Badge>
            )}
          </DialogTitle>
          {def && (
            <DialogDescription className="text-xs">
              {def.definition} <span className="text-muted-foreground">· Source: {def.source} · {def.cadence}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="border-t border-border/60 -mx-6 px-6 pt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Contributing line-items {items.length > 0 && <span className="text-muted-foreground/70">({items.length})</span>}
          </div>

          {q.isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading source records…
            </div>
          ) : q.isError ? (
            <div className="py-10 text-center text-sm text-rose-600">Failed to load source records.</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Info className="h-4 w-4" />
              <div>No contributing line-items for this period.</div>
              <div className="text-xs">This is an aggregate or derived metric — check the metric definition above for its source.</div>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px] pr-2">
              <ul className="divide-y divide-border/60">
                {items.map((it) => (
                  <li key={it.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{it.primary}</div>
                      {it.secondary && (
                        <div className="text-xs text-muted-foreground truncate">{it.secondary}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground/80 mt-0.5">{fmtDate(it.date)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {it.value && <span className="text-sm tabular-nums">{it.value}</span>}
                      {it.href && (
                        <a href={it.href} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}