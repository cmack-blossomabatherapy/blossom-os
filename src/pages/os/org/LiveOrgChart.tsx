/**
 * Live Org Chart — real interactive tree.
 *
 * - Hierarchy is built from the live employee directory (`v_employee_directory`,
 *   synced from Viventium) using `manager_id`, with department-leader inference
 *   for anyone missing a manager, and manual overrides on top.
 * - HR / admins can drag cards (whole subtree moves with them) and every move
 *   is saved to `org_chart_layout` instantly.
 * - Drag a handle from one card to another to change the reporting line.
 * - Every branch collapses / expands, and the state is saved.
 * - Cards show the person, their role and responsibilities; clicking any card
 *   opens a drill-down with chain of command and direct reports.
 * - Viventium coverage audit shows how live the underlying data is.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  ChevronsDownUp,
  Filter,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEmployeeDirectory } from "@/hooks/useEmployeeDirectory";
import { useOrgChartLayout } from "@/hooks/useOrgChartLayout";
import { useOSRole } from "@/contexts/OSRoleContext";
import { OrgTreeNodeCard, type OrgTreeNodeData } from "@/components/org/OrgTreeNodeCard";
import { OrgPersonDrawer } from "@/components/org/OrgPersonDrawer";
import { OrgViventiumAuditPanel } from "@/components/org/OrgViventiumAuditPanel";
import {
  ORG_ROOT_ID,
  buildOrgTree,
  canReparent,
  descendantsOf,
  type OrgPersonInput,
} from "@/lib/os/orgChart/tree";
import { cleanJobTitle, roleProfileForTitle } from "@/lib/os/orgChart/responsibilities";

const EDITOR_ROLES = new Set([
  "super_admin",
  "admin",
  "systems_admin",
  "hr",
  "hr_team",
  "hr_lead",
  "hr_manager",
  "hr_admin",
]);

const NODE_TYPES = { orgPerson: OrgTreeNodeCard };

function InnerLiveOrgChart() {
  const { members, loading } = useEmployeeDirectory();
  const { overrides, save, saveMany, resetAll } = useOrgChartLayout();
  const { role } = useOSRole();
  const canEdit = EDITOR_ROLES.has(role as string);
  const { fitView } = useReactFlow();

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const people = useMemo<OrgPersonInput[]>(
    () =>
      members
        .filter(
          (m) =>
            !!m.uuid &&
            (!m.status || m.status === "active" || m.status === "on_leave"),
        )
        .map((m) => ({
          id: m.uuid!,
          name: m.name,
          title: m.title,
          departmentName: m.departmentName ?? null,
          leadershipLevel: m.leadershipLevel ?? "individual",
          managerId: m.managerId ?? null,
          email: m.email ?? null,
          photo: m.photo ?? null,
          state: m.states?.[0] ?? null,
          status: m.status ?? null,
        })),
    [members],
  );

  const tree = useMemo(() => buildOrgTree(people, overrides), [people, overrides]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(people.map((p) => (p.departmentName ?? "Unassigned").trim())),
      ).sort((a, b) => a.localeCompare(b)),
    [people],
  );

  const matchedIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && deptFilter === "all") return null;
    const set = new Set<string>();
    for (const node of tree.nodes.values()) {
      const p = node.person;
      if (!p) continue;
      if (deptFilter !== "all" && (p.departmentName ?? "Unassigned") !== deptFilter)
        continue;
      if (q) {
        const role = roleProfileForTitle(p.title);
        const hay = [p.name, p.title, p.departmentName, p.email, role.label]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      set.add(node.id);
    }
    return set;
  }, [query, deptFilter, tree]);

  // ---- React Flow nodes / edges derived from the tree -------------------
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<OrgTreeNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const toggleCollapse = useCallback(
    async (id: string) => {
      const node = tree.nodes.get(id);
      if (!node) return;
      const next = !node.collapsed;
      const err = await save(id, { collapsed: next });
      if (err) toast.error("Could not save collapse state", { description: err });
    },
    [tree, save],
  );

  useEffect(() => {
    const nextNodes: Node<OrgTreeNodeData>[] = [];
    for (const node of tree.nodes.values()) {
      if (tree.hidden.has(node.id)) continue;
      const p = node.person;
      const roleProfile = roleProfileForTitle(p?.title);
      nextNodes.push({
        id: node.id,
        type: "orgPerson",
        position: node.position,
        draggable: canEdit && !node.isRoot,
        connectable: canEdit && !node.isRoot,
        selectable: true,
        data: {
          name: node.isRoot ? "Blossom ABA Therapy" : (p?.name ?? "—"),
          title: node.isRoot ? null : cleanJobTitle(p?.title),
          roleLabel: roleProfile.label,
          department: p?.departmentName ?? null,
          photo: p?.photo ?? null,
          state: p?.state ?? null,
          level: p?.leadershipLevel ?? "individual",
          responsibilities: roleProfile.responsibilities,
          directReports: node.directReports,
          totalReports: node.totalReports,
          collapsed: node.collapsed,
          hasChildren: node.childIds.length > 0,
          isRoot: node.isRoot,
          headcount: people.length,
          overridden: node.parentSource === "override",
          dimmed: !!matchedIds && !node.isRoot && !matchedIds.has(node.id),
          onToggleCollapse: () => void toggleCollapse(node.id),
          onOpen: node.isRoot ? undefined : () => setSelectedId(node.id),
        },
      });
    }

    const nextEdges: Edge[] = [];
    for (const node of tree.nodes.values()) {
      if (!node.parentId || tree.hidden.has(node.id) || tree.hidden.has(node.parentId))
        continue;
      const active =
        !matchedIds || matchedIds.has(node.id) || matchedIds.has(node.parentId);
      nextEdges.push({
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        type: "smoothstep",
        style: {
          stroke: "hsl(var(--border))",
          strokeWidth: 1.5,
          opacity: active ? 1 : 0.15,
        },
      });
    }

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [tree, canEdit, matchedIds, people.length, toggleCollapse, setNodes, setEdges]);

  // Focus matches
  useEffect(() => {
    if (!matchedIds || matchedIds.size === 0) return;
    const t = window.setTimeout(() => {
      fitView({
        nodes: Array.from(matchedIds).map((id) => ({ id })),
        padding: 0.4,
        duration: 350,
        maxZoom: 1.1,
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [matchedIds, fitView]);

  // ---- Drag: move subtree together, persist on drop --------------------
  const dragRef = useRef<{
    rootId: string;
    start: { x: number; y: number };
    descendants: Array<{ id: string; start: { x: number; y: number } }>;
  } | null>(null);

  const onNodeDragStart = useCallback(
    (_e: unknown, node: Node<OrgTreeNodeData>) => {
      if (!canEdit) return;
      const posById = new Map(nodes.map((n) => [n.id, n.position] as const));
      dragRef.current = {
        rootId: node.id,
        start: { ...node.position },
        descendants: descendantsOf(tree, node.id)
          .map((id) => {
            const p = posById.get(id);
            return p ? { id, start: { x: p.x, y: p.y } } : null;
          })
          .filter((v): v is { id: string; start: { x: number; y: number } } => !!v),
      };
    },
    [canEdit, nodes, tree],
  );

  const onNodeDrag = useCallback(
    (_e: unknown, node: Node<OrgTreeNodeData>) => {
      const session = dragRef.current;
      if (!canEdit || !session || session.rootId !== node.id) return;
      const dx = node.position.x - session.start.x;
      const dy = node.position.y - session.start.y;
      if (session.descendants.length === 0) return;
      const nextPos = new Map(
        session.descendants.map((d) => [d.id, { x: d.start.x + dx, y: d.start.y + dy }]),
      );
      setNodes((ns) =>
        ns.map((n) => (nextPos.has(n.id) ? { ...n, position: nextPos.get(n.id)! } : n)),
      );
    },
    [canEdit, setNodes],
  );

  const onNodeDragStop = useCallback(
    async (_e: unknown, node: Node<OrgTreeNodeData>) => {
      const session = dragRef.current;
      dragRef.current = null;
      if (!canEdit) return;
      const dx = node.position.x - (session?.start.x ?? node.position.x);
      const dy = node.position.y - (session?.start.y ?? node.position.y);
      if (dx === 0 && dy === 0) return;
      const entries = [
        {
          employeeId: node.id,
          patch: { positionX: node.position.x, positionY: node.position.y },
        },
        ...(session?.descendants ?? []).map((d) => ({
          employeeId: d.id,
          patch: { positionX: d.start.x + dx, positionY: d.start.y + dy },
        })),
      ];
      const err = await saveMany(entries);
      if (err) toast.error("Move not saved", { description: err });
    },
    [canEdit, saveMany],
  );

  // ---- Re-parenting ----------------------------------------------------
  const reparent = useCallback(
    async (childId: string, parentId: string | null) => {
      if (!canEdit) return;
      if (parentId && !canReparent(tree, childId, parentId)) {
        toast.error("That would create a loop");
        return;
      }
      const err = await save(childId, {
        parentEmployeeId: parentId,
        parentOverride: true,
      });
      if (err) toast.error("Reporting line not saved", { description: err });
      else toast.success("Reporting line saved");
    },
    [canEdit, tree, save],
  );

  const resetParent = useCallback(
    async (childId: string) => {
      if (!canEdit) return;
      const err = await save(childId, {
        parentEmployeeId: null,
        parentOverride: false,
      });
      if (err) toast.error("Could not reset", { description: err });
      else toast.success("Reporting line reset to HR data");
    },
    [canEdit, save],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      void reparent(conn.target, conn.source === ORG_ROOT_ID ? null : conn.source);
    },
    [reparent],
  );

  const collapsedIds = useMemo(
    () => Array.from(tree.nodes.values()).filter((n) => n.collapsed).map((n) => n.id),
    [tree],
  );

  const expandAll = useCallback(async () => {
    if (collapsedIds.length === 0) return;
    const err = await saveMany(
      collapsedIds.map((id) => ({ employeeId: id, patch: { collapsed: false } })),
    );
    if (err) toast.error("Could not expand all", { description: err });
  }, [collapsedIds, saveMany]);

  const collapseLeaders = useCallback(async () => {
    const ids = Array.from(tree.nodes.values())
      .filter((n) => !n.isRoot && n.childIds.length > 0 && n.depth <= 2)
      .map((n) => n.id);
    if (ids.length === 0) return;
    const err = await saveMany(
      ids.map((id) => ({ employeeId: id, patch: { collapsed: true } })),
    );
    if (err) toast.error("Could not collapse", { description: err });
  }, [tree, saveMany]);

  const resetLayout = useCallback(async () => {
    const err = await resetAll();
    if (err) toast.error("Could not reset layout", { description: err });
    else toast.success("Layout reset to live HR data");
  }, [resetAll]);

  const focusNode = useCallback(
    (id: string) => {
      fitView({ nodes: [{ id }], padding: 0.6, duration: 400, maxZoom: 1.2 });
    },
    [fitView],
  );

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, title, role…"
              className="h-9 w-64 rounded-xl pl-8 pr-8"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="h-9 w-[190px] rounded-xl text-sm">
              <Filter className="mr-2 size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {matchedIds && (
            <span className="rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
              {matchedIds.size} match{matchedIds.size === 1 ? "" : "es"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <Users className="size-3.5" />
            <span className="tabular-nums">{people.length}</span> teammates
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-xl"
            onClick={collapsedIds.length > 0 ? expandAll : collapseLeaders}
            disabled={!canEdit}
            title={canEdit ? undefined : "HR / admins can change the saved layout"}
          >
            <ChevronsDownUp className="size-4" />
            {collapsedIds.length > 0 ? "Expand all" : "Collapse teams"}
          </Button>
          {canEdit ? (
            <>
              <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={resetLayout}>
                <RefreshCw className="size-4" /> Reset layout
              </Button>
              <Button asChild size="sm" variant="outline" className="h-9 rounded-xl">
                <Link to="/org-chart/editor">
                  <Pencil className="size-4" /> Manual editor
                </Link>
              </Button>
            </>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> View only
            </span>
          )}
        </div>
      </div>

      <OrgViventiumAuditPanel tree={tree} canEdit={canEdit} />

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-muted/40 via-background to-[#F5F1FA]">
        {loading && people.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading the org chart…
          </div>
        ) : people.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Users className="size-6 opacity-60" />
            <p>No active teammates found in the employee directory yet.</p>
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link to="/user-management">Open User Management</Link>
            </Button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            elementsSelectable
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.08}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(var(--border))" />
            <Controls
              showInteractive={false}
              className="!rounded-xl !border !border-border/70 !bg-card/80 !shadow-none backdrop-blur"
            />
            <MiniMap
              pannable
              zoomable
              maskColor="hsl(var(--background) / 0.6)"
              className="!rounded-xl !border !border-border/70 !bg-card/80 backdrop-blur"
            />
          </ReactFlow>
        )}
        <div className={cn(
          "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur",
          !canEdit && "hidden",
        )}>
          Drag cards to arrange · drag from a card's bottom dot onto another card to change who they report to
        </div>
      </div>

      <OrgPersonDrawer
        tree={tree}
        personId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onSelect={setSelectedId}
        onFocus={focusNode}
        canEdit={canEdit}
        onReparent={(child, parent) => void reparent(child, parent)}
        onResetParent={(child) => void resetParent(child)}
      />
    </div>
  );
}

export default function LiveOrgChart() {
  return (
    <ReactFlowProvider>
      <InnerLiveOrgChart />
    </ReactFlowProvider>
  );
}