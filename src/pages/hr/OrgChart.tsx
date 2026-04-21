import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Network, Search, ChevronDown, ChevronRight, Mail, Phone, MapPin,
  Building2, Users, X, Maximize2, Minimize2, LayoutGrid, GitBranch, Globe2,
  ZoomIn, ZoomOut, Maximize, RotateCcw, Download, FileImage, FileText, Crosshair,
} from "lucide-react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useRef } from "react";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/hr/HRStatusBadge";
import { employeeFullName, type Employee, type Department } from "@/lib/hr/types";
import { cn } from "@/lib/utils";

// ---------- Reporting hierarchy rules (derived from job titles) ----------

type Level = "ceo" | "c_suite" | "director" | "manager" | "lead" | "ic";

function levelOf(title: string): Level {
  const t = title.toLowerCase();
  if (t === "ceo") return "ceo";
  if (t.includes("director of operations")) return "c_suite";
  if (t.includes("director")) return "director";
  if (t.includes("manager")) return "manager";
  if (t.includes("assistant") || t.includes("coordinator") || t.includes("lead")) return "lead";
  return "ic";
}

const LEVEL_META: Record<Level, { label: string; ring: string; chip: string }> = {
  ceo:      { label: "Executive",      ring: "ring-petal-purple/40 bg-petal-purple/5",  chip: "bg-petal-purple/15 text-petal-purple border-petal-purple/30" },
  c_suite:  { label: "C-Suite",        ring: "ring-primary/40 bg-primary/5",            chip: "bg-primary/15 text-primary border-primary/30" },
  director: { label: "Director",       ring: "ring-petal-orange/40 bg-petal-orange/5",  chip: "bg-petal-orange/15 text-petal-orange border-petal-orange/30" },
  manager:  { label: "Manager",        ring: "ring-petal-sage/40 bg-petal-sage/5",      chip: "bg-petal-sage/15 text-petal-sage border-petal-sage/30" },
  lead:     { label: "Lead",           ring: "ring-petal-pink/40 bg-petal-pink/5",      chip: "bg-petal-pink/15 text-petal-pink border-petal-pink/30" },
  ic:       { label: "Team Member",    ring: "ring-border bg-card",                     chip: "bg-muted text-muted-foreground border-border" },
};

interface DeptRow { id: string; name: string; category: string | null }

interface Node {
  emp: Employee;
  level: Level;
  deptName: string;
  reports: Node[];
}

/** Build reporting tree based on titles + departments + state. */
function buildTree(emps: Employee[], depts: DeptRow[]): { roots: Node[]; nodeById: Map<string, Node> } {
  const deptById = new Map(depts.map((d) => [d.id, d.name]));
  const all: Node[] = emps.map((e) => ({
    emp: e,
    level: levelOf(e.job_title),
    deptName: e.department_id ? (deptById.get(e.department_id) ?? "Unassigned") : "Unassigned",
    reports: [],
  }));

  const ceo = all.find((n) => n.level === "ceo") ?? null;
  const dirOps = all.find((n) => n.level === "c_suite") ?? null;

  // Group by department
  const byDept = new Map<string, Node[]>();
  all.forEach((n) => {
    const list = byDept.get(n.deptName) ?? [];
    list.push(n); byDept.set(n.deptName, list);
  });

  // Group by state for state-leadership branches
  const byState = new Map<string, Node[]>();
  all.forEach((n) => {
    const list = byState.get(n.emp.state) ?? [];
    list.push(n); byState.set(n.emp.state, list);
  });

  // For each department: pick the highest-ranked person as the dept head
  const deptHeads: Node[] = [];
  byDept.forEach((nodes, deptName) => {
    if (deptName === "Executive") return; // CEO + Dir Ops already top
    if (deptName === "State Leadership") return; // handled separately
    const sorted = [...nodes].sort((a, b) => rankWeight(a.level) - rankWeight(b.level));
    const head = sorted[0];
    if (!head) return;
    deptHeads.push(head);
    // everyone else reports to head
    sorted.slice(1).forEach((n) => head.reports.push(n));
    // Sort head's reports by level then name
    head.reports.sort(sortNodes);
  });

  // State leadership: each State Director gets their assistants + state employees who aren't elsewhere
  const stateDirectors = all.filter((n) => /state director/i.test(n.emp.job_title) && !/assistant/i.test(n.emp.job_title));
  const assistantStateDirs = all.filter((n) => /assistant state director/i.test(n.emp.job_title));
  // Assistants report to a state director in the same state (or first matching)
  assistantStateDirs.forEach((a) => {
    const head =
      stateDirectors.find((d) => d.emp.state === a.emp.state) ??
      stateDirectors[0];
    if (head) head.reports.push(a);
  });

  // Director of Ops gets: every department head + every state director
  if (dirOps) {
    deptHeads.forEach((h) => dirOps.reports.push(h));
    stateDirectors.forEach((d) => dirOps.reports.push(d));
    dirOps.reports.sort(sortNodes);
  }

  // CEO gets Director of Ops; if no dirOps, gets all dept heads
  if (ceo) {
    if (dirOps) ceo.reports.push(dirOps);
    else {
      deptHeads.forEach((h) => ceo.reports.push(h));
      stateDirectors.forEach((d) => ceo.reports.push(d));
    }
    ceo.reports.sort(sortNodes);
  }

  const roots: Node[] = ceo
    ? [ceo]
    : dirOps
      ? [dirOps]
      : deptHeads;

  const nodeById = new Map(all.map((n) => [n.emp.id, n]));
  return { roots, nodeById };
}

function rankWeight(l: Level): number {
  return { ceo: 0, c_suite: 1, director: 2, manager: 3, lead: 4, ic: 5 }[l];
}
function sortNodes(a: Node, b: Node): number {
  const r = rankWeight(a.level) - rankWeight(b.level);
  if (r !== 0) return r;
  return a.emp.last_name.localeCompare(b.emp.last_name);
}

function descendantsOf(node: Node): Node[] {
  const out: Node[] = [];
  const walk = (n: Node) => { n.reports.forEach((c) => { out.push(c); walk(c); }); };
  walk(node);
  return out;
}

const STORAGE_KEY = "blossom.orgchart.state.v1";
type PersistedState = {
  view: "hierarchy" | "department" | "state";
  collapsed: string[];
  transform: { scale: number; positionX: number; positionY: number } | null;
};
function loadPersisted(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function savePersisted(patch: Partial<PersistedState>) {
  try {
    const current = loadPersisted();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
  } catch { /* ignore */ }
}

// ---------- Component ----------

export default function OrgChart() {
  const persisted = useMemo(() => loadPersisted(), []);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(persisted.collapsed ?? []));
  const [view, setView] = useState<"hierarchy" | "department" | "state">(persisted.view ?? "hierarchy");
  const zoomRef = useRef<ReactZoomPanPinchRef | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  // Persist view + collapsed
  useEffect(() => { savePersisted({ view }); }, [view]);
  useEffect(() => { savePersisted({ collapsed: Array.from(collapsed) }); }, [collapsed]);

  const handleExport = async (format: "png" | "pdf") => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      // Reset zoom/pan so the full chart is captured at 1:1 in the hierarchy view
      zoomRef.current?.resetTransform(0);
      await new Promise((r) => setTimeout(r, 50));
      const { toPng } = await import("html-to-image");
      const node = exportRef.current;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: { transform: "none" },
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const filterTag = search.trim() ? `-${search.trim().replace(/\s+/g, "_").slice(0, 24)}` : "";
      const base = `org-chart-${view}${filterTag}-${stamp}`;

      if (format === "png") {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${base}.png`;
        a.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => { img.onload = res; });
        const orientation = img.width >= img.height ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
        pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
        pdf.save(`${base}.pdf`);
      }
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const [empRes, deptRes] = await Promise.all([
        supabase.from("employees").select("*").neq("status", "terminated").order("last_name"),
        supabase.from("hr_departments").select("id,name,category"),
      ]);
      setEmployees((empRes.data ?? []) as Employee[]);
      setDepts((deptRes.data ?? []) as DeptRow[]);
      setLoading(false);
    })();
  }, []);

  const tree = useMemo(() => buildTree(employees, depts), [employees, depts]);
  const selected = selectedId ? tree.nodeById.get(selectedId) ?? null : null;

  // Search highlights – returns a set of ids matching + their ancestors so they're visible
  const matches = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matched = new Set<string>();
    const ancestors = new Set<string>();
    const visit = (n: Node, parents: string[]) => {
      const hit =
        employeeFullName(n.emp).toLowerCase().includes(q) ||
        n.emp.job_title.toLowerCase().includes(q) ||
        (n.emp.email ?? "").toLowerCase().includes(q) ||
        n.deptName.toLowerCase().includes(q) ||
        n.emp.state.toLowerCase().includes(q);
      if (hit) {
        matched.add(n.emp.id);
        parents.forEach((p) => ancestors.add(p));
      }
      n.reports.forEach((c) => visit(c, [...parents, n.emp.id]));
    };
    tree.roots.forEach((r) => visit(r, []));
    return { matched, ancestors };
  }, [search, tree]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    const all = new Set<string>();
    tree.nodeById.forEach((n) => { if (n.reports.length > 0) all.add(n.emp.id); });
    setCollapsed(all);
  };

  // Find ancestors of a node (for auto-expanding the path)
  const ancestorsOf = (targetId: string): string[] => {
    const path: string[] = [];
    const find = (n: Node, trail: string[]): boolean => {
      if (n.emp.id === targetId) { path.push(...trail); return true; }
      for (const c of n.reports) if (find(c, [...trail, n.emp.id])) return true;
      return false;
    };
    tree.roots.forEach((r) => find(r, []));
    return path;
  };

  const focusSelected = () => {
    if (!selectedId) return;
    if (view !== "hierarchy") setView("hierarchy");
    // Expand ancestors so the node is visible
    const path = ancestorsOf(selectedId);
    if (path.length > 0) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        path.forEach((id) => next.delete(id));
        return next;
      });
    }
    // Wait for layout, then pan/zoom to the node
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-node-id="${selectedId}"]`) as HTMLElement | null;
        if (el && zoomRef.current) {
          zoomRef.current.zoomToElement(el, 1.1, 400);
        }
      });
    });
  };

  // KPI counts
  const counts = useMemo(() => {
    const byLevel: Record<Level, number> = { ceo: 0, c_suite: 0, director: 0, manager: 0, lead: 0, ic: 0 };
    employees.forEach((e) => { byLevel[levelOf(e.job_title)]++; });
    const byState = new Map<string, number>();
    employees.forEach((e) => byState.set(e.state, (byState.get(e.state) ?? 0) + 1));
    return { total: employees.length, byLevel, byState };
  }, [employees]);

  return (
    <PageShell
      title="Org Chart"
      description="Live, interactive org structure built from the employee directory."
      icon={Network}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={focusSelected}
            disabled={!selectedId}
            title={selectedId ? "Pan & zoom to selected employee" : "Select an employee first"}
          >
            <Crosshair className="h-3.5 w-3.5 mr-1.5" /> Focus selected
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs" disabled={exporting}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {exporting ? "Exporting…" : "Export chart"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => handleExport("png")}>
                <FileImage className="h-3.5 w-3.5 mr-2" /> PNG image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="h-3.5 w-3.5 mr-2" /> PDF document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-xs">
            <Maximize2 className="h-3.5 w-3.5 mr-1.5" /> Expand all
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-xs">
            <Minimize2 className="h-3.5 w-3.5 mr-1.5" /> Collapse all
          </Button>
        </div>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <KpiTile label="Total" value={counts.total} icon={Users} accent="primary" />
        <KpiTile label="Executive" value={counts.byLevel.ceo + counts.byLevel.c_suite} accent="petal-purple" />
        <KpiTile label="Directors" value={counts.byLevel.director} accent="petal-orange" />
        <KpiTile label="Managers" value={counts.byLevel.manager} accent="petal-sage" />
        <KpiTile label="Leads" value={counts.byLevel.lead} accent="petal-pink" />
        <KpiTile label="Team" value={counts.byLevel.ic} accent="muted" />
        <KpiTile label="States" value={counts.byState.size} icon={Globe2} accent="primary" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, email, department, or state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-9">
            <TabsTrigger value="hierarchy" className="text-xs gap-1.5">
              <GitBranch className="h-3.5 w-3.5" /> Hierarchy
            </TabsTrigger>
            <TabsTrigger value="department" className="text-xs gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" /> Department
            </TabsTrigger>
            <TabsTrigger value="state" className="text-xs gap-1.5">
              <Globe2 className="h-3.5 w-3.5" /> State
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <Card className="p-4 overflow-hidden">
            {view === "hierarchy" && (
              <div className="relative h-[680px] w-full bg-muted/20 rounded-md overflow-hidden">
                <TransformWrapper
                  ref={zoomRef}
                  initialScale={1}
                  minScale={0.3}
                  maxScale={2.5}
                  limitToBounds={false}
                  centerOnInit={false}
                  wheel={{ step: 0.1 }}
                  doubleClick={{ disabled: true }}
                  panning={{ excluded: ["button", "a", "input"] }}
                >
                  {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                    <>
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-card border border-border/60 rounded-md p-1 shadow-sm">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomIn()} title="Zoom in">
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomOut()} title="Zoom out">
                          <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => centerView(1)} title="Fit to view">
                          <Maximize className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetTransform()} title="Reset">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded border border-border/60">
                        Drag to pan · Scroll to zoom
                      </div>
                      <TransformComponent
                        wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing"
                        contentClass="!p-6"
                      >
                        <div ref={view === "hierarchy" ? exportRef : undefined} className="min-w-fit bg-background p-4">
                          {tree.roots.map((root) => (
                            <TreeNode
                              key={root.emp.id}
                              node={root}
                              depth={0}
                              collapsed={collapsed}
                              onToggle={toggle}
                              selectedId={selectedId}
                              onSelect={setSelectedId}
                              matches={matches}
                            />
                          ))}
                        </div>
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </div>
            )}

            {view === "department" && (
              <ScrollArea className="h-[680px]">
                <div ref={view === "department" ? exportRef : undefined} className="bg-background p-2">
                  <DepartmentView
                    employees={employees}
                    depts={depts}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    matches={matches}
                  />
                </div>
              </ScrollArea>
            )}

            {view === "state" && (
              <ScrollArea className="h-[680px]">
                <div ref={view === "state" ? exportRef : undefined} className="bg-background p-2">
                  <StateView
                    employees={employees}
                    depts={depts}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    matches={matches}
                  />
                </div>
              </ScrollArea>
            )}
          </Card>

          <DetailPanel node={selected} tree={tree} onSelect={setSelectedId} />
        </div>
      )}
    </PageShell>
  );
}

// ---------- Tree node (hierarchy view) ----------

function TreeNode({
  node, depth, collapsed, onToggle, selectedId, onSelect, matches,
}: {
  node: Node;
  depth: number;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  matches: { matched: Set<string>; ancestors: Set<string> } | null;
}) {
  const isCollapsed = collapsed.has(node.emp.id);
  const hasReports = node.reports.length > 0;
  const isSelected = selectedId === node.emp.id;
  const isMatch = matches?.matched.has(node.emp.id);
  const isOnPath = matches?.ancestors.has(node.emp.id);
  const dimmed = matches && !isMatch && !isOnPath;

  return (
    <div className={cn("relative", depth > 0 && "ml-6 pl-6 border-l border-border/50")}>
      {depth > 0 && (
        <span className="absolute left-0 top-5 h-px w-6 bg-border/50" />
      )}
      <div className="flex items-start gap-1 py-1.5">
        <button
          onClick={() => hasReports && onToggle(node.emp.id)}
          className={cn(
            "h-5 w-5 rounded flex items-center justify-center mt-2 shrink-0 transition-colors",
            hasReports ? "hover:bg-muted text-muted-foreground" : "opacity-0 pointer-events-none",
          )}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <NodeCard
          node={node}
          selected={isSelected}
          highlighted={!!isMatch}
          dimmed={!!dimmed}
          onSelect={onSelect}
        />
      </div>

      {hasReports && !isCollapsed && (
        <div className="space-y-0.5">
          {node.reports.map((child) => (
            <TreeNode
              key={child.emp.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              matches={matches}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({
  node, selected, highlighted, dimmed, onSelect,
}: {
  node: Node;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const meta = LEVEL_META[node.level];
  const reportsCount = node.reports.length;
  return (
    <button
      onClick={() => onSelect(node.emp.id)}
      data-node-id={node.emp.id}
      className={cn(
        "group flex items-center gap-2.5 p-2 pr-3 rounded-lg ring-1 transition-all min-w-[260px] text-left",
        meta.ring,
        selected && "ring-2 ring-primary shadow-md",
        highlighted && !selected && "ring-2 ring-warning/60",
        dimmed && "opacity-40",
        !selected && !highlighted && "hover:ring-primary/40 hover:shadow-sm",
      )}
    >
      <EmployeeAvatar employee={node.emp} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground truncate">
            {employeeFullName(node.emp)}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{node.emp.job_title}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border", meta.chip)}>
          {meta.label}
        </span>
        {reportsCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-2.5 w-2.5" /> {reportsCount}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------- Department view ----------

function DepartmentView({
  employees, depts, selectedId, onSelect, matches,
}: {
  employees: Employee[];
  depts: DeptRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  matches: { matched: Set<string>; ancestors: Set<string> } | null;
}) {
  const groups = useMemo(() => {
    const deptById = new Map(depts.map((d) => [d.id, d]));
    const map = new Map<string, { dept: DeptRow | null; emps: Employee[] }>();
    employees.forEach((e) => {
      const d = e.department_id ? deptById.get(e.department_id) ?? null : null;
      const key = d?.name ?? "Unassigned";
      const g = map.get(key) ?? { dept: d, emps: [] };
      g.emps.push(e); map.set(key, g);
    });
    return Array.from(map.entries()).sort();
  }, [employees, depts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
      {groups.map(([name, g]) => (
        <Card key={name} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{name}</h3>
              {g.dept?.category && (
                <p className="text-[11px] text-muted-foreground">{g.dept.category}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-[10px]">{g.emps.length}</Badge>
          </div>
          <div className="space-y-1">
            {g.emps
              .slice()
              .sort((a, b) => rankWeight(levelOf(a.job_title)) - rankWeight(levelOf(b.job_title)))
              .map((e) => (
                <EmpRow
                  key={e.id}
                  emp={e}
                  selected={selectedId === e.id}
                  dimmed={!!matches && !matches.matched.has(e.id) && !matches.ancestors.has(e.id)}
                  highlighted={!!matches?.matched.has(e.id)}
                  onSelect={onSelect}
                />
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------- State view ----------

function StateView({
  employees, depts, selectedId, onSelect, matches,
}: {
  employees: Employee[];
  depts: DeptRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  matches: { matched: Set<string>; ancestors: Set<string> } | null;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Employee[]>();
    employees.forEach((e) => {
      const list = map.get(e.state) ?? [];
      list.push(e); map.set(e.state, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [employees]);

  return (
    <div className="space-y-3 pr-2">
      {groups.map(([state, emps]) => (
        <Card key={state} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                {state}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{state}</h3>
            </div>
            <Badge variant="secondary" className="text-[10px]">{emps.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {emps
              .slice()
              .sort((a, b) => rankWeight(levelOf(a.job_title)) - rankWeight(levelOf(b.job_title)))
              .map((e) => (
                <EmpRow
                  key={e.id}
                  emp={e}
                  selected={selectedId === e.id}
                  dimmed={!!matches && !matches.matched.has(e.id) && !matches.ancestors.has(e.id)}
                  highlighted={!!matches?.matched.has(e.id)}
                  onSelect={onSelect}
                />
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmpRow({
  emp, selected, dimmed, highlighted, onSelect,
}: {
  emp: Employee;
  selected: boolean;
  dimmed: boolean;
  highlighted: boolean;
  onSelect: (id: string) => void;
}) {
  const meta = LEVEL_META[levelOf(emp.job_title)];
  return (
    <button
      onClick={() => onSelect(emp.id)}
      className={cn(
        "w-full flex items-center gap-2 p-1.5 rounded-md text-left transition-all",
        selected && "bg-primary/10 ring-1 ring-primary",
        highlighted && !selected && "bg-warning/10 ring-1 ring-warning/40",
        dimmed && "opacity-40",
        !selected && !highlighted && "hover:bg-muted/40",
      )}
    >
      <EmployeeAvatar employee={emp} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{employeeFullName(emp)}</p>
        <p className="text-[10px] text-muted-foreground truncate">{emp.job_title}</p>
      </div>
      <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border", meta.chip)}>
        {meta.label}
      </span>
    </button>
  );
}

// ---------- Detail side panel ----------

function DetailPanel({
  node, tree, onSelect,
}: {
  node: Node | null;
  tree: { nodeById: Map<string, Node> };
  onSelect: (id: string) => void;
}) {
  if (!node) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <Network className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">Select a person</p>
        <p className="text-xs text-muted-foreground mt-1">
          Click any card to see contact info, department, and direct reports.
        </p>
      </Card>
    );
  }

  const e = node.emp;
  const meta = LEVEL_META[node.level];
  const directReports = node.reports;
  const totalUnder = descendantsOf(node).length;

  return (
    <Card className="p-4 sticky top-4 self-start">
      <div className="flex flex-col items-center text-center pb-4 border-b border-border/60">
        <EmployeeAvatar employee={e} size="xl" className="mb-3" />
        <h3 className="text-base font-semibold text-foreground">{employeeFullName(e)}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{e.job_title}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-medium border", meta.chip)}>
            {meta.label}
          </span>
          <EmployeeStatusBadge status={e.status} />
        </div>
      </div>

      <div className="space-y-2.5 py-4 text-xs">
        <Field icon={Building2} label="Department" value={node.deptName} />
        {e.clinic && <Field icon={Building2} label="Clinic" value={e.clinic} />}
        <Field icon={MapPin} label="State" value={e.state} />
        {e.email && (
          <Field
            icon={Mail}
            label="Email"
            value={
              <a href={`mailto:${e.email}`} className="text-primary hover:underline truncate block">
                {e.email}
              </a>
            }
          />
        )}
        {e.phone && (
          <Field
            icon={Phone}
            label="Phone"
            value={
              <a href={`tel:${e.phone}`} className="text-primary hover:underline">
                {e.phone}
              </a>
            }
          />
        )}
      </div>

      <div className="border-t border-border/60 pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Direct reports
          </p>
          <Badge variant="secondary" className="text-[10px]">
            {directReports.length}{totalUnder !== directReports.length && ` · ${totalUnder} total`}
          </Badge>
        </div>
        {directReports.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">Individual contributor</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {directReports.map((r) => (
              <button
                key={r.emp.id}
                onClick={() => onSelect(r.emp.id)}
                className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/40 text-left"
              >
                <EmployeeAvatar employee={r.emp} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{employeeFullName(r.emp)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.emp.job_title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/60 pt-3 mt-3">
        <Link
          to={`/hr/employees/${e.id}`}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          Open full profile <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}

function Field({
  icon: Icon, label, value,
}: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <div className="text-xs text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function KpiTile({
  label, value, icon: Icon, accent,
}: {
  label: string;
  value: number;
  icon?: typeof Users;
  accent: "primary" | "petal-purple" | "petal-orange" | "petal-sage" | "petal-pink" | "muted";
}) {
  const accentClass: Record<typeof accent, string> = {
    "primary":       "text-primary bg-primary/10",
    "petal-purple":  "text-petal-purple bg-petal-purple/10",
    "petal-orange":  "text-petal-orange bg-petal-orange/10",
    "petal-sage":    "text-petal-sage bg-petal-sage/10",
    "petal-pink":    "text-petal-pink bg-petal-pink/10",
    "muted":         "text-muted-foreground bg-muted",
  } as const;
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        {Icon && (
          <span className={cn("h-5 w-5 rounded flex items-center justify-center", accentClass[accent])}>
            <Icon className="h-3 w-3" />
          </span>
        )}
      </div>
      <p className={cn("text-lg font-bold mt-1", accentClass[accent].split(" ")[0])}>{value}</p>
    </div>
  );
}
