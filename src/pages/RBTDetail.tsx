import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Award, Clock, Users, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { findProfileById, getRBTUtilization, statusVariant } from "@/data/staffing";
import { mockClients } from "@/data/clients";
import { weekDays, timeSlots } from "@/data/scheduling";

export default function RBTDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rbt = id ? findProfileById(id) : undefined;

  if (!rbt) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Staff member not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/staffing")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Staffing
        </Button>
      </div>
    );
  }

  const util = getRBTUtilization(rbt);
  const remaining = rbt.capacityHours - rbt.assignedHours;
  const assignedClients = mockClients.filter((c) => rbt.assignedClientIds.includes(c.id));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <button
          onClick={() => navigate("/staffing")}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Staffing
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">
              {rbt.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{rbt.name}</h1>
                <StatusBadge status={rbt.status} variant={statusVariant(rbt.status)} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {rbt.state} · {rbt.clinic}</span>
                <span className="inline-flex items-center gap-1"><Award className="h-3 w-3" /> {rbt.experience}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {assignedClients.length} clients</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Edit Profile</Button>
            <Button size="sm">Assign Client</Button>
          </div>
        </div>
      </div>

      {/* Snapshot KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Assigned Hours" value={`${rbt.assignedHours}h`} hint={`of ${rbt.capacityHours}h capacity`} />
        <KpiTile label="Remaining" value={`${remaining}h`} hint="weekly availability" tone={remaining <= 0 ? "destructive" : "success"} />
        <KpiTile label="Utilization" value={`${Math.round(util)}%`} hint={util >= 95 ? "Overloaded" : util >= 75 ? "High load" : "Healthy"} tone={util >= 95 ? "destructive" : util >= 75 ? "warning" : "success"} />
        <KpiTile label="Active Clients" value={`${assignedClients.length}`} hint="currently assigned" />
      </div>

      <Tabs defaultValue="availability">
        <TabsList>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="clients">Assigned Clients</TabsTrigger>
          <TabsTrigger value="history">Match History</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Weekly Availability Grid</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Filled blocks show assigned sessions</p>
              </div>
              <div className="flex items-center gap-1">
                {rbt.availability.map((a) => (
                  <span key={a} className="text-[10px] uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {a}
                  </span>
                ))}
              </div>
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
                        const block = rbt.schedule.find(
                          (s) => s.day === d && slot >= s.start && slot < s.end,
                        );
                        return (
                          <td key={d} className="px-1 py-1">
                            <div
                              className={cn(
                                "h-6 rounded text-[10px] font-medium flex items-center justify-center",
                                block ? "bg-primary/15 text-primary" : "bg-muted/30",
                              )}
                            >
                              {block ? "Booked" : ""}
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

        <TabsContent value="clients" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
            {assignedClients.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">No clients assigned</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Client", "Hours/Week", "BCBA", "Stage"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignedClients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer"
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">{c.childName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 20 hr/wk
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.bcba ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.stage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4">
            {rbt.matchHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No prior assignments recorded</p>
            ) : (
              <ul className="space-y-2.5">
                {rbt.matchHistory.map((m, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums w-24">{m.date}</span>
                      <span className="text-foreground">{m.clientName}</span>
                    </div>
                    <StatusBadge
                      status={m.event}
                      variant={m.event === "Assigned" ? "success" : m.event === "Removed" ? "warning" : "destructive"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4 space-y-2">
            {rbt.tasks.map((t) => (
              <label key={t.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  defaultChecked={t.completed}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className={cn(t.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                  {t.title}
                </span>
              </label>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="bg-card rounded-xl border border-border/60 p-4">
            <ol className="space-y-3">
              {rbt.timeline.map((e, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CalIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-foreground">{e.event}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{e.date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="bg-card rounded-xl border border-border/60 p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold mt-1", toneClass)}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
