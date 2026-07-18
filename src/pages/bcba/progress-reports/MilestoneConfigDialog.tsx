import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMilestones, useUpsertMilestone, useDeleteMilestone, type Milestone } from "./useProgressReports";
import type { RiskLevel } from "./pipeline";

const EMPTY: Partial<Milestone> = {
  name: "",
  days_before_expiration: 30,
  payer: null,
  state: null,
  is_active: true,
  show_on_dashboard: true,
  notify_bcba: true,
  create_task: false,
  visible_to_authorization_team: true,
  visible_to_state_leadership: false,
  escalate_to_clinical_leadership: false,
  offer_support: true,
  risk_level: "watch",
  employee_message: "",
  due_date_language: "",
  sort_order: 0,
};

export default function MilestoneConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: milestones = [], isLoading } = useMilestones();
  const upsert = useUpsertMilestone();
  const del = useDeleteMilestone();

  const [editing, setEditing] = useState<Partial<Milestone> | null>(null);

  const save = async () => {
    if (!editing) return;
    if (!editing.name || !editing.employee_message || !editing.due_date_language) {
      toast.error("Name, message and due-date language are required");
      return;
    }
    try {
      await upsert.mutateAsync(editing);
      toast.success("Milestone saved");
      setEditing(null);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Milestone rules</DialogTitle></DialogHeader>
        <div className="text-xs text-muted-foreground -mt-2 mb-3">
          Configure when BCBAs, authorization staff, and leadership see progress-report warnings, and how the messages read.
        </div>

        {editing ? (
          <MilestoneEditor value={editing} onChange={setEditing} />
        ) : isLoading ? (
          <div className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {milestones.map((m) => (
              <div key={m.id} className="rounded-lg border border-border/70 bg-card p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{m.name} · {m.days_before_expiration} days out</div>
                  <div className="text-xs text-muted-foreground truncate">{m.employee_message}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {[
                      m.is_active ? "Active" : "Off",
                      m.risk_level,
                      m.payer ? `Payer: ${m.payer}` : null,
                      m.state ? `State: ${m.state}` : null,
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    if (!confirm("Delete this milestone?")) return;
                    try { await del.mutateAsync(m.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message ?? "Failed"); }
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(null)}>Back</Button>
              <Button onClick={save} disabled={upsert.isPending}>
                {upsert.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Save milestone
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => setEditing({ ...EMPTY })}><Plus className="h-4 w-4 mr-1" /> Add milestone</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MilestoneEditor({ value, onChange }: { value: Partial<Milestone>; onChange: (v: Partial<Milestone>) => void }) {
  const set = <K extends keyof Milestone>(k: K, v: Milestone[K] | null) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={value.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 6 weeks out" />
        </div>
        <div>
          <Label>Days before expiration</Label>
          <Input type="number" value={value.days_before_expiration ?? 0} onChange={(e) => set("days_before_expiration", Number(e.target.value))} />
        </div>
        <div>
          <Label>Payer scope (optional)</Label>
          <Input value={value.payer ?? ""} onChange={(e) => set("payer", e.target.value || null)} placeholder="All payers if blank" />
        </div>
        <div>
          <Label>State scope (optional)</Label>
          <Input value={value.state ?? ""} onChange={(e) => set("state", e.target.value || null)} placeholder="All states if blank" />
        </div>
        <div>
          <Label>Risk level</Label>
          <Select value={value.risk_level ?? "watch"} onValueChange={(v) => set("risk_level", v as RiskLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Healthy</SelectItem>
              <SelectItem value="watch">Watch</SelectItem>
              <SelectItem value="elevated">Elevated</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sort order</Label>
          <Input type="number" value={value.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
        </div>
      </div>

      <div>
        <Label>Employee-facing message</Label>
        <Input value={value.employee_message ?? ""} onChange={(e) => set("employee_message", e.target.value)}
          placeholder="e.g. Progress report due in 21 days." />
        <p className="text-[11px] text-muted-foreground mt-1">Keep it calm. Never threatening or vague.</p>
      </div>
      <div>
        <Label>Due-date language</Label>
        <Input value={value.due_date_language ?? ""} onChange={(e) => set("due_date_language", e.target.value)}
          placeholder="e.g. Due in 3 weeks" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Toggle label="Active" value={!!value.is_active} onChange={(v) => set("is_active", v)} />
        <Toggle label="Show on dashboard" value={!!value.show_on_dashboard} onChange={(v) => set("show_on_dashboard", v)} />
        <Toggle label="Notify BCBA" value={!!value.notify_bcba} onChange={(v) => set("notify_bcba", v)} />
        <Toggle label="Create task" value={!!value.create_task} onChange={(v) => set("create_task", v)} />
        <Toggle label="Visible to authorization team" value={!!value.visible_to_authorization_team} onChange={(v) => set("visible_to_authorization_team", v)} />
        <Toggle label="Visible to state leadership" value={!!value.visible_to_state_leadership} onChange={(v) => set("visible_to_state_leadership", v)} />
        <Toggle label="Escalate to clinical leadership" value={!!value.escalate_to_clinical_leadership} onChange={(v) => set("escalate_to_clinical_leadership", v)} />
        <Toggle label="Offer support quick actions" value={!!value.offer_support} onChange={(v) => set("offer_support", v)} />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}