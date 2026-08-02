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
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  ChevronsDownUp,
  CornerLeftUp,
  Crosshair,
  Filter,
  Home,
  Loader2,
  Lock,
  Maximize2,
  Minus,
  Network,
  Pencil,
  Plus,
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
import { OrgDepartmentGrid } from "@/components/org/OrgDepartmentGrid";
import {
  ORG_ROOT_ID,
  buildOrgTree,
  canReparent,
  departmentSummaries,
  descendantsOf,
  scopeIds,
  scopeTrail,
  type OrgPersonInput,
} from "@/lib/os/orgChart/tree";
import { cleanJobTitle, roleProfileForTitle } from "@/lib/os/orgChart/responsibilities";

// Only the Super Admin may change the org chart or how it looks. Everyone else
// gets a fully interactive read-only chart (zoom, drill-down, drawer, search).
const EDITOR_ROLES = new Set(["super_admin"]);

const NODE_TYPES = { orgPerson: OrgTreeNodeCard };

type OrgView = "tree" | "departments";

function InnerLiveOrgChart() {
  const { members, loading } = useEmployeeDirectory();
  const { overrides, save, saveMany, resetAll } = useOrgChartLayout();
  const { role } = useOSRole();
  const isOrgChartAdmin = EDITOR_ROLES.has(role as string);
  const [editMode, setEditMode] = useState(false);
  const canEdit = isOrgChartAdmin && editMode;
  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();
  const { zoom } = useViewport();

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<OrgView>("tree");
  const [scopeId, setScopeId] = useState<string | null>(null);

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
    () => departmentSummaries(tree, (t) => roleProfileForTitle(t).label),
    [tree],
  );

  /** Ids visible in the current drill-in scope (null = whole company). */
  const scoped = useMemo(() => scopeIds(tree, scopeId), [tree, scopeId]);
  const trail = useMemo(() => scopeTrail(tree, scopeId), [tree, scopeId]);
  const scopeNode = scopeId ? tree.nodes.get(scopeId) ?? null : null;

  const drillInto = useCallback((id: string | null) => {
    setScopeId(id && id !== ORG_ROOT_ID ? id : null);
    setView("tree");
  }, []);

  const drillOut = useCallback(() => {
    if (!scopeId) return;
    const parent = tree.nodes.get(scopeId)?.parentId ?? null;
    setScopeId(parent && parent !== ORG_ROOT_ID ? parent : null);
  }, [scopeId, tree]);

  const departmentNames = useMemo(
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
      if (scoped && !scoped.has(node.id)) continue;
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
          isScopeRoot: node.id === scopeId,
          onToggleCollapse: () => void toggleCollapse(node.id),
          onOpen: node.isRoot ? undefined : () => setSelectedId(node.id),
          onDrillIn:
            node.isRoot || node.childIds.length === 0
              ? undefined
              : () => drillInto(node.id),
        },
      });
    }

    const nextEdges: Edge[] = [];
    for (const node of tree.nodes.values()) {
      if (!node.parentId || tree.hidden.has(node.id) || tree.hidden.has(node.parentId))
        continue;
      if (scoped && (!scoped.has(node.id) || !scoped.has(node.parentId))) continue;
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
  }, [
    tree,
    canEdit,
    matchedIds,
    people.length,
    toggleCollapse,
    setNodes,
    setEdges,
    scoped,
    scopeId,
    drillInto,
  ]);

  // Re-frame whenever the drill-in scope changes.
  useEffect(() => {
    if (view !== "tree") return;
    const t = window.setTimeout(() => {
      fitView({ padding: 0.25, duration: 400, maxZoom: 1.1 });
    }, 90);
    return () => window.clearTimeout(t);
  }, [scopeId, view, fitView]);

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

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3">
      {/* view + drill-in breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setView("tree")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "tree"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-3.5" /> Tree
            </button>
            <button
              type="button"
              onClick={() => setView("departments")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === "departments"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Building2 className="size-3.5" /> Departments
              <span className="tabular-nums opacity-70">{departments.length}</span>
            </button>
          </div>

          {view === "tree" && (
            <nav aria-label="Org chart section" className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => drillInto(null)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors",
                  scopeId
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "bg-muted/60 text-foreground",
                )}
              >
                <Home className="size-3" /> Whole company
              </button>
              {trail.map((id, i) => {
                const n = tree.nodes.get(id);
                const isLast = i === trail.length - 1;
                return (
                  <span key={id} className="flex items-center gap-1">
                    <span className="text-muted-foreground/60" aria-hidden>
                      /
                    </span>
                    <button
                      type="button"
                      onClick={() => drillInto(id)}
                      className={cn(
                        "max-w-[190px] truncate rounded-lg px-2 py-1 font-medium transition-colors",
                        isLast
                          ? "bg-muted/60 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {n?.person?.name ?? "—"}
                    </button>
                  </span>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view === "tree" && scopeId && (
            <>
              <span className="hidden rounded-full border border-border/70 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
                {(scopeNode?.totalReports ?? 0) + 1} in this section
              </span>
              <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={drillOut}>
                <CornerLeftUp className="size-4" /> Back out
              </Button>
              <Button size="sm" variant="outline" className="h-9 rounded-xl" onClick={() => drillInto(null)}>
                <ArrowLeft className="size-4" /> Whole company
              </Button>
            </>
          )}
          {view === "tree" && (
            <div className="flex items-center gap-0.5 rounded-xl border border-border/70 bg-card/70 p-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg"
                aria-label="Zoom out"
                onClick={() => zoomOut({ duration: 200 })}
              >
                <Minus className="size-4" />
              </Button>
              <button
                type="button"
                onClick={() => zoomTo(1, { duration: 200 })}
                title="Reset zoom to 100%"
                className="min-w-[52px] rounded-lg px-1 py-1 text-xs font-medium tabular-nums text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {zoomPct}%
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg"
                aria-label="Zoom in"
                onClick={() => zoomIn({ duration: 200 })}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg"
                aria-label="Fit chart to screen"
                onClick={() => fitView({ padding: 0.2, duration: 300 })}
              >
                <Maximize2 className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

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
              {departmentNames.map((d) => (
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
            title={canEdit ? undefined : "Only the Super Admin can change the saved layout"}
          >
            <ChevronsDownUp className="size-4" />
            {collapsedIds.length > 0 ? "Expand all" : "Collapse teams"}
          </Button>
          {isOrgChartAdmin ? (
            <>
              <Button
                size="sm"
                variant={editMode ? "default" : "outline"}
                className="h-9 rounded-xl"
                onClick={() => setEditMode((v) => !v)}
                aria-pressed={editMode}
              >
                {editMode ? <Lock className="size-4" /> : <Pencil className="size-4" />}
                {editMode ? "Done editing" : "Edit chart"}
              </Button>
              {editMode && (
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
              )}
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
          view === "departments" ? (
            <OrgDepartmentGrid
              departments={departments}
              onOpenDepartment={(dept) => {
                if (dept.anchorId) {
                  setDeptFilter(dept.name);
                  drillInto(dept.anchorId);
                } else {
                  setDeptFilter(dept.name);
                  setView("tree");
                }
              }}
              onOpenPerson={(id) => setSelectedId(id)}
            />
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
            onNodeDoubleClick={(_e, node) => {
              if (node.id !== ORG_ROOT_ID) drillInto(node.id);
            }}
            nodesDraggable={canEdit}
            nodesConnectable={canEdit}
            elementsSelectable
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.08}
            maxZoom={1.6}
            zoomOnScroll
            zoomOnPinch
            zoomOnDoubleClick={false}
            panOnScroll={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(var(--border))" />
            <MiniMap
              pannable
              zoomable
              maskColor="hsl(var(--background) / 0.6)"
              className="!rounded-xl !border !border-border/70 !bg-card/80 backdrop-blur"
            />
          </ReactFlow>
          )
        )}
        <div className={cn(
          "pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur",
          (view !== "tree" || !canEdit) && "hidden",
        )}>
          Scroll or pinch to zoom · double-click a card to drill into their section · drag from a card's bottom dot onto another card to change who they report to
        </div>
      </div>

      <OrgPersonDrawer
        tree={tree}
        personId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onSelect={setSelectedId}
        onFocus={focusNode}
        onDrillIn={(id) => {
          setSelectedId(null);
          drillInto(id);
        }}
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