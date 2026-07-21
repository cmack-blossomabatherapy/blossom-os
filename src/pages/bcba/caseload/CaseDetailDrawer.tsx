import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ExternalLink, MessageSquare, Users, Calendar, FileText, HeartHandshake,
  AlertTriangle, LifeBuoy, History, Link as LinkIcon, StickyNote, ShieldAlert,
} from "lucide-react";
import { HEALTH_LABEL, HEALTH_TONE } from "./caseHealth";
import type { CaseloadRow } from "./useCaseload";
import { useBcbaIdentity } from "../useBcbaIdentity";

/* -------------------------------------------------------------------------- */

function SourceBadge({ source, freshAt, stale }: { source: string; freshAt?: string | null; stale?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${stale ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-muted border-border text-muted-foreground"}`}>
      <LinkIcon className="h-2.5 w-2.5" />
      {source}
      {freshAt && <span className="opacity-70">· {new Date(freshAt).toLocaleDateString()}</span>}
    </span>
  );
}

function Field({ label, value, source, freshAt, stale }: { label: string; value: React.ReactNode; source?: string; freshAt?: string | null; stale?: boolean }) {
  return (
    <div className="py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        {source && <SourceBadge source={source} freshAt={freshAt} stale={stale} />}
      </div>
      <div className="text-sm mt-0.5">{value ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick actions — write to bcba_client_notes / bcba_workflow_activity_events */
/* -------------------------------------------------------------------------- */

function QuickActions({ row, onLog }: { row: CaseloadRow; onLog: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const { readOnly } = useBcbaIdentity();

  async function logEvent(eventType: string, summary: string) {
    if (readOnly) { toast.info("Read-only in preview mode."); return; }
    setBusy(eventType);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("bcba_workflow_activity_events").insert({
        actor_id: user.id, bcba_id: user.id,
        client_id: row.clientId, client_name: row.approvedIdentifier,
        source_table: "caseload_quick_action", source_record_id: row.clientId,
        event_type: eventType, summary,
      });
      if (error) throw error;
      toast.success(summary);
      onLog();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(null); }
  }

  const actions: { key: string; label: string; icon: any; onClick: () => void }[] = [
    { key: "cr",        label: "Open CentralReach",        icon: ExternalLink,   onClick: () => window.open("https://members.centralreach.com/", "_blank") },
    { key: "rbt",       label: "Contact RBT",              icon: MessageSquare,  onClick: () => logEvent("contact_rbt", "Contacted RBT") },
    { key: "staffing",  label: "Request staffing support", icon: Users,          onClick: () => logEvent("staffing_support_request", "Requested staffing support") },
    { key: "sched",     label: "Request scheduling review",icon: Calendar,       onClick: () => logEvent("scheduling_review_request", "Requested scheduling review") },
    { key: "pr",        label: "Submit PR status",         icon: FileText,       onClick: () => logEvent("progress_report_status", "Progress report status submitted") },
    { key: "auth",      label: "Request auth support",     icon: ShieldAlert,    onClick: () => logEvent("auth_support_request", "Requested authorization support") },
    { key: "family",    label: "Report family barrier",    icon: HeartHandshake, onClick: () => logEvent("family_barrier",  "Reported family barrier") },
    { key: "escalate",  label: "Escalate clinical",        icon: AlertTriangle,  onClick: () => logEvent("clinical_escalation", "Escalated clinical concern") },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {actions.map((a) => (
        <Button key={a.key} variant="outline" size="sm"
          disabled={busy === a.key || (a.key !== "cr" && readOnly)}
          onClick={a.onClick}
          className="justify-start gap-2 h-auto py-2">
          <a.icon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs truncate">{a.label}</span>
        </Button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Operational notes                                                          */
/* -------------------------------------------------------------------------- */

function OperationalNotes({ clientId }: { clientId: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { readOnly } = useBcbaIdentity();
  const notes = useQuery({
    queryKey: ["case-notes", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("bcba_client_notes")
        .select("id,body,note_type,visibility,created_at")
        .eq("client_id", clientId).order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  async function add() {
    if (!text.trim()) return;
    if (readOnly) { toast.info("Read-only in preview mode."); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      // Operational notes are labelled and permission-scoped (visibility=team).
      const { error } = await supabase.from("bcba_client_notes").insert({
        client_id: clientId, author_id: user.id, bcba_id: user.id,
        note_type: "operational", visibility: "team", body: text,
      });
      if (error) throw error;
      setText(""); notes.refetch(); toast.success("Operational note added");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Textarea placeholder="Add an operational note — visible to your clinical team"
          value={text} onChange={(e) => setText(e.target.value)} rows={2} className="text-sm" />
        <Button onClick={add} disabled={busy || !text.trim() || readOnly} size="sm">
          {readOnly ? "Read-only" : "Add"}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <StickyNote className="h-3 w-3" /> Operational notes only. Do not include clinical documentation — use CentralReach.
      </p>
      <div className="space-y-2">
        {(notes.data ?? []).map((n: any) => (
          <div key={n.id} className="rounded-lg border bg-muted/30 p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-[10px] capitalize">{n.note_type ?? "note"}</Badge>
              <Badge variant="outline" className="text-[10px]">{n.visibility ?? "team"}</Badge>
              <span className="text-[10px] text-muted-foreground ml-auto">{new Date(n.created_at).toLocaleString()}</span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{n.body}</div>
          </div>
        ))}
        {notes.data?.length === 0 && (
          <div className="text-xs text-muted-foreground py-3 text-center">No operational notes yet.</div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Activity timeline                                                          */
/* -------------------------------------------------------------------------- */

function ActivityTimeline({ clientId }: { clientId: string }) {
  const q = useQuery({
    queryKey: ["case-activity", clientId],
    queryFn: async () => {
      const { data } = await supabase.from("bcba_workflow_activity_events")
        .select("id,event_type,summary,created_at,source_table")
        .eq("client_id", clientId).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  if (!q.data || q.data.length === 0) return <div className="text-xs text-muted-foreground py-4 text-center">No activity yet.</div>;
  return (
    <ol className="space-y-2">
      {q.data.map((e: any) => (
        <li key={e.id} className="flex items-start gap-3 border-l-2 border-border pl-3 py-1">
          <div className="flex-1 min-w-0">
            <div className="text-sm">{e.summary}</div>
            <div className="text-[10px] text-muted-foreground">
              {e.event_type} · {new Date(e.created_at).toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/*  Drawer                                                                     */
/* -------------------------------------------------------------------------- */

export function CaseDetailDrawer({
  row, open, onOpenChange, onRefresh,
}: {
  row: CaseloadRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRefresh: () => void;
}) {
  if (!row) return null;
  const h = row.health;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {row.approvedIdentifier}
            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${HEALTH_TONE[h.primary]}`}>
              {HEALTH_LABEL[h.primary]}
            </span>
            {row.sourceStale && <Badge variant="outline" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" /> Stale sync</Badge>}
          </SheetTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            {h.reasons.map((r, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                {r.label}{r.detail ? ` · ${r.detail}` : ""}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <div className="pt-4">
          <QuickActions row={row} onLog={onRefresh} />
        </div>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full flex flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Care team</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
            <TabsTrigger value="rbt">RBT support</TabsTrigger>
            <TabsTrigger value="parent">Parent training</TabsTrigger>
            <TabsTrigger value="concerns">Concerns</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="cr">CentralReach</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <Field label="Client" value={row.approvedIdentifier} source={row.fields.approvedIdentifier?.source} />
            <Field label="Service status" value={row.serviceStatus} source={row.fields.serviceStatus?.source} />
            <Field label="Service setting" value={row.serviceSetting} />
            <Field label="Assignment start" value={row.assignmentStartDate ? new Date(row.assignmentStartDate).toLocaleDateString() : null} />
            <Field label="Staffing status" value={row.staffingStatus} source={row.fields.staffingStatus?.source} />
            <OperationalNotes clientId={row.clientId} />
          </TabsContent>

          <TabsContent value="team" className="mt-3">
            <Field label="Assigned RBTs" value={
              row.assignedRbts.length === 0 ? "—" :
              <ul className="space-y-1">
                {row.assignedRbts.map((r, i) => (
                  <li key={i} className="text-sm">
                    {r.name ?? r.id}
                    {r.startDate && <span className="text-muted-foreground ml-2 text-xs">since {new Date(r.startDate).toLocaleDateString()}</span>}
                  </li>
                ))}
              </ul>
            } />
          </TabsContent>

          <TabsContent value="schedule" className="mt-3">
            <Field label="Weekly scheduled" value={row.weeklyScheduledHours != null ? `${row.weeklyScheduledHours}h` : null} source={row.fields.weeklyScheduledHours?.source} />
            <Field label="Delivered (weekly)" value={row.deliveredHours != null ? `${row.deliveredHours}h` : null} source={row.fields.deliveredHours?.source} />
            <Field label="Cancelled (last 4wk)" value={`${row.cancelledHours ?? 0}h · ${row.cancellationTrend} sessions`} source={row.fields.cancelledHours?.source} />
            <Field label="Utilization" value={row.utilizationPct != null ? `${row.utilizationPct}%` : null} />
          </TabsContent>

          <TabsContent value="deadlines" className="mt-3">
            <Field label="Authorization" value={row.authStart && row.authEnd ? `${new Date(row.authStart).toLocaleDateString()} → ${new Date(row.authEnd).toLocaleDateString()}` : null} source={row.fields.authEnd?.source} />
            <Field label="Authorized units" value={row.authorizedUnits} source={row.fields.authorizedUnits?.source} />
            <Field label="Used units" value={row.usedUnits} />
            <Field label="Remaining units" value={row.remainingUnits} />
            <Field label="Progress report due" value={row.progressReportDueAt ? new Date(row.progressReportDueAt).toLocaleDateString() : null} />
            <Field label="Treatment plan status" value={row.treatmentPlanStatus} />
            <Field label="Assessment status" value={row.assessmentStatus} />
          </TabsContent>

          <TabsContent value="rbt" className="mt-3">
            <div className="text-sm text-muted-foreground">
              Use the quick actions above to request staffing support or contact your RBT.
              Supervision cadence and RBT coaching notes appear here as they are recorded.
            </div>
          </TabsContent>

          <TabsContent value="parent" className="mt-3">
            <Field label="Parent training status" value={row.parentTrainingStatus} />
            <Field label="Next PT due" value={row.parentTrainingNextDueAt ? new Date(row.parentTrainingNextDueAt).toLocaleDateString() : null} />
          </TabsContent>

          <TabsContent value="concerns" className="mt-3">
            <Field label="Open concerns" value={row.openSupportConcerns} />
            <Field label="Cancellation trend" value={`${row.cancellationTrend} in last 4 weeks`} />
          </TabsContent>

          <TabsContent value="support" className="mt-3">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <LifeBuoy className="h-4 w-4" />
              Open support tickets routed to your team appear here. Use "Escalate clinical" above for urgent issues.
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Recent actions on this case
            </div>
            <ActivityTimeline clientId={row.clientId} />
          </TabsContent>

          <TabsContent value="cr" className="mt-3 space-y-3">
            <Field label="Last CentralReach sync" value={row.lastCrSync ? new Date(row.lastCrSync).toLocaleString() : "Never"}
                   source="CentralReach" freshAt={row.lastCrSync} stale={row.sourceStale} />
            <Button variant="outline" size="sm" onClick={() => window.open("https://members.centralreach.com/", "_blank")} className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> Open in CentralReach
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Blossom OS is not a clinical chart. Session notes, documentation, and billing live in CentralReach.
            </p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}