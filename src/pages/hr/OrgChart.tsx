import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Network, Search, ChevronRight, Mail, Phone, MapPin,
  Building2, Users, X, GitBranch, LayoutGrid, Globe2, Crown,
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Download, ExternalLink,
} from "lucide-react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { PageShell } from "@/components/shared/PageShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeAvatar } from "@/components/hr/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/hr/HRStatusBadge";
import { employeeFullName, type Employee } from "@/lib/hr/types";
import { cn } from "@/lib/utils";

// ---------- Hierarchy rules ----------
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

const LEVEL_LABEL: Record<Level, string> = {
  ceo: "Executive", c_suite: "C-Suite", director: "Director",
  manager: "Manager", lead: "Lead", ic: "Team Member",
};

function rankWeight(l: Level): number {
  return { ceo: 0, c_suite: 1, director: 2, manager: 3, lead: 4, ic: 5 }[l];
}
function sortNodes(a: Node, b: Node): number {
  const r = rankWeight(a.level) - rankWeight(b.level);
  return r !== 0 ? r : a.emp.last_name.localeCompare(b.emp.last_name);
}

interface DeptRow { id: string; name: string; category: string | null }

interface Node {
  emp: Employee;
  level: Level;
  deptName: string;
  reports: Node[];
}

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

  const byDept = new Map<string, Node[]>();
  all.forEach((n) => {
    const list = byDept.get(n.deptName) ?? [];
    list.push(n); byDept.set(n.deptName, list);
  });

  const deptHeads: Node[] = [];
  byDept.forEach((nodes, deptName) => {
    if (deptName === "Executive" || deptName === "State Leadership") return;
    const sorted = [...nodes].sort((a, b) => rankWeight(a.level) - rankWeight(b.level));
    const head = sorted[0];
    if (!head) return;
    deptHeads.push(head);
    sorted.slice(1).forEach((n) => head.reports.push(n));
    head.reports.sort(sortNodes);
  });

  const stateDirectors = all.filter((n) => /state director/i.test(n.emp.job_title) && !/assistant/i.test(n.emp.job_title));
  const assistantStateDirs = all.filter((n) => /assistant state director/i.test(n.emp.job_title));
  assistantStateDirs.forEach((a) => {
    const head = stateDirectors.find((d) => d.emp.state === a.emp.state) ?? stateDirectors[0];
    if (head) head.reports.push(a);
  });

  if (dirOps) {
    deptHeads.forEach((h) => dirOps.reports.push(h));
    stateDirectors.forEach((d) => dirOps.reports.push(d));
    dirOps.reports.sort(sortNodes);
  }
  if (ceo) {
    if (dirOps) ceo.reports.push(dirOps);
    else { deptHeads.forEach((h) => ceo.reports.push(h)); stateDirectors.forEach((d) => ceo.reports.push(d)); }
    ceo.reports.sort(sortNodes);
  }

  const roots: Node[] = ceo ? [ceo] : dirOps ? [dirOps] : deptHeads;
  const nodeById = new Map(all.map((n) => [n.emp.id, n]));

  // Apply manager_id overrides
  const overrides = all.filter((n) => n.emp.manager_id && nodeById.has(n.emp.manager_id));
  if (overrides.length > 0) {
    const parentOf = new Map<string, Node>();
    const walk = (n: Node) => n.reports.forEach((c) => { parentOf.set(c.emp.id, n); walk(c); });
    roots.forEach(walk);
    overrides.forEach((node) => {
      const newParent = nodeById.get(node.emp.manager_id!);
      if (!newParent || newParent === node) return;
      let cur: Node | undefined = newParent;
      while (cur) { if (cur === node) return; cur = parentOf.get(cur.emp.id); }
      const oldParent = parentOf.get(node.emp.id);
      if (oldParent) oldParent.reports = oldParent.reports.filter((c) => c !== node);
      else { const idx = roots.indexOf(node); if (idx >= 0) roots.splice(idx, 1); }
      if (!newParent.reports.includes(node)) newParent.reports.push(node);
      newParent.reports.sort(sortNodes);
      parentOf.set(node.emp.id, newParent);
    });
  }
  return { roots, nodeById };
}

function descendantsOf(node: Node): Node[] {
  const out: Node[] = [];
  const walk = (n: Node) => { n.reports.forEach((c) => { out.push(c); walk(c); }); };
  walk(node);
  return out;
}

// ---------- Canvas layout (matches Org Chart Settings) ----------
const NODE_W = 240;
const NODE_H = 92;
const GAP_X = 32;
const GAP_Y = 64;

interface Pos { x: number; y: number }

function layoutCanvas(roots: Node[]): { pos: Map<string, Pos>; width: number; height: number } {
  const pos = new Map<string, Pos>();
  let cursor = 0;
  let maxDepth = 0;
  const place = (n: Node, depth: number): { left: number; right: number } => {
    maxDepth = Math.max(maxDepth, depth);
    const y = depth * (NODE_H + GAP_Y);
    if (n.reports.length === 0) {
      const x = cursor * (NODE_W + GAP_X);
      cursor++;
      pos.set(n.emp.id, { x, y });
      return { left: x, right: x };
    }
    let left = Infinity, right = -Infinity;
    n.reports.forEach((c) => {
      const r = place(c, depth + 1);
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
    });
    const x = (left + right) / 2;
    pos.set(n.emp.id, { x, y });
    return { left, right };
  };
  roots.forEach((r, i) => { if (i > 0) cursor += 1; place(r, 0); });
  return {
    pos,
    width: Math.max(NODE_W, cursor * (NODE_W + GAP_X)),
    height: (maxDepth + 1) * (NODE_H + GAP_Y),
  };
}

// ---------- Component ----------
export default function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"hierarchy" | "department" | "state">("hierarchy");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [leadershipOnly, setLeadershipOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const zoomRef = useRef<ReactZoomPanPinchRef | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

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

  const matches = useMemo(() => {
    const hasSearch = !!search.trim();
    const hasState = stateFilter !== "all";
    if (!hasSearch && !hasState && !leadershipOnly) return null;
    const q = search.toLowerCase();
    const matched = new Set<string>();
    const ancestors = new Set<string>();
    const visit = (n: Node, parents: string[]) => {
      const mSearch = !hasSearch ||
        employeeFullName(n.emp).toLowerCase().includes(q) ||
        n.emp.job_title.toLowerCase().includes(q) ||
        (n.emp.email ?? "").toLowerCase().includes(q) ||
        n.deptName.toLowerCase().includes(q) ||
        n.emp.state.toLowerCase().includes(q);
      const mState = !hasState || n.emp.state === stateFilter;
      const mLead = !leadershipOnly || ["ceo", "c_suite", "director", "manager"].includes(n.level);
      if (mSearch && mState && mLead) { matched.add(n.emp.id); parents.forEach((p) => ancestors.add(p)); }
      n.reports.forEach((c) => visit(c, [...parents, n.emp.id]));
    };
    tree.roots.forEach((r) => visit(r, []));
    return { matched, ancestors };
  }, [search, stateFilter, leadershipOnly, tree]);

  const toggle = (id: string) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const counts = useMemo(() => {
    const byLevel: Record<Level, number> = { ceo: 0, c_suite: 0, director: 0, manager: 0, lead: 0, ic: 0 };
    employees.forEach((e) => { byLevel[levelOf(e.job_title)]++; });
    const byState = new Map<string, number>();
    employees.forEach((e) => byState.set(e.state, (byState.get(e.state) ?? 0) + 1));
    return { total: employees.length, byLevel, byState };
  }, [employees]);

  const leadership = counts.byLevel.ceo + counts.byLevel.c_suite + counts.byLevel.director + counts.byLevel.manager;

  async function exportPng() {
    const node = exportRef.current;
    if (!node) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `org-chart-${view}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      toast.success("Chart exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PageShell
      title="Organizational Chart"
      description="See how every department, leader, and teammate connects."
      icon={Network}
      actions={
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportPng} disabled={exporting}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {exporting ? "Exporting…" : "Export PNG"}
        </Button>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Team members" value={counts.total} />
        <Kpi label="Departments" value={Math.max(0, new Set(employees.map((e) => e.department_id).filter(Boolean)).size)} />
        <Kpi label="States" value={counts.byState.size} />
        <Kpi label="Leadership" value={leadership} />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, title, department, or state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="all">All states</option>
            {[...counts.byState.keys()].sort().map((s) => (
              <option key={s} value={s}>{s} ({counts.byState.get(s)})</option>
            ))}
          </select>
          <Button
            variant={leadershipOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setLeadershipOnly((v) => !v)}
            className="h-10 rounded-xl text-xs"
          >
            <Crown className="h-3.5 w-3.5 mr-1.5" /> Leadership
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList className="h-10 rounded-xl">
              <TabsTrigger value="hierarchy" className="text-xs gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Tree</TabsTrigger>
              <TabsTrigger value="department" className="text-xs gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Departments</TabsTrigger>
              <TabsTrigger value="state" className="text-xs gap-1.5"><Globe2 className="h-3.5 w-3.5" /> States</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[60vh] rounded-2xl" />
      ) : (
        <Card className="overflow-hidden rounded-2xl border-border/70">
          {view === "hierarchy" && (
            <div className="relative h-[68vh] min-h-[520px] w-full bg-muted/30">
              <TransformWrapper
                ref={zoomRef}
                initialScale={1}
                minScale={0.3}
                maxScale={2.5}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: true }}
                panning={{ excluded: ["button", "a", "input"] }}
              >
                {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                  <>
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-0.5 rounded-xl border border-border/70 bg-card/90 backdrop-blur p-1 shadow-sm">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomIn()} title="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomOut()} title="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => centerView(1)} title="Fit"><Maximize className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetTransform()} title="Reset"><RotateCcw className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="absolute bottom-3 left-3 z-10 text-[10px] text-muted-foreground bg-card/80 backdrop-blur border border-border/60 px-2.5 py-1 rounded-lg">
                      Drag to pan · scroll to zoom · click any card
                    </div>
                    <TransformComponent wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing" contentClass="!p-6">
                      <div ref={view === "hierarchy" ? exportRef : undefined} className="min-w-fit p-2">
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
            <ScrollArea className="h-[68vh] min-h-[520px]">
              <div ref={exportRef} className="p-4 bg-background">
                <DepartmentView employees={employees} depts={depts} selectedId={selectedId} onSelect={setSelectedId} matches={matches} />
              </div>
            </ScrollArea>
          )}

          {view === "state" && (
            <ScrollArea className="h-[68vh] min-h-[520px]">
              <div ref={exportRef} className="p-4 bg-background">
                <StateView employees={employees} selectedId={selectedId} onSelect={setSelectedId} matches={matches} />
              </div>
            </ScrollArea>
          )}
        </Card>
      )}

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/60">
          {selected && <ProfileModal node={selected} onSelect={setSelectedId} />}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1 tabular-nums">{value}</p>
    </div>
  );
}

// ---------- Tree node ----------
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
    <div className={cn("relative", depth > 0 && "ml-6 pl-6 border-l border-border/60")}>
      {depth > 0 && <span className="absolute left-0 top-5 h-px w-6 bg-border/60" />}
      <div className="flex items-start gap-1 py-1.5">
        <button
          onClick={() => hasReports && onToggle(node.emp.id)}
          className={cn(
            "h-5 w-5 rounded grid place-items-center mt-2.5 shrink-0 transition-colors",
            hasReports ? "hover:bg-muted text-muted-foreground" : "opacity-0 pointer-events-none",
          )}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <NodeCard node={node} selected={isSelected} highlighted={!!isMatch} dimmed={!!dimmed} onSelect={onSelect} />
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
  const reportsCount = node.reports.length;
  const isLeader = ["ceo", "c_suite", "director", "manager"].includes(node.level);
  return (
    <button
      onClick={() => onSelect(node.emp.id)}
      data-node-id={node.emp.id}
      className={cn(
        "group flex items-center gap-2.5 px-3 py-2 rounded-xl border bg-card transition-all duration-200 min-w-[260px] text-left hover:-translate-y-0.5 hover:shadow-sm",
        "border-border/70",
        selected && "ring-2 ring-primary border-primary",
        highlighted && !selected && "ring-2 ring-primary/40",
        dimmed && "opacity-40",
      )}
    >
      <EmployeeAvatar employee={node.emp} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{employeeFullName(node.emp)}</p>
        <p className="text-[11px] text-muted-foreground truncate">{node.emp.job_title}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {isLeader && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
            {LEVEL_LABEL[node.level]}
          </span>
        )}
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {groups.map(([name, g]) => (
        <Card key={name} className="p-3 border-border/70">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-foreground">{name}</h3>
              {g.dept?.category && <p className="text-[11px] text-muted-foreground">{g.dept.category}</p>}
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
  employees, selectedId, onSelect, matches,
}: {
  employees: Employee[];
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {groups.map(([state, emps]) => (
        <Card key={state} className="p-3 border-border/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-muted text-foreground grid place-items-center text-[11px] font-semibold">
                {state}
              </div>
              <h3 className="text-sm font-medium text-foreground">{state}</h3>
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
  return (
    <button
      onClick={() => onSelect(emp.id)}
      className={cn(
        "w-full flex items-center gap-2 p-1.5 rounded-md text-left transition-all",
        selected && "bg-primary/10 ring-1 ring-primary",
        highlighted && !selected && "bg-muted",
        dimmed && "opacity-40",
        !selected && !highlighted && "hover:bg-muted/60",
      )}
    >
      <EmployeeAvatar employee={emp} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{employeeFullName(emp)}</p>
        <p className="text-[10px] text-muted-foreground truncate">{emp.job_title}</p>
      </div>
    </button>
  );
}

// ---------- Profile dialog ----------
function ProfileModal({ node, onSelect }: { node: Node; onSelect: (id: string) => void }) {
  const e = node.emp;
  const directReports = node.reports;
  const totalUnder = descendantsOf(node).length;
  return (
    <div className="relative">
      <div className="px-6 pt-6 pb-4 border-b border-border/60">
        <div className="flex items-start gap-4">
          <EmployeeAvatar employee={e} size="xl" />
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-lg font-semibold text-foreground">{employeeFullName(e)}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              {e.job_title} · {node.deptName}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground">
                {LEVEL_LABEL[node.level]}
              </span>
              <EmployeeStatusBadge status={e.status} />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                <MapPin className="h-3 w-3" /> {e.state}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {e.email && (
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a href={`mailto:${e.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" /> Email</a>
            </Button>
          )}
          {e.phone && (
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a href={`tel:${e.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" /> Call</a>
            </Button>
          )}
          <Button asChild size="sm" className="h-8 text-xs ml-auto">
            <Link to={`/hr/employees/${e.id}`}>
              Open profile <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 p-6">
        <div className="space-y-2.5">
          <InfoRow icon={Building2} label="Department" value={node.deptName} />
          {e.clinic && <InfoRow icon={Building2} label="Clinic" value={e.clinic} />}
          <InfoRow icon={MapPin} label="State" value={e.state} />
          {e.email && <InfoRow icon={Mail} label="Email" value={e.email} />}
          {e.phone && <InfoRow icon={Phone} label="Phone" value={e.phone} />}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Direct reports</p>
            <Badge variant="secondary" className="text-[10px]">
              {directReports.length}{totalUnder !== directReports.length && ` · ${totalUnder} total`}
            </Badge>
          </div>
          {directReports.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Individual contributor.</p>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {directReports.map((r) => (
                <button
                  key={r.emp.id}
                  onClick={() => onSelect(r.emp.id)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/60 text-left transition-colors"
                >
                  <EmployeeAvatar employee={r.emp} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{employeeFullName(r.emp)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.emp.job_title}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-xs text-foreground mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
