import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, FileSpreadsheet, CheckCircle2, XCircle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { TimesheetStatusBadge } from "@/components/hr/HoursStatusBadge";
import {
  employeeFullName, startOfWeek,
  type Employee, type HoursTimesheet, type HoursTimesheetEntry, type TimesheetStatus,
} from "@/lib/hr/types";

type SheetWithEmp = HoursTimesheet & { employee?: Employee };

function fmtPeriod(start: string, end: string) {
  const s = new Date(start), e = new Date(end);
  return `${s.toLocaleDateString([], { month: "short", day: "numeric" })} – ${e.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export default function Hours() {
  const { hasPerm } = useAuth();
  const canApprove = hasPerm("hr.hours.approve");

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sheets, setSheets] = useState<SheetWithEmp[]>([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current, -1 = last week
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SheetWithEmp | null>(null);
  const [entries, setEntries] = useState<HoursTimesheetEntry[]>([]);

  const periodStart = useMemo(() => {
    const d = startOfWeek(new Date());
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const periodStartIso = useMemo(() => periodStart.toISOString().slice(0, 10), [periodStart]);

  useEffect(() => { void load(); }, [periodStartIso]);
  useEffect(() => { if (selected) void loadEntries(selected.id); else setEntries([]); }, [selected]);

  async function load() {
    setLoading(true);
    const [emp, ts] = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("hours_timesheets").select("*").eq("period_start", periodStartIso).order("created_at", { ascending: false }),
    ]);
    const employeesList = (emp.data ?? []) as Employee[];
    const empMap = new Map(employeesList.map((e) => [e.id, e]));
    setEmployees(employeesList);
    setSheets(((ts.data ?? []) as HoursTimesheet[]).map((s) => ({ ...s, employee: empMap.get(s.employee_id) })));
    setLoading(false);
    setSelected(null);
  }
  async function loadEntries(timesheetId: string) {
    const { data } = await supabase.from("hours_timesheet_entries").select("*").eq("timesheet_id", timesheetId).order("work_date");
    setEntries((data ?? []) as HoursTimesheetEntry[]);
  }

  const totals = useMemo(() => {
    const submitted = sheets.filter((s) => s.status === "submitted").length;
    const approved  = sheets.filter((s) => s.status === "approved").length;
    const hours     = sheets.reduce((sum, s) => sum + Number(s.total_hours || 0), 0);
    const ot        = sheets.reduce((sum, s) => sum + Number(s.overtime_hours || 0), 0);
    return { submitted, approved, hours, ot };
  }, [sheets]);

  const filtered = sheets.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.employee && employeeFullName(s.employee).toLowerCase().includes(q);
  });

  async function setStatus(id: string, status: TimesheetStatus) {
    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "locked")   patch.locked_at   = new Date().toISOString();
    const { error } = await supabase.from("hours_timesheets").update(patch).eq("id", id);
    if (error) { toast.error("Could not update timesheet."); return; }
    toast.success(`Timesheet ${status}.`);
    void load();
  }

  const employeesWithoutSheet = useMemo(() => {
    const taken = new Set(sheets.map((s) => s.employee_id));
    return employees.filter((e) => e.status === "active" && !taken.has(e.id));
  }, [employees, sheets]);

  async function startSheet(employeeId: string) {
    const periodEnd = new Date(periodStart); periodEnd.setDate(periodEnd.getDate() + 6);
    const { error } = await supabase.from("hours_timesheets").insert({
      employee_id: employeeId,
      period_start: periodStartIso,
      period_end: periodEnd.toISOString().slice(0, 10),
      status: "draft",
    });
    if (error) { toast.error("Could not create timesheet."); return; }
    toast.success("Draft timesheet created.");
    void load();
  }

  return (
    <PageShell
      title="Hours Tracker"
      description="Weekly timesheets for hourly employees, approvals, and payroll lock."
      icon={FileSpreadsheet}
    >
      {/* Week selector + KPIs */}
      <Card className="p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 text-sm font-medium tabular-nums min-w-[180px] text-center">
            <Calendar className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
            Week of {periodStart.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
          </div>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <Stat label="Submitted" value={totals.submitted} />
          <Stat label="Approved"  value={totals.approved} />
          <Stat label="Hours"     value={totals.hours.toFixed(1)} />
          <Stat label="OT"        value={totals.ot.toFixed(1)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: list */}
        <div className="lg:col-span-2 space-y-2">
          <Input placeholder="Search employee…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 max-w-xs" />
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Employee</th>
                      <th className="text-left font-medium px-3 py-2">Period</th>
                      <th className="text-right font-medium px-3 py-2">Hours</th>
                      <th className="text-right font-medium px-3 py-2">OT</th>
                      <th className="text-left font-medium px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No timesheets for this week.</td></tr>
                    ) : filtered.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className={cn(
                          "border-t border-border/40 cursor-pointer hover:bg-muted/30",
                          selected?.id === s.id && "bg-primary/5",
                        )}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {s.employee && <EmployeeAvatar employee={s.employee} size="sm" />}
                            <span className="font-medium">{s.employee ? employeeFullName(s.employee) : "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{fmtPeriod(s.period_start, s.period_end)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{Number(s.total_hours).toFixed(1)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{Number(s.overtime_hours).toFixed(1)}</td>
                        <td className="px-3 py-2"><TimesheetStatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {employeesWithoutSheet.length > 0 && hasPerm("hr.hours.submit") && (
            <Card className="p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">No timesheet yet</p>
              <div className="flex flex-wrap gap-1.5">
                {employeesWithoutSheet.slice(0, 12).map((e) => (
                  <Button key={e.id} size="sm" variant="outline" className="h-7" onClick={() => startSheet(e.id)}>
                    + {employeeFullName(e)}
                  </Button>
                ))}
                {employeesWithoutSheet.length > 12 && (
                  <span className="text-xs text-muted-foreground self-center">+ {employeesWithoutSheet.length - 12} more</span>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: detail panel */}
        <Card className="p-4 lg:sticky lg:top-4 self-start">
          {!selected ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Select a timesheet to view daily entries and take action.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {selected.employee && <EmployeeAvatar employee={selected.employee} size="md" />}
                <div className="flex-1 min-w-0">
                  {selected.employee && (
                    <Link to={`/hr/employees/${selected.employee.id}`} className="text-base font-semibold hover:underline">
                      {employeeFullName(selected.employee)}
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground">{fmtPeriod(selected.period_start, selected.period_end)}</p>
                </div>
                <TimesheetStatusBadge status={selected.status} />
              </div>
              <div className="border-t border-border/40 pt-3 space-y-1">
                {entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No daily entries logged.</p>
                ) : entries.map((en) => (
                  <div key={en.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-muted-foreground">{new Date(en.work_date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span className="tabular-nums font-medium">{Number(en.hours).toFixed(2)} h</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{Number(selected.total_hours).toFixed(2)} h</span>
                </div>
              </div>
              {canApprove && selected.status !== "locked" && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                  {selected.status === "submitted" && (
                    <>
                      <Button size="sm" onClick={() => setStatus(selected.id, "approved")}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(selected.id, "rejected")}>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                      </Button>
                    </>
                  )}
                  {selected.status === "approved" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(selected.id, "locked")}>
                      <Lock className="h-3.5 w-3.5 mr-1.5" /> Lock for payroll
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}