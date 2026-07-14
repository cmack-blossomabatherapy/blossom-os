import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { useLeads } from "@/contexts/LeadsContext";
import { useIntakeTasksLive, type CreateIntakeTaskInput } from "@/hooks/useIntakeTasksLive";
import { cn } from "@/lib/utils";

type RelatedKind = "none" | "lead" | "client" | "employee" | "authorization" | "other";

interface Subtask {
  key: string;
  title: string;
  owner: string;
  due: string;
}

function newSubtask(): Subtask {
  return { key: Math.random().toString(36).slice(2, 9), title: "", owner: "", due: "" };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultLeadId?: string;
  onCreated?: () => void;
}

export function CreateTaskDialog({ open, onOpenChange, defaultLeadId, onCreated }: Props) {
  const { create } = useIntakeTasksLive();
  const { leads } = useLeads();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [taskType, setTaskType] = useState<string>("task");
  const [kind, setKind] = useState<RelatedKind>(defaultLeadId ? "lead" : "none");
  const [leadId, setLeadId] = useState<string>(defaultLeadId ?? "");
  const [relatedLabel, setRelatedLabel] = useState<string>("");
  const [relatedIdText, setRelatedIdText] = useState<string>("");
  const [relatedUrl, setRelatedUrl] = useState<string>("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [saving, setSaving] = useState(false);
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(""); setNotes(""); setOwner("");
    setTaskType("task");
    const d = new Date(); d.setDate(d.getDate() + 1);
    setDue(d.toISOString().slice(0, 10));
    setKind(defaultLeadId ? "lead" : "none");
    setLeadId(defaultLeadId ?? "");
    setRelatedLabel(""); setRelatedIdText(""); setRelatedUrl("");
    setSubtasks([]);
  }, [open, defaultLeadId]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === leadId) ?? null,
    [leads, leadId],
  );

  const save = async () => {
    if (!title.trim()) { toast.error("Add a title"); return; }
    setSaving(true);
    try {
      const input: CreateIntakeTaskInput = {
        title: title.trim(),
        task_type: taskType,
        owner: owner || null,
        due_date: due || null,
        notes: notes || null,
        subtasks: subtasks
          .filter((s) => s.title.trim())
          .map((s) => ({ title: s.title, owner: s.owner || null, due_date: s.due || null })),
      };
      if (kind === "lead" && leadId) {
        input.lead_id = leadId;
        input.related_record_type = "lead";
        input.related_record_id = leadId;
        input.related_record_label = selectedLead?.childName ?? "Lead";
        input.related_url = `/leads?view=pipeline&lead=${encodeURIComponent(leadId)}`;
      } else if (kind !== "none") {
        input.related_record_type = kind;
        input.related_record_id = relatedIdText.trim() || null;
        input.related_record_label = relatedLabel.trim() || null;
        input.related_url = relatedUrl.trim() || null;
      }
      await create(input);
      toast.success(
        subtasks.filter((s) => s.title.trim()).length > 0
          ? "Task and subtasks created"
          : "Task created",
      );
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Assign an owner, set a due date, and optionally link to a record or add subtasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <AssigneePicker
                value={owner}
                onChange={(name) => setOwner(name)}
                placeholder="Assign to…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, next steps, links…"
              rows={2}
            />
          </div>

          {/* Related record */}
          <div className="rounded-lg border border-border/70 p-3 space-y-2 bg-muted/20">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" /> Related record (optional)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={kind} onValueChange={(v) => setKind(v as RelatedKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="authorization">Authorization</SelectItem>
                  <SelectItem value="other">Other / link</SelectItem>
                </SelectContent>
              </Select>

              {kind === "lead" && (
                <div className="md:col-span-2">
                  <Popover open={leadPickerOpen} onOpenChange={setLeadPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start font-normal", !selectedLead && "text-muted-foreground")}>
                        {selectedLead ? `${selectedLead.childName} · ${selectedLead.parentName}` : "Search leads…"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search by child, parent, state…" />
                        <CommandList>
                          <CommandEmpty>No matching leads.</CommandEmpty>
                          <CommandGroup heading={`Leads (${leads.length})`}>
                            {leads.slice(0, 200).map((l) => (
                              <CommandItem
                                key={l.id}
                                value={`${l.childName} ${l.parentName ?? ""} ${l.state ?? ""}`}
                                onSelect={() => { setLeadId(l.id); setLeadPickerOpen(false); }}
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm">{l.childName}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {l.parentName}{l.state ? ` · ${l.state}` : ""}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {kind !== "none" && kind !== "lead" && (
                <>
                  <Input
                    placeholder="Record label"
                    value={relatedLabel}
                    onChange={(e) => setRelatedLabel(e.target.value)}
                  />
                  <Input
                    placeholder="ID (optional)"
                    value={relatedIdText}
                    onChange={(e) => setRelatedIdText(e.target.value)}
                  />
                  <Input
                    className="md:col-span-3"
                    placeholder="Deep link URL (optional, e.g. /clients?client=…)"
                    value={relatedUrl}
                    onChange={(e) => setRelatedUrl(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div className="rounded-lg border border-border/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Subtasks (optional)</div>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1"
                onClick={() => setSubtasks((s) => [...s, newSubtask()])}>
                <Plus className="h-3 w-3" /> Add subtask
              </Button>
            </div>
            {subtasks.length === 0 ? (
              <div className="text-[11px] text-muted-foreground py-1">
                Break this task into smaller steps. Subtasks inherit the owner and due date unless you override them.
              </div>
            ) : (
              <div className="space-y-2">
                {subtasks.map((s, idx) => (
                  <div key={s.key} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      className="col-span-6"
                      placeholder={`Subtask ${idx + 1}`}
                      value={s.title}
                      onChange={(e) => setSubtasks((prev) => prev.map((p) => p.key === s.key ? { ...p, title: e.target.value } : p))}
                    />
                    <div className="col-span-3">
                      <AssigneePicker
                        value={s.owner}
                        onChange={(name) => setSubtasks((prev) => prev.map((p) => p.key === s.key ? { ...p, owner: name } : p))}
                        placeholder="Owner"
                        triggerSize="sm"
                      />
                    </div>
                    <Input
                      className="col-span-2 h-7 text-xs"
                      type="date"
                      value={s.due}
                      onChange={(e) => setSubtasks((prev) => prev.map((p) => p.key === s.key ? { ...p, due: e.target.value } : p))}
                    />
                    <Button type="button" variant="ghost" size="icon" className="col-span-1 h-7 w-7"
                      onClick={() => setSubtasks((prev) => prev.filter((p) => p.key !== s.key))}
                      aria-label="Remove subtask">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving ? "Creating…" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
