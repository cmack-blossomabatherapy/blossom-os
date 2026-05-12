import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Network, Search, ChevronDown, ChevronRight, Mail, Phone, MapPin,
  Building2, Users, X, Maximize2, Minimize2, LayoutGrid, GitBranch, Globe2,
  ZoomIn, ZoomOut, Maximize, RotateCcw, Download, FileImage, FileText, Crosshair,
  Sparkles, Workflow, Crown, Filter, ArrowRight, MessageCircle, ExternalLink,
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
  ceo:      { label: "Executive",      ring: "ring-petal-purple/50 shadow-[0_10px_40px_-12px_hsl(var(--petal-purple)/0.45)]",  chip: "bg-petal-purple/15 text-petal-purple border-petal-purple/30" },
  c_suite:  { label: "C-Suite",        ring: "ring-primary/50 shadow-[0_10px_40px_-12px_hsl(var(--primary)/0.45)]",            chip: "bg-primary/15 text-primary border-primary/30" },
  director: { label: "Director",       ring: "ring-petal-orange/50 shadow-[0_8px_32px_-12px_hsl(var(--petal-orange)/0.40)]",  chip: "bg-petal-orange/15 text-petal-orange border-petal-orange/30" },
  manager:  { label: "Manager",        ring: "ring-petal-sage/50 shadow-[0_8px_28px_-12px_hsl(var(--petal-sage)/0.35)]",      chip: "bg-petal-sage/15 text-petal-sage border-petal-sage/30" },
  lead:     { label: "Lead",           ring: "ring-petal-pink/50 shadow-[0_8px_24px_-12px_hsl(var(--petal-pink)/0.30)]",      chip: "bg-petal-pink/15 text-petal-pink border-petal-pink/30" },
  ic:       { label: "Team Member",    ring: "ring-border/70",                                                                  chip: "bg-muted text-muted-foreground border-border" },
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

// ---------- Multi-page PDF export helper ----------
// Splits a tall PNG dataUrl into Letter-landscape pages and saves the PDF.
async function exportPaginatedPdf(dataUrl: string, filename: string) {
  const { jsPDF } = await import("jspdf");
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res) => { img.onload = res; });

  // Letter landscape in pt (792 x 612), use 36pt margin
  const PAGE_W = 792;
  const PAGE_H = 612;
  const MARGIN = 24;
  const innerW = PAGE_W - MARGIN * 2;
  const innerH = PAGE_H - MARGIN * 2;

  // Scale image so its WIDTH fits on a page; paginate vertically.
  const scale = innerW / img.width;
  const scaledH = img.height * scale;

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });

  // If single page is enough, just place it
  if (scaledH <= innerH) {
    pdf.addImage(dataUrl, "PNG", MARGIN, MARGIN, innerW, scaledH);
    pdf.save(filename);
    return;
  }

  // Otherwise tile vertically using a slicing canvas
  const sliceHeightPx = innerH / scale; // source-pixel height per page
  const totalPages = Math.ceil(img.height / sliceHeightPx);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  for (let i = 0; i < totalPages; i++) {
    const sy = Math.floor(i * sliceHeightPx);
    const sh = Math.min(Math.ceil(sliceHeightPx), img.height - sy);
    canvas.width = img.width;
    canvas.height = sh;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, img.width, sh);
    const sliceDataUrl = canvas.toDataURL("image/png");

    if (i > 0) pdf.addPage("letter", "landscape");
    pdf.addImage(sliceDataUrl, "PNG", MARGIN, MARGIN, innerW, sh * scale);

    // Page footer
    pdf.setFontSize(8);
    pdf.setTextColor(140);
    pdf.text(`Page ${i + 1} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
  }

  pdf.save(filename);
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
  const offscreenExportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "pdf">("pdf");
  const [exportScope, setExportScope] = useState<"full" | "subtree">("full");
  const [exportLegend, setExportLegend] = useState(true);
  const [flowMode, setFlowMode] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [leadershipOnly, setLeadershipOnly] = useState(false);

  // Persist view + collapsed
  useEffect(() => { savePersisted({ view }); }, [view]);
  useEffect(() => { savePersisted({ collapsed: Array.from(collapsed) }); }, [collapsed]);

  const runExport = async () => {
    setExporting(true);
    try {
      // Wait for the offscreen export node to render with the chosen options
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 80));
      const node = offscreenExportRef.current;
      if (!node) throw new Error("Export node not ready");

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      const stamp = new Date().toISOString().slice(0, 10);
      const scopeTag = exportScope === "subtree" && selected ? `-${selected.emp.last_name.toLowerCase()}` : "";
      const filterTag = search.trim() ? `-${search.trim().replace(/\s+/g, "_").slice(0, 24)}` : "";
      const base = `org-chart-${view}${scopeTag}${filterTag}-${stamp}`;

      if (exportFormat === "png") {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${base}.png`;
        a.click();
      } else {
        await exportPaginatedPdf(dataUrl, `${base}.pdf`);
      }
      toast.success(`Exported as ${exportFormat.toUpperCase()}`);
      setExportOpen(false);
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
    const hasSearch = !!search.trim();
    const hasState = stateFilter !== "all";
    const hasLeadership = leadershipOnly;
    if (!hasSearch && !hasState && !hasLeadership) return null;
    const q = search.toLowerCase();
    const matched = new Set<string>();
    const ancestors = new Set<string>();
    const visit = (n: Node, parents: string[]) => {
      const matchesSearch = !hasSearch ||
        employeeFullName(n.emp).toLowerCase().includes(q) ||
        n.emp.job_title.toLowerCase().includes(q) ||
        (n.emp.email ?? "").toLowerCase().includes(q) ||
        n.deptName.toLowerCase().includes(q) ||
        n.emp.state.toLowerCase().includes(q);
      const matchesState = !hasState || n.emp.state === stateFilter;
      const matchesLeadership = !hasLeadership || ["ceo","c_suite","director","manager"].includes(n.level);
      const hit = matchesSearch && matchesState && matchesLeadership;
      if (hit) {
        matched.add(n.emp.id);
        parents.forEach((p) => ancestors.add(p));
      }
      n.reports.forEach((c) => visit(c, [...parents, n.emp.id]));
    };
    tree.roots.forEach((r) => visit(r, []));
    return { matched, ancestors };
  }, [search, stateFilter, leadershipOnly, tree]);

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
      title="Organizational Ecosystem"
      description="Understand how every department, leader, and workflow connects."
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
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={exporting}
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {exporting ? "Exporting…" : "Export chart"}
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-xs">
            <Maximize2 className="h-3.5 w-3.5 mr-1.5" /> Expand all
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-xs">
            <Minimize2 className="h-3.5 w-3.5 mr-1.5" /> Collapse all
          </Button>
        </div>
      }
    >
      {/* Cinematic hero */}
      <OrgHero counts={counts} />

      {/* Operational flow mode */}
      {flowMode && <OperationalFlowSection onToggle={() => setFlowMode(false)} />}
      {!flowMode && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFlowMode(true)}>
            <Workflow className="h-3.5 w-3.5 mr-1.5" /> Show Operational Flow
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search anyone — name, title, department, or state…"
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
            className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-10 rounded-xl">
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
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <Card className="p-3 sm:p-4 overflow-hidden org-glass rounded-2xl">
            {view === "hierarchy" && (
              <div className="relative h-[72vh] min-h-[560px] w-full rounded-xl overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.06),transparent_55%)]">
                <TransformWrapper
                  ref={zoomRef}
                  initialScale={persisted.transform?.scale ?? 1}
                  initialPositionX={persisted.transform?.positionX ?? 0}
                  initialPositionY={persisted.transform?.positionY ?? 0}
                  minScale={0.3}
                  maxScale={2.5}
                  limitToBounds={false}
                  centerOnInit={false}
                  wheel={{ step: 0.1 }}
                  doubleClick={{ disabled: true }}
                  panning={{ excluded: ["button", "a", "input"] }}
                  onTransform={(_ref, state) => {
                    savePersisted({
                      transform: {
                        scale: state.scale,
                        positionX: state.positionX,
                        positionY: state.positionY,
                      },
                    });
                  }}
                >
                  {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                    <>
                      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 org-glass rounded-xl p-1 shadow-lg">
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
                      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-muted-foreground org-glass px-2.5 py-1.5 rounded-lg">
                        Drag to pan · Scroll to zoom · Click any node
                      </div>
                      <TransformComponent
                        wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing"
                        contentClass="!p-6"
                      >
                        <div ref={view === "hierarchy" ? exportRef : undefined} className="min-w-fit p-4">
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
              <ScrollArea className="h-[72vh] min-h-[560px]">
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
              <ScrollArea className="h-[72vh] min-h-[560px]">
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
      )}

      {/* ===== Premium fullscreen profile modal ===== */}
      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-border/60">
          {selected && <ProfileModal node={selected} tree={tree} onSelect={setSelectedId} />}
        </DialogContent>
      </Dialog>

      {/* ===== Off-screen export render (always present so the ref is stable) ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-10000px",
          left: "-10000px",
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <div
          ref={offscreenExportRef}
          className="bg-background"
          style={{ width: "1400px", padding: "32px" }}
        >
          <ExportHeader
            view={view}
            scope={exportScope}
            search={search}
            selected={selected}
          />
          <div className="mt-4">
            {view === "hierarchy" && (
              <div className="min-w-fit">
                {(exportScope === "subtree" && selected ? [selected] : tree.roots).map((root) => (
                  <TreeNode
                    key={root.emp.id}
                    node={root}
                    depth={0}
                    collapsed={new Set()}
                    onToggle={() => {}}
                    selectedId={null}
                    onSelect={() => {}}
                    matches={null}
                  />
                ))}
              </div>
            )}
            {view === "department" && (
              <DepartmentView
                employees={
                  exportScope === "subtree" && selected
                    ? [selected.emp, ...descendantsOf(selected).map((n) => n.emp)]
                    : employees
                }
                depts={depts}
                selectedId={null}
                onSelect={() => {}}
                matches={null}
              />
            )}
            {view === "state" && (
              <StateView
                employees={
                  exportScope === "subtree" && selected
                    ? [selected.emp, ...descendantsOf(selected).map((n) => n.emp)]
                    : employees
                }
                depts={depts}
                selectedId={null}
                onSelect={() => {}}
                matches={null}
              />
            )}
          </div>
          {exportLegend && <ExportLegend />}
        </div>
      </div>

      {/* ===== Export options dialog ===== */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export org chart</DialogTitle>
            <DialogDescription>
              Choose what to export and how. PDFs auto-paginate when the chart is too tall for one page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Format
              </Label>
              <RadioGroup
                value={exportFormat}
                onValueChange={(v) => setExportFormat(v as "png" | "pdf")}
                className="mt-2 grid grid-cols-2 gap-2"
              >
                <Label
                  htmlFor="fmt-pdf"
                  className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="pdf" id="fmt-pdf" />
                  <FileText className="h-4 w-4" /> PDF (multi-page)
                </Label>
                <Label
                  htmlFor="fmt-png"
                  className="flex items-center gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="png" id="fmt-png" />
                  <FileImage className="h-4 w-4" /> PNG image
                </Label>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scope
              </Label>
              <RadioGroup
                value={exportScope}
                onValueChange={(v) => setExportScope(v as "full" | "subtree")}
                className="mt-2 space-y-2"
              >
                <Label
                  htmlFor="scope-full"
                  className="flex items-start gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value="full" id="scope-full" className="mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">Full chart</p>
                    <p className="text-muted-foreground">Everyone in the current view.</p>
                  </div>
                </Label>
                <Label
                  htmlFor="scope-subtree"
                  className={cn(
                    "flex items-start gap-2 border border-border rounded-md p-2 cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                    !selected && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <RadioGroupItem
                    value="subtree"
                    id="scope-subtree"
                    className="mt-0.5"
                    disabled={!selected}
                  />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">
                      Selected employee &amp; direct reports
                    </p>
                    <p className="text-muted-foreground">
                      {selected
                        ? `Centers on ${employeeFullName(selected.emp)} and their team.`
                        : "Select an employee first to enable this."}
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between border border-border rounded-md p-3">
              <div>
                <Label htmlFor="export-legend" className="text-sm font-medium">
                  Include legend
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Color &amp; title key matching the on-screen chart.
                </p>
              </div>
              <Switch
                id="export-legend"
                checked={exportLegend}
                onCheckedChange={setExportLegend}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button size="sm" onClick={runExport} disabled={exporting}>
              {exporting ? "Exporting…" : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

// ---------- Export header & legend ----------

function ExportHeader({
  view, scope, search, selected,
}: {
  view: "hierarchy" | "department" | "state";
  scope: "full" | "subtree";
  search: string;
  selected: Node | null;
}) {
  const stamp = new Date().toLocaleString();
  const viewLabel = view === "hierarchy" ? "Hierarchy" : view === "department" ? "By Department" : "By State";
  const scopeLabel = scope === "subtree" && selected
    ? `${employeeFullName(selected.emp)} & direct reports`
    : "Full organization";
  return (
    <div className="flex items-end justify-between border-b border-border pb-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Blossom ABA Therapy
        </p>
        <h1 className="text-xl font-bold text-foreground">Organizational Chart</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {viewLabel} · {scopeLabel}
          {search.trim() && ` · Filter: "${search.trim()}"`}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground">Generated {stamp}</p>
    </div>
  );
}

function ExportLegend() {
  const items: { level: Level }[] = [
    { level: "ceo" },
    { level: "c_suite" },
    { level: "director" },
    { level: "manager" },
    { level: "lead" },
    { level: "ic" },
  ];
  return (
    <div className="mt-6 border-t border-border pt-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
        Legend
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ level }) => {
          const meta = LEVEL_META[level];
          return (
            <span
              key={level}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border",
                meta.chip,
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", meta.chip.split(" ").find((c) => c.startsWith("text-")))}>
                <span className="sr-only">{meta.label}</span>
              </span>
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
//  NEW PREMIUM COMPONENTS
// ============================================================

function OrgHero({
  counts,
}: {
  counts: { total: number; byLevel: Record<Level, number>; byState: Map<string, number> };
}) {
  const stats = [
    { label: "Team members", value: counts.total },
    { label: "Departments", value: 18 },
    { label: "States", value: counts.byState.size },
    { label: "Leadership", value: counts.byLevel.ceo + counts.byLevel.c_suite + counts.byLevel.director + counts.byLevel.manager },
  ];
  return (
    <section className="org-hero p-6 sm:p-10">
      <div className="org-hero-grid" />
      {/* Floating glow nodes */}
      <span className="org-floating-node" style={{ top: "18%", left: "12%", animationDelay: "0s" }} />
      <span className="org-floating-node" style={{ top: "62%", left: "22%", animationDelay: "1.2s" }} />
      <span className="org-floating-node" style={{ top: "30%", left: "78%", animationDelay: "2.1s" }} />
      <span className="org-floating-node" style={{ top: "70%", left: "85%", animationDelay: "0.6s" }} />
      <span className="org-floating-node" style={{ top: "12%", left: "55%", animationDelay: "1.8s" }} />

      <div className="relative space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md ring-1 ring-white/15">
          <Sparkles className="h-3.5 w-3.5" /> Blossom Ecosystem
        </div>
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
            Blossom Organizational Ecosystem
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/80 max-w-2xl">
            Understanding how every department, leader, and workflow connects together — a living map of how Blossom supports families, every day.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 px-3 py-2.5"
            >
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/70">{s.label}</p>
              <p className="text-2xl font-bold text-white tabular-nums mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperationalFlowSection({ onToggle }: { onToggle: () => void }) {
  const stages = [
    { label: "Marketing", color: "petal-pink" },
    { label: "Intake", color: "primary" },
    { label: "Authorizations", color: "petal-orange" },
    { label: "Scheduling", color: "petal-yellow" },
    { label: "Clinical", color: "petal-sage" },
    { label: "QA", color: "petal-purple" },
    { label: "Family Support", color: "primary" },
  ];
  return (
    <section className="org-glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Workflow className="h-3 w-3" /> Operational Flow Mode
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mt-1">
            How operations move through Blossom
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every family is supported by this connected pipeline of teams.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggle}>
          Hide flow
        </Button>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {stages.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                className="relative shrink-0 px-3.5 py-2.5 rounded-xl border bg-card text-foreground text-xs font-semibold whitespace-nowrap shadow-sm"
                style={{
                  borderColor: `hsl(var(--${s.color}) / 0.45)`,
                  background: `linear-gradient(135deg, hsl(var(--${s.color}) / 0.10), hsl(var(--${s.color}) / 0.02))`,
                  boxShadow: `0 8px 24px -16px hsl(var(--${s.color}) / 0.45)`,
                  animation: `org-node-pulse 3.4s ease-out infinite`,
                  animationDelay: `${i * 0.25}s`,
                }}
              >
                <span
                  className="absolute -top-1.5 -left-1.5 h-2 w-2 rounded-full"
                  style={{ background: `hsl(var(--${s.color}))`, boxShadow: `0 0 10px hsl(var(--${s.color}))` }}
                />
                {s.label}
              </div>
              {i < stages.length - 1 && (
                <svg width="36" height="14" viewBox="0 0 36 14" className="shrink-0 text-primary/60">
                  <line x1="0" y1="7" x2="36" y2="7" stroke="currentColor" strokeWidth="2" className="org-flow-line" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileModal({
  node, tree, onSelect,
}: {
  node: Node;
  tree: { nodeById: Map<string, Node> };
  onSelect: (id: string) => void;
}) {
  const e = node.emp;
  const meta = LEVEL_META[node.level];
  const directReports = node.reports;
  const totalUnder = descendantsOf(node).length;
  return (
    <div className="relative">
      {/* Hero band */}
      <div className="relative h-32 sm:h-40 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow))_55%,hsl(var(--accent))_120%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(0_0%_100%/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(0_0%_100%/0.18),transparent_50%)]" />
      </div>
      <div className="px-6 pb-6 -mt-12 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="ring-4 ring-background rounded-full bg-background">
            <EmployeeAvatar employee={e} size="xl" />
          </div>
          <div className="flex-1 min-w-0 sm:pb-1">
            <DialogTitle className="text-xl font-semibold text-foreground">{employeeFullName(e)}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              {e.job_title} · {node.deptName}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={cn("inline-flex px-2 py-0.5 rounded text-[10px] font-medium border", meta.chip)}>
                {meta.label}
              </span>
              <EmployeeStatusBadge status={e.status} />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-muted/40 text-muted-foreground">
                <MapPin className="h-3 w-3" /> {e.state}
              </span>
            </div>
          </div>
        </div>

        {/* Quick action row */}
        <div className="flex flex-wrap gap-2 mt-5">
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
          {e.email && (
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <a href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(e.email)}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Teams
              </a>
            </Button>
          )}
          <Button asChild size="sm" className="h-8 text-xs ml-auto">
            <Link to={`/hr/employees/${e.id}`}>
              Open full profile <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>

        {/* Body grid */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl border border-border/60 p-4 bg-card/40">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              About this role
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {roleBlurb(node)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4 bg-card/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Direct reports
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {directReports.length}{totalUnder !== directReports.length && ` · ${totalUnder} total`}
              </Badge>
            </div>
            {directReports.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Individual contributor — supports the team directly.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {directReports.map((r) => (
                  <button
                    key={r.emp.id}
                    onClick={() => onSelect(r.emp.id)}
                    className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/40 text-left transition-colors"
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

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <InfoTile icon={Building2} label="Department" value={node.deptName} />
          {e.clinic && <InfoTile icon={Building2} label="Clinic" value={e.clinic} />}
          <InfoTile icon={MapPin} label="State" value={e.state} />
          {e.email && <InfoTile icon={Mail} label="Email" value={e.email} />}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-3 bg-card/40">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <p className="text-[10px] uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className="text-xs font-medium text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}

function roleBlurb(node: Node): string {
  const dept = node.deptName;
  const reports = node.reports.length;
  switch (node.level) {
    case "ceo":
      return "Sets the vision for Blossom and ensures every department is aligned around supporting families with exceptional care.";
    case "c_suite":
      return "Oversees company-wide operations, connecting clinical, business, and support functions into one coordinated system.";
    case "director":
      return `Leads the ${dept} department and ${reports > 0 ? `directly supports ${reports} teammate${reports === 1 ? "" : "s"}` : "drives strategy across the organization"}.`;
    case "manager":
      return `Manages day-to-day execution within ${dept}, coaching the team and keeping operations running smoothly.`;
    case "lead":
      return `Coordinates work inside ${dept} and is a go-to resource for newer teammates.`;
    default:
      return `Part of the ${dept} team — directly supporting Blossom families and the colleagues who serve them.`;
  }
}
