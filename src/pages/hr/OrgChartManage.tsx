import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Network, Search, Save, X as XIcon, Plus, Crown, Loader2,
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Pencil,
} from "lucide-react";
import {
  DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent,
  useDraggable, useDroppable, type Modifier,
} from "@dnd-kit/core";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { PageShell } from "@/components/shared/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { employeeFullName, type Employee } from "@/lib/hr/types";
import { cn } from "@/lib/utils";

// ============================================================================
// Org Chart Settings — interactive zoomable canvas. Every seat is a draggable
// card; dropping a seat on top of another sets that target as the manager.
// Changes persist to employees.manager_id and the public chart updates too.
// ============================================================================

type Row = Employee & { manager_id: string | null; responsibilities: string[] };

const TOP_OF_TREE = "__root__";
const NODE_W = 220;
const NODE_H = 96;
const GAP_X = 36;
const GAP_Y = 72;

interface Pos { x: number; y: number }

/** Tidy tree layout — positions each subtree side-by-side, parent centered. */
function layoutTree(roots: Row[], childrenOf: Map<string, Row[]>): {
  pos: Map<string, Pos>; width: number; height: number;
} {
  const pos = new Map<string, Pos>();
  let cursor = 0;
  let maxDepth = 0;

  const place = (node: Row, depth: number): { left: number; right: number } => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = childrenOf.get(node.id) ?? [];
    const y = depth * (NODE_H + GAP_Y);
    if (kids.length === 0) {
      const x = cursor * (NODE_W + GAP_X);
      cursor++;
      pos.set(node.id, { x, y });
      return { left: x, right: x };
    }
    let left = Infinity;
    let right = -Infinity;
    kids.forEach((k) => {
      const r = place(k, depth + 1);
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
    });
    const x = (left + right) / 2;
    pos.set(node.id, { x, y });
    return { left, right };
  };

  // Place each root sequentially with horizontal gap between trees.
  roots.forEach((r, i) => {
    if (i > 0) cursor += 1; // spacer column between trees
    place(r, 0);
  });

  const width = Math.max(NODE_W, (cursor) * (NODE_W + GAP_X));
  const height = (maxDepth + 1) * (NODE_H + GAP_Y);
  return { pos, width, height };
}

export default function OrgChartManage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Live zoom scale ref — used to scale dnd-kit deltas so dragged cards track
  // the cursor 1:1 even when the canvas is zoomed in/out.
  const scaleRef = useRef(1);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

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

  // Index by id and children-by-manager map.
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const childrenOf = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => {
      const key = r.manager_id && byId.has(r.manager_id) ? r.manager_id : TOP_OF_TREE;
      const list = m.get(key) ?? [];
      list.push(r);
      m.set(key, list);
    });
    m.forEach((list) => {
      list.sort((a, b) => {
        // leadership-ish titles bubble up
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
    });
    return m;
  }, [rows, byId]);

  const roots = useMemo(() => childrenOf.get(TOP_OF_TREE) ?? [], [childrenOf]);
  const layout = useMemo(() => layoutTree(roots, childrenOf), [roots, childrenOf]);

  // Search highlighting (does not hide nodes — the chart needs to stay whole).
  const q = search.trim().toLowerCase();
  const matches = useCallback((r: Row) =>
    !q ||
    employeeFullName(r).toLowerCase().includes(q) ||
    r.job_title.toLowerCase().includes(q) ||
    (r.email ?? "").toLowerCase().includes(q) ||
    r.state.toLowerCase().includes(q),
  [q]);

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

  const totalEmployees = rows.length;
  const managerCount = useMemo(() => new Set(rows.map((r) => r.manager_id).filter(Boolean) as string[]).size, [rows]);
  const topLevel = roots.length;

  // dnd-kit modifier: divide deltas by current zoom scale so the dragged card
  // tracks the cursor 1:1 inside the transformed canvas.
  const scaleModifier: Modifier = useCallback(({ transform }) => ({
    ...transform,
    x: transform.x / scaleRef.current,
    y: transform.y / scaleRef.current,
  }), []);

  const editingPerson = editingId ? byId.get(editingId) ?? null : null;

  return (
    <PageShell
      title="Org Chart Settings"
      description="Drag any seat onto another to set the new manager. Scroll or pinch to zoom. Drag the canvas to pan."
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
        <Skeleton className="h-[640px] w-full rounded-2xl mt-3" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border/70 bg-card p-10 text-center text-sm text-muted-foreground mt-3">
          No employees yet — add people in User Management to start mapping the org.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd} modifiers={[scaleModifier]}>
          <div className="relative mt-3 h-[72vh] min-h-[560px] w-full overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-background">
            <TransformWrapper
              ref={transformRef}
              initialScale={0.85}
              minScale={0.3}
              maxScale={2}
              limitToBounds={false}
              centerOnInit
              wheel={{ step: 0.12 }}
              doubleClick={{ disabled: true }}
              panning={{ velocityDisabled: true, excluded: ["org-card", "org-toolbar"] }}
              onTransformed={(_, state) => { scaleRef.current = state.scale; }}
            >
              {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                <>
                  <CanvasToolbar
                    onZoomIn={() => zoomIn()}
                    onZoomOut={() => zoomOut()}
                    onReset={() => { resetTransform(); setTimeout(() => centerView(), 0); }}
                    onFit={() => centerView()}
                  />
                  <TopDropZone />
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: layout.width + 80, height: layout.height + 80 }}
                  >
                    <CanvasInner
                      layout={layout}
                      rows={rows}
                      childrenOf={childrenOf}
                      matches={matches}
                      onEdit={(id) => setEditingId(id)}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </DndContext>
      )}

      <EditSheet
        person={editingPerson}
        onClose={() => setEditingId(null)}
        onSave={saveRow}
      />
    </PageShell>
  );
}

// ---------- small bits ----------
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-semibold tracking-tight mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function CanvasToolbar({
  onZoomIn, onZoomOut, onReset, onFit,
}: { onZoomIn: () => void; onZoomOut: () => void; onReset: () => void; onFit: () => void }) {
  return (
    <div className="org-toolbar absolute right-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-border/70 bg-background/95 p-1 shadow-sm backdrop-blur">
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onZoomOut} title="Zoom out">
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onZoomIn} title="Zoom in">
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onFit} title="Center">
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onReset} title="Reset">
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function TopDropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: TOP_OF_TREE });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "org-toolbar absolute left-3 top-3 z-20 flex items-center gap-2 rounded-xl border border-dashed px-3 py-1.5 text-[11px] font-medium transition-colors backdrop-blur",
        isOver ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background/80 text-muted-foreground",
      )}
    >
      <Crown className="h-3.5 w-3.5" />
      Drop here to remove manager (top of tree)
    </div>
  );
}

// ---------- canvas inner: connectors + nodes ----------
function CanvasInner({
  layout, rows, childrenOf, matches, onEdit,
}: {
  layout: { pos: Map<string, Pos>; width: number; height: number };
  rows: Row[];
  childrenOf: Map<string, Row[]>;
  matches: (r: Row) => boolean;
  onEdit: (id: string) => void;
}) {
  // Build edges (manager -> report) using positions.
  const edges: Array<{ from: Pos; to: Pos; key: string }> = [];
  rows.forEach((r) => {
    if (!r.manager_id) return;
    const parent = layout.pos.get(r.manager_id);
    const me = layout.pos.get(r.id);
    if (!parent || !me) return;
    edges.push({
      key: `${r.manager_id}->${r.id}`,
      from: { x: parent.x + NODE_W / 2, y: parent.y + NODE_H },
      to: { x: me.x + NODE_W / 2, y: me.y },
    });
  });

  return (
    <div className="relative" style={{ width: layout.width + 80, height: layout.height + 80, padding: 40 }}>
      <svg
        className="pointer-events-none absolute inset-0"
        width={layout.width + 80}
        height={layout.height + 80}
      >
        {edges.map(({ from, to, key }) => {
          const midY = (from.y + to.y) / 2;
          const d = `M ${from.x + 40} ${from.y + 40} C ${from.x + 40} ${midY + 40}, ${to.x + 40} ${midY + 40}, ${to.x + 40} ${to.y + 40}`;
          return (
            <path
              key={key}
              d={d}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      {rows.map((r) => {
        const p = layout.pos.get(r.id);
        if (!p) return null;
        const isManager = (childrenOf.get(r.id)?.length ?? 0) > 0;
        return (
          <SeatNode
            key={r.id}
            person={r}
            x={p.x + 40}
            y={p.y + 40}
            isManager={isManager}
            muted={!matches(r)}
            onEdit={() => onEdit(r.id)}
          />
        );
      })}
    </div>
  );
}

// ---------- one seat: draggable + droppable card ----------
function SeatNode({
  person, x, y, isManager, muted, onEdit,
}: {
  person: Row; x: number; y: number; isManager: boolean; muted: boolean; onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging, transform } = useDraggable({ id: person.id });
  const { isOver, setNodeRef: setDropRef } = useDroppable({ id: person.id });

  // Compose refs so the element is both draggable and droppable.
  const setRef = (el: HTMLDivElement | null) => { setDragRef(el); setDropRef(el); };

  const dragTransform = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <div
      ref={setRef}
      {...listeners}
      {...attributes}
      className={cn(
        "org-card absolute select-none rounded-2xl border bg-card p-3 shadow-sm transition-shadow",
        "hover:shadow-md cursor-grab active:cursor-grabbing",
        isManager ? "border-primary/40" : "border-border/70",
        isOver && "ring-2 ring-primary/70",
        isDragging && "opacity-70 shadow-lg z-50",
        muted && "opacity-40",
      )}
      style={{
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H,
        transform: dragTransform,
        touchAction: "none",
      }}
    >
      <div className="flex items-start gap-2.5 h-full">
        <EmployeeAvatar employee={person} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-foreground truncate">{employeeFullName(person)}</p>
            {isManager && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-primary/40 text-primary">M</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{person.job_title}</p>
          <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">{person.state}</p>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Edit ${employeeFullName(person)}`}
          title="Edit seat"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ---------- edit sheet ----------
function EditSheet({
  person, onClose, onSave,
}: {
  person: Row | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Pick<Row, "job_title" | "responsibilities">>) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [resps, setResps] = useState<string[]>([]);
  const [newResp, setNewResp] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (person) {
      setTitle(person.job_title);
      setResps(person.responsibilities ?? []);
      setNewResp("");
    }
  }, [person]);

  if (!person) {
    return (
      <Sheet open={false} onOpenChange={() => onClose()}>
        <SheetContent />
      </Sheet>
    );
  }

  async function commit() {
    if (!person) return;
    setSaving(true);
    const ok = await onSave(person.id, {
      job_title: title.trim() || person.job_title,
      responsibilities: resps,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Sheet open={!!person} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{employeeFullName(person)}</SheetTitle>
          <SheetDescription>Edit job title and responsibilities for this seat.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Job title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm mt-1"
              placeholder="e.g. Director of Operations"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsibilities</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resps.length === 0 && (
                <p className="text-xs text-muted-foreground">None yet — add a few below.</p>
              )}
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
                className="h-8 text-xs"
                placeholder="Add a responsibility…"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={commit} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Save changes
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}