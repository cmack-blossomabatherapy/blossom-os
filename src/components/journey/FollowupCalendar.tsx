import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Mail, Plus, Bell, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  TrainingFollowup, addDays, createFollowup, daysUntil, deleteFollowup,
  listMyFollowups, todayIso, updateFollowup,
} from "@/data/trainingFollowups";
import type { TrainingModule } from "@/data/journey";
import { composeModuleKey } from "@/data/trainingFollowups";

interface Props {
  userId: string;
  audience: "rbt" | "bcba";
  modules: TrainingModule[];
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

export function FollowupCalendar({ userId, audience, modules }: Props) {
  const [items, setItems] = useState<TrainingFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [editing, setEditing] = useState<TrainingFollowup | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setItems(await listMyFollowups(userId));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load follow-ups");
    } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [userId]);

  const monthEnd = endOfMonth(cursor);
  const monthDays: Date[] = useMemo(() => {
    const days: Date[] = [];
    // Pad start of week (Sun)
    const padStart = cursor.getDay();
    for (let i = padStart; i > 0; i--) {
      const d = new Date(cursor); d.setDate(cursor.getDate() - i); days.push(d);
    }
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1];
      const d = new Date(last); d.setDate(last.getDate() + 1); days.push(d);
    }
    return days;
  }, [cursor, monthEnd]);

  const byDate = useMemo(() => {
    const m = new Map<string, TrainingFollowup[]>();
    for (const f of items) {
      const arr = m.get(f.due_date) ?? [];
      arr.push(f);
      m.set(f.due_date, arr);
    }
    return m;
  }, [items]);

  const upcoming = useMemo(
    () => items.filter((i) => i.status === "pending").slice(0, 8),
    [items],
  );

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            Training Follow-ups
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Due dates, coordinator contacts, and reminders for your training modules.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} className="rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add follow-up
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold">{monthLabel}</div>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((d, i) => {
            const iso = d.toISOString().slice(0, 10);
            const inMonth = d.getMonth() === cursor.getMonth();
            const today = iso === todayIso();
            const events = byDate.get(iso) ?? [];
            return (
              <div
                key={i}
                className={`min-h-[64px] rounded-md border p-1.5 text-[11px] ${
                  inMonth ? "border-border/60 bg-background" : "border-transparent bg-muted/20 text-muted-foreground/50"
                } ${today ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className={`text-right font-medium ${today ? "text-primary" : ""}`}>{d.getDate()}</div>
                <div className="space-y-0.5 mt-0.5">
                  {events.slice(0, 2).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEditing(e)}
                      className={`w-full truncate text-left px-1 py-0.5 rounded text-[10px] ${
                        e.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 line-through"
                          : daysUntil(e.due_date) < 0
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                      }`}
                      title={e.module_title}
                    >
                      {e.module_title}
                    </button>
                  ))}
                  {events.length > 2 && (
                    <div className="text-[9px] text-muted-foreground pl-1">+{events.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming list */}
        <div>
          <div className="text-xs font-semibold text-foreground mb-2">Upcoming</div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : upcoming.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-lg">
              No follow-ups yet. Click "Add follow-up" to schedule one.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((f) => {
                const d = daysUntil(f.due_date);
                const tone =
                  d < 0 ? "text-destructive" : d <= 3 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
                return (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setEditing(f)}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{f.module_title}</div>
                      <div className={`text-[11px] ${tone}`}>
                        {d < 0 ? `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue` : d === 0 ? "Due today" : `Due in ${d} day${d === 1 ? "" : "s"}`}
                        {f.coordinator_email && (
                          <span className="text-muted-foreground"> · {f.coordinator_name ?? "coordinator"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {f.reminder_offsets_days.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Bell className="h-3 w-3" />
                          {f.reminder_offsets_days.join(", ")}d
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>

      <FollowupDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        existing={editing}
        modules={modules}
        audience={audience}
        userId={userId}
        onSaved={async () => { await refresh(); setCreating(false); setEditing(null); }}
      />
    </Card>
  );
}

function FollowupDialog({
  open, onOpenChange, existing, modules, audience, userId, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: TrainingFollowup | null;
  modules: TrainingModule[];
  audience: "rbt" | "bcba";
  userId: string;
  onSaved: () => void;
}) {
  const [moduleKey, setModuleKey] = useState<string>("");
  const [dueDate, setDueDate] = useState(addDays(todayIso(), 30));
  const [reminders, setReminders] = useState("7, 1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setModuleKey(existing.module_id);
      setDueDate(existing.due_date);
      setReminders(existing.reminder_offsets_days.join(", "));
      setNotes(existing.notes ?? "");
    } else {
      setModuleKey(modules[0] ? composeModuleKey(audience, modules[0].id) : "");
      setDueDate(addDays(todayIso(), 30));
      setReminders("7, 1");
      setNotes("");
    }
  }, [open, existing, modules, audience]);

  const moduleLookup = useMemo(() => {
    const m = new Map<string, TrainingModule>();
    modules.forEach((mod) => m.set(composeModuleKey(audience, mod.id), mod));
    return m;
  }, [modules, audience]);

  const selectedModule = moduleLookup.get(moduleKey);

  const handleSave = async () => {
    if (!moduleKey || !selectedModule) {
      toast.error("Pick a training module");
      return;
    }
    setSaving(true);
    try {
      const remindersArr = reminders
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 0);
      if (existing) {
        await updateFollowup(existing.id, {
          due_date: dueDate,
          reminder_offsets_days: remindersArr,
          notes: notes || null,
        });
      } else {
        await createFollowup({
          user_id: userId,
          module_id: moduleKey,
          module_title: selectedModule.title,
          audience,
          due_date: dueDate,
          reminder_offsets_days: remindersArr,
          coordinator_name: selectedModule.coordinatorName ?? null,
          coordinator_email: selectedModule.coordinatorEmail ?? null,
          notes: notes || null,
        });
      }
      toast.success(existing ? "Follow-up updated" : "Follow-up scheduled");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      await updateFollowup(existing.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      toast.success("Marked complete");
      onSaved();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      await deleteFollowup(existing.id);
      toast.success("Deleted");
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit follow-up" : "Schedule a training follow-up"}</DialogTitle>
          <DialogDescription>
            Set a due date and choose reminders. The training coordinator will be cc'd on reminder emails.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Training module</Label>
            <Select value={moduleKey} onValueChange={setModuleKey} disabled={!!existing}>
              <SelectTrigger><SelectValue placeholder="Pick a module" /></SelectTrigger>
              <SelectContent>
                {modules.map((m) => (
                  <SelectItem key={m.id} value={composeModuleKey(audience, m.id)}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Bell className="h-3 w-3" /> Reminders (days before)</Label>
              <Input value={reminders} onChange={(e) => setReminders(e.target.value)} placeholder="7, 1" />
            </div>
          </div>

          {selectedModule?.coordinatorEmail && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 p-2.5 text-xs">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">
                  {selectedModule.coordinatorName ?? "Coordinator"} — {selectedModule.coordinatorEmail}
                </div>
                <div className="text-muted-foreground">Will be cc'd on reminders.</div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any context for this follow-up…" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
          {existing && existing.status !== "completed" && (
            <Button variant="outline" onClick={handleComplete} disabled={saving} className="mr-auto">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark complete
            </Button>
          )}
          {existing && (
            <Button variant="ghost" onClick={handleDelete} disabled={saving} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Clock className="h-3.5 w-3.5 mr-1" /> {existing ? "Save changes" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}