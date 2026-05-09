import { useEffect, useState } from "react";
import { AlertTriangle, Globe, Lock, Plus, RotateCcw, Trash2, Undo2, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  ONBOARDING_PHASES, modulesForPath, type OnboardingPath,
} from "@/lib/onboarding/journey";
import {
  type RouteLock, createLock, deactivateLock, fetchLocksFor,
} from "@/lib/onboarding/routeLocks";

interface Props {
  userId: string;
  userName: string;
  path: OnboardingPath;
  onChanged?: () => void;
}

export function AdminControls({ userId, userName, path, onChanged }: Props) {
  return (
    <Card className="rounded-xl border-amber-500/30 bg-amber-50/40 p-4 dark:bg-amber-950/10">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Admin controls
        </p>
      </div>
      <div className="space-y-4">
        <RouteLocks userId={userId} userName={userName} />
        <PhaseRollback userId={userId} userName={userName} path={path} onChanged={onChanged} />
      </div>
    </Card>
  );
}

/* ------------------------------ Route locks ------------------------------ */

function RouteLocks({ userId, userName }: { userId: string; userName: string }) {
  const [locks, setLocks] = useState<RouteLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // form state
  const [scope, setScope] = useState<"user" | "global">("user");
  const [pattern, setPattern] = useState("");
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState<string>("24");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setLocks(await fetchLocksFor(userId));
    setLoading(false);
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  const submit = async () => {
    if (!pattern.trim() || !reason.trim()) { toast.error("Pattern and reason are required."); return; }
    setSaving(true);
    const expiresAt = hours && Number(hours) > 0
      ? new Date(Date.now() + Number(hours) * 3600_000).toISOString()
      : null;
    const { error } = await createLock({
      userId: scope === "global" ? null : userId,
      routePattern: pattern,
      reason,
      expiresAt,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Route lock added");
    setPattern(""); setReason(""); setHours("24"); setScope("user");
    setOpen(false);
    void refresh();
  };

  const remove = async (id: string) => {
    const { error } = await deactivateLock(id);
    if (error) { toast.error(error.message); return; }
    toast.success("Lock removed");
    void refresh();
  };

  const live = locks.filter((l) => l.active && (!l.expires_at || new Date(l.expires_at).getTime() > Date.now()));
  const expired = locks.filter((l) => !live.includes(l));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-semibold text-foreground">Temporary route locks</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)}>
          <Plus className="h-3 w-3" /> Add lock
        </Button>
      </div>
      {loading ? (
        <p className="text-[11px] text-muted-foreground">Loading…</p>
      ) : live.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No active locks for this employee.</p>
      ) : (
        <ul className="space-y-1.5">
          {live.map((l) => (
            <li key={l.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/70 px-2.5 py-2">
              <div className="mt-0.5">
                {l.user_id ? <UserIcon className="h-3 w-3 text-primary" /> : <Globe className="h-3 w-3 text-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">{l.route_pattern}</code>
                  <Badge variant="outline" className="text-[9px]">{l.user_id ? "User" : "Global"}</Badge>
                  {l.expires_at && (
                    <span className="text-[10px] text-muted-foreground">
                      Until {new Date(l.expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{l.reason}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => void remove(l.id)} title="Remove lock">
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {expired.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[10px] text-muted-foreground">{expired.length} expired/inactive</summary>
          <ul className="mt-1 space-y-1">
            {expired.map((l) => (
              <li key={l.id} className="text-[10px] text-muted-foreground">
                <code className="font-mono">{l.route_pattern}</code> · {l.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add temporary lock</DialogTitle>
            <DialogDescription>
              Block one or more routes with a friendly reason. Locks override allow-lists and
              are visible to the affected user with the reason you provide.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Scope</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn("flex-1 rounded-lg border px-3 py-2 text-left text-xs",
                    scope === "user" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                  onClick={() => setScope("user")}
                >
                  <UserIcon className="mb-1 h-3.5 w-3.5 text-primary" />
                  <p className="font-medium text-foreground">Just {userName.split(" ")[0] || "this user"}</p>
                </button>
                <button
                  type="button"
                  className={cn("flex-1 rounded-lg border px-3 py-2 text-left text-xs",
                    scope === "global" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                  onClick={() => setScope("global")}
                >
                  <Globe className="mb-1 h-3.5 w-3.5 text-primary" />
                  <p className="font-medium text-foreground">Everyone</p>
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Route pattern</Label>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="/training/* or /reports"
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Use <code>/path</code> for exact, or <code>/path/*</code> to lock a section.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason (visible to user)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Pending re-training on the new clinical workflow."
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Auto-unlock after (hours)</Label>
              <Input
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Leave 0 for no expiry — the lock stays until you remove it.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={saving}>{saving ? "Locking…" : "Lock route"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------- Phase rollback ----------------------------- */

function PhaseRollback({ userId, userName, path, onChanged }: Props) {
  const phases = ONBOARDING_PHASES;
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>(phases[1]?.id ?? "w1");
  const [note, setNote] = useState("");
  const [resetAcks, setResetAcks] = useState(true);
  const [resetQuiz, setResetQuiz] = useState(true);
  const [clearCert, setClearCert] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!note.trim()) { toast.error("Add an audit note explaining the rollback."); return; }
    setSaving(true);
    const targetIdx = phases.findIndex((p) => p.id === target);
    // Keep modules from earlier phases only.
    const keepModules = phases
      .slice(0, targetIdx)
      .flatMap((p) => modulesForPath(p, path).map((m) => m.key));

    // Pull current state to compute what to keep for steps/acks.
    const { data: curr } = await supabase
      .from("onboarding_state")
      .select("completed_steps, acknowledgements")
      .eq("user_id", userId)
      .maybeSingle();
    const keepSteps = curr?.completed_steps ?? [];
    const keepAcks = resetAcks ? [] : (curr?.acknowledgements ?? []);

    const { error } = await supabase.rpc("admin_rollback_onboarding", {
      target_user: userId,
      target_phase: target,
      keep_modules: keepModules,
      keep_steps: keepSteps,
      keep_acks: keepAcks,
      note: note.trim(),
      reset_quiz: resetQuiz,
      clear_certificate: clearCert,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Rolled back ${userName.split(" ")[0] || "user"} to ${target}`);
    setOpen(false); setNote("");
    onChanged?.();
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Undo2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-semibold text-foreground">Rollback to a phase</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)}>
          <RotateCcw className="h-3 w-3" /> Rollback
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Removes module completions for the selected phase and everything after it. The audit
        note appears on the activity timeline.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rollback onboarding</DialogTitle>
            <DialogDescription>
              Choose the phase to send {userName.split(" ")[0] || "this user"} back to. All
              progress at or after that phase will be cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Target phase</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.weekLabel} — {p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={resetAcks} onCheckedChange={(v) => setResetAcks(v === true)} />
                Clear policy acknowledgements
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={resetQuiz} onCheckedChange={(v) => setResetQuiz(v === true)} />
                Reset final knowledge check
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={clearCert} onCheckedChange={(v) => setClearCert(v === true)} />
                Revoke completion certificate
              </label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Audit note (required)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why are you rolling this employee back?"
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={saving} variant="destructive">
              {saving ? "Rolling back…" : "Rollback now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// keep the X import for future closeable banners
void X;