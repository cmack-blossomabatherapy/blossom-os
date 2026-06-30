import { useEffect, useState } from "react";
import { Plus, BookmarkPlus, Bookmark, Trash2, Database, FileSpreadsheet, Sparkles, Pencil, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthorizationActions, type AuthSourceSystem, type EnsureOverlayInput } from "@/hooks/useAuthorizationActions";
import { useAuthorizationSavedViews, type SavedView, type SavedViewScope } from "@/hooks/useAuthorizationSavedViews";
import { cn } from "@/lib/utils";

/* ─── Source badge (Monday / CentralReach / Manual / Sample) ─── */

export type AuthSourceTag = "monday" | "centralreach" | "manual" | "sample";

const SOURCE_META: Record<AuthSourceTag, { label: string; icon: typeof Database; cls: string }> = {
  monday:        { label: "Monday",        icon: Database,        cls: "bg-[hsl(265_85%_96%)] text-[hsl(265_60%_40%)] border-[hsl(265_50%_88%)]" },
  centralreach:  { label: "CentralReach",  icon: Sparkles,        cls: "bg-[hsl(190_70%_94%)] text-[hsl(190_60%_30%)] border-[hsl(190_50%_82%)]" },
  manual:        { label: "Manual",        icon: FileSpreadsheet, cls: "bg-[hsl(38_100%_94%)] text-[hsl(30_75%_35%)] border-[hsl(38_70%_82%)]" },
  sample:        { label: "Sample",        icon: Sparkles,        cls: "bg-foreground/[0.05] text-foreground/55 border-foreground/10" },
};

export function SourceBadge({ source, className }: { source: AuthSourceTag; className?: string }) {
  const meta = SOURCE_META[source];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", meta.cls, className)}>
      <Icon className="h-2.5 w-2.5" /> {meta.label}
    </span>
  );
}

/* ─── New Authorization modal (writes to operational overlay) ─── */

export interface NewAuthInitial {
  client_name?: string;
  state?: string;
  payer?: string;
  auth_type?: string;
  expiration_date?: string;
  assigned_owner?: string;
}

export function NewAuthorizationDialog({
  open, onOpenChange, onCreated, initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (id: string) => void;
  initial?: NewAuthInitial;
}) {
  const actions = useAuthorizationActions();
  const [form, setForm] = useState<NewAuthInitial & { workflow_stage?: string; notes?: string }>({
    client_name: initial?.client_name ?? "",
    state: initial?.state ?? "GA",
    payer: initial?.payer ?? "",
    auth_type: initial?.auth_type ?? "Initial Auth",
    expiration_date: initial?.expiration_date ?? "",
    assigned_owner: initial?.assigned_owner ?? "",
    workflow_stage: "Awaiting Submission",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleCreate() {
    if (!form.client_name?.trim()) return;
    const id = await actions.createManualAuth({
      client_name: form.client_name.trim(),
      state: form.state || null,
      payer: form.payer || null,
      auth_type: form.auth_type || null,
      expiration_date: form.expiration_date || null,
      assigned_owner: form.assigned_owner || null,
      workflow_stage: form.workflow_stage || null,
      status: form.workflow_stage || null,
    });
    // Persist the initial note (if any) by writing an activity entry
    // against the just-created overlay record.
    const note = form.notes?.trim();
    if (note) {
      await actions
        .addNote(
          {
            source_system: "manual",
            overlay_id: id,
            source_id: id,
            client_name: form.client_name.trim(),
          },
          note,
        )
        .catch(() => undefined);
    }
    onOpenChange(false);
    onCreated?.(id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Authorization</DialogTitle>
          <DialogDescription>
            Manually create an authorization record. This writes to the operational overlay and will
            appear in the workspace immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="client_name">Client name *</Label>
            <Input id="client_name" value={form.client_name ?? ""} onChange={(e) => update("client_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>State</Label>
              <Select value={form.state ?? ""} onValueChange={(v) => update("state", v)}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  {["GA","NC","TN","VA","MD","NJ"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="payer">Payer</Label>
              <Input id="payer" value={form.payer ?? ""} onChange={(e) => update("payer", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Auth type</Label>
              <Select value={form.auth_type ?? ""} onValueChange={(v) => update("auth_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Initial Auth","Treatment Auth","Reassessment","Parent Training 97156","Secondary Insurance"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Workflow stage</Label>
              <Select value={form.workflow_stage ?? ""} onValueChange={(v) => update("workflow_stage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Awaiting Submission","Submitted","In QA Review","Approved","Denied","Expiring Soon"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="expiration_date">Expiration</Label>
              <Input id="expiration_date" type="date" value={form.expiration_date ?? ""} onChange={(e) => update("expiration_date", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="assigned_owner">Coordinator</Label>
              <Input id="assigned_owner" value={form.assigned_owner ?? ""} onChange={(e) => update("assigned_owner", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.client_name?.trim() || actions.pending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create authorization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Saved Views dropdown ─── */

export function SavedViewsMenu({
  scope,
  currentConfig,
  onApply,
  triggerClassName,
}: {
  scope: SavedViewScope;
  currentConfig: Record<string, unknown>;
  onApply: (view: SavedView) => void;
  triggerClassName?: string;
}) {
  const { views, save, remove } = useAuthorizationSavedViews(scope);
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [name, setName] = useState("");

  async function handleSave() {
    if (!name.trim()) return;
    await save(name.trim(), currentConfig);
    setName("");
    setNamePromptOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/70 bg-white/70 px-3 text-[12.5px] font-semibold text-foreground/85 transition hover:text-foreground",
            triggerClassName,
          )}
        >
          <Bookmark className="h-3.5 w-3.5" /> Saved Views
          {views.length > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/10 px-1 text-[10px] font-semibold">
              {views.length}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Your saved views</DropdownMenuLabel>
          {views.length === 0 && (
            <div className="px-2 py-3 text-[12px] text-muted-foreground">
              No saved views yet.
            </div>
          )}
          {views.map((v) => (
            <DropdownMenuItem
              key={v.id}
              onSelect={(e) => { e.preventDefault(); onApply(v); }}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{v.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); void remove(v.id); }}
                aria-label={`Delete ${v.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setNamePromptOpen(true); }}>
            <BookmarkPlus className="mr-2 h-3.5 w-3.5" /> Save current view…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={namePromptOpen} onOpenChange={setNamePromptOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
            <DialogDescription>
              Saves your current filters, queue, and search. Only you can see this view.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GA · Expiring < 30d"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNamePromptOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>Save view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Edit Authorization (full operational fields) ─── */

export interface EditAuthInitial {
  client_name?: string | null;
  state?: string | null;
  payer?: string | null;
  auth_type?: string | null;
  workflow_stage?: string | null;
  status?: string | null;
  assigned_owner?: string | null;
  assigned_bcba?: string | null;
  assigned_auth_coordinator?: string | null;
  qa_owner?: string | null;
  start_date?: string | null;
  submitted_date?: string | null;
  approved_date?: string | null;
  expiration_date?: string | null;
  authorization_number?: string | null;
  tracking_number?: string | null;
  service_code?: string | null;
  authorized_hours?: number | null;
  used_hours?: number | null;
  priority?: string | null;
  denial_reason?: string | null;
  next_action?: string | null;
  next_action_due_date?: string | null;
}

export function EditAuthorizationDialog({
  open,
  onOpenChange,
  identity,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  identity: Pick<EnsureOverlayInput, "source_system" | "overlay_id" | "monday_item_id" | "centralreach_authorization_id" | "source_id">;
  initial: EditAuthInitial;
  onSaved?: () => void;
}) {
  const actions = useAuthorizationActions();
  const [form, setForm] = useState<EditAuthInitial>(initial);
  // Keep form in sync when the dialog is opened against a different record.
  useEffect(() => { if (open) setForm(initial); }, [open, initial]);

  const upd = <K extends keyof EditAuthInitial>(k: K, v: EditAuthInitial[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    await actions.updateAuthorizationRecord({
      identity,
      patch: { ...form } as Record<string, unknown>,
    });
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit Authorization</DialogTitle>
          <DialogDescription>
            Update the operational authorization record. Field changes are persisted to the operational overlay and
            logged to the activity timeline. CentralReach sync fields stay read-only until live integration is wired.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client name"><Input value={form.client_name ?? ""} onChange={(e) => upd("client_name", e.target.value)} /></Field>
            <Field label="State">
              <Select value={form.state ?? ""} onValueChange={(v) => upd("state", v)}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>{["GA","NC","TN","VA","MD","NJ"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Payer"><Input value={form.payer ?? ""} onChange={(e) => upd("payer", e.target.value)} /></Field>
            <Field label="Auth type">
              <Select value={form.auth_type ?? ""} onValueChange={(v) => upd("auth_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Initial Auth","Treatment Auth","Reassessment","Parent Training 97156","Secondary Insurance"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Workflow stage">
              <Select value={form.workflow_stage ?? ""} onValueChange={(v) => { upd("workflow_stage", v); upd("status", v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Awaiting Submission","Submitted","In QA Review","Approved","Denied","Expiring Soon","Denial Review"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority ?? ""} onValueChange={(v) => upd("priority", v)}>
                <SelectTrigger><SelectValue placeholder="Normal" /></SelectTrigger>
                <SelectContent>{["Low","Normal","High","Critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Assigned owner"><Input value={form.assigned_owner ?? ""} onChange={(e) => upd("assigned_owner", e.target.value)} /></Field>
            <Field label="Assigned BCBA"><Input value={form.assigned_bcba ?? ""} onChange={(e) => upd("assigned_bcba", e.target.value)} /></Field>
            <Field label="Auth coordinator"><Input value={form.assigned_auth_coordinator ?? ""} onChange={(e) => upd("assigned_auth_coordinator", e.target.value)} /></Field>
            <Field label="QA owner"><Input value={form.qa_owner ?? ""} onChange={(e) => upd("qa_owner", e.target.value)} /></Field>
            <Field label="Start date"><Input type="date" value={form.start_date ?? ""} onChange={(e) => upd("start_date", e.target.value)} /></Field>
            <Field label="Submitted"><Input type="date" value={form.submitted_date ?? ""} onChange={(e) => upd("submitted_date", e.target.value)} /></Field>
            <Field label="Approved"><Input type="date" value={form.approved_date ?? ""} onChange={(e) => upd("approved_date", e.target.value)} /></Field>
            <Field label="Expiration"><Input type="date" value={form.expiration_date ?? ""} onChange={(e) => upd("expiration_date", e.target.value)} /></Field>
            <Field label="Authorization #"><Input value={form.authorization_number ?? ""} onChange={(e) => upd("authorization_number", e.target.value)} /></Field>
            <Field label="Tracking #"><Input value={form.tracking_number ?? ""} onChange={(e) => upd("tracking_number", e.target.value)} /></Field>
            <Field label="Service code"><Input value={form.service_code ?? ""} onChange={(e) => upd("service_code", e.target.value)} placeholder="e.g. 97153" /></Field>
            <Field label="Authorized hours"><Input type="number" value={form.authorized_hours ?? ""} onChange={(e) => upd("authorized_hours", e.target.value === "" ? null : Number(e.target.value))} /></Field>
            <Field label="Used hours"><Input type="number" value={form.used_hours ?? ""} onChange={(e) => upd("used_hours", e.target.value === "" ? null : Number(e.target.value))} /></Field>
            <Field label="Next action"><Input value={form.next_action ?? ""} onChange={(e) => upd("next_action", e.target.value)} /></Field>
            <Field label="Next action due"><Input type="date" value={form.next_action_due_date ?? ""} onChange={(e) => upd("next_action_due_date", e.target.value)} /></Field>
          </div>
          <Field label="Denial reason"><Textarea rows={2} value={form.denial_reason ?? ""} onChange={(e) => upd("denial_reason", e.target.value)} /></Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={actions.pending}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ─── CentralReach readiness section (visible on detail drawers) ─── */

export interface CentralReachReadinessProps {
  source: AuthSourceSystem;
  centralreachAuthorizationId?: string | null;
  centralreachClientId?: string | null;
  centralreachSyncStatus?: string | null;
  centralreachLastSyncedAt?: string | null;
  authorizationNumber?: string | null;
  trackingNumber?: string | null;
  serviceCode?: string | null;
  authorizedHours?: number | null;
  usedHours?: number | null;
  checklist: { label: string; ok: boolean }[];
}

export function CentralReachReadinessSection(props: CentralReachReadinessProps) {
  const allOk = props.checklist.every((c) => c.ok);
  const syncedLabel = props.centralreachLastSyncedAt
    ? new Date(props.centralreachLastSyncedAt).toLocaleString()
    : "Never";
  return (
    <div className="space-y-3 rounded-2xl border border-[hsl(190_50%_82%)] bg-[hsl(190_70%_98%)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(190_60%_30%)]" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[hsl(190_60%_30%)]">CentralReach Readiness</p>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
          allOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
        )}>
          {allOk ? "Ready to queue" : "Setup needed"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        <KVRow label="Source">{props.source}</KVRow>
        <KVRow label="Sync status">{props.centralreachSyncStatus ?? "Not synced"}</KVRow>
        <KVRow label="Last synced">{syncedLabel}</KVRow>
        <KVRow label="Auth number">{props.authorizationNumber ?? "—"}</KVRow>
        <KVRow label="Tracking #">{props.trackingNumber ?? "—"}</KVRow>
        <KVRow label="Service code">{props.serviceCode ?? "—"}</KVRow>
        <KVRow label="Authorized hrs">{props.authorizedHours != null ? String(props.authorizedHours) : "—"}</KVRow>
        <KVRow label="Used hrs">{props.usedHours != null ? String(props.usedHours) : "—"}</KVRow>
      </div>
      <ul className="space-y-1">
        {props.checklist.map((c, i) => (
          <li key={i} className="flex items-center gap-2 text-[12px]">
            {c.ok
              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              : <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
            <span className={c.ok ? "text-foreground/80" : "text-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10.5px] italic text-muted-foreground">
        CentralReach integration pending — fields are tracked locally and will sync once the integration is enabled.
      </p>
    </div>
  );
}

function KVRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-foreground/85">{children}</span>
    </div>
  );
}