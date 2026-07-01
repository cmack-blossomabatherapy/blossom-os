import { useMemo, useState } from "react";
import { Plus, Loader2, Archive, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useMarketingWorkItems,
  MARKETING_WORK_STATUSES,
  MARKETING_WORK_PRIORITIES,
  type MarketingWorkType,
  type MarketingWorkStatus,
  type MarketingWorkPriority,
  type MarketingWorkItem,
} from "@/hooks/useMarketingWorkItems";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";

interface MarketingWorkPanelProps {
  workType: MarketingWorkType;
  title?: string;
  description?: string;
  defaultState?: string;
  defaultSourceSystem?: string;
  /** Optional preset when creating from a specific insight/opportunity row. */
  seedFactory?: () => Partial<MarketingWorkItem> & { title?: string; description?: string };
}

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-100 text-sky-800",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-rose-100 text-rose-800",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-slate-100 text-slate-800",
  in_progress: "bg-blue-100 text-blue-800",
  blocked: "bg-rose-100 text-rose-800",
  done: "bg-emerald-100 text-emerald-800",
  archived: "bg-muted text-muted-foreground",
};

/**
 * Shared operational work panel for Marketing pages. Renders open work items
 * scoped to a work_type and exposes create/update/status/owner/priority/due
 * so any Marketing page can act on the data it displays.
 */
export function MarketingWorkPanel({
  workType,
  title = "Open work",
  description,
  defaultState,
  defaultSourceSystem,
  seedFactory,
}: MarketingWorkPanelProps) {
  const {
    items,
    loading,
    error,
    createItem,
    setStatus,
    setPriority,
    setDueDate,
    setOwner,
    archive,
  } = useMarketingWorkItems({ workType, state: defaultState });

  const [createOpen, setCreateOpen] = useState(false);

  const openCount = useMemo(
    () => items.filter((i) => i.status !== "done" && i.status !== "archived").length,
    [items],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">
            {title}{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({openCount} open)
            </span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New work item
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading work items...
        </div>
      ) : error ? (
        <div className="text-xs text-destructive py-3">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">
          No work items yet. Create one to start tracking action for this area.
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((it) => (
            <WorkRow
              key={it.id}
              item={it}
              onStatus={(s) => setStatus(it.id, s)}
              onPriority={(p) => setPriority(it.id, p)}
              onDue={(d) => setDueDate(it.id, d)}
              onOwner={(o) => setOwner(it.id, o)}
              onArchive={() => archive(it.id)}
            />
          ))}
        </ul>
      )}

      <CreateWorkItemDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workType={workType}
        defaultState={defaultState}
        defaultSourceSystem={defaultSourceSystem}
        seedFactory={seedFactory}
        onCreate={async (row) => {
          await createItem(row);
          toast.success("Work item created");
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

function WorkRow({
  item,
  onStatus,
  onPriority,
  onDue,
  onOwner,
  onArchive,
}: {
  item: MarketingWorkItem;
  onStatus: (s: MarketingWorkStatus) => Promise<void> | void;
  onPriority: (p: MarketingWorkPriority) => Promise<void> | void;
  onDue: (d: string | null) => Promise<void> | void;
  onOwner: (o: string | null) => Promise<void> | void;
  onArchive: () => Promise<void> | void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { members } = useEmployeeDirectory();
  return (
    <li className="py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className="flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
            <span className="text-sm font-medium">{item.title}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {item.state && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.state}</Badge>}
            {item.source_system && <span>{item.source_system}</span>}
            {item.due_date && <span>Due {item.due_date}</span>}
          </div>
        </button>
        <Badge className={`${PRIORITY_TONE[item.priority] ?? PRIORITY_TONE.medium} text-[10px]`}>
          {item.priority}
        </Badge>
        <Badge className={`${STATUS_TONE[item.status] ?? STATUS_TONE.open} text-[10px]`}>
          {item.status.replace("_", " ")}
        </Badge>
      </div>
      {expanded && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2 pl-6">
          {item.description && (
            <div className="col-span-full text-xs text-muted-foreground whitespace-pre-wrap">
              {item.description}
            </div>
          )}
          <div>
            <Label className="text-[10px]">Status</Label>
            <Select value={item.status} onValueChange={(v) => onStatus(v as MarketingWorkStatus)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MARKETING_WORK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Priority</Label>
            <Select
              value={item.priority}
              onValueChange={(v) => onPriority(v as MarketingWorkPriority)}
            >
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MARKETING_WORK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Due</Label>
            <Input
              type="date"
              className="h-8"
              value={item.due_date ?? ""}
              onChange={(e) => onDue(e.target.value || null)}
            />
          </div>
          <div>
            <Label className="text-[10px]">Owner</Label>
            <Select
              value={item.owner_id ?? "__unassigned__"}
              onValueChange={(v) => onOwner(v === "__unassigned__" ? null : v)}
            >
              <SelectTrigger className="h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {members.slice(0, 200).map((e) => (
                  <SelectItem key={e.uuid ?? e.id} value={e.uuid ?? e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="ghost" onClick={onArchive}>
              <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Reusable seeded-create button. Any marketing page can drop this in to
 * queue a work item with prefilled context (state, source, campaign, etc.).
 */
export function CreateMarketingWorkButton({
  workType,
  label = "New work item",
  seedFactory,
  defaultState,
  defaultSourceSystem,
}: {
  workType: MarketingWorkType;
  label?: string;
  seedFactory?: () => Partial<MarketingWorkItem> & { title?: string; description?: string };
  defaultState?: string;
  defaultSourceSystem?: string;
}) {
  const { createItem } = useMarketingWorkItems({ workType });
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> {label}
      </Button>
      <CreateWorkItemDialog
        open={open}
        onOpenChange={setOpen}
        workType={workType}
        defaultState={defaultState}
        defaultSourceSystem={defaultSourceSystem}
        seedFactory={seedFactory}
        onCreate={async (row) => {
          await createItem(row);
          toast.success("Work item created");
          setOpen(false);
        }}
      />
    </>
  );
}

function CreateWorkItemDialog({
  open,
  onOpenChange,
  workType,
  defaultState,
  defaultSourceSystem,
  seedFactory,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workType: MarketingWorkType;
  defaultState?: string;
  defaultSourceSystem?: string;
  seedFactory?: () => Partial<MarketingWorkItem> & { title?: string; description?: string };
  onCreate: (row: Partial<MarketingWorkItem> & Pick<MarketingWorkItem, "work_type" | "title">) => Promise<void>;
}) {
  const seed = seedFactory ? seedFactory() : {};
  const [title, setTitle] = useState(seed.title ?? "");
  const [description, setDescription] = useState(seed.description ?? "");
  const [priority, setPriority] = useState<MarketingWorkPriority>((seed.priority as MarketingWorkPriority) ?? "medium");
  const [state, setState] = useState(seed.state ?? defaultState ?? "");
  const [dueDate, setDue] = useState(seed.due_date ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        work_type: workType,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        state: state.trim() || null,
        source_system: seed.source_system ?? defaultSourceSystem ?? null,
        due_date: dueDate || null,
        evidence: seed.evidence ?? {},
      });
      setTitle("");
      setDescription("");
      setDue("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New work item</DialogTitle>
          <DialogDescription>
            Track a follow-up, opportunity, or fix inside Marketing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, action-oriented" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MarketingWorkPriority)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKETING_WORK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="GA" maxLength={2} />
            </div>
            <div>
              <Label className="text-xs">Due</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}