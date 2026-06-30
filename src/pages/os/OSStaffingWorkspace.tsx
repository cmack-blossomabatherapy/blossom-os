import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users, Briefcase, UserCheck, Calendar, HeartHandshake, MapPin, Plug,
  LayoutDashboard, ArrowUpRight, Plus, AlertTriangle, Sparkles, Search,
  CheckCircle2, XCircle, Clock, Building2, ListChecks,
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
        {active === "dashboard"   && <DashboardTab />}
        {active === "open-cases"  && <OpenCasesTab />}
        {active === "match-queue" && <MatchQueueTab />}
        {active === "coverage"    && <CoverageNeedsTab />}
        {active === "preferences" && <PreferencesTab />}
        {active === "map"         && <LiveMapTab />}
        {active === "apploi"      && <ApploiHandoffTab />}
      </div>
    </OSShell>
  );
}

/* ============================ Dashboard tab ============================ */

function DashboardTab() {
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
        <KPI label="Open cases"        value={openCases}        tone="warn"   icon={Briefcase} />
        <KPI label="Matched this week" value={matchedThisWeek}  tone="ok"     icon={CheckCircle2} />
        <KPI label="Match proposals"   value={pending}          tone="info"   icon={UserCheck} />
        <KPI label="Active prefs"      value={preferences.filter((p) => p.status === "active").length} tone="muted" icon={HeartHandshake} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 rounded-2xl border-border/60 lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold">Top open cases by urgency</h3>
          <div className="space-y-2">
            {needs.slice(0, 6).map((n) => (
              <div key={n.client.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.client.childName}</div>
                  <div className="text-[11px] text-muted-foreground">{n.client.state} · {n.requiredHours} hr/wk · {n.daysWaiting}d waiting</div>
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

function OpenCasesTab() {
  const { clients } = useClients();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
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
        <Button asChild size="sm" variant="outline">
          <Link to="/staffing">Open full case workspace <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
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
                <tr key={n.client.id} className="border-t border-border/40 hover:bg-muted/20">
                  <Td className="font-medium">{n.client.childName}</Td>
                  <Td>{n.client.state}</Td>
                  <Td>{n.requiredHours}</Td>
                  <Td className="text-muted-foreground">{n.client.bcba ?? "—"}</Td>
                  <Td>
                    <Badge variant={n.priority === "High" ? "destructive" : "secondary"}>{n.priority}</Badge>
                  </Td>
                  <Td className={cn(n.daysWaiting > 7 ? "text-destructive font-medium" : "text-muted-foreground")}>{n.daysWaiting}d</Td>
                  <Td>
                    <Link to={`/staffing?clientId=${n.client.id}`} className="text-primary text-xs hover:underline">
                      Open case →
                    </Link>
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
    </div>
  );
}

/* ============================ Match Queue tab =========================== */

function MatchQueueTab() {
  const { matches, loading, error, setStatus } = useStaffingWorkspace();
  const { clients } = useClients();
  const lookupClient = (id: string) => clients.find((c) => c.id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">RBT Match Queue</h2>
          <p className="text-xs text-muted-foreground">Persisted to <code>staffing_matches</code> — assignment cascades into client stage automatically.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/staffing">Propose from case <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
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
                <Th>Client</Th><Th>RBT</Th><Th>Score</Th><Th>Status</Th>
                <Th>Updated</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && matches.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No match proposals yet. Open a case to propose one.</td></tr>
              )}
              {matches.map((m) => {
                const c = lookupClient(m.client_id);
                return (
                  <tr key={m.id} className="border-t border-border/40 hover:bg-muted/20">
                    <Td className="font-medium">{c?.childName ?? m.client_id.slice(0, 8)}</Td>
                    <Td>{m.rbt_name}</Td>
                    <Td>{m.match_score}%</Td>
                    <Td><StatusPill status={m.status} /></Td>
                    <Td className="text-xs text-muted-foreground">{new Date(m.updated_at).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {m.status !== "Assigned" && (
                          <button onClick={() => setStatus(m.id, "Assigned")} className="text-xs text-emerald-600 hover:underline">Assign</button>
                        )}
                        {m.status !== "Rejected" && (
                          <button
                            onClick={() => {
                              const reason = window.prompt("Rejection reason?") ?? undefined;
                              if (reason !== undefined) void setStatus(m.id, "Rejected", { rejection_reason: reason });
                            }}
                            className="text-xs text-rose-600 hover:underline"
                          >Reject</button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* =========================== Coverage Needs tab ========================= */

function CoverageNeedsTab() {
  const { clients } = useClients();
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
                <tr key={c.id} className="border-t border-border/40 hover:bg-muted/20">
                  <Td className="font-medium">{c.childName}</Td>
                  <Td>{c.state}</Td>
                  <Td>{c.stage}</Td>
                  <Td>{c.approvedWeeklyHours ?? "—"}</Td>
                  <Td className={c.scheduledWeeklyHours !== undefined && c.approvedWeeklyHours !== undefined && c.scheduledWeeklyHours < c.approvedWeeklyHours * 0.8 ? "text-warning" : ""}>
                    {c.scheduledWeeklyHours ?? "—"}
                  </Td>
                  <Td className="text-muted-foreground">{c.rbt ?? "—"}</Td>
                  <Td><Link className="text-xs text-primary hover:underline" to={`/staffing?clientId=${c.id}`}>Open case →</Link></Td>
                </tr>
              ))}
              {atRisk.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No coverage gaps detected.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================ Preferences tab =========================== */

function PreferencesTab() {
  const { preferences, savePreference, removePreference, loading } = useStaffingWorkspace();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    state: "",
    preference_type: "family_request" as const,
    preference_detail: "",
    importance: "nice_to_have" as const,
    notes: "",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Family Staffing Preferences</h2>
          <p className="text-xs text-muted-foreground">Influence match scoring — must-haves are treated as hard constraints.</p>
        </div>
        <Button size="sm" onClick={() => setOpen((o) => !o)}>
          <Plus className="h-4 w-4 mr-1.5" />{open ? "Cancel" : "Add preference"}
        </Button>
      </div>

      {open && (
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            <Input placeholder="State (e.g. GA)" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
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
              onChange={(e) => setForm({ ...form, importance: e.target.value as typeof form.importance })}
            >
              <option value="nice_to_have">Nice to have</option>
              <option value="must_have">Must have</option>
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
                  client_name: form.client_name,
                  state: form.state || null,
                  preference_type: form.preference_type,
                  preference_detail: form.preference_detail,
                  importance: form.importance,
                  notes: form.notes || null,
                });
                setForm({ client_name: "", state: "", preference_type: "family_request", preference_detail: "", importance: "nice_to_have", notes: "" });
                setOpen(false);
              }}
            >Save preference</Button>
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
                  <Td className="font-medium">{p.client_name}</Td>
                  <Td>{p.state ?? "—"}</Td>
                  <Td className="capitalize">{p.preference_type.replace(/_/g, " ")}</Td>
                  <Td>{p.preference_detail}</Td>
                  <Td>
                    <Badge variant={p.importance === "must_have" ? "destructive" : "secondary"}>
                      {p.importance === "must_have" ? "Must have" : "Nice to have"}
                    </Badge>
                  </Td>
                  <Td className="capitalize">{p.status.replace(/_/g, " ")}</Td>
                  <Td>
                    <button onClick={() => removePreference(p.id)} className="text-xs text-rose-600 hover:underline">Remove</button>
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

function LiveMapTab() {
  const { clients } = useClients();
  const needs = useMemo(() => getClientStaffingNeeds(clients), [clients]);
  const [stateFilter, setStateFilter] = useState<string>("ALL");

  const states = Array.from(new Set([...needs.map((n) => n.client.state), ...mockRBTProfiles.map((r) => r.state)])).sort();
  const visibleNeeds = needs.filter((n) => stateFilter === "ALL" || n.client.state === stateFilter);
  const visibleRBTs = mockRBTProfiles.filter((r) => stateFilter === "ALL" || r.state === stateFilter);

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Live Staffing Map</h2>
            <p className="text-xs text-muted-foreground">State / clinic clustering view. Geocoded map (Mapbox) plugs in next pass — adapter ready in <code>staffingStore</code>.</p>
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
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2"><Briefcase className="h-4 w-4 text-warning" /> Open cases ({visibleNeeds.length})</h3>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {visibleNeeds.map((n) => (
              <div key={n.client.id} className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{n.client.childName}</div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
                    <Building2 className="h-3 w-3" /> {n.client.state} · {n.client.clinic}
                    <Clock className="h-3 w-3 ml-2" /> {n.requiredHours} hr/wk
                  </div>
                </div>
                <Badge variant={n.priority === "High" ? "destructive" : "secondary"}>{n.priority}</Badge>
              </div>
            ))}
            {visibleNeeds.length === 0 && <p className="text-xs text-muted-foreground italic">No open cases here.</p>}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border-border/60 space-y-3">
          <h3 className="text-sm font-semibold inline-flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> Available RBTs ({visibleRBTs.length})</h3>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {visibleRBTs.map((r) => {
              const remaining = r.capacityHours - r.assignedHours;
              return (
                <div key={r.id} className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">{r.state} · {r.clinic} · ZIP {r.zip}</div>
                  </div>
                  <span className={cn("text-[11px] font-medium", remaining <= 0 ? "text-destructive" : remaining < 8 ? "text-warning" : "text-success")}>
                    {remaining}h open
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ========================== Apploi Handoff tab ========================== */

function ApploiHandoffTab() {
  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl border-border/60 space-y-3">
        <div className="flex items-start gap-3">
          <Plug className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-base font-semibold">Apploi / Recruiting Handoff</h2>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Staffing will see new-hire RBTs and BCBAs ready for caseload assignment as soon as
              the Apploi sync starts publishing into <code>integration_normalized_records</code>. The
              adapter is wired through <code>staffingStore</code> and respects role-based RLS.
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
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                  <Sparkles className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  Apploi sync not yet active. Once a recruiter publishes a candidate, they will
                  appear here with Add-to-pool, Hold, and Notify-Recruiting actions.
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/integrations">Open Integrations <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================== primitives ============================== */

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-3 py-2 whitespace-nowrap">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2 align-middle", className)}>{children}</td>;
}

function KPI({ label, value, tone, icon: Icon }: { label: string; value: number | string; tone: "ok" | "warn" | "danger" | "info" | "muted"; icon: typeof Users }) {
  const toneClass = {
    ok: "text-success bg-success/10",
    warn: "text-warning bg-warning/10",
    danger: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
    muted: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <Card className="p-5 rounded-2xl border-border/60">
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