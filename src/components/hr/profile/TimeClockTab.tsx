import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PunchKindBadge, ExceptionKindBadge, TimesheetStatusBadge } from "@/components/hr/HoursStatusBadge";
import type { Employee, TimeClockPunch, AttendanceException, HoursTimesheet } from "@/lib/hr/types";

export function TimeClockTab({ employee }: { employee: Employee }) {
  const [loading, setLoading] = useState(true);
  const [punches, setPunches] = useState<TimeClockPunch[]>([]);
  const [exceptions, setExceptions] = useState<AttendanceException[]>([]);
  const [timesheets, setTimesheets] = useState<HoursTimesheet[]>([]);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const [p, ex, ts] = await Promise.all([
      supabase.from("time_clock_punches").select("*").eq("employee_id", employee.id).order("punch_at", { ascending: false }).limit(40),
      supabase.from("attendance_exceptions").select("*").eq("employee_id", employee.id).order("occurred_on", { ascending: false }).limit(20),
      supabase.from("hours_timesheets").select("*").eq("employee_id", employee.id).order("period_start", { ascending: false }).limit(8),
    ]);
    setPunches((p.data ?? []) as TimeClockPunch[]);
    setExceptions((ex.data ?? []) as AttendanceException[]);
    setTimesheets((ts.data ?? []) as HoursTimesheet[]);
    setLoading(false);
  }

  if (loading) return <Skeleton className="h-64" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Kiosk access</h3>
          <Badge variant="outline" className={employee.kiosk_enabled ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}>
            {employee.kiosk_enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <dl className="text-sm space-y-1.5">
          <Row label="PIN">{employee.kiosk_pin ? <span className="font-mono">{employee.kiosk_pin}</span> : <span className="text-muted-foreground">Not set</span>}</Row>
          <Row label="Assigned clinic">{employee.clinic ?? "—"}</Row>
          <Row label="Work setting"><span className="capitalize">{employee.work_setting}</span></Row>
        </dl>
        <Link to="/hr/time-clock" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-3">
          Open Time Clock <ExternalLink className="h-3 w-3" />
        </Link>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Recent timesheets</h3>
        {timesheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timesheets yet.</p>
        ) : (
          <div className="space-y-1.5">
            {timesheets.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">
                  {new Date(t.period_start).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
                <span className="tabular-nums">{Number(t.total_hours).toFixed(1)} h</span>
                <TimesheetStatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold mb-3">Recent punches</h3>
        {punches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No punches recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium pb-2">Type</th>
                  <th className="text-left font-medium pb-2">When</th>
                  <th className="text-left font-medium pb-2">Clinic</th>
                  <th className="text-left font-medium pb-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p) => (
                  <tr key={p.id} className="border-t border-border/30">
                    <td className="py-1.5"><PunchKindBadge kind={p.kind} /></td>
                    <td className="py-1.5 tabular-nums text-muted-foreground">{new Date(p.punch_at).toLocaleString()}</td>
                    <td className="py-1.5 text-muted-foreground">{p.clinic ?? "—"}</td>
                    <td className="py-1.5 text-muted-foreground capitalize">{p.source.replace("_"," ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {exceptions.length > 0 && (
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Attendance exceptions</h3>
          <div className="space-y-1.5">
            {exceptions.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border/30 last:border-0">
                <ExceptionKindBadge kind={e.kind} />
                <span className="text-muted-foreground">{new Date(e.occurred_on).toLocaleDateString()}</span>
                {e.detail && <span className="text-muted-foreground truncate flex-1">{e.detail}</span>}
                <Badge variant="outline" className="text-[10px] capitalize">{e.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium text-right">{children}</dd>
    </div>
  );
}