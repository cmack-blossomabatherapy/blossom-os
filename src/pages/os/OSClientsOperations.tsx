import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Plus, Sparkles, AlertTriangle, ChevronRight, Loader2,
  ShieldCheck, ClipboardList, Calendar as CalendarIcon, Activity,
  ArrowUpRight, CircleDot, ListTodo, Wand2, Users, UserCog, FileWarning,
  MessageSquare, StickyNote, Phone, Mail, Download, X, Heart,
} from "lucide-react";
import { OSShell } from "./OSShell";
import { useClients } from "@/contexts/ClientsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { scopeClientsForUser } from "@/lib/clients/scoping";
import {
  LIFECYCLE_STAGES, getBlockers, primaryBlocker, getUrgency,
  getHealthStatus, HEALTH_TONE, HEALTH_LABEL,
} from "@/lib/clients/operations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Client } from "@/data/clients";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

/* ─────────── helpers ─────────── */

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function urgencyDot(u: "low" | "medium" | "high") {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        u === "high" ? "bg-destructive" : u === "medium" ? "bg-amber-500" : "bg-emerald-500",
      )}
    />
  );
}

/* ─────────── page ─────────── */

export default function OSClientsOperations() {
  const { clients, loading } = useClients();
  const { user, roles } = useAuth();
  const [profileState, setProfileState] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [openClientId, setOpenClientId] = useState<string | null>(
    () => searchParams.get("client"),
  );

  // Keep drawer state in sync with the ?client=<id> deep link (CTM/escalation links).
  useEffect(() => {
    const q = searchParams.get("client");
    if (q && q !== openClientId) setOpenClientId(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const closeClientDrawer = () => {
    setOpenClientId(null);
    if (searchParams.get("client")) {
      const next = new URLSearchParams(searchParams);
      next.delete("client");
      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles")
      .select("state, display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfileState((data?.state as string) ?? null);
        setDisplayName((data?.display_name as string) ?? null);
      });
  }, [user?.id]);

  const scoped = useMemo(
    () => scopeClientsForUser(clients, { state: profileState, displayName, roles: roles as string[] }),
    [clients, profileState, displayName, roles],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((c) =>
      [c.childName, c.parentName, c.bcba, c.rbt, c.payor, c.insurance, c.state]
        .map((s) => String(s ?? "").toLowerCase())
        .join(" ")
        .includes(q),
    );
  }, [scoped, query]);

  return (
    <OSShell rightRail={<AskBlossomClientsRail clients={visible} onOpen={setOpenClientId} />}>
      <div className="space-y-10 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Manage operational client lifecycle, staffing readiness, and active service coordination.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/scheduling"><CalendarIcon className="mr-1.5 h-4 w-4" /> Open Scheduling</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/authorizations"><ShieldCheck className="mr-1.5 h-4 w-4" /> Open Authorizations</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Create Task — coming soon")}>
              <ClipboardList className="mr-1.5 h-4 w-4" /> Create Task
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Export — coming soon")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => toast("Add Client — coming soon")}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Client
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, BCBA, insurance, state…"
            className="h-11 w-full rounded-xl bg-muted/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition outline-none"
          />
        </div>

        {loading && clients.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading clients…</p>
          </div>
        ) : (
          <>
            <ClientPulse clients={visible} />
            <ClientsNeedingAttention clients={visible} onOpen={setOpenClientId} />
            <StaffingStatus clients={visible} onOpen={setOpenClientId} />
            <AuthPrRisks clients={visible} onOpen={setOpenClientId} />
            <ClientLifecyclePipeline clients={visible} onOpen={setOpenClientId} />
            <ClientHealth clients={visible} onOpen={setOpenClientId} />
            <ClientsList clients={visible} onOpen={setOpenClientId} />
            <RecentActivity clients={visible} onOpen={setOpenClientId} />
          </>
        )}
      </div>

      {openClientId && (
        <ClientDrawer clientId={openClientId} onClose={closeClientDrawer} />
      )}
    </OSShell>
  );
}

/* ─────────── Pulse ─────────── */

function ClientPulse({ clients }: { clients: Client[] }) {
  const pulse = useMemo(() => {
    const c = { active: 0, awaiting_staffing: 0, at_risk: 0, auth_expiring: 0, pr_overdue: 0, ready_to_schedule: 0 };
    for (const cl of clients) {
      if (cl.stage === "Active") c.active++;
      if (cl.stage === "Staffing Needed" || cl.stage === "Restaffing Needed") c.awaiting_staffing++;
      const blockers = getBlockers(cl);
      if (blockers.some((b) => b.key === "auth_expiring" || b.key === "auth_expired" || b.key === "staffing_needed" || b.key === "pr_overdue")) c.at_risk++;
      if (cl.authStatus === "Expiring Soon") c.auth_expiring++;
      if (blockers.some((b) => b.key === "pr_overdue") || cl.stage === "Progress Report Needed") c.pr_overdue++;
      if (cl.stage === "Pending Schedule" || (cl.bcba && cl.rbt && cl.stage === "Pending Start Date")) c.ready_to_schedule++;
    }
    return c;
  }, [clients]);

  const pills = [
    { label: "Active Clients", value: pulse.active, accent: true },
    { label: "Awaiting Staffing", value: pulse.awaiting_staffing },
    { label: "At Risk", value: pulse.at_risk },
    { label: "Auth Expiring", value: pulse.auth_expiring },
    { label: "PRs Overdue", value: pulse.pr_overdue },
    { label: "Ready to Schedule", value: pulse.ready_to_schedule },
  ];

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Client Operations Pulse</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{clients.length} total</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {pills.map((p) => (
          <div
            key={p.label}
            className={cn(
              "rounded-2xl border border-border/70 bg-card p-4",
              p.accent && "bg-primary/[0.04] border-primary/20",
            )}
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.label}</p>
            <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", p.accent && "text-primary")}>
              {p.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────── Clients Needing Attention ─────────── */

function ClientsNeedingAttention({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const actionable = useMemo(() => {
    return clients
      .map((c) => ({ client: c, blocker: primaryBlocker(c), urgency: getUrgency(c) }))
      .filter((x) => x.blocker)
      .sort((a, b) => {
        const w = { high: 0, medium: 1, low: 2 } as const;
        if (w[a.urgency] !== w[b.urgency]) return w[a.urgency] - w[b.urgency];
        return (b.client.daysInStage || 0) - (a.client.daysInStage || 0);
      })
      .slice(0, 8);
  }, [clients]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Clients Needing Attention</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operational blockers keeping clients from active service.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{actionable.length} surfaced</span>
      </div>
      {actionable.length === 0 ? (
        <EmptyTile message="All clear. No active operational blockers." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actionable.map(({ client, blocker, urgency }) => (
            <article
              key={client.id}
              className="group rounded-2xl border border-border/70 bg-card p-5 hover:border-border hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {urgencyDot(urgency)}
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {blocker?.label}
                    </span>
                  </div>
                  <button onClick={() => onOpen(client.id)} className="text-base font-medium text-left hover:text-primary transition">
                    {client.childName}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {client.state || "—"} · BCBA: {client.bcba || "Unassigned"} · {client.payor || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-muted-foreground">Days in stage</p>
                  <p className="text-lg font-semibold tabular-nums">{client.daysInStage ?? 0}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {blocker?.reason} · Stage: <span className="text-foreground">{client.stage}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-1">
                <QuickAction icon={CalendarIcon} label="Scheduling" onClick={() => toast("Open Scheduling")} />
                <QuickAction icon={ShieldCheck} label="Auth" onClick={() => toast("Open Auth")} />
                <QuickAction icon={MessageSquare} label="Message" onClick={() => toast("Message team")} />
                <QuickAction icon={StickyNote} label="Note" onClick={() => toast("Add note")} />
                <QuickAction icon={AlertTriangle} label="Escalate" onClick={() => toast("Escalated")} />
                <button onClick={() => onOpen(client.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Open <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* ─────────── Staffing Status ─────────── */

function StaffingStatus({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const groups = useMemo(() => {
    const fully = clients.filter((c) => c.bcba && c.rbt && c.stage === "Active");
    const partial = clients.filter((c) => c.bcba && !c.rbt && c.stage !== "Discharged" && c.stage !== "Active");
    const unstaffed = clients.filter((c) => !c.bcba && c.stage !== "Discharged" && c.stage !== "Services on Pause");
    const risk = clients.filter((c) => c.stage === "Restaffing Needed" || c.stage === "Staffing Needed");
    return [
      { key: "unstaffed", label: "Unstaffed", tone: "destructive", items: unstaffed },
      { key: "risk", label: "Staffing Risk", tone: "amber", items: risk },
      { key: "partial", label: "Partially Staffed", tone: "amber", items: partial },
      { key: "fully", label: "Fully Staffed", tone: "emerald", items: fully },
    ];
  }, [clients]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Staffing Status</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operational staffing coverage across active clients.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {groups.map((g) => (
          <div key={g.key} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{g.label}</p>
              <span className={cn(
                "text-sm font-semibold tabular-nums",
                g.tone === "destructive" && "text-destructive",
                g.tone === "amber" && "text-amber-600",
                g.tone === "emerald" && "text-emerald-600",
              )}>{g.items.length}</span>
            </div>
            <ul className="space-y-1">
              {g.items.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <button onClick={() => onOpen(c.id)} className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-muted text-xs">
                    <p className="truncate font-medium">{c.childName}</p>
                    <p className="truncate text-muted-foreground text-[11px]">
                      {c.bcba || "No BCBA"} · {c.rbt || "No RBT"}
                    </p>
                  </button>
                </li>
              ))}
              {g.items.length > 4 && <li className="text-[11px] text-muted-foreground px-2">+{g.items.length - 4} more</li>}
              {g.items.length === 0 && <li className="text-[11px] text-muted-foreground/70 px-2">None</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────── Auth / PR Risks ─────────── */

function AuthPrRisks({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const items = useMemo(() => {
    const list = clients
      .map((c) => ({ client: c, blockers: getBlockers(c) }))
      .filter((x) => x.blockers.some((b) => ["auth_expiring", "auth_expired", "auth_not_submitted", "pr_overdue", "qa_pending"].includes(b.key)))
      .slice(0, 10);
    return list;
  }, [clients]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Authorization & PR Risks</h2>
        <span className="text-xs text-muted-foreground">{items.length} flagged</span>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
        {items.map(({ client, blockers }) => {
          const top = blockers.find((b) => ["auth_expiring", "auth_expired", "pr_overdue", "qa_pending", "auth_not_submitted"].includes(b.key))!;
          return (
            <div key={client.id} onClick={() => onOpen(client.id)} className="px-5 py-3 hover:bg-muted/40 cursor-pointer flex items-center gap-4">
              <FileWarning className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{client.childName}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">{top.label}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {top.reason} · BCBA {client.bcba || "—"} · {client.state}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground hidden md:inline">{client.payor}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────── Lifecycle Pipeline ─────────── */

function ClientLifecyclePipeline({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const stages = useMemo(() => LIFECYCLE_STAGES.map((s) => {
    const items = clients.filter(s.match);
    const overdue = items.filter((c) => (c.daysInStage ?? 0) >= 10).length;
    const avg = items.length
      ? Math.round(items.reduce((acc, c) => acc + (c.daysInStage ?? 0), 0) / items.length)
      : 0;
    return { ...s, items, overdue, avg };
  }), [clients]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Client Lifecycle Pipeline</h2>
        <p className="text-sm text-muted-foreground">Operational progression from assessment to active services</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {stages.map((s, i) => (
          <div key={s.key} className="flex-shrink-0 w-[220px] rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
              <CircleDot className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium leading-tight mb-3">{s.label}</p>
            <p className="text-3xl font-semibold tabular-nums">{s.items.length}</p>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><span>Overdue</span><span className={cn("tabular-nums", s.overdue > 0 && "text-destructive")}>{s.overdue}</span></div>
              <div className="flex justify-between"><span>Avg days</span><span className="tabular-nums">{s.avg}</span></div>
            </div>
            {s.items.length > 0 && (
              <button onClick={() => onOpen(s.items[0].id)} className="mt-3 w-full text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                Open first <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────── Health ─────────── */

function ClientHealth({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const buckets = useMemo(() => {
    const map = new Map<string, Client[]>();
    for (const c of clients) {
      const k = getHealthStatus(c);
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return ["healthy", "staffing_risk", "auth_risk", "clinical_risk", "communication_risk"]
      .map((k) => ({ key: k as keyof typeof HEALTH_TONE, items: map.get(k) ?? [] }));
  }, [clients]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Client Readiness & Health</h2>
        <p className="text-sm text-muted-foreground">Operational health indicators</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {buckets.map((b) => (
          <div key={b.key} className="rounded-2xl border border-border/70 bg-card p-4">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", HEALTH_TONE[b.key])}>
              <Heart className="h-3 w-3" /> {HEALTH_LABEL[b.key]}
            </span>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{b.items.length}</p>
            <ul className="mt-2 space-y-1">
              {b.items.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <button onClick={() => onOpen(c.id)} className="w-full text-left text-[11px] truncate hover:text-primary">
                    {c.childName}
                  </button>
                </li>
              ))}
              {b.items.length === 0 && <li className="text-[11px] text-muted-foreground/70">None</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────── List view ─────────── */

function ClientsList({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const rows = useMemo(() => clients.slice(0, 40), [clients]);
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">All Clients</h2>
        <span className="text-xs text-muted-foreground">{clients.length} total · showing {rows.length}</span>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.6fr_0.6fr_1fr_0.9fr_0.9fr_0.9fr_1fr_auto] gap-3 px-5 py-2.5 border-b border-border/60 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>Client</span><span>State</span><span>BCBA</span><span>Staffing</span><span>Auth</span><span>QA</span><span>Next Action</span><span></span>
        </div>
        <ul className="divide-y divide-border/50">
          {rows.map((c) => {
            const health = getHealthStatus(c);
            return (
              <li key={c.id}
                onClick={() => onOpen(c.id)}
                className="px-5 py-3 hover:bg-muted/40 cursor-pointer grid grid-cols-1 md:grid-cols-[1.6fr_0.6fr_1fr_0.9fr_0.9fr_0.9fr_1fr_auto] gap-3 items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.childName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.payor || "—"} · {c.stage}</p>
                </div>
                <span className="text-xs text-muted-foreground">{c.state || "—"}</span>
                <span className="text-xs truncate">{c.bcba || <span className="text-muted-foreground">Unassigned</span>}</span>
                <span className="text-xs">{c.staffingStatus}</span>
                <span className={cn("text-xs",
                  c.authStatus === "Approved" && "text-emerald-600",
                  (c.authStatus === "Expired" || c.authStatus === "Denied") && "text-destructive",
                  c.authStatus === "Expiring Soon" && "text-amber-600",
                )}>{c.authStatus}</span>
                <span className="text-xs text-muted-foreground">{c.qaStatus}</span>
                <span className="text-xs text-muted-foreground truncate">{c.nextAction || "—"}</span>
                <span className={cn("hidden md:inline rounded-full border px-2 py-0.5 text-[10px]", HEALTH_TONE[health])}>
                  {HEALTH_LABEL[health].split(" ")[0]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ─────────── Recent Activity ─────────── */

interface UpdateRow { id: string; author: string | null; posted_at: string | null; body: string | null; parent_item_name: string | null; }

function RecentActivity({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const nameIndex = useMemo(() => {
    const m = new Map<string, Client>();
    for (const c of clients) m.set(c.childName, c);
    return m;
  }, [clients]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("monday_updates_raw")
      .select("id, author, posted_at, body, parent_item_name")
      .in("parent_board", ["clients", "authorizations"])
      .order("posted_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (cancelled) return;
        setUpdates((data ?? []) as UpdateRow[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">Latest client operational events</p>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : updates.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No recent activity.</div>
        ) : (
          updates.slice(0, 12).map((u) => {
            const c = u.parent_item_name ? nameIndex.get(u.parent_item_name) : null;
            return (
              <div key={u.id}
                className={cn("px-5 py-3 flex items-start gap-3", c && "hover:bg-muted/40 cursor-pointer")}
                onClick={() => c && onOpen(c.id)}>
                <div className="grid place-items-center h-8 w-8 rounded-full bg-muted shrink-0 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {u.parent_item_name || "Unknown client"}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">{u.author || ""}</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{relTime(u.posted_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{u.body || ""}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

/* ─────────── Insights Rail ─────────── */

function AskBlossomClientsRail({ clients, onOpen }: { clients: Client[]; onOpen: (id: string) => void }) {
  const priorities = useMemo(() => {
    return [...clients]
      .filter((c) => primaryBlocker(c))
      .sort((a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0))
      .slice(0, 5);
  }, [clients]);

  const insights = useMemo(() => {
    const expiring = clients.filter((c) => c.authStatus === "Expiring Soon").length;
    const unstaffed = clients.filter((c) => c.stage === "Staffing Needed" || c.stage === "Restaffing Needed").length;
    const prOverdue = clients.filter((c) => c.stage === "Progress Report Needed").length;
    return [
      expiring > 0 && { icon: ShieldCheck, text: `${expiring} client${expiring === 1 ? "" : "s"} approaching auth expiration.`, tone: "amber" as const },
      unstaffed > 0 && { icon: Users, text: `${unstaffed} client${unstaffed === 1 ? "" : "s"} awaiting staffing.`, tone: "violet" as const },
      prOverdue > 0 && { icon: AlertTriangle, text: `${prOverdue} progress report${prOverdue === 1 ? "" : "s"} overdue.`, tone: "sky" as const },
    ].filter(Boolean) as { icon: any; text: string; tone: "amber" | "violet" | "sky" }[];
  }, [clients]);

  const prompts = [
    "Which clients are at risk?",
    "Show staffing gaps",
    "Find auth risks",
    "Which PRs are overdue?",
    "Summarize operational blockers",
  ];

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2">
        <div className="grid place-items-center h-8 w-8 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Insights</p>
          <p className="text-[11px] text-muted-foreground">Client operations assistant</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Try</p>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button key={p} onClick={() => toast(`"${p}" — assistant coming soon`)}
              className="text-[11px] px-2.5 h-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition">
              {p}
            </button>
          ))}
        </div>
      </div>

      {insights.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Wand2 className="h-3 w-3" /> Insights
          </p>
          <div className="space-y-2">
            {insights.map((i) => (
              <div key={i.text} className="rounded-xl border border-border/60 bg-card p-3 flex gap-2.5">
                <i.icon className={cn("h-4 w-4 mt-0.5 shrink-0",
                  i.tone === "amber" && "text-amber-500",
                  i.tone === "violet" && "text-violet-500",
                  i.tone === "sky" && "text-sky-500",
                )} />
                <p className="text-xs text-foreground leading-snug">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
          <ListTodo className="h-3 w-3" /> Daily Priorities
        </p>
        {priorities.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing urgent today.</p>
        ) : (
          <div className="space-y-1">
            {priorities.map((c, i) => (
              <button key={c.id} onClick={() => onOpen(c.id)}
                className="w-full text-left rounded-xl p-2.5 hover:bg-muted transition flex items-center gap-2.5">
                <span className="grid place-items-center h-6 w-6 rounded-full bg-muted text-[11px] font-medium shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{c.childName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.daysInStage}d · {c.stage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Client Detail Drawer ─────────── */

function ClientDrawer({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const { getClient } = useClients();
  const c = getClient(clientId);
  const [taskOpen, setTaskOpen] = useState(false);
  if (!c) return null;
  const blockers = getBlockers(c);
  const health = getHealthStatus(c);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-xl bg-card border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/60 px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold truncate">{c.childName}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {c.parentName} · {c.state || "—"} · {c.payor || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", HEALTH_TONE[health])}>
              {HEALTH_LABEL[health]}
            </span>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild><Link to="/scheduling"><CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> Scheduling</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/authorizations"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Auth</Link></Button>
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}><ListTodo className="mr-1.5 h-3.5 w-3.5" /> Add Task</Button>
            <Button size="sm" variant="outline" onClick={() => toast("Message BCBA")}><MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message BCBA</Button>
            <Button size="sm" variant="outline" onClick={() => toast("Note added")}><StickyNote className="mr-1.5 h-3.5 w-3.5" /> Note</Button>
            <Button size="sm" variant="outline" onClick={() => toast("Escalated")}><AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Escalate</Button>
          </div>

          {/* Overview */}
          <Section title="Overview">
            <KV label="Stage" value={c.stage} />
            <KV label="Days in stage" value={String(c.daysInStage ?? 0)} />
            <KV label="Auth status" value={c.authStatus} />
            <KV label="Staffing" value={c.staffingStatus} />
            <KV label="QA" value={c.qaStatus} />
            <KV label="Next action" value={c.nextAction || "—"} />
          </Section>

          {/* Staffing */}
          <Section title="Care Team">
            <KV label="BCBA" value={c.bcba || "Unassigned"} />
            <KV label="RBT" value={c.rbt || "Unassigned"} />
            <KV label="Intake owner" value={c.intakeOwner || "—"} />
          </Section>

          {/* Authorizations */}
          {c.authorizations.length > 0 && (
            <Section title="Authorizations">
              <ul className="space-y-2">
                {c.authorizations.slice(0, 5).map((a, i) => (
                  <li key={a.id || i} className="rounded-xl border border-border/60 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.type}</span>
                      <span className="text-muted-foreground">{a.status}</span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      {a.hours || "—"} · {a.payor || c.payor} · Exp {a.expirationDate || "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Operational risks */}
          <Section title="Operational Risks">
            {blockers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active blockers.</p>
            ) : (
              <ul className="space-y-1.5">
                {blockers.map((b) => (
                  <li key={b.key} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span><span className="font-medium">{b.label}</span> <span className="text-muted-foreground">· {b.reason}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Timeline */}
          {c.timeline.length > 0 && (
            <Section title="Activity Timeline">
              <ul className="space-y-2">
                {c.timeline.slice(0, 8).map((t) => (
                  <li key={t.id} className="text-xs">
                    <p>{t.description}</p>
                    <p className="text-muted-foreground mt-0.5">{relTime(t.timestamp)} · {t.user || "System"}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Contact */}
          <Section title="Contact">
            <div className="flex flex-wrap gap-2">
              {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><Phone className="h-3.5 w-3.5" /> {c.phone}</a>}
              {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><Mail className="h-3.5 w-3.5" /> {c.email}</a>}
              {!c.phone && !c.email && <p className="text-xs text-muted-foreground">No contact on file.</p>}
            </div>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}

function EmptyTile({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}