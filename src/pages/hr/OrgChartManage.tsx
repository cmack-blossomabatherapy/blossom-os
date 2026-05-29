import { useEffect, useMemo, useState } from "react";
import {
  Network, Search, Save, X as XIcon, Plus, UserCog, Crown,
  CornerDownRight, Loader2,
} from "lucide-react";
import {
  DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent,
  useDraggable, useDroppable,
} from "@dnd-kit/core";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { employeeFullName, type Employee } from "@/lib/hr/types";
import { cn } from "@/lib/utils";

// ============================================================================
// Org Chart Settings — HR admin tool to set the reporting hierarchy by drag-
// and-drop, edit job titles inline, and maintain a list of responsibilities
// per person. Drops are persisted to employees.manager_id; the read-only
// public chart (/hr/org-chart) honors those overrides automatically.
// ============================================================================

type Row = Employee & { manager_id: string | null; responsibilities: string[] };

const TOP_OF_TREE = "__root__";

export default function OrgChartManage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .neq("status", "terminated")
      .order("last_name");
    if (error) {
      toast.error(error.message);
    } else {
      setRows(((data ?? []) as Row[]).map((r) => ({ ...r, responsibilities: r.responsibilities ?? [] })));
    }
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  // Index by id and group by manager.
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => {
      const key = r.manager_id && byId.has(r.manager_id) ? r.manager_id : TOP_OF_TREE;
      const list = m.get(key) ?? [];
      list.push(r);
      m.set(key, list);
    });
    m.forEach((list) => list.sort((a, b) => a.last_name.localeCompare(b.last_name)));
    return m;
  }, [rows, byId]);

  // Search filter for the unassigned/search pane
  const q = search.trim().toLowerCase();
  const matches = (r: Row) =>
    !q ||
    employeeFullName(r).toLowerCase().includes(q) ||
    r.job_title.toLowerCase().includes(q) ||
    (r.email ?? "").toLowerCase().includes(q) ||
    r.state.toLowerCase().includes(q);

  // ----- DnD handler: reparent the dropped employee under the target -----
  async function onDragEnd(e: DragEndEvent) {
    const draggedId = String(e.active.id);
    const targetRaw = e.over?.id;
    if (!targetRaw) return;
    const target = String(targetRaw);
    const dragged = byId.get(draggedId);
    if (!dragged) return;
    const newManagerId = target === TOP_OF_TREE ? null : target;
    if (dragged.manager_id === newManagerId) return;

    // Block cycle: target cannot be a descendant of dragged.
    if (newManagerId) {
      const descendants = new Set<string>();
      const walk = (id: string) => {
        rows.filter((r) => r.manager_id === id).forEach((r) => {
          if (!descendants.has(r.id)) { descendants.add(r.id); walk(r.id); }
        });
      };
      walk(draggedId);
      if (descendants.has(newManagerId) || newManagerId === draggedId) {
        toast.error("Can't report into your own report.");
        return;
      }
    }

    // Optimistic update
    const prev = rows;
    setRows((rs) => rs.map((r) => r.id === draggedId ? { ...r, manager_id: newManagerId } : r));
    const { error } = await supabase.from("employees").update({ manager_id: newManagerId }).eq("id", draggedId);
    if (error) {
      setRows(prev);
      toast.error(error.message);
      return;
    }
    toast.success(newManagerId ? `${employeeFullName(dragged)} now reports to ${employeeFullName(byId.get(newManagerId)!)}` : `${employeeFullName(dragged)} moved to top of tree`);
  }

  async function saveRow(id: string, patch: Partial<Pick<Row, "job_title" | "responsibilities">>) {
    const prev = rows;
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, ...patch } : r));
    const { error } = await supabase.from("employees").update(patch).eq("id", id);
    if (error) {
      setRows(prev);
      toast.error(error.message);
      return false;
    }
    toast.success("Saved");
    return true;
  }

  // Roots = managers (anyone with reports) + top-of-tree employees
  const rootEntries = useMemo(() => {
    const roots: Row[] = (groups.get(TOP_OF_TREE) ?? []).slice();
    // sort: leadership-like titles first
    roots.sort((a, b) => {
      const w = (t: string) => {
        const x = t.toLowerCase();
        if (x === "ceo") return 0;
        if (x.includes("director of operations")) return 1;
        if (x.includes("director")) return 2;
        if (x.includes("manager")) return 3;
        return 5;
      };
      return w(a.job_title) - w(b.job_title) || a.last_name.localeCompare(b.last_name);
    });
    return roots;
  }, [groups]);

  const totalEmployees = rows.length;
  const managerCount = useMemo(() => new Set(rows.map((r) => r.manager_id).filter(Boolean) as string[]).size, [rows]);
  const topLevel = (groups.get(TOP_OF_TREE) ?? []).length;

  return (
    <PageShell
      title="Org Chart Settings"
      description="Drag any person onto a manager to change reporting. Click a card to edit title or responsibilities."
      icon={Network}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              className="h-8 pl-8 w-56 text-xs"
            />
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      }
    >
      {/* Compact stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="People" value={totalEmployees} />
        <Stat label="Managers" value={managerCount} />
        <Stat label="Top-level" value={topLevel} />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <TopZone />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
            {rootEntries.map((root) => (
              <ManagerBranch
                key={root.id}
                node={root}
                groups={groups}
                editing={editing}
                setEditing={setEditing}
                onSave={saveRow}
                matches={matches}
                depth={0}
              />
            ))}
          </div>

          {rootEntries.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground rounded-2xl">
              No employees yet — add people in User Management to start mapping the org.
            </Card>
          )}
        </DndContext>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-semibold tracking-tight mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

// ---------- Top-of-tree drop zone ----------
function TopZone() {
  const { isOver, setNodeRef } = useDroppable({ id: TOP_OF_TREE });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-dashed px-4 py-2 text-[11px] font-medium transition-colors flex items-center gap-2",
        isOver ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-muted-foreground",
      )}
    >
      <Crown className="h-3.5 w-3.5" />
      Top of organization — drop a card here to remove its manager
    </div>
  );
}

// ---------- Manager branch ----------
function ManagerBranch({
  node, groups, editing, setEditing, onSave, matches, depth,
}: {
  node: Row;
  groups: Map<string, Row[]>;
  editing: string | null;
  setEditing: (id: string | null) => void;
  onSave: (id: string, patch: Partial<Pick<Row, "job_title" | "responsibilities">>) => Promise<boolean>;
  matches: (r: Row) => boolean;
  depth: number;
}) {
  const reports = groups.get(node.id) ?? [];
  const { isOver, setNodeRef } = useDroppable({ id: node.id });

  return (
    <div
      style={{ marginLeft: depth * 20 }}
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-card p-3 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border/70",
      )}
    >
      <PersonCard
        person={node}
        isManager
        editing={editing === node.id}
        onEdit={() => setEditing(editing === node.id ? null : node.id)}
        onCancel={() => setEditing(null)}
        onSave={onSave}
        muted={!matches(node) && reports.every((r) => !matches(r))}
      />

      {reports.length > 0 && (
        <div className="mt-3 pl-3 border-l border-border/60 space-y-2">
          {reports.map((r) => {
            const hasGrandkids = (groups.get(r.id) ?? []).length > 0;
            if (hasGrandkids) {
              return (
                <ManagerBranch
                  key={r.id}
                  node={r}
                  groups={groups}
                  editing={editing}
                  setEditing={setEditing}
                  onSave={onSave}
                  matches={matches}
                  depth={depth + 1}
                />
              );
            }
            return (
              <DroppablePerson
                key={r.id}
                person={r}
                editing={editing === r.id}
                onEdit={() => setEditing(editing === r.id ? null : r.id)}
                onCancel={() => setEditing(null)}
                onSave={onSave}
                muted={!matches(r)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Leaf person — also a droppable so users can re-parent onto a non-manager
function DroppablePerson(props: {
  person: Row;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, patch: Partial<Pick<Row, "job_title" | "responsibilities">>) => Promise<boolean>;
  muted?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: props.person.id });
  return (
    <div ref={setNodeRef} className={cn("rounded-2xl transition-colors", isOver && "ring-2 ring-primary/60")}>
      <PersonCard {...props} />
    </div>
  );
}

// ---------- Person card (draggable + editable) ----------
function PersonCard({
  person, isManager, editing, onEdit, onCancel, onSave, muted,
}: {
  person: Row;
  isManager?: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, patch: Partial<Pick<Row, "job_title" | "responsibilities">>) => Promise<boolean>;
  muted?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: person.id });

  const [title, setTitle] = useState(person.job_title);
  const [resps, setResps] = useState<string[]>(person.responsibilities ?? []);
  const [newResp, setNewResp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(person.job_title);
      setResps(person.responsibilities ?? []);
      setNewResp("");
    }
  }, [editing, person]);

  async function commit() {
    setSaving(true);
    const ok = await onSave(person.id, {
      job_title: title.trim() || person.job_title,
      responsibilities: resps,
    });
    setSaving(false);
    if (ok) onCancel();
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-background p-3 flex items-start gap-3 transition-all",
        isManager ? "border-primary/30 bg-primary/[0.03]" : "border-border/70",
        isDragging && "opacity-50",
        muted && "opacity-60",
      )}
    >
      {/* drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="mt-1 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted cursor-grab active:cursor-grabbing"
        title="Drag to reassign"
        aria-label={`Drag ${employeeFullName(person)}`}
      >
        <CornerDownRight className="h-3.5 w-3.5" />
      </button>

      <EmployeeAvatar employee={person} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{employeeFullName(person)}</p>
          {isManager && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary">Manager</Badge>}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{person.state}</Badge>
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Job title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs mt-1"
                placeholder="e.g. Director of Operations"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsibilities</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {resps.map((r, i) => (
                  <span
                    key={`${r}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {r}
                    <button
                      onClick={() => setResps((rs) => rs.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${r}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form
                className="mt-2 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = newResp.trim();
                  if (!v) return;
                  setResps((rs) => [...rs, v]);
                  setNewResp("");
                }}
              >
                <Input
                  value={newResp}
                  onChange={(e) => setNewResp(e.target.value)}
                  className="h-7 text-xs"
                  placeholder="Add a responsibility…"
                />
                <Button type="submit" size="sm" variant="outline" className="h-7 px-2">
                  <Plus className="h-3 w-3" />
                </Button>
              </form>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={commit} disabled={saving} className="h-7 text-xs">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground truncate">{person.job_title}</p>
            {(person.responsibilities ?? []).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(person.responsibilities ?? []).slice(0, 4).map((r) => (
                  <span key={r} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{r}</span>
                ))}
                {(person.responsibilities ?? []).length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{(person.responsibilities ?? []).length - 4} more</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!editing && (
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={onEdit}>
          <UserCog className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}