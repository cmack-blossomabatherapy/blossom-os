import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact recent HR activity list, backed by `hr_activity_events`.
 * Filters by any combination of employee_id, onboarding_id, or case_id.
 */

export interface HRRecentActivityProps {
  employeeId?: string | null;
  onboardingId?: string | null;
  caseId?: string | null;
  limit?: number;
  className?: string;
  title?: string;
}

interface EventRow {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

function rel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function HRRecentActivity({
  employeeId, onboardingId, caseId, limit = 8, className, title = "Recent HR activity",
}: HRRecentActivityProps) {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let q: any = (supabase.from("hr_activity_events" as never) as any)
        .select("id,event_type,title,description,created_at,created_by")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (employeeId) q = q.eq("employee_id", employeeId);
      if (onboardingId) q = q.eq("onboarding_id", onboardingId);
      if (caseId) q = q.eq("case_id", caseId);
      const { data } = await q;
      if (!cancelled) {
        setRows((data ?? []) as EventRow[]);
        setLoading(false);
      }
    }
    if (employeeId || onboardingId || caseId) void load();
    else { setRows([]); setLoading(false); }
    return () => { cancelled = true; };
  }, [employeeId, onboardingId, caseId, limit]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Activity className="h-3 w-3" /> {title}
      </p>
      <div className="rounded-xl border border-border/70 bg-background/50 divide-y divide-border/60">
        {loading ? (
          <p className="p-3 text-[12px] text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-3 text-[12px] text-muted-foreground">No activity yet.</p>
        ) : rows.map((r) => (
          <div key={r.id} className="p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-medium tracking-tight truncate">{r.title}</p>
              <span className="text-[10.5px] text-muted-foreground shrink-0">{rel(r.created_at)}</span>
            </div>
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-0.5">{r.event_type.replace(/_/g, " ")}</p>
            {r.description && <p className="text-[11.5px] text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}