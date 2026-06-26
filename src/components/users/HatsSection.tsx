import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Star, MapPin, Building2, Pencil, Power, Trash2, Sparkles, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ROLE_GROUPS, DEPARTMENT_KEYS, DEPARTMENT_LABELS, STATE_CODES, SCOPE_OPTIONS, SCOPE_LABELS,
  GROWTH_STAGE_PRESETS, findRoleLabel,
  loadAssignmentsForUser, upsertAssignment, deactivateAssignment, activateAssignment,
  deleteAssignment, setPrimary, applyPreset,
  type RoleAssignment, type AssignmentScope, type DepartmentKey, type StateCode,
  type GrowthStagePreset,
} from "@/lib/access/roleAssignments";

interface Props {
  employeeId: string;
  /** May be null if the employee has no auth user yet (rare). */
  userId: string | null;
}

export function HatsSection({ employeeId, userId }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RoleAssignment | "new" | null>(null);
  const [presetTarget, setPresetTarget] = useState<{ preset: GrowthStagePreset; state: StateCode } | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const data = await loadAssignmentsForUser(userId);
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const onSetPrimary = async (id: string) => {
    if (!userId) return;
    const { error } = await setPrimary(userId, id);
    if (error) toast({ title: "Couldn't set primary", description: error.message, variant: "destructive" });
    else { toast({ title: "Primary hat updated" }); void refresh(); }
  };

  const onDeactivate = async (id: string) => {
    const { error } = await deactivateAssignment(id);
    if (error) toast({ title: "Couldn't deactivate", description: error.message, variant: "destructive" });
    else { toast({ title: "Hat deactivated" }); void refresh(); }
  };
  const onActivate = async (id: string) => {
    const { error } = await activateAssignment(id);
    if (error) toast({ title: "Couldn't activate", description: error.message, variant: "destructive" });
    else { toast({ title: "Hat activated" }); void refresh(); }
  };
  const onDelete = async (id: string) => {
    if (!confirm("Remove this hat? It will be deleted permanently.")) return;
    const { error } = await deleteAssignment(id);
    if (error) toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    else { toast({ title: "Hat removed" }); void refresh(); }
  };

  if (!userId) {
    return (
      <Card className="p-6">
        <h3 className="text-base font-semibold">Roles, Hats & State Department Access</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This employee doesn't have a login yet — issue an invite from the Login section first,
          then come back to assign hats.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Roles, Hats & State Department Access</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each hat is a role this person performs, optionally scoped to a state and department.
              The primary hat decides which menu they see by default.
            </p>
          </div>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Hat
          </Button>
        </div>

        {/* Growth-stage presets */}
        <div className="mt-5 rounded-xl border border-border/70 bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Growth Stage Presets
            </p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {GROWTH_STAGE_PRESETS.map((p) => (
              <PresetCard key={p.key} preset={p} onPick={(state) => setPresetTarget({ preset: p, state })} />
            ))}
          </div>
        </div>

        {/* Hat list */}
        <div className="mt-5 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading hats…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hats yet. Click <strong>Add Hat</strong> or pick a Growth Stage Preset to get started.
            </p>
          ) : (
            rows.map((a) => (
              <HatRow
                key={a.id}
                row={a}
                onEdit={() => setEditing(a)}
                onPrimary={() => onSetPrimary(a.id)}
                onDeactivate={() => onDeactivate(a.id)}
                onActivate={() => onActivate(a.id)}
                onDelete={() => onDelete(a.id)}
              />
            ))
          )}
        </div>
      </Card>

      {editing && (
        <HatEditorDialog
          existing={editing === "new" ? null : editing}
          userId={userId}
          employeeId={employeeId}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void refresh(); }}
        />
      )}

      {presetTarget && (
        <PresetPreviewDialog
          preset={presetTarget.preset}
          state={presetTarget.state}
          onClose={() => setPresetTarget(null)}
          onConfirm={async () => {
            const { error } = await applyPreset(userId, employeeId, presetTarget.preset, presetTarget.state);
            if (error) {
              toast({ title: "Preset failed", description: error.message, variant: "destructive" });
            } else {
              toast({ title: "Preset applied", description: `${presetTarget.preset.label} for ${presetTarget.state}` });
              setPresetTarget(null);
              void refresh();
            }
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function HatRow({
  row, onEdit, onPrimary, onDeactivate, onActivate, onDelete,
}: {
  row: RoleAssignment;
  onEdit: () => void;
  onPrimary: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={"flex flex-wrap items-start gap-3 rounded-xl border border-border/70 bg-card p-3 " + (row.is_active ? "" : "opacity-60")}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Briefcase className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-semibold">{row.title_override ?? findRoleLabel(row.role_key)}</p>
          {row.is_primary && (
            <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
              <Star className="h-2.5 w-2.5" /> Primary
            </Badge>
          )}
          {!row.is_active && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Inactive</Badge>
          )}
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">{SCOPE_LABELS[row.scope]}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
          {row.state_code && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {row.state_code}</span>
          )}
          {row.department_key && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {DEPARTMENT_LABELS[row.department_key]}
            </span>
          )}
          {(row.starts_at || row.ends_at) && (
            <span>{row.starts_at ?? "—"} → {row.ends_at ?? "ongoing"}</span>
          )}
        </div>
        {row.responsibility_notes && (
          <p className="mt-1.5 text-[12px] text-foreground/80">{row.responsibility_notes}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!row.is_primary && row.is_active && (
          <Button variant="ghost" size="sm" onClick={onPrimary} title="Make primary">
            <Star className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {row.is_active ? (
          <Button variant="ghost" size="sm" onClick={onDeactivate} title="Deactivate">
            <Power className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onActivate} title="Activate">
            <Power className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} title="Remove">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HatEditorDialog({
  existing, userId, employeeId, onClose, onSaved,
}: {
  existing: RoleAssignment | null;
  userId: string;
  employeeId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    role_key: existing?.role_key ?? "intake_coordinator",
    state_code: (existing?.state_code ?? "") as string,
    department_key: (existing?.department_key ?? "") as string,
    scope: (existing?.scope ?? "department") as AssignmentScope,
    is_primary: existing?.is_primary ?? false,
    is_active: existing?.is_active ?? true,
    starts_at: existing?.starts_at ?? "",
    ends_at: existing?.ends_at ?? "",
    title_override: existing?.title_override ?? "",
    responsibility_notes: existing?.responsibility_notes ?? "",
  }));

  const save = async () => {
    setSaving(true);
    const { error } = await upsertAssignment({
      id: existing?.id,
      user_id: userId,
      employee_id: employeeId,
      role_key: form.role_key,
      state_code: (form.state_code || null) as StateCode | null,
      department_key: (form.department_key || null) as DepartmentKey | null,
      scope: form.scope,
      is_primary: form.is_primary,
      is_active: form.is_active,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      title_override: form.title_override || null,
      responsibility_notes: form.responsibility_notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save hat", description: error.message, variant: "destructive" });
      return;
    }
    // Setting primary clears every other primary atomically.
    if (form.is_primary && existing?.id) {
      await setPrimary(userId, existing.id);
    }
    toast({ title: existing ? "Hat updated" : "Hat added" });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Hat" : "Add Hat"}</DialogTitle>
          <DialogDescription>
            Each hat answers: who is this person acting as, in which state, for which department?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Role</Label>
            <Select value={form.role_key} onValueChange={(v) => setForm({ ...form, role_key: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_GROUPS.map((g) => (
                  <SelectGroup key={g.label}>
                    <SelectLabel>{g.label}</SelectLabel>
                    {g.roles.map((r) => (
                      <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>State</Label>
            <Select value={form.state_code || "__none"} onValueChange={(v) => setForm({ ...form, state_code: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="No state" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— No state —</SelectItem>
                {STATE_CODES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Department</Label>
            <Select value={form.department_key || "__none"} onValueChange={(v) => setForm({ ...form, department_key: v === "__none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— No department —</SelectItem>
                {DEPARTMENT_KEYS.map((d) => (
                  <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Scope</Label>
            <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as AssignmentScope })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{SCOPE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title override (optional)</Label>
            <Input
              value={form.title_override}
              onChange={(e) => setForm({ ...form, title_override: e.target.value })}
              placeholder="e.g. Virtual Assistant — GA"
            />
          </div>

          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>

          <div>
            <Label>End date</Label>
            <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>

          <div className="col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_primary} onCheckedChange={(v) => setForm({ ...form, is_primary: !!v })} />
              Primary hat
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
              Active
            </label>
          </div>

          <div className="col-span-2">
            <Label>Responsibility notes</Label>
            <Textarea
              value={form.responsibility_notes}
              onChange={(e) => setForm({ ...form, responsibility_notes: e.target.value })}
              placeholder="What does this person own under this hat?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : (existing ? "Save changes" : "Add hat")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function PresetCard({
  preset, onPick,
}: { preset: GrowthStagePreset; onPick: (state: StateCode) => void }) {
  const [state, setState] = useState<StateCode>("GA");
  return (
    <div className="rounded-lg border border-border/70 bg-card p-3">
      <p className="text-sm font-semibold">{preset.label}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{preset.description}</p>
      <div className="mt-2 flex items-center gap-2">
        <Select value={state} onValueChange={(v) => setState(v as StateCode)}>
          <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATE_CODES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => onPick(state)}>Apply</Button>
      </div>
    </div>
  );
}

function PresetPreviewDialog({
  preset, state, onClose, onConfirm,
}: {
  preset: GrowthStagePreset;
  state: StateCode;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const drafts = useMemo(() => preset.build(state), [preset, state]);
  const [working, setWorking] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply preset: {preset.label} — {state}</DialogTitle>
          <DialogDescription>{preset.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hats that will be created or updated:
          </p>
          {drafts.map((d) => (
            <div key={`${d.role_key}-${d.department_key}`} className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
              <p className="font-semibold">
                {findRoleLabel(d.role_key)}
                {d.is_primary && <Badge variant="secondary" className="ml-2 text-[10px]">Primary</Badge>}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {d.state_code ?? "—"} · {d.department_key ? DEPARTMENT_LABELS[d.department_key] : "—"} · {SCOPE_LABELS[d.scope]}
              </p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={async () => { setWorking(true); try { await onConfirm(); } finally { setWorking(false); } }}
            disabled={working}
          >
            {working ? "Applying…" : "Apply preset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for tests / external integrations.
export { supabase };