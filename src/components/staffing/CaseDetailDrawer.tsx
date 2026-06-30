import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Ban, ClipboardList, Edit2, Eye, HeartHandshake, ListChecks,
  Plus, Sparkles, Trash2, UserCheck, X,
} from "lucide-react";
import { useStaffingWorkspace } from "@/hooks/useStaffingWorkspace";
import type { Client } from "@/data/clients";
import type { StaffingActivityType, StaffingActivityStatus } from "@/lib/os/staffing/types";
import { ProposeMatchDialog } from "./ProposeMatchDialog";
import { mockRBTProfiles } from "@/data/staffing";
import { distanceBetween, type StaffingMapPoint } from "@/lib/os/staffing/mapAdapter";
import { applyPreferenceScoring } from "@/lib/os/staffing/preferenceScoring";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client: Client | null;
  onJumpMap?: () => void;
  onJumpQueue?: () => void;
}

const ACTIVITY_LABEL: Record<StaffingActivityType, string> = {
  note: "Note",
  escalation: "Escalation",
  blocked: "Blocked",
  task: "Task",
  handoff: "Handoff",
  status_change: "Status change",
};

export function CaseDetailDrawer({ open, onOpenChange, client, onJumpMap, onJumpQueue }: Props) {
  const { matches, preferences, activity, saveActivity, removeActivity } = useStaffingWorkspace();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actType, setActType] = useState<StaffingActivityType>("note");
  const [actTitle, setActTitle] = useState("");
  const [actDetail, setActDetail] = useState("");
  const [actOwner, setActOwner] = useState("");
  const [actDue, setActDue] = useState("");
  const [actStatus, setActStatus] = useState<StaffingActivityStatus>("open");

  const clientMatches = useMemo(
    () => (client ? matches.filter((m) => m.client_id === client.id) : []),
    [matches, client],
  );
  const clientPrefs = useMemo(
    () => (client ? preferences.filter((p) => p.client_id === client.id || p.client_name.toLowerCase() === client.childName.toLowerCase()) : []),
    [preferences, client],
  );
  const clientActivity = useMemo(
    () => (client ? activity.filter((a) => a.client_id === client.id || a.client_name === client.childName) : []),
    [activity, client],
  );

  const reset = () => {
    setEditingId(null);
    setActType("note"); setActTitle(""); setActDetail(""); setActOwner(""); setActDue(""); setActStatus("open");
  };

  const saveActivityForm = async () => {
    if (!client || !actTitle.trim()) return;
    await saveActivity({
      id: editingId ?? undefined,
      client_id: client.id,
      client_name: client.childName,
      activity_type: actType,
      title: actTitle.trim(),
      detail: actDetail.trim() || null,
      owner: actOwner.trim() || null,
      due_date: actDue || null,
      status: actStatus,
    });
    reset();
  };

  const startEditActivity = (id: string) => {
    const a = clientActivity.find((x) => x.id === id);
    if (!a) return;
    setEditingId(a.id);
    setActType(a.activity_type);
    setActStatus(a.status);
    setActTitle(a.title);
    setActDetail(a.detail ?? "");
    setActOwner(a.owner ?? "");
    setActDue(a.due_date ?? "");
  };

  const quickAction = async (
    type: StaffingActivityType,
    status: StaffingActivityStatus,
    title: string,
  ) => {
    if (!client) return;
    await saveActivity({
      client_id: client.id,
      client_name: client.childName,
      activity_type: type,
      title,
      detail: null,
      owner: null,
      due_date: null,
      status,
    });
  };

  // Suggested RBTs preview (top 3) — hook MUST run unconditionally (call before any early return)
  const suggested = useMemoSuggested(client, clientPrefs);
  const [proposeRbtId, setProposeRbtId] = useState<string | null>(null);

  if (!client) return null;
  const approvedHrs = client.approvedWeeklyHours ?? 0;
  const scheduledHrs = client.scheduledWeeklyHours ?? 0;
  const gap = Math.max(0, approvedHrs - scheduledHrs);
  const gapPct = approvedHrs > 0 ? Math.round((gap / approvedHrs) * 100) : 0;

  // Risk reasons
  const risks: string[] = [];
  if (client.authStatus === "Approved" && !client.rbt) risks.push("Approved without RBT");
  if (client.stage === "Restaffing Needed") risks.push("Restaffing needed");
  if (approvedHrs > 0 && scheduledHrs < approvedHrs * 0.8) risks.push("Scheduled below 80% of approved");
  if (clientMatches.length === 0 && client.stage !== "Active") risks.push("No active proposal");
  if (clientPrefs.some((p) => p.importance === "must_have" || p.importance === "avoid")) {
    risks.push("Family preference constraint");
  }

  const openPropose = (rbtId: string | null) => {
    setProposeRbtId(rbtId);
    setProposeOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {client.childName}
              <Badge variant="secondary" className="text-[10px]">{client.stage}</Badge>
            </SheetTitle>
            <SheetDescription>{client.state} - {client.clinic ?? "no clinic"} - BCBA {client.bcba ?? "unassigned"}</SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Current RBT</div><div className="text-sm font-medium">{client.rbt ?? "Unassigned"}</div></Card>
            <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Auth status</div><div className="text-sm font-medium">{client.authStatus ?? "-"}</div></Card>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2 text-center">
            <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Approved</div><div className="text-base font-semibold">{approvedHrs}h</div></Card>
            <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Scheduled</div><div className="text-base font-semibold">{scheduledHrs}h</div></Card>
            <Card className={cn("p-3", gap > 0 && "border-warning/50")}><div className="text-[10px] uppercase text-muted-foreground">Gap</div><div className={cn("text-base font-semibold", gap > 0 && "text-warning")}>{gap}h</div></Card>
            <Card className={cn("p-3", gapPct >= 20 && "border-warning/50")}><div className="text-[10px] uppercase text-muted-foreground">Gap %</div><div className={cn("text-base font-semibold", gapPct >= 20 && "text-warning")}>{gapPct}%</div></Card>
          </div>

          {risks.length > 0 && (
            <Card className="p-3 mt-3 border-warning/40 bg-warning/5">
              <div className="text-[10px] uppercase text-warning font-semibold inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Risk reasons</div>
              <ul className="mt-1 text-xs space-y-0.5">
                {risks.map((r) => <li key={r}>- {r}</li>)}
              </ul>
            </Card>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openPropose(null)}><UserCheck className="h-3.5 w-3.5 mr-1" /> Propose match</Button>
            <Button size="sm" variant="outline" onClick={() => quickAction("note", "open", "Note added from drawer")}><Plus className="h-3.5 w-3.5 mr-1" /> Add note</Button>
            <Button size="sm" variant="outline" onClick={() => quickAction("blocked", "open", "Case marked blocked")}><Ban className="h-3.5 w-3.5 mr-1" /> Mark blocked</Button>
            <Button size="sm" variant="outline" onClick={() => quickAction("escalation", "open", "Case escalated")}><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Escalate</Button>
            <Button size="sm" variant="outline" onClick={() => quickAction("status_change", "watching", "Case set to watching")}><Eye className="h-3.5 w-3.5 mr-1" /> Watch</Button>
            <Button size="sm" variant="outline" onClick={() => quickAction("status_change", "resolved", "Case resolved")}>Resolve</Button>
            {onJumpMap && <Button size="sm" variant="outline" onClick={onJumpMap}>Open in Live Map</Button>}
            {onJumpQueue && <Button size="sm" variant="outline" onClick={onJumpQueue}>Match Queue</Button>}
          </div>

          <Separator className="my-4" />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Suggested RBTs (top 3)</h3>
            {suggested.length === 0 && <p className="text-xs text-muted-foreground italic">No suggestions available.</p>}
            {suggested.map((s) => (
              <div key={s.rbt.id} className={cn("flex items-center justify-between text-xs rounded-md border p-2", s.blocked ? "border-destructive/40 bg-destructive/5" : "border-border/40 bg-muted/20")}>
                <div className="min-w-0">
                  <div className="font-medium">{s.rbt.name}</div>
                  <div className="text-[10px] text-muted-foreground">{s.rbt.state} - {s.miles != null ? `${s.miles} mi` : "no distance"} - {s.remaining}h open</div>
                  {s.blocked && <div className="text-[10px] text-destructive inline-flex items-center gap-1"><Ban className="h-3 w-3" /> Blocked by preference</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{s.score}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2" disabled={s.blocked} onClick={() => openPropose(s.rbt.id)}>Propose</Button>
                </div>
              </div>
            ))}
          </section>

          <Separator className="my-4" />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><ListChecks className="h-4 w-4" /> Match proposals ({clientMatches.length})</h3>
            {clientMatches.length === 0 && <p className="text-xs text-muted-foreground italic">No proposals yet.</p>}
            {clientMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs rounded-md border border-border/40 bg-muted/20 p-2">
                <span><span className="font-medium">{m.rbt_name}</span> - {m.match_score}%</span>
                <Badge variant="outline">{m.status}</Badge>
              </div>
            ))}
          </section>

          <Separator className="my-4" />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> Active preferences ({clientPrefs.length})</h3>
            {clientPrefs.length === 0 && <p className="text-xs text-muted-foreground italic">None.</p>}
            {clientPrefs.map((p) => (
              <div key={p.id} className="text-xs rounded-md border border-border/40 bg-muted/20 p-2">
                <div className="flex items-center justify-between">
                  <span className="capitalize">{p.preference_type.replace(/_/g, " ")}</span>
                  <Badge variant={p.importance === "must_have" ? "destructive" : p.importance === "avoid" ? "destructive" : "secondary"} className="text-[10px]">{p.importance.replace("_", " ")}</Badge>
                </div>
                <div className="text-muted-foreground">{p.preference_detail}</div>
              </div>
            ))}
          </section>

          <Separator className="my-4" />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold inline-flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Case activity ({clientActivity.length})</h3>
              {editingId && <button onClick={reset} className="text-[11px] text-muted-foreground hover:underline inline-flex items-center gap-1"><X className="h-3 w-3" /> Cancel edit</button>}
            </div>
            <Card className="p-3 space-y-2 bg-muted/20 border-border/40">
              <div className="grid grid-cols-2 gap-2">
                <select className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs" value={actType} onChange={(e) => setActType(e.target.value as StaffingActivityType)}>
                  <option value="note">Note</option>
                  <option value="escalation">Escalation</option>
                  <option value="blocked">Blocked</option>
                  <option value="task">Task</option>
                  <option value="handoff">Handoff</option>
                  <option value="status_change">Status change</option>
                </select>
                <select className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs" value={actStatus} onChange={(e) => setActStatus(e.target.value as StaffingActivityStatus)}>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="watching">Watching</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <Input className="h-8 text-xs" placeholder="Title" value={actTitle} onChange={(e) => setActTitle(e.target.value)} />
              <Textarea rows={2} placeholder="Detail" value={actDetail} onChange={(e) => setActDetail(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input className="h-8 text-xs" placeholder="Owner" value={actOwner} onChange={(e) => setActOwner(e.target.value)} />
                <Input className="h-8 text-xs" type="date" value={actDue} onChange={(e) => setActDue(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button size="sm" disabled={!actTitle.trim()} onClick={saveActivityForm}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {editingId ? "Update activity" : "Save activity"}
                </Button>
              </div>
            </Card>
            <div className="space-y-2">
              {clientActivity.map((a) => (
                <div key={a.id} className="text-xs rounded-md border border-border/40 bg-background p-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {a.activity_type === "escalation" || a.activity_type === "blocked" ? <AlertTriangle className="h-3 w-3 text-warning" /> : null}
                      {ACTIVITY_LABEL[a.activity_type]}: {a.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">{a.status.replace(/_/g, " ")}</Badge>
                      <button onClick={() => startEditActivity(a.id)} className="text-muted-foreground hover:text-foreground" title="Edit"><Edit2 className="h-3 w-3" /></button>
                      <button onClick={() => removeActivity(a.id)} className="text-muted-foreground hover:text-destructive" title="Remove"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  {a.detail && <div className="text-muted-foreground mt-1">{a.detail}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {a.owner ? `Owner: ${a.owner}` : "Unowned"}
                    {a.due_date ? ` - Due ${new Date(a.due_date).toLocaleDateString()}` : ""}
                    {" - "}
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {clientActivity.length === 0 && <p className="text-xs text-muted-foreground italic">No activity yet.</p>}
            </div>
          </section>
        </SheetContent>
      </Sheet>

      <ProposeMatchDialog
        open={proposeOpen}
        onOpenChange={(o) => { setProposeOpen(o); if (!o) setProposeRbtId(null); }}
        initialRbtId={proposeRbtId}
        caseInfo={{
          id: client.id,
          childName: client.childName,
          state: client.state,
          clinic: client.clinic ?? null,
          requiredHours: client.approvedWeeklyHours ?? 20,
        }}
        preferences={preferences}
      />
    </>
  );
}

export { X };

/* ------------------------- suggested-RBT helper -------------------------- */

function useMemoSuggested(
  client: Client | null,
  clientPrefs: ReturnType<typeof useStaffingWorkspace>["preferences"],
) {
  return useMemo(() => {
    if (!client) return [];
    const clientPoint: StaffingMapPoint = {
      id: client.id, kind: "client", name: client.childName,
      state: client.state, city: client.clinic ?? null, zip: null,
      lat: null, lon: null, hours: client.approvedWeeklyHours ?? 20,
    };
    return mockRBTProfiles
      .map((r) => {
        const rbtPoint: StaffingMapPoint = {
          id: r.id, kind: "rbt", name: r.name, state: r.state,
          city: r.clinic ?? null, zip: r.zip ?? null, lat: null, lon: null,
          hours: r.capacityHours - r.assignedHours,
        };
        const miles = distanceBetween(clientPoint, rbtPoint);
        const remaining = r.capacityHours - r.assignedHours;
        const sameState = r.state === client.state;
        const base = Math.max(0, Math.min(100,
          (sameState ? 60 : 30) +
          Math.min(20, remaining) +
          (miles !== null ? Math.max(0, 20 - Math.round(miles / 5)) : 0),
        ));
        const scored = applyPreferenceScoring(base, clientPrefs.filter((p) => p.status === "active"), {
          rbtName: r.name, rbtState: r.state,
        });
        return { rbt: r, miles, remaining, score: scored.score, blocked: scored.blocked };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [client, clientPrefs]);
}