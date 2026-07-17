import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LifeBuoy, Route as RouteIcon, Tag, Users2, ClipboardList, ShieldCheck } from "lucide-react";

type Tab = "tickets" | "categories" | "routing" | "team" | "audit";

export default function RbtSupportConsole() {
  const [tab, setTab] = useState<Tab>("tickets");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" /> RBT Support Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Tickets, routing, categories, support team contacts, and audit.</p>
      </header>

      <nav className="flex gap-1 border-b border-border/70 overflow-x-auto">
        {([
          ["tickets",    "Tickets",    ClipboardList],
          ["categories", "Categories", Tag],
          ["routing",    "Routing",    RouteIcon],
          ["team",       "Team",       Users2],
          ["audit",      "Audit",      ShieldCheck],
        ] as [Tab,string,any][]).map(([k,label,Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition ${tab === k ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === "tickets"    && <TicketsPanel />}
      {tab === "categories" && <CategoriesPanel />}
      {tab === "routing"    && <RoutingPanel />}
      {tab === "team"       && <TeamPanel />}
      {tab === "audit"      && <AuditPanel />}
    </div>
  );
}

// -------- Tickets
function TicketsPanel() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<string>("open");

  const load = async () => {
    let q = supabase.from("rbt_help_requests" as any).select("*").order("created_at",{ascending:false}).limit(200);
    if (filter === "open") q = q.not("status","in","(resolved,closed)");
    else if (filter === "urgent") q = q.eq("is_urgent_safety", true);
    else if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as any) ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("rbt_help_requests" as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated"); load();
  };

  const escalate = async (r: any) => {
    const { error } = await supabase.from("rbt_help_requests" as any)
      .update({ escalation_level: (r.escalation_level ?? 0) + 1 }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Escalated"); load();
  };

  const resolve = async (r: any) => {
    const notes = window.prompt("Resolution notes (visible to employee):");
    if (!notes) return;
    const { error } = await supabase.from("rbt_help_requests" as any)
      .update({ status: "resolved", resolution_notes: notes, resolved_at: new Date().toISOString() }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Resolved"); load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["open","urgent","submitted","received","in_progress","waiting_for_you","resolved","closed","all"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs rounded-full px-3 py-1 border transition ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/70 hover:bg-muted"}`}>
            {f.replace(/_/g," ")}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
        {rows === null && <div className="p-8 text-sm text-muted-foreground">Loading…</div>}
        {rows?.length === 0 && <div className="p-8 text-sm text-muted-foreground">No tickets.</div>}
        {rows?.map(r => (
          <div key={r.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs tabular-nums text-muted-foreground">{r.ticket_number}</span>
                  {r.is_urgent_safety && <span className="text-[10px] rounded-full bg-red-500/10 text-red-700 px-2 py-0.5 font-semibold">URGENT</span>}
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5">{r.category?.replace(/_/g," ")}</span>
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5">{r.urgency}</span>
                  <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5">{r.status?.replace(/_/g," ")}</span>
                  {r.escalation_level > 0 && <span className="text-[10px] rounded-full bg-amber-500/10 text-amber-700 px-2 py-0.5">esc L{r.escalation_level}</span>}
                </div>
                <p className="text-sm font-medium mt-1">{r.subject || r.description?.slice(0,80)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Owner: {r.routed_to_role ?? "unassigned"} · Due {r.due_at ? new Date(r.due_at).toLocaleString() : "—"}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <select value={r.status} onChange={e => setStatus(r.id, e.target.value)}
                  className="text-xs rounded-lg border border-border/70 bg-card px-2 py-1">
                  {["submitted","received","in_progress","waiting_for_you","resolved","closed"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
                <button onClick={() => escalate(r)} className="text-xs rounded-lg border border-border/70 px-2 py-1 hover:bg-muted">Escalate</button>
                <button onClick={() => resolve(r)} className="text-xs rounded-lg bg-emerald-600 text-white px-2 py-1 hover:bg-emerald-700">Resolve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Categories
function CategoriesPanel() {
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => supabase.from("rbt_support_categories" as any).select("*").order("order_index").then(({ data }) => setRows((data as any) ?? []));
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("rbt_support_categories" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  return (
    <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
      {rows?.map(c => (
        <div key={c.id} className="p-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] items-center">
          <div>
            <p className="text-sm font-medium">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.key} · {c.description}</p>
          </div>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={c.is_urgent_safety} onChange={e => update(c.id, { is_urgent_safety: e.target.checked })} /> Urgent-safety
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={c.ai_advice_restricted} onChange={e => update(c.id, { ai_advice_restricted: e.target.checked })} /> No AI advice
          </label>
          <input type="number" defaultValue={c.default_sla_minutes} onBlur={e => update(c.id, { default_sla_minutes: parseInt(e.target.value) || 1440 })}
            className="w-20 text-xs rounded-lg border border-border/70 bg-card px-2 py-1" />
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={c.active} onChange={e => update(c.id, { active: e.target.checked })} /> Active
          </label>
        </div>
      ))}
    </div>
  );
}

// -------- Routing rules
function RoutingPanel() {
  const [rows, setRows] = useState<any[] | null>(null);
  const load = () => supabase.from("rbt_support_routing_rules" as any).select("*").order("priority").then(({ data }) => setRows((data as any) ?? []));
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("rbt_support_routing_rules" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  const toggle = (r: any) => update(r.id, { active: !r.active });
  return (
    <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
      {rows?.map(r => (
        <div key={r.id} className="p-4 grid gap-2 md:grid-cols-[auto_1fr_auto_auto] items-center">
          <span className="text-xs tabular-nums text-muted-foreground w-10">#{r.priority}</span>
          <div>
            <p className="text-sm font-medium">{r.name}</p>
            <p className="text-xs text-muted-foreground">
              {[
                r.match_category && `cat=${r.match_category}`,
                r.match_state && `state=${r.match_state}`,
                r.match_urgency && `urg=${r.match_urgency}`,
                r.match_service_setting && `setting=${r.match_service_setting}`,
                r.match_time_of_day && `tod=${r.match_time_of_day}`,
                r.match_escalation_min != null && `esc>=${r.match_escalation_min}`,
              ].filter(Boolean).join(" · ") || "any"}
              {" → "}
              {r.route_to_assigned_bcba ? "assigned BCBA" : r.route_to_rbt_support_rep ? "RBT Support Rep" : r.route_to_role ?? "—"}
              {r.sla_minutes_override && ` · SLA ${r.sla_minutes_override}m`}
              {r.escalate_after_minutes && ` · esc ${r.escalate_after_minutes}m`}
            </p>
          </div>
          <input type="number" defaultValue={r.priority} onBlur={e => update(r.id, { priority: parseInt(e.target.value) || 100 })}
            className="w-16 text-xs rounded-lg border border-border/70 bg-card px-2 py-1" />
          <button onClick={() => toggle(r)}
            className={`text-xs rounded-full px-3 py-1 border ${r.active ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/40" : "bg-muted border-border/70"}`}>
            {r.active ? "Active" : "Off"}
          </button>
        </div>
      ))}
      <p className="p-4 text-xs text-muted-foreground">Rules match top-down by priority. Employees never see this — routing happens automatically on submit.</p>
    </div>
  );
}

// -------- Team contacts
function TeamPanel() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [form, setForm] = useState({ scope:"default", scope_state:"", role_key:"bcba", contact_name:"", contact_email:"", contact_phone:"", notes:"" });
  const load = () => supabase.from("rbt_support_team_contacts" as any).select("*").order("scope").then(({ data }) => setRows((data as any) ?? []));
  useEffect(() => { load(); }, []);
  const add = async () => {
    const payload: any = { ...form };
    if (!payload.scope_state) payload.scope_state = null;
    const { error } = await supabase.from("rbt_support_team_contacts" as any).insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Added"); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    const { error } = await supabase.from("rbt_support_team_contacts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/70 bg-card p-4 grid gap-2 md:grid-cols-7">
        <select value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} className="text-sm rounded-lg border border-border/70 bg-card px-2 h-9">
          <option value="default">Default</option><option value="state">By state</option><option value="employee">By employee</option>
        </select>
        <input placeholder="State (e.g. GA)" value={form.scope_state} onChange={e => setForm({...form, scope_state: e.target.value})} className="text-sm rounded-lg border border-border/70 bg-card px-2 h-9" />
        <select value={form.role_key} onChange={e => setForm({...form, role_key: e.target.value})} className="text-sm rounded-lg border border-border/70 bg-card px-2 h-9">
          <option value="bcba">BCBA</option><option value="rbt_support">RBT Support</option><option value="scheduling">Scheduling</option><option value="training">Training</option><option value="state_clinic">State/Clinic</option>
        </select>
        <input placeholder="Name" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="text-sm rounded-lg border border-border/70 bg-card px-2 h-9" />
        <input placeholder="Email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} className="text-sm rounded-lg border border-border/70 bg-card px-2 h-9" />
        <input placeholder="Phone" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="text-sm rounded-lg border border-border/70 bg-card px-2 h-9" />
        <button onClick={add} className="text-sm rounded-lg bg-primary text-primary-foreground px-3 h-9">Add</button>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
        {rows?.map(c => (
          <div key={c.id} className="p-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium">{c.contact_name ?? "—"} <span className="text-xs text-muted-foreground">({c.role_key})</span></p>
              <p className="text-xs text-muted-foreground">{c.scope}{c.scope_state ? ` · ${c.scope_state}` : ""} · {c.contact_email ?? c.contact_phone ?? "no contact"}</p>
            </div>
            <button onClick={() => remove(c.id)} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Audit
function AuditPanel() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("rbt_support_audit" as any).select("*").order("created_at",{ascending:false}).limit(200)
      .then(({ data }) => setRows((data as any) ?? []));
  }, []);
  return (
    <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/70">
      {rows?.length === 0 && <div className="p-8 text-sm text-muted-foreground">No audit entries yet.</div>}
      {rows?.map(a => (
        <div key={a.id} className="p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{a.action}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{new Date(a.created_at).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{JSON.stringify(a.detail)}</p>
        </div>
      ))}
    </div>
  );
}