import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, ClipboardList, Inbox,
  PhoneCall, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import {
  useActivityFeed,
  filterActivityEvents,
  listKnownSourceSystems,
  type ActivityEvent,
  type ActivityEventType,
  type ActivityObjectType,
  type ActivitySeverity,
} from "@/lib/activity/activityTimeline";

const OBJECT_TYPES: { value: ActivityObjectType | "all"; label: string }[] = [
  { value: "all", label: "All objects" },
  { value: "lead", label: "Leads" },
  { value: "patient", label: "Patients" },
  { value: "source_event", label: "Source events" },
  { value: "call", label: "Calls" },
  { value: "email", label: "Emails" },
  { value: "task", label: "Tasks" },
  { value: "user", label: "Users" },
  { value: "system", label: "System" },
];

const EVENT_TYPES: { value: ActivityEventType | "all"; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "lead_created", label: "Lead created" },
  { value: "stage_changed", label: "Stage changed" },
  { value: "contact_logged", label: "Contact logged" },
  { value: "call_received", label: "Call received" },
  { value: "call_made", label: "Call made" },
  { value: "email_sent", label: "Email sent" },
  { value: "task_created", label: "Task created" },
  { value: "task_completed", label: "Task completed" },
  { value: "missing_info_flagged", label: "Missing info flagged" },
  { value: "escalation_created", label: "Escalation created" },
  { value: "escalation_resolved", label: "Escalation resolved" },
  { value: "source_event_received", label: "Source event received" },
  { value: "source_event_converted", label: "Source converted" },
  { value: "source_event_attached", label: "Source attached" },
  { value: "file_uploaded", label: "File uploaded" },
  { value: "login_viewed", label: "Login viewed (audit)" },
  { value: "nfc_badge_updated", label: "NFC badge updated" },
  { value: "report_viewed", label: "Report viewed" },
  { value: "integration_event", label: "Integration event" },
];

const SEVERITIES: { value: ActivitySeverity | "all"; label: string }[] = [
  { value: "all", label: "Any severity" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function KpiCard({ icon: Icon, label, value, tone }: {
  icon: typeof Activity; label: string; value: number | string; tone?: string;
}) {
  return (
    <Card className="p-4 rounded-2xl border-border/60">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg grid place-items-center ${tone ?? "bg-muted text-muted-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold text-foreground leading-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

export default function ActivityCenterPage() {
  const { events } = useActivityFeed({ limit: 500 });
  const [selected, setSelected] = useState<ActivityEvent | null>(null);

  const [objectType, setObjectType] = useState<ActivityObjectType | "all">("all");
  const [eventType, setEventType] = useState<ActivityEventType | "all">("all");
  const [severity, setSeverity] = useState<ActivitySeverity | "all">("all");
  const [sourceSystem, setSourceSystem] = useState<string | "all">("all");

  const knownSources = useMemo(() => listKnownSourceSystems(events), [events]);
  const filtered = useMemo(
    () =>
      filterActivityEvents(events, {
        objectType,
        eventType,
        severity,
        sourceSystem,
      }),
    [events, objectType, eventType, severity, sourceSystem],
  );

  const kpi = useMemo(() => {
    const todayEvents = events.filter((e) => isToday(e.occurredAt));
    return {
      eventsToday: todayEvents.length,
      openEscalations: events.filter(
        (e) => e.type === "escalation_created" && e.status !== "complete",
      ).length,
      overdueTasks: events.filter((e) => e.type === "task_created" && e.status === "open").length,
      callsToday: todayEvents.filter((e) => e.type === "call_received" || e.type === "call_made").length,
      sourceToday: todayEvents.filter((e) => e.objectType === "source_event").length,
      critical: events.filter((e) => e.severity === "critical").length,
    };
  }, [events]);

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <Activity className="h-3.5 w-3.5" /> Communications
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Activity Center</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Calls, emails, lead updates, patient activity, tasks, escalations, and system actions
              in one operating timeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/communications/patient-activity">Patient activity</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/communications/user-activity">User activity</Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Activity} label="Events today" value={kpi.eventsToday} tone="bg-primary/10 text-primary" />
          <KpiCard icon={Sparkles} label="Open escalations" value={kpi.openEscalations} tone="bg-red-50 text-red-700" />
          <KpiCard icon={ClipboardList} label="Open tasks" value={kpi.overdueTasks} tone="bg-amber-50 text-amber-700" />
          <KpiCard icon={PhoneCall} label="Calls today" value={kpi.callsToday} tone="bg-sky-50 text-sky-700" />
          <KpiCard icon={Inbox} label="Source events today" value={kpi.sourceToday} tone="bg-violet-50 text-violet-700" />
          <KpiCard icon={AlertTriangle} label="Critical" value={kpi.critical} tone="bg-red-50 text-red-700" />
        </div>

        <Card className="p-4 rounded-2xl border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={objectType} onValueChange={(v) => setObjectType(v as ActivityObjectType | "all")}>
              <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBJECT_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={eventType} onValueChange={(v) => setEventType(v as ActivityEventType | "all")}>
              <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {EVENT_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => setSeverity(v as ActivitySeverity | "all")}>
              <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceSystem} onValueChange={setSourceSystem}>
              <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="Source system" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All source systems</SelectItem>
                {knownSources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length} of {events.length} events
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <Card className="p-4 rounded-2xl border-border/60">
            <ActivityTimeline
              events={filtered}
              showFilters
              onSelect={setSelected}
              selectedId={selected?.id}
              emptyMessage="No activity matches the current filters."
            />
          </Card>

          <Card className="p-4 rounded-2xl border-border/60 lg:sticky lg:top-4 h-fit">
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">{selected.sourceSystem ?? "Blossom OS"}</div>
                    <h3 className="text-base font-semibold">{selected.title}</h3>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {selected.summary && (
                  <p className="text-sm text-muted-foreground">{selected.summary}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground">When</div>
                    <div>{new Date(selected.occurredAt).toLocaleString()}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground">Actor</div>
                    <div>{selected.actorName ?? "System"}{selected.actorRole ? ` · ${selected.actorRole}` : ""}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground">Object</div>
                    <div className="capitalize">{selected.objectType.replace(/_/g, " ")}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground">Severity</div>
                    <div className="capitalize">{selected.severity ?? "info"}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.relatedLeadId && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/patient-journey?leadId=${selected.relatedLeadId}`}>Open Patient Journey</Link>
                    </Button>
                  )}
                  {selected.objectType === "source_event" && selected.objectId && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/marketing/lead-source-inbox`}>Open Source Inbox</Link>
                    </Button>
                  )}
                  {selected.type === "file_uploaded" && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/system/bcba-productivity-uploads">View upload batch</Link>
                    </Button>
                  )}
                </div>
                {(selected.type === "login_viewed" || selected.type === "nfc_badge_updated") && (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3" /> Sensitive content is audited but never exposed in the activity stream.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <div className="font-medium text-foreground mb-1 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Activity details
                </div>
                Select an event in the timeline to see who, what, when, and where it came from, plus next-step actions.
              </div>
            )}
          </Card>
        </div>

        <Card className="p-4 rounded-2xl border-border/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> What this powers
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                Lead actions, source events, communications, tasks, escalations, BCBA Productivity uploads,
                login vault audits, and NFC badge updates all normalize into this timeline — ready for
                CTM, Retell AI, LeadTrap, Google/Facebook Ads, Mailchimp, Outlook, Jivetel, Calendly,
                Apploi, and CentralReach integrations to write into the same stream.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">Sprint 11</Badge>
          </div>
        </Card>
      </div>
    </OSShell>
  );
}