import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users, Briefcase, UserCheck, Calendar, HeartHandshake, MapPin, Plug,
  LayoutDashboard, ArrowUpRight, Plus, AlertTriangle, Sparkles, Search,
  CheckCircle2, XCircle, Clock, Building2, ListChecks, Edit2, Ban,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientsContext";
import { mockRBTProfiles, getClientStaffingNeeds } from "@/data/staffing";
import { useStaffingWorkspace } from "@/hooks/useStaffingWorkspace";
import { STAFFING_TABS, type StaffingTab } from "@/lib/os/staffing/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listNormalizedRecords, type IntegrationNormalizedRecordRow } from "@/lib/os/integrations/backend";
import { distanceBetween, type StaffingMapPoint } from "@/lib/os/staffing/mapAdapter";
import type {
  FamilyStaffingPreferenceRow,
  FamilyPreferenceImportance,
  FamilyPreferenceStatus,
  IntegrationHandoffStatus,
} from "@/lib/os/staffing/types";
import { applyPreferenceScoring, type PreferenceScoringResult } from "@/lib/os/staffing/preferenceScoring";
import { CaseDetailDrawer } from "@/components/staffing/CaseDetailDrawer";
import { ProposeMatchDialog } from "@/components/staffing/ProposeMatchDialog";
import type { Client } from "@/data/clients";

/* ---------------------------- tab definitions ---------------------------- */

const TABS: { id: StaffingTab; label: string; icon: typeof Users }[] = [
  { id: "dashboard",   label: "Dashboard",        icon: LayoutDashboard },
  { id: "open-cases",  label: "Open Cases",       icon: Briefcase },
  { id: "match-queue", label: "RBT Match Queue",  icon: UserCheck },
  { id: "coverage",    label: "Coverage Needs",   icon: Calendar },
  { id: "preferences", label: "Family Prefs",     icon: HeartHandshake },
  { id: "map",         label: "Live Map",         icon: MapPin },
  { id: "apploi",      label: "Apploi Handoff",   icon: Plug },
];

function isTab(value: string | null): value is StaffingTab {
  return !!value && (STAFFING_TABS as readonly string[]).includes(value);
}

/* --------------------------------- page --------------------------------- */

export default function OSStaffingWorkspace() {
  const [params, setParams] = useSearchParams();
  const active: StaffingTab = isTab(params.get("tab")) ? (params.get("tab") as StaffingTab) : "dashboard";
  const setTab = (t: StaffingTab) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <OSShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1500px] mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
              <Users className="h-3.5 w-3.5" /> Staffing Team
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Staffing Workspace</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Match RBTs to open cases, track family preferences, monitor coverage risk, and hand off readiness from Recruiting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/reports">Reports <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
        </header>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Active tab */}
        {active === "dashboard"   && <DashboardTab setTab={setTab} />}
        {active === "open-cases"  && <OpenCasesTab setTab={setTab} />}
        {active === "match-queue" && <MatchQueueTab />}
        {active === "coverage"    && <CoverageNeedsTab setTab={setTab} />}
        {active === "preferences" && <PreferencesTab />}
        {active === "map"         && <LiveMapTab setTab={setTab} />}
        {active === "apploi"      && <ApploiHandoffTab />}
      </div>
    </OSShell>
  );
}

/* ============================ Dashboard tab ============================ */

function DashboardTab({ setTab }: { setTab: (t: StaffingTab) => void }) {
  const { clients } = useClients();
  const { matches, preferences } = useStaffingWorkspace();
  const needs = useMemo(() => getClientStaffingNeeds(clients), [clients]);

  const openCases = needs.length;
  const matchedThisWeek = matches.filter(
    (m) => m.status === "Assigned" && Date.now() - new Date(m.updated_at).getTime() < 7 * 86400_000,
  ).length;
  const pending = matches.filter((m) => m.status === "Pending").length;
  const rejected = matches.filter((m) => m.status === "Rejected").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KPI onClick={() => setTab("open-cases")}  label="Open cases"        value={openCases}        tone="warn"   icon={Briefcase} />
        <KPI onClick={() => setTab("match-queue")} label="Matched this week" value={matchedThisWeek}  tone="ok"     icon={CheckCircle2} />
        <KPI onClick={() => setTab("match-queue")} label="Match proposals"   value={pending}          tone="info"   icon={UserCheck} />
        <KPI onClick={() => setTab("preferences")} label="Active prefs"      value={preferences.filter((p) => p.status === "active").length} tone="muted" icon={HeartHandshake} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 rounded-2xl border-border/60 lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold">Top open cases by urgency</h3>
          <div className="space-y-2">
            {needs.slice(0, 6).map((n) => (
              <div key={n.client.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.client.childName}</div>
                  <div className="text-[11px] text-muted-foreground">{n.client.state} - {n.requiredHours} hr/wk - {n.daysWaiting}d waiting</div>
                </div>
                <Badge variant={n.priority === "High" ? "destructive" : "secondary"}>{n.priority}</Badge>
              </div>
            ))}
            {needs.length === 0 && <p className="text-xs text-muted-foreground italic">No open staffing cases.</p>}
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <h3 className="text-sm font-semibold">Workflow signals</h3>
          <Signal label="Awaiting acceptance" value={pending} tone="warn" />
          <Signal label="Rejected this period" value={rejected} tone="danger" />
          <Signal label="Active family preferences" value={preferences.filter((p) => p.status === "active").length} tone="info" />
          <Signal label="RBTs at/over capacity" value={mockRBTProfiles.filter((r) => r.assignedHours >= r.capacityHours).length} tone="warn" />
        </Card>
      </div>
    </div>
  );
}

/* ============================ Open Cases tab ============================ */

function OpenCasesTab({ setTab }: { setTab: (t: StaffingTab) => void }) {
  const { clients } = useClients();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Client | null>(null);
  const needs = useMemo(() => {
    const all = getClientStaffingNeeds(clients);
    return all
      .filter((n) => stateFilter === "ALL" || n.client.state === stateFilter)
      .filter((n) => !query || n.client.childName.toLowerCase().includes(query.toLowerCase()));
  }, [clients, query, stateFilter]);

  const states = Array.from(new Set(clients.map((c) => c.state))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search client / family…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select
          className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="ALL">All states</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={() => setTab("match-queue")}>
          Go to Match Queue <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Client</Th><Th>State</Th><Th>Hours / wk</Th><Th>BCBA</Th>
                <Th>Priority</Th><Th>Days waiting</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {needs.map((n) => (
                <tr key={n.client.id} className="border-t border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(n.client)}>
                  <Td className="font-medium text-primary hover:underline">{n.client.childName}</Td>
                  <Td>{n.client.state}</Td>
                  <Td>{n.requiredHours}</Td>
                  <Td className="text-muted-foreground">{n.client.bcba ?? "-"}</Td>
                  <Td>
                    <Badge variant={n.priority === "High" ? "destructive" : "secondary"}>{n.priority}</Badge>
                  </Td>
                  <Td className={cn(n.daysWaiting > 7 ? "text-destructive font-medium" : "text-muted-foreground")}>{n.daysWaiting}d</Td>
                  <Td>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(n.client); }}
                      className="text-primary text-xs hover:underline"
                    >
                      Open case -&gt;
                    </button>
                  </Td>
                </tr>
              ))}
              {needs.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No open cases match those filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <CaseDetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        client={selected}
        onJumpMap={() => { setTab("map"); setSelected(null); }}
        onJumpQueue={() => { setTab("match-queue"); setSelected(null); }}
      />
    </div>
  );
}

/* ============================ Match Queue tab =========================== */

function MatchQueueTab() {
  const { matches, loading, error, setStatus } = useStaffingWorkspace();
  const { clients } = useClients();
  const lookupClient = (id: string) => clients.find((c) => c.id === id);
  const [reject, setReject] = useState<{ id: string; reason: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [conflictFilter, setConflictFilter] = useState<string>("ALL");
  const [capacityFilter, setCapacityFilter] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const states = Array.from(new Set(clients.map((c) => c.state))).sort();
  const visible = matches.filter((m) => {
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
    const c = lookupClient(m.client_id);
    if (stateFilter !== "ALL" && c?.state !== stateFilter) return false;
    const cap = m.capacity_remaining ?? 0;
    if (capacityFilter === "has" && cap <= 0) return false;
    if (capacityFilter === "limited" && (cap <= 0 || cap >= 8)) return false;
    if (capacityFilter === "full" && cap > 0) return false;
    const notesLow = (m.notes ?? "").toLowerCase();
    const isBlocked = notesLow.includes("blocked") || notesLow.includes("avoid");
    const isWarning = notesLow.includes("must") || notesLow.includes("conflict") || notesLow.includes("warning");
    if (conflictFilter === "clean" && (isBlocked || isWarning)) return false;
    if (conflictFilter === "warning" && !isWarning) return false;
    if (conflictFilter === "blocked" && !isBlocked) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!c?.childName.toLowerCase().includes(q) && !m.rbt_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">RBT Match Queue</h2>
          <p className="text-xs text-muted-foreground">Persisted to <code>staffing_matches</code> - assignment cascades into client stage automatically.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search client or RBT..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="Suggested">Suggested</option>
          <option value="Pending">Pending</option>
          <option value="Assigned">Assigned</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="ALL">All states</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm" value={conflictFilter} onChange={(e) => setConflictFilter(e.target.value)} title="Preference conflict filter">
          <option value="ALL">All preference fits</option>
          <option value="clean">Clean fit</option>
          <option value="warning">Has warning</option>
          <option value="blocked">Blocked</option>
        </select>
        <select className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm" value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} title="Capacity filter">
          <option value="ALL">All capacities</option>
          <option value="has">Has capacity</option>
          <option value="limited">Limited (&lt;8h)</option>
          <option value="full">Full</option>
        </select>
      </div>

      {error && (
        <Card className="p-4 rounded-2xl border-destructive/40 bg-destructive/5 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Client</Th><Th>State</Th><Th>RBT</Th><Th>Score</Th>
                <Th>Distance</Th><Th>Capacity</Th><Th>Fit</Th>
                <Th>Status</Th><Th>Updated</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="p-6 text-center text-sm text-muted-foreground">Loading...</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={10} className="p-6 text-center text-sm text-muted-foreground">No match proposals yet. Open a case to propose one.</td></tr>
              )}
              {visible.map((m) => {
                const c = lookupClient(m.client_id);
                const notesLow = (m.notes ?? "").toLowerCase();
                const blocked = notesLow.includes("blocked") || notesLow.includes("avoid");
                const warning = !blocked && (notesLow.includes("must") || notesLow.includes("conflict") || notesLow.includes("warning"));
                const fitLabel = blocked ? "Blocked" : warning ? "Warning" : "Clean";
                const isOpen = expanded === m.id;
                return (
                  <>
                    <tr key={m.id} className="border-t border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setExpanded(isOpen ? null : m.id)}>
                      <Td className="font-medium">{c?.childName ?? m.client_id.slice(0, 8)}</Td>
                      <Td>{c?.state ?? "-"}</Td>
                      <Td>{m.rbt_name}</Td>
                      <Td>{m.match_score}%</Td>
                      <Td className="text-xs">{m.distance_miles != null ? `${m.distance_miles} mi` : "-"}</Td>
                      <Td className="text-xs">{m.capacity_remaining != null ? `${m.capacity_remaining}h` : "-"}</Td>
                      <Td>
                        <Badge variant={blocked ? "destructive" : warning ? "secondary" : "outline"} className="text-[10px]">{fitLabel}</Badge>
                      </Td>
                      <Td><StatusPill status={m.status} /></Td>
                      <Td className="text-xs text-muted-foreground">{new Date(m.updated_at).toLocaleDateString()}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {m.status !== "Assigned" && (
                            <button onClick={() => setStatus(m.id, "Assigned")} className="text-xs text-emerald-600 hover:underline">Assign</button>
                          )}
                          {m.status !== "Rejected" && (
                            <button
                              onClick={() => setReject({ id: m.id, reason: "" })}
                              className="text-xs text-rose-600 hover:underline"
                            >Reject</button>
                          )}
                          {m.status === "Rejected" && (
                            <button onClick={() => setStatus(m.id, "Pending")} className="text-xs text-primary hover:underline">Re-open</button>
                          )}
                        </div>
                      </Td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/10 border-t border-border/30">
                        <td colSpan={10} className="px-6 py-3 text-xs space-y-1">
                          <div className="grid gap-2 md:grid-cols-3">
                            <div><span className="text-muted-foreground">Client clinic:</span> {c?.clinic ?? "-"}</div>
                            <div><span className="text-muted-foreground">BCBA:</span> {c?.bcba ?? "-"}</div>
                            <div><span className="text-muted-foreground">Approved hrs:</span> {c?.approvedWeeklyHours ?? "-"}</div>
                            <div><span className="text-muted-foreground">Availability overlap:</span> {(m.availability_overlap ?? []).join(", ") || "-"}</div>
                            <div><span className="text-muted-foreground">Created:</span> {new Date(m.created_at).toLocaleDateString()}</div>
                            <div><span className="text-muted-foreground">Match id:</span> <code className="text-[10px]">{m.id.slice(0, 8)}</code></div>
                          </div>
                          {m.notes && <div><span className="text-muted-foreground">Notes:</span> {m.notes}</div>}
                          {m.rejection_reason && <div className="text-destructive"><span className="font-medium">Rejection reason:</span> {m.rejection_reason}</div>}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject match</DialogTitle>
            <DialogDescription>
              A rejection reason is required so Staffing has audit history for every declined match.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-xs">Reason</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={reject?.reason ?? ""}
              onChange={(e) => setReject((r) => (r ? { ...r, reason: e.target.value } : r))}
              placeholder="e.g. Family declined, RBT unavailable, capacity full..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReject(null)}>Cancel</Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!reject?.reason.trim()}
              onClick={async () => {
                if (!reject) return;
                await setStatus(reject.id, "Rejected", { rejection_reason: reject.reason.trim() });
                setReject(null);
              }}
            >Reject match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================== Coverage Needs tab ========================= */

function CoverageNeedsTab({ setTab }: { setTab: (t: StaffingTab) => void }) {
  const { clients } = useClients();
  const [selected, setSelected] = useState<Client | null>(null);
  const atRisk = clients.filter(
    (c) =>
      (c.stage === "Active" && c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined &&
        c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8) ||
      c.stage === "Restaffing Needed" ||
      (c.authStatus === "Approved" && !c.rbt),
  );

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <h3 className="text-sm font-semibold">At-risk and uncovered clients</h3>
        <p className="text-xs text-muted-foreground">Approved without RBT, restaffing needed, or scheduled hours under 80% of approved.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Client</Th><Th>State</Th><Th>Stage</Th><Th>Approved hrs</Th>
                <Th>Scheduled hrs</Th><Th>RBT</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map((c) => (
                <tr key={c.id} className="border-t border-border/40 hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(c)}>
                  <Td className="font-medium text-primary hover:underline">{c.childName}</Td>
                  <Td>{c.state}</Td>
                  <Td>{c.stage}</Td>
                  <Td>{c.approvedWeeklyHours ?? "-"}</Td>
                  <Td className={c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined && c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8 ? "text-warning" : ""}>
                    {c.scheduledWeeklyHours ?? "-"}
                  </Td>
                  <Td className="text-muted-foreground">{c.rbt ?? "-"}</Td>
                  <Td>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(c); }} className="text-xs text-primary hover:underline">
                      Open case -&gt;
                    </button>
                  </Td>
                </tr>
              ))}
              {atRisk.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No coverage gaps detected.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <CaseDetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        client={selected}
        onJumpMap={() => { setTab("map"); setSelected(null); }}
        onJumpQueue={() => { setTab("match-queue"); setSelected(null); }}
      />
    </div>
  );
}

/* ============================ Preferences tab =========================== */

function PreferencesTab() {
  const { preferences, savePreference, removePreference, loading } = useStaffingWorkspace();
  const { clients } = useClients();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: "" as string,
    client_name: "",
    state: "",
    preference_type: "family_request" as FamilyStaffingPreferenceRow["preference_type"],
    preference_detail: "",
    importance: "nice_to_have" as FamilyPreferenceImportance,
    notes: "",
  });

  const resetForm = () => {
    setForm({ client_id: "", client_name: "", state: "", preference_type: "family_request", preference_detail: "", importance: "nice_to_have", notes: "" });
    setEditingId(null);
  };

  const startEdit = (p: FamilyStaffingPreferenceRow) => {
    setEditingId(p.id);
    setForm({
      client_id: p.client_id ?? "",
      client_name: p.client_name,
      state: p.state ?? "",
      preference_type: p.preference_type,
      preference_detail: p.preference_detail,
      importance: p.importance,
      notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const changeStatus = (p: FamilyStaffingPreferenceRow, status: FamilyPreferenceStatus) =>
    savePreference({
      id: p.id, client_id: p.client_id, client_name: p.client_name, state: p.state,
      preference_type: p.preference_type, preference_detail: p.preference_detail,
      importance: p.importance, status, notes: p.notes,
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Family Staffing Preferences</h2>
          <p className="text-xs text-muted-foreground">Influence match scoring — must-haves are treated as hard constraints.</p>
        </div>
        <Button size="sm" onClick={() => { if (open) resetForm(); setOpen((o) => !o); }}>
          <Plus className="h-4 w-4 mr-1.5" />{open ? "Cancel" : "Add preference"}
        </Button>
      </div>

      {open && (
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
              value={form.client_id}
              onChange={(e) => {
                const c = clients.find((x) => x.id === e.target.value);
                setForm({
                  ...form,
                  client_id: e.target.value,
                  client_name: c?.childName ?? form.client_name,
                  state: c?.state ?? form.state,
                });
              }}
            >
              <option value="">- Link to client (recommended) -</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.childName} - {c.state}</option>)}
            </select>
            <Input placeholder="Client name (auto-fills when linked)" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            <select
              className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
              value={form.preference_type}
              onChange={(e) => setForm({ ...form, preference_type: e.target.value as typeof form.preference_type })}
            >
              <option value="schedule">Schedule</option>
              <option value="language">Language</option>
              <option value="gender">Gender</option>
              <option value="location">Location</option>
              <option value="continuity">Continuity</option>
              <option value="clinical_fit">Clinical fit</option>
              <option value="family_request">Family request</option>
              <option value="other">Other</option>
            </select>
            <select
              className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
              value={form.importance}
              onChange={(e) => setForm({ ...form, importance: e.target.value as FamilyPreferenceImportance })}
            >
              <option value="nice_to_have">Nice to have</option>
              <option value="must_have">Must have</option>
              <option value="avoid">Avoid</option>
            </select>
            <Input className="md:col-span-2" placeholder="Preference detail" value={form.preference_detail} onChange={(e) => setForm({ ...form, preference_detail: e.target.value })} />
            <Input className="md:col-span-2" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!form.client_name || !form.preference_detail}
              onClick={async () => {
                await savePreference({
                  id: editingId ?? undefined,
                  client_id: form.client_id || null,
                  client_name: form.client_name,
                  state: form.state || null,
                  preference_type: form.preference_type,
                  preference_detail: form.preference_detail,
                  importance: form.importance,
                  notes: form.notes || null,
                });
                resetForm();
                setOpen(false);
              }}
            >{editingId ? "Update preference" : "Save preference"}</Button>
          </div>
        </Card>
      )}

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Client</Th><Th>State</Th><Th>Type</Th><Th>Detail</Th>
                <Th>Importance</Th><Th>Status</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && preferences.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No preferences logged yet.</td></tr>
              )}
              {preferences.map((p) => (
                <tr key={p.id} className="border-t border-border/40 hover:bg-muted/20">
                  <Td className="font-medium">
                    {p.client_name}
                    {p.client_id && <span className="ml-1 text-[10px] text-muted-foreground">- linked</span>}
                  </Td>
                  <Td>{p.state ?? "-"}</Td>
                  <Td className="capitalize">{p.preference_type.replace(/_/g, " ")}</Td>
                  <Td>{p.preference_detail}</Td>
                  <Td>
                    <Badge variant={p.importance === "must_have" || p.importance === "avoid" ? "destructive" : "secondary"}>
                      {p.importance === "must_have" ? "Must have" : p.importance === "avoid" ? "Avoid" : "Nice to have"}
                    </Badge>
                  </Td>
                  <Td className="capitalize">{p.status.replace(/_/g, " ")}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(p)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      {p.status === "active" && (
                        <>
                          <button onClick={() => changeStatus(p, "resolved")} className="text-xs text-emerald-600 hover:underline">Resolve</button>
                          <button onClick={() => changeStatus(p, "no_longer_applicable")} className="text-xs text-muted-foreground hover:underline">N/A</button>
                        </>
                      )}
                      {p.status !== "active" && (
                        <button onClick={() => changeStatus(p, "active")} className="text-xs text-primary hover:underline">Reactivate</button>
                      )}
                      <button onClick={() => removePreference(p.id)} className="text-xs text-rose-600 hover:underline">Remove</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================== Live Map tab ============================ */

function LiveMapTab({ setTab: _setTab }: { setTab: (t: StaffingTab) => void }) {
  const { clients } = useClients();
  const { preferences } = useStaffingWorkspace();
  const needs = useMemo(() => getClientStaffingNeeds(clients), [clients]);
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [proposeOpen, setProposeOpen] = useState(false);

  const states = Array.from(new Set([...needs.map((n) => n.client.state), ...mockRBTProfiles.map((r) => r.state)])).sort();
  const visibleNeeds = needs.filter((n) => stateFilter === "ALL" || n.client.state === stateFilter);
  const visibleRBTs = mockRBTProfiles.filter((r) => stateFilter === "ALL" || r.state === stateFilter);

  const selectedNeed = visibleNeeds.find((n) => n.client.id === selectedClientId) ?? null;

  const relevantPrefs = useMemo(() => {
    if (!selectedNeed) return [];
    return preferences.filter((p) =>
      p.status === "active" &&
      (p.client_id === selectedNeed.client.id ||
        p.client_name.toLowerCase() === selectedNeed.client.childName.toLowerCase()),
    );
  }, [preferences, selectedNeed]);

  // State-cluster summary
  const clusters = useMemo(() => {
    const map = new Map<string, { state: string; clients: number; rbts: number; openHours: number; capacity: number }>();
    for (const n of visibleNeeds) {
      const k = n.client.state;
      const e = map.get(k) ?? { state: k, clients: 0, rbts: 0, openHours: 0, capacity: 0 };
      e.clients += 1; e.openHours += n.requiredHours; map.set(k, e);
    }
    for (const r of visibleRBTs) {
      const k = r.state;
      const e = map.get(k) ?? { state: k, clients: 0, rbts: 0, openHours: 0, capacity: 0 };
      e.rbts += 1; e.capacity += Math.max(0, r.capacityHours - r.assignedHours); map.set(k, e);
    }
    return Array.from(map.values()).sort((a, b) => b.openHours - a.openHours);
  }, [visibleNeeds, visibleRBTs]);

  type RankedRow = {
    rbt: (typeof visibleRBTs)[number];
    miles: number | null;
    base: number;
    scored: PreferenceScoringResult | null;
  };
  const rankedRBTs = useMemo<RankedRow[]>(() => {
    if (!selectedNeed) {
      return visibleRBTs.map((r) => ({ rbt: r, miles: null, base: 0, scored: null }));
    }
    const clientPoint: StaffingMapPoint = {
      id: selectedNeed.client.id, kind: "client", name: selectedNeed.client.childName,
      state: selectedNeed.client.state, city: selectedNeed.client.clinic ?? null, zip: null,
      lat: null, lon: null, hours: selectedNeed.requiredHours,
    };
    return visibleRBTs
      .map((r) => {
        const rbtPoint: StaffingMapPoint = {
          id: r.id, kind: "rbt", name: r.name, state: r.state, city: r.clinic ?? null,
          zip: r.zip ?? null, lat: null, lon: null, hours: r.capacityHours - r.assignedHours,
        };
        const miles = distanceBetween(clientPoint, rbtPoint);
        const remaining = r.capacityHours - r.assignedHours;
        const sameState = r.state === selectedNeed.client.state;
        const base = Math.max(0, Math.min(100,
          (sameState ? 60 : 30) +
          Math.min(20, remaining) +
          (miles !== null ? Math.max(0, 20 - Math.round(miles / 5)) : 0),
        ));
        const scored = applyPreferenceScoring(base, relevantPrefs, { rbtName: r.name, rbtState: r.state });
        return { rbt: r, miles, base, scored } as RankedRow;
      })
      .sort((a, b) => (b.scored?.score ?? 0) - (a.scored?.score ?? 0));
  }, [selectedNeed, visibleRBTs, relevantPrefs]);

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Live Staffing Map</h2>
            <p className="text-xs text-muted-foreground">State clusters with preference-aware RBT recommendations. Select a client to rank by preference-adjusted score.</p>
          </div>
          <select
            className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="ALL">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
          {clusters.map((c) => {
            const tight = c.openHours > c.capacity;
            return (
              <button
                key={c.state}
                onClick={() => setStateFilter(stateFilter === c.state ? "ALL" : c.state)}
                className={cn(
                  "rounded-lg border p-2 text-left transition-colors",
                  stateFilter === c.state ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/40",
                  tight && "ring-1 ring-warning/40",
                )}
              >
                <div className="text-xs font-semibold">{c.state}</div>
                <div className="text-[10px] text-muted-foreground">{c.clients} cases - {c.rbts} RBTs</div>
                <div className={cn("text-[10px]", tight ? "text-warning" : "text-muted-foreground")}>{c.openHours}h needed / {c.capacity}h open</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2"><Briefcase className="h-4 w-4 text-warning" /> Open cases ({visibleNeeds.length})</h3>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {visibleNeeds.map((n) => (
              <button
                key={n.client.id}
                type="button"
                onClick={() => setSelectedClientId(n.client.id === selectedClientId ? null : n.client.id)}
                className={cn(
                  "w-full text-left rounded-lg border bg-muted/20 p-3 flex items-center justify-between transition-colors",
                  selectedClientId === n.client.id ? "border-primary ring-1 ring-primary/40" : "border-border/40 hover:border-primary/30",
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.client.childName}</div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
                    <Building2 className="h-3 w-3" /> {n.client.state} - {n.client.clinic}
                    <Clock className="h-3 w-3 ml-2" /> {n.requiredHours} hr/wk
                  </div>
                </div>
                <Badge variant={n.priority === "High" ? "destructive" : "secondary"}>{n.priority}</Badge>
              </button>
            ))}
            {visibleNeeds.length === 0 && <p className="text-xs text-muted-foreground italic">No open cases here.</p>}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              {selectedNeed ? `RBTs near ${selectedNeed.client.childName}` : `Available RBTs (${visibleRBTs.length})`}
            </h3>
            {selectedNeed && (
              <Button size="sm" onClick={() => setProposeOpen(true)}>Propose match</Button>
            )}
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {rankedRBTs.map((row) => {
              const { rbt: r, miles, scored } = row;
              const remaining = r.capacityHours - r.assignedHours;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-lg border p-3 flex items-center justify-between",
                    scored?.blocked ? "border-destructive/40 bg-destructive/5" : "border-border/40 bg-muted/20",
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.state} - {r.clinic} - ZIP {r.zip}
                      {miles !== null && <span className="ml-2">- {miles} mi</span>}
                    </div>
                    {scored && scored.applied.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {scored.applied.map((a, i) => (
                          <Badge
                            key={i}
                            variant={a.impact < 0 ? "destructive" : a.matched ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {a.preference.importance === "avoid" ? "avoid" : a.preference.importance.replace("_", " ")}: {a.impact > 0 ? `+${a.impact}` : a.impact}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {scored?.blocked && (
                      <div className="mt-1 text-[11px] text-destructive inline-flex items-center gap-1">
                        <Ban className="h-3 w-3" /> Blocked by family preference
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-medium", remaining <= 0 ? "text-destructive" : remaining < 8 ? "text-warning" : "text-success")}>
                      {remaining}h open
                    </span>
                    {scored && (
                      <span className="text-sm font-semibold">{scored.score}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {selectedNeed && (
        <ProposeMatchDialog
          open={proposeOpen}
          onOpenChange={setProposeOpen}
          caseInfo={{
            id: selectedNeed.client.id,
            childName: selectedNeed.client.childName,
            state: selectedNeed.client.state,
            clinic: selectedNeed.client.clinic ?? null,
            requiredHours: selectedNeed.requiredHours,
          }}
          preferences={preferences}
        />
      )}
    </div>
  );
}

/* ========================== Apploi Handoff tab ========================== */

function ApploiHandoffTab() {
  const [rows, setRows] = useState<IntegrationNormalizedRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { handoffs, saveHandoff } = useStaffingWorkspace();
  const [actionFor, setActionFor] = useState<{ row: IntegrationNormalizedRecordRow; status: IntegrationHandoffStatus } | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handoffByRecordId = useMemo(() => {
    const m = new Map<string, typeof handoffs[number]>();
    for (const h of handoffs) if (h.integration_record_id) m.set(h.integration_record_id, h);
    return m;
  }, [handoffs]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await listNormalizedRecords(undefined, 100);
        if (!alive) return;
        // Apploi candidate records
        setRows(all.filter((r) =>
          (r.source_label ?? "").toLowerCase().includes("apploi") ||
          r.record_kind?.toLowerCase().includes("candidate"),
        ));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const submitAction = async () => {
    if (!actionFor) return;
    const { row, status } = actionFor;
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    await saveHandoff({
      integration_record_id: row.id,
      provider: row.source_label ?? "apploi",
      candidate_name: row.person_name ?? row.display_title ?? "Unknown candidate",
      candidate_role: row.record_kind ?? null,
      state: (meta.state as string | undefined) ?? null,
      status,
      hold_reason: status === "hold" ? reason.trim() : null,
      notes: notes.trim() || null,
    });
    setActionFor(null); setReason(""); setNotes("");
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <div className="flex items-start gap-3">
          <Plug className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-base font-semibold">Apploi / Recruiting Handoff</h2>
            <p className="text-xs text-muted-foreground max-w-2xl">
              New-hire RBTs and BCBAs appear here as Apploi sync publishes into
              <code> integration_normalized_records</code>. Handoff decisions persist to
              <code> staffing_integration_handoffs</code> and respect role-based RLS.
            </p>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Candidate</Th><Th>Role</Th><Th>State</Th><Th>Apploi status</Th>
                <Th>Onboarding</Th><Th>Last synced</Th><Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">Loading candidates...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                    <Sparkles className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    Workspace is ready for Apploi candidate handoff. New records will appear here automatically as integration data starts flowing.
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/integrations">Open Integrations <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.map((r) => {
                const meta = (r.metadata ?? {}) as Record<string, unknown>;
                const state = (meta.state as string | undefined) ?? "-";
                const onboarding = (meta.onboarding_status as string | undefined) ?? "-";
                const existing = handoffByRecordId.get(r.id);
                return (
                  <tr key={r.id} className="border-t border-border/40 hover:bg-muted/20">
                    <Td className="font-medium">{r.person_name ?? r.display_title ?? r.provider_record_id ?? "-"}</Td>
                    <Td className="text-xs text-muted-foreground capitalize">{r.record_kind?.replace(/_/g, " ") ?? "-"}</Td>
                    <Td>{state}</Td>
                    <Td>{existing ? <Badge variant="outline" className="capitalize">{existing.status.replace(/_/g, " ")}</Badge> : (r.record_status ?? "-")}</Td>
                    <Td className="capitalize">{onboarding}</Td>
                    <Td className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-emerald-600 hover:underline" onClick={() => setActionFor({ row: r, status: "added_to_pool" })}>Add to pool</button>
                        <button className="text-xs text-amber-600 hover:underline" onClick={() => setActionFor({ row: r, status: "hold" })}>Hold</button>
                        <button className="text-xs text-rose-600 hover:underline" onClick={() => setActionFor({ row: r, status: "returned_to_recruiting" })}>Return</button>
                        {r.external_url && <a className="text-xs text-primary hover:underline" href={r.external_url} target="_blank" rel="noreferrer">Apploi (open)</a>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!actionFor} onOpenChange={(o) => { if (!o) { setActionFor(null); setReason(""); setNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionFor?.status === "added_to_pool" && "Add to staffing pool"}
              {actionFor?.status === "hold" && "Place on hold"}
              {actionFor?.status === "returned_to_recruiting" && "Return to Recruiting"}
            </DialogTitle>
            <DialogDescription>
              {actionFor && (
                <>This persists to <code>staffing_integration_handoffs</code> for {actionFor.row.person_name ?? "this candidate"}.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {actionFor?.status === "hold" && (
              <>
                <Label className="text-xs">Hold reason (required)</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why on hold?" />
              </>
            )}
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setActionFor(null); setReason(""); setNotes(""); }}>Cancel</Button>
            <Button size="sm" disabled={actionFor?.status === "hold" && !reason.trim()} onClick={submitAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== primitives ============================== */

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-3 py-2 whitespace-nowrap">{children}</th>;
}
function Td({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return <td className={cn("px-3 py-2 align-middle", className)} onClick={onClick}>{children}</td>;
}

function KPI({ label, value, tone, icon: Icon, onClick }: { label: string; value: number | string; tone: "ok" | "warn" | "danger" | "info" | "muted"; icon: typeof Users; onClick?: () => void }) {
  const toneClass = {
    ok: "text-success bg-success/10",
    warn: "text-warning bg-warning/10",
    danger: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <Card
      className={cn("p-5 rounded-2xl border-border/60", onClick && "cursor-pointer hover:border-primary/60 transition-colors")}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className={cn("inline-flex items-center justify-center h-7 w-7 rounded-lg", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
    </Card>
  );
}

function Signal({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "danger" | "info" }) {
  const dot = { ok: "bg-success", warn: "bg-warning", danger: "bg-destructive", info: "bg-info" }[tone];
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="inline-flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", dot)} />{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending:   "bg-warning/10 text-warning",
    Suggested: "bg-info/10 text-info",
    Assigned:  "bg-success/10 text-success",
    Rejected:  "bg-destructive/10 text-destructive",
  };
  const Icon = status === "Assigned" ? CheckCircle2 : status === "Rejected" ? XCircle : ListChecks;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", map[status] ?? "bg-muted text-muted-foreground")}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}