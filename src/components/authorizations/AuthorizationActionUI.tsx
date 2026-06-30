import { useState } from "react";
import { Plus, BookmarkPlus, Bookmark, Trash2, Database, FileSpreadsheet, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthorizationActions } from "@/hooks/useAuthorizationActions";
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