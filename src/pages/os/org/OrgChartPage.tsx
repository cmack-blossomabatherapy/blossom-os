import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { useOSRole } from "@/contexts/OSRoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { OrgChartNodeCard, type OrgNodeData } from "@/components/org/OrgChartNodeCard";
import { toast } from "sonner";
import { Plus, Save, Trash2, Users, Lock, DownloadCloud } from "lucide-react";

type DbRow = {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  avatar_url: string | null;
  accent_color: string | null;
  parent_id: string | null;
  position_x: number;
  position_y: number;
  sort_order: number;
};

const NODE_TYPES = { person: OrgChartNodeCard };

const EDITOR_ROLES = new Set([
  "super_admin",
  "admin",
  "systems_admin",
  "hr_team",
  "hr_lead",
]);

const ACCENTS = ["#F472B6", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F97316"];

function rowToNode(row: DbRow, isEditor: boolean): Node<OrgNodeData> {
  return {
    id: row.id,
    type: "person",
    position: { x: Number(row.position_x), y: Number(row.position_y) },
    data: {
      name: row.name,
      title: row.title,
      department: row.department,
      email: row.email,
      avatar_url: row.avatar_url,
      accent_color: row.accent_color,
      isEditor,
    },
    draggable: isEditor,
    connectable: isEditor,
    deletable: isEditor,
  };
}

function rowsToEdges(rows: DbRow[]): Edge[] {
  return rows
    .filter((r) => r.parent_id)
    .map((r) => ({
      id: `e-${r.parent_id}-${r.id}`,
      source: r.parent_id!,
      target: r.id,
      type: "smoothstep",
      animated: false,
      style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 },
    }));
}

function InnerOrgChart() {
  const { role } = useOSRole();
  const isEditor = EDITOR_ROLES.has(role as string);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<OrgNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DbRow[]>([]);
  const [editing, setEditing] = useState<DbRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("org_chart_nodes")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Could not load org chart", { description: error.message });
      setLoading(false);
      return;
    }
    const list = (data ?? []) as DbRow[];
    setRows(list);
    setNodes(list.map((r) => rowToNode(r, isEditor)));
    setEdges(rowsToEdges(list));
    setLoading(false);
  }, [isEditor, setNodes, setEdges]);

  useEffect(() => {
    load();
  }, [load]);

  // Live sync from other clients
  useEffect(() => {
    const channel = supabase
      .channel("org_chart_nodes-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_chart_nodes" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Persist drag positions on drag-stop
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<OrgNodeData>>[]) => {
      onNodesChange(changes);
      if (!isEditor) return;
      for (const c of changes) {
        if (c.type === "position" && c.dragging === false && c.position) {
          const id = c.id;
          const { x, y } = c.position;
          void supabase
            .from("org_chart_nodes")
            .update({ position_x: x, position_y: y })
            .eq("id", id)
            .then(({ error }) => {
              if (error) toast.error("Move not saved", { description: error.message });
            });
        }
      }
    },
    [isEditor, onNodesChange],
  );

  // Connect: set parent_id on target
  const onConnect = useCallback(
    async (conn: Connection) => {
      if (!isEditor || !conn.source || !conn.target) return;
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            type: "smoothstep",
            style: { stroke: "hsl(var(--border))", strokeWidth: 1.5 },
          },
          eds,
        ),
      );
      const { error } = await supabase
        .from("org_chart_nodes")
        .update({ parent_id: conn.source })
        .eq("id", conn.target);
      if (error) {
        toast.error("Link not saved", { description: error.message });
        void load();
      }
    },
    [isEditor, setEdges, load],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, n) => {
      if (!isEditor) return;
      const row = rows.find((r) => r.id === n.id);
      if (row) setEditing(row);
    },
    [isEditor, rows],
  );

  const roots = useMemo(() => rows.filter((r) => !r.parent_id).length, [rows]);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Organization Chart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditor
              ? "Drag to reposition, connect handles to change reporting lines."
              : "A live view of who reports to whom across Blossom."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <Users className="size-3.5" />
            <span>{rows.length} people</span>
            <span className="opacity-50">·</span>
            <span>{roots} at top</span>
          </div>
          {isEditor ? (
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => setCreating(true)}
            >
              <Plus className="size-4" />
              Add person
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              View only
            </div>
          )}
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 via-background to-muted/40">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading org chart…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState canEdit={isEditor} onAdd={() => setCreating(true)} onImported={load} />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodesDraggable={isEditor}
            nodesConnectable={isEditor}
            elementsSelectable
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={1.6}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="hsl(var(--border))"
            />
            <Controls
              showInteractive={false}
              className="!rounded-xl !border !border-border/70 !bg-card/80 !shadow-none backdrop-blur"
            />
            <MiniMap
              pannable
              zoomable
              maskColor="hsl(var(--background) / 0.6)"
              className="!rounded-xl !border !border-border/70 !bg-card/80 backdrop-blur"
              nodeColor={(n) =>
                ((n.data as OrgNodeData | undefined)?.accent_color as string) ||
                "hsl(var(--primary))"
              }
            />
          </ReactFlow>
        )}
      </div>

      <PersonSheet
        open={creating}
        onOpenChange={setCreating}
        row={null}
        onSaved={load}
      />
      <PersonSheet
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        row={editing}
        onSaved={load}
      />
    </div>
  );
}

async function importFromEmployees(): Promise<{ imported: number; error?: string }> {
  const { data: emps, error } = await supabase
    .from("employees")
    .select("id,first_name,last_name,preferred_name,email,job_title,status")
    .in("status", ["active", "on_leave"])
    .order("last_name");
  if (error) return { imported: 0, error: error.message };
  const rows = (emps ?? []).map((e, idx) => {
    const name = `${e.preferred_name || e.first_name || ""} ${e.last_name || ""}`.trim();
    return {
      name: name || (e.email ?? "Unnamed teammate"),
      title: e.job_title ?? null,
      email: e.email ?? null,
      accent_color: ["#F472B6", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F97316"][idx % 6],
      position_x: (idx % 6) * 300,
      position_y: Math.floor(idx / 6) * 200,
      sort_order: idx,
    };
  });
  if (rows.length === 0) return { imported: 0 };
  const { error: insErr } = await supabase.from("org_chart_nodes").insert(rows);
  if (insErr) return { imported: 0, error: insErr.message };
  return { imported: rows.length };
}

function EmptyState({ canEdit, onAdd, onImported }: { canEdit: boolean; onAdd: () => void; onImported: () => void }) {
  const [importing, setImporting] = useState(false);
  const handleImport = async () => {
    setImporting(true);
    const result = await importFromEmployees();
    setImporting(false);
    if (result.error) {
      toast.error("Import failed", { description: result.error });
      return;
    }
    if (result.imported === 0) {
      toast.info("No active employees to import");
      return;
    }
    toast.success(`Imported ${result.imported} teammates`);
    onImported();
  };
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-border/70 bg-card">
        <Users className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-medium text-foreground">No one on the chart yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canEdit
            ? "Import from your employee directory to seed the chart, or add people one at a time."
            : "Ask HR to publish the organization chart."}
        </p>
      </div>
      {canEdit && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" className="rounded-xl" onClick={handleImport} disabled={importing}>
            <DownloadCloud className="size-4" />
            {importing ? "Importing…" : "Import from Employees"}
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onAdd}>
            <Plus className="size-4" />
            Add person manually
          </Button>
        </div>
      )}
    </div>
  );
}

function PersonSheet({
  open,
  onOpenChange,
  row,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: DbRow | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    title: "",
    department: "",
    email: "",
    avatar_url: "",
    accent_color: ACCENTS[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: row?.name ?? "",
        title: row?.title ?? "",
        department: row?.department ?? "",
        email: row?.email ?? "",
        avatar_url: row?.avatar_url ?? "",
        accent_color: row?.accent_color ?? ACCENTS[0],
      });
    }
  }, [open, row]);

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      title: form.title.trim() || null,
      department: form.department.trim() || null,
      email: form.email.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      accent_color: form.accent_color,
    };
    const { error } = row
      ? await supabase.from("org_chart_nodes").update(payload).eq("id", row.id)
      : await supabase
          .from("org_chart_nodes")
          .insert({ ...payload, position_x: 120, position_y: 120 });
    setSaving(false);
    if (error) {
      toast.error(row ? "Update failed" : "Create failed", {
        description: error.message,
      });
      return;
    }
    toast.success(row ? "Updated" : "Added to org chart");
    onSaved();
    onOpenChange(false);
  };

  const remove = async () => {
    if (!row) return;
    if (!confirm(`Remove ${row.name} from the org chart?`)) return;
    const { error } = await supabase.from("org_chart_nodes").delete().eq("id", row.id);
    if (error) {
      toast.error("Delete failed", { description: error.message });
      return;
    }
    toast.success("Removed");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{row ? "Edit person" : "Add person"}</SheetTitle>
          <SheetDescription>
            {row ? "Update details or remove from the chart." : "Add a new person to the org chart."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Director of Operations"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Operations"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@blossom.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              value={form.avatar_url}
              onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Accent</Label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, accent_color: c })}
                  className={[
                    "size-7 rounded-full ring-offset-2 ring-offset-background transition-all",
                    form.accent_color === c ? "ring-2 ring-foreground/70" : "ring-0",
                  ].join(" ")}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8 gap-2 sm:flex-row sm:justify-between">
          {row ? (
            <Button variant="ghost" onClick={remove} className="text-destructive">
              <Trash2 className="size-4" />
              Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving…" : row ? "Save" : "Add"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function OrgChartPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-10">
      <ReactFlowProvider>
        <InnerOrgChart />
      </ReactFlowProvider>
    </div>
  );
}
