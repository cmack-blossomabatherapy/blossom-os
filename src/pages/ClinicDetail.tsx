import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, User, Home, AlertTriangle, FileText, Mail, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  findClinic,
  getClinicMetrics,
  getClinicClients,
  getClinicRBTs,
  clinicPipelineStages,
  clinicStatusVariant,
} from "@/data/clinics";
import { stageVariant } from "@/data/clients";
import { weekDays, timeSlots } from "@/data/scheduling";
import { getRBTUtilization } from "@/data/staffing";

export default function ClinicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clinic = id ? findClinic(id) : undefined;

  if (!clinic) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Clinic not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/operations")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Operations
        </Button>
      </div>
    );
  }

  const metrics = getClinicMetrics(clinic);
  const clients = getClinicClients(clinic);
  const rbts = getClinicRBTs(clinic);
  const Icon = clinic.isPhysical ? Building2 : Home;

  const activeClients = clients.filter((c) => c.stage === "Active");
  const pendingStarts = clients.filter((c) => c.stage === "Pending Start Date");
  const upcomingAssessments = clients.filter((c) => c.stage === "Assessment Scheduled");
  const stuckInQA = clients.filter((c) => c.stage === "In QA" || c.stage === "Pending Treatment Auth");

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <button
          onClick={() => navigate("/operations")}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Operations
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{clinic.name}</h1>
                <StatusBadge status={clinic.status} variant={clinicStatusVariant(clinic.status)} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {clinic.address}</span>
                <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> Mgr: {clinic.manager}</span>
                <span>Director: {clinic.director}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Assign BCBA</Button>
            <Button size="sm">Schedule Assessment</Button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Active Clients" value={metrics.activeClients} />
        <Kpi label="Pending Starts" value={metrics.pendingStarts} tone={metrics.pendingStarts >= 5 ? "warning" : "default"} />
        <Kpi label="Staffing Needed" value={metrics.staffingNeeded} tone={metrics.staffingNeeded >= 5 ? "destructive" : metrics.staffingNeeded >= 3 ? "warning" : "default"} />
        <Kpi label="Assessments / Wk" value={metrics.assessmentsThisWeek} />
        <Kpi
          label="Capacity"
          value={clinic.isPhysical ? `${Math.round(metrics.utilizationPct)}%` : "—"}
          hint={clinic.isPhysical ? `${metrics.activeClients}/${clinic.capacity}` : "In-home"}
          tone={metrics.utilizationPct >= 95 ? "destructive" : metrics.utilizationPct >= 75 ? "warning" : "default"}
        />
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {metrics.alerts.map((a) => (
            <div
              key={a.message}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
                a.level === "destructive"
                  ? "bg-destructive/5 border-destructive/30 text-destructive"
                  : "bg-warning/5 border-warning/30 text-warning",
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Clinic Pipeline */}
      <div className="bg-card rounded-xl border border-border/60 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Clinic Pipeline</h3>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {clinicPipelineStages.map((stage) => {
              const items = clients.filter((c) => c.stage === stage);
              return (
                <div key={stage} className="w-[200px] shrink-0 bg-secondary/30 rounded-lg border border-border/40">
                  <div className="px-2.5 py-2 border-b border-border/40 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground truncate">{stage}</p>
                    <span className="text-[10px] font-medium text-muted-foreground bg-background border border-border/60 px-1.5 rounded">
                      {items.length}
                    </span>
                  </div>
                  <div className="p-1.5 space-y-1 max-h-[260px] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">Empty</p>
                    ) : (
                      items.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/clients/${c.id}`)}
                          className="w-full text-left p-1.5 rounded bg-card border border-border/40 hover:border-primary/40 transition-colors"
                        >
                          <p className="text-xs font-medium text-foreground truncate">{c.childName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.bcba ?? "No BCBA"}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Clients</TabsTrigger>
          <TabsTrigger value="pending">Pending Starts</TabsTrigger>
          <TabsTrigger value="staffing">Staffing</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="qa">QA / Auth</TabsTrigger>
          {clinic.isPhysical && <TabsTrigger value="schedule">Schedule</TabsTrigger>}
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <ClientTable
            clients={activeClients}
            columns={["Client", "BCBA", "RBT", "Hours/Wk"]}
            renderRow={(c) => (
              <>
                <td className="px-4 py-2.5 font-medium text-foreground">{c.childName}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.bcba ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.rbt ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">20 hr/wk</td>
              </>
            )}
            onRowClick={(c) => navigate(`/clients/${c.id}`)}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <ClientTable
            clients={pendingStarts}
            columns={["Client", "BCBA", "Blockers", "Days Waiting", "Actions"]}
            renderRow={(c) => (
              <>
                <td className="px-4 py-2.5 font-medium text-foreground">{c.childName}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.bcba ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {c.blockers.length === 0 ? (
                    <span className="text-xs text-success">Ready</span>
                  ) : (
                    <span className="text-xs text-destructive">{c.blockers[0]}</span>
                  )}
                </td>
                <td className={cn("px-4 py-2.5 font-medium", c.daysInStage > 7 ? "text-destructive" : "text-muted-foreground")}>
                  {c.daysInStage}d
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <ActionBtn
                      icon={FileText}
                      label="Generate Case Coordination Doc"
                      onClick={() =>
                        toast.success("Case coordination doc generated", {
                          description: `${c.childName} · sent to clinical team`,
                        })
                      }
                    />
                    <ActionBtn
                      icon={Mail}
                      label="Send Pairing Email"
                      onClick={() =>
                        toast.success("Pairing email sent", {
                          description: `${c.childName} · ${c.parentName}`,
                        })
                      }
                    />
                    <ActionBtn
                      icon={CalendarPlus}
                      label="Set Start Date"
                      onClick={() =>
                        toast("Set start date", {
                          description: `Open scheduler for ${c.childName}`,
                        })
                      }
                    />
                  </div>
                </td>
              </>
            )}
            onRowClick={(c) => navigate(`/clients/${c.id}`)}
          />
        </TabsContent>

        <TabsContent value="staffing" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Kpi label="RBTs" value={metrics.rbtCount} />
            <Kpi label="Capacity Hours" value={`${metrics.rbtCapacityHours}h`} />
            <Kpi
              label="Assigned Hours"
              value={`${metrics.rbtAssignedHours}h`}
              hint={`${Math.round(metrics.rbtCapacityHours > 0 ? (metrics.rbtAssignedHours / metrics.rbtCapacityHours) * 100 : 0)}% utilized`}
            />
          </div>
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
            {rbts.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">No RBTs assigned to this location</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["RBT", "Status", "Hours", "Utilization"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rbts.map((r) => {
                    const util = getRBTUtilization(r);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/ops/staffing/rbt/${r.id}`)}
                        className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer"
                      >
                        <td className="px-4 py-2.5 font-medium text-foreground">{r.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.status}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{r.assignedHours}h / {r.capacityHours}h</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", util >= 95 ? "bg-destructive" : util >= 75 ? "bg-warning" : "bg-success")}
                                style={{ width: `${Math.min(util, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">{Math.round(util)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-4">
          <ClientTable
            clients={upcomingAssessments}
            columns={["Client", "BCBA", "Date", "Time"]}
            renderRow={(c) => (
              <>
                <td className="px-4 py-2.5 font-medium text-foreground">{c.childName}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.bcba ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.assessmentDate ?? "TBD"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">10:00 AM</td>
              </>
            )}
            onRowClick={(c) => navigate(`/clients/${c.id}`)}
          />
        </TabsContent>

        <TabsContent value="qa" className="mt-4">
          <ClientTable
            clients={stuckInQA}
            columns={["Client", "Stage", "Auth Status", "Days Stuck"]}
            renderRow={(c) => (
              <>
                <td className="px-4 py-2.5 font-medium text-foreground">{c.childName}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={c.stage} variant={stageVariant(c.stage)} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{c.authStatus}</td>
                <td className={cn("px-4 py-2.5 font-medium", c.daysInStage > 7 ? "text-destructive" : "text-muted-foreground")}>
                  {c.daysInStage}d
                </td>
              </>
            )}
            onRowClick={(c) => navigate(`/clients/${c.id}`)}
          />
        </TabsContent>

        {clinic.isPhysical && (
          <TabsContent value="schedule" className="mt-4">
            <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground">Weekly Utilization Grid</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Therapist allocation across the clinic</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-16">Time</th>
                      {weekDays.map((d) => (
                        <th key={d} className="text-left px-3 py-2 font-medium text-muted-foreground">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => (
                      <tr key={slot} className="border-b border-border/20">
                        <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{slot}</td>
                        {weekDays.map((d) => {
                          const used = rbts.reduce((count, r) => {
                            const block = r.schedule.find((s) => s.day === d && slot >= s.start && slot < s.end);
                            return count + (block ? 1 : 0);
                          }, 0);
                          const pct = rbts.length > 0 ? used / rbts.length : 0;
                          return (
                            <td key={d} className="px-1 py-1">
                              <div
                                className={cn(
                                  "h-6 rounded text-[10px] font-medium flex items-center justify-center",
                                  pct === 0
                                    ? "bg-muted/30 text-muted-foreground"
                                    : pct < 0.5
                                      ? "bg-success/15 text-success"
                                      : pct < 0.85
                                        ? "bg-warning/15 text-warning"
                                        : "bg-destructive/15 text-destructive",
                                )}
                              >
                                {used > 0 ? `${used}/${rbts.length}` : ""}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="bg-card rounded-xl border border-border/60 p-3.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold mt-1 tabular-nums", toneClass)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ClientTable<T extends { id: string }>({
  clients,
  columns,
  renderRow,
  onRowClick,
}: {
  clients: T[];
  columns: string[];
  renderRow: (c: T) => React.ReactNode;
  onRowClick: (c: T) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      {clients.length === 0 ? (
        <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">No items in this group</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                onClick={() => onRowClick(c)}
                className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer"
              >
                {renderRow(c)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
