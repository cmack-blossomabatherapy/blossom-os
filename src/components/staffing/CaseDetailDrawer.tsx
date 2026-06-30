import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AlertTriangle, ClipboardList, HeartHandshake, ListChecks, Plus, UserCheck, X } from "lucide-react";
import { useStaffingWorkspace } from "@/hooks/useStaffingWorkspace";
import type { Client } from "@/data/clients";
import type { StaffingActivityType, StaffingActivityStatus } from "@/lib/os/staffing/types";
import { ProposeMatchDialog } from "./ProposeMatchDialog";

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
  const { matches, preferences, activity, saveActivity } = useStaffingWorkspace();
  const [proposeOpen, setProposeOpen] = useState(false);
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
    setActType("note"); setActTitle(""); setActDetail(""); setActOwner(""); setActDue(""); setActStatus("open");
  };

  const addActivity = async () => {
    if (!client || !actTitle.trim()) return;
    await saveActivity({
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

  if (!client) return null;
  const approvedHrs = client.approvedWeeklyHours ?? 0;
  const scheduledHrs = client.scheduledWeeklyHours ?? 0;
  const gap = Math.max(0, approvedHrs - scheduledHrs);

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

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Approved</div><div className="text-lg font-semibold">{approvedHrs}h</div></Card>
            <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Scheduled</div><div className="text-lg font-semibold">{scheduledHrs}h</div></Card>
            <Card className={cn("p-3", gap > 0 && "border-warning/50")}><div className="text-[10px] uppercase text-muted-foreground">Gap</div><div className={cn("text-lg font-semibold", gap > 0 && "text-warning")}>{gap}h</div></Card>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setProposeOpen(true)}><UserCheck className="h-3.5 w-3.5 mr-1" /> Propose match</Button>
            {onJumpMap && <Button size="sm" variant="outline" onClick={onJumpMap}>Open in Live Map</Button>}
            {onJumpQueue && <Button size="sm" variant="outline" onClick={onJumpQueue}>Match Queue</Button>}
          </div>

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
            <h3 className="text-sm font-semibold inline-flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Case activity ({clientActivity.length})</h3>
            <Card className="p-3 space-y-2 bg-muted/20 border-border/40">
              <div className="grid grid-cols-2 gap-2">
                <select className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs" value={actType} onChange={(e) => setActType(e.target.value as StaffingActivityType)}>
                  <option value="note">Note</option>
                  <option value="escalation">Escalation</option>
                  <option value="blocked">Blocked</option>
                  <option value="task">Task</option>
                  <option value="handoff">Handoff</option>
                </select>
                <select className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs" value={actStatus} onChange={(e) => setActStatus(e.target.value as StaffingActivityStatus)}>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="watching">Watching</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <Input className="h-8 text-xs" placeholder="Title" value={actTitle} onChange={(e) => setActTitle(e.target.value)} />
              <Textarea rows={2} placeholder="Detail" value={actDetail} onChange={(e) => setActDetail(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input className="h-8 text-xs" placeholder="Owner" value={actOwner} onChange={(e) => setActOwner(e.target.value)} />
                <Input className="h-8 text-xs" type="date" value={actDue} onChange={(e) => setActDue(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button size="sm" disabled={!actTitle.trim()} onClick={addActivity}><Plus className="h-3.5 w-3.5 mr-1" /> Save activity</Button>
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
                    <Badge variant="outline" className="text-[10px] capitalize">{a.status.replace(/_/g, " ")}</Badge>
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
        onOpenChange={setProposeOpen}
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