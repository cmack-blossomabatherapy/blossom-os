import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Tab = "stages" | "requirements" | "fellowship_content" | "applications" | "mentors" | "opportunities" | "audit";

export default function RbtGrowthConsole() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("stages");
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">RBT Growth</h1>
        <p className="text-sm text-muted-foreground">
          Configure career stages, eligibility, Fellowship content, and review interest and applications.
          Details published here appear to employees in My Growth and the Fellowship Explorer.
        </p>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border">
        {([
          ["stages","Career stages"],
          ["requirements","Eligibility"],
          ["fellowship_content","Fellowship content"],
          ["applications","Fellowship applications"],
          ["mentors","Mentor requests"],
          ["opportunities","Opportunity interest"],
          ["audit","Audit log"],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-sm px-3 py-1.5 border-b-2 -mb-px ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "stages" && <StagesTab actorId={user!.id} />}
      {tab === "requirements" && <RequirementsTab actorId={user!.id} />}
      {tab === "fellowship_content" && <FellowshipContentTab actorId={user!.id} />}
      {tab === "applications" && <ApplicationsTab actorId={user!.id} />}
      {tab === "mentors" && <MentorRequestsTab actorId={user!.id} />}
      {tab === "opportunities" && <OpportunitiesTab actorId={user!.id} />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

function audit(actorId: string, event: string, payload: any, employeeId?: string, entity_table?: string, entity_id?: string) {
  return supabase.from("rbt_growth_audit" as any).insert({
    employee_id: employeeId ?? null, actor_id: actorId, event_type: event,
    entity_table: entity_table ?? null, entity_id: entity_id ?? null, payload,
  } as any);
}

// ---------- Stages
function StagesTab({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("rbt_career_stages" as any).select("*").order("order_index")
    .then(({ data }) => setRows((data as any[]) ?? []));
  useEffect(() => { void load(); }, []);

  const save = async (row: any) => {
    const { error } = await supabase.from("rbt_career_stages" as any).update({
      name: row.name, description: row.description, employee_summary: row.employee_summary,
      order_index: row.order_index, active: row.active, requires_application: row.requires_application,
    }).eq("key", row.key);
    if (error) toast.error(error.message); else {
      toast.success("Saved"); await audit(actorId, "career_stage.updated", row, undefined, "rbt_career_stages", row.key);
      void load();
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.key} className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
          <div className="flex items-center gap-2">
            <Input className="max-w-xs" value={r.name} onChange={e => { const c = [...rows]; c[i] = { ...r, name: e.target.value }; setRows(c); }} />
            <Input className="w-24" type="number" value={r.order_index}
              onChange={e => { const c = [...rows]; c[i] = { ...r, order_index: parseInt(e.target.value) || 0 }; setRows(c); }} />
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={r.requires_application}
                onChange={e => { const c = [...rows]; c[i] = { ...r, requires_application: e.target.checked }; setRows(c); }} />
              Requires application
            </label>
            <label className="text-xs flex items-center gap-1">
              <input type="checkbox" checked={r.active}
                onChange={e => { const c = [...rows]; c[i] = { ...r, active: e.target.checked }; setRows(c); }} />
              Active
            </label>
            {r.is_fellowship && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Fellowship</span>}
            <Button size="sm" onClick={() => save(r)} className="ml-auto">Save</Button>
          </div>
          <Textarea rows={2} placeholder="Internal description"
            value={r.description ?? ""} onChange={e => { const c = [...rows]; c[i] = { ...r, description: e.target.value }; setRows(c); }} />
          <Textarea rows={2} placeholder="Employee-facing summary (shown in My Growth)"
            value={r.employee_summary ?? ""} onChange={e => { const c = [...rows]; c[i] = { ...r, employee_summary: e.target.value }; setRows(c); }} />
        </div>
      ))}
    </div>
  );
}

// ---------- Requirements
const CATEGORIES = ["tenure","training","credential","attendance","documentation","supervision","performance","recommendation","application","capacity"];

function RequirementsTab({ actorId }: { actorId: string }) {
  const [stages, setStages] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [stageKey, setStageKey] = useState<string>("");
  const [newReq, setNewReq] = useState({ requirement_key: "", label: "", category: "tenure", description: "" });

  const load = async () => {
    const [s, r] = await Promise.all([
      supabase.from("rbt_career_stages" as any).select("key,name").order("order_index"),
      supabase.from("rbt_career_stage_requirements" as any).select("*").order("order_index"),
    ]);
    setStages((s.data as any[]) ?? []);
    setReqs((r.data as any[]) ?? []);
    if (!stageKey && (s.data as any[])?.[0]) setStageKey((s.data as any[])[0].key);
  };
  useEffect(() => { void load(); }, []);

  const filtered = reqs.filter(r => r.stage_key === stageKey);

  const add = async () => {
    if (!stageKey || !newReq.requirement_key || !newReq.label) { toast.error("Key and label required"); return; }
    const { error } = await supabase.from("rbt_career_stage_requirements" as any).insert({
      stage_key: stageKey, ...newReq, order_index: filtered.length * 10 + 10,
    } as any);
    if (error) return toast.error(error.message);
    await audit(actorId, "requirement.created", { stage_key: stageKey, ...newReq });
    setNewReq({ requirement_key: "", label: "", category: "tenure", description: "" });
    void load();
  };
  const toggle = async (r: any) => {
    await supabase.from("rbt_career_stage_requirements" as any).update({ active: !r.active }).eq("id", r.id);
    await audit(actorId, "requirement.toggled", { id: r.id, active: !r.active }, undefined, "rbt_career_stage_requirements", r.id);
    void load();
  };
  const del = async (r: any) => {
    await supabase.from("rbt_career_stage_requirements" as any).delete().eq("id", r.id);
    await audit(actorId, "requirement.deleted", r, undefined, "rbt_career_stage_requirements", r.id);
    void load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select value={stageKey} onChange={e => setStageKey(e.target.value)}
          className="h-9 rounded-xl border border-border/70 bg-card px-3 text-sm">
          {stages.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} requirement(s)</span>
      </div>
      <div className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
        <p className="text-sm font-medium">Add requirement</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Key (e.g. tenure_90)" value={newReq.requirement_key}
            onChange={e => setNewReq({ ...newReq, requirement_key: e.target.value })} />
          <Input placeholder="Label" value={newReq.label}
            onChange={e => setNewReq({ ...newReq, label: e.target.value })} />
          <select value={newReq.category} onChange={e => setNewReq({ ...newReq, category: e.target.value })}
            className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input placeholder="Description (optional)" value={newReq.description}
            onChange={e => setNewReq({ ...newReq, description: e.target.value })} />
        </div>
        <Button size="sm" onClick={add}>Add requirement</Button>
      </div>
      <ul className="space-y-2">
        {filtered.map(r => (
          <li key={r.id} className="rounded-2xl border border-border/70 p-3 bg-card flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{r.category} · {r.requirement_key}</p>
              {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
            </div>
            <button onClick={() => toggle(r)} className="text-xs px-2 py-1 rounded-full border border-border/70">
              {r.active ? "Active" : "Inactive"}
            </button>
            <button onClick={() => del(r)} className="text-xs text-destructive">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Fellowship content
function FellowshipContentTab({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("rbt_fellowship_content" as any).select("*").order("order_index")
    .then(({ data }) => setRows((data as any[]) ?? []));
  useEffect(() => { void load(); }, []);

  const save = async (row: any, publish?: boolean) => {
    const patch: any = {
      title: row.title, body: row.body, order_index: row.order_index, updated_by: actorId,
    };
    if (publish === true) { patch.published = true; patch.published_at = new Date().toISOString(); patch.published_by = actorId; }
    if (publish === false) { patch.published = false; }
    const { error } = await supabase.from("rbt_fellowship_content" as any).update(patch).eq("section_key", row.section_key);
    if (error) return toast.error(error.message);
    await audit(actorId, publish === true ? "fellowship_content.published" : publish === false ? "fellowship_content.unpublished" : "fellowship_content.updated",
      { section_key: row.section_key }, undefined, "rbt_fellowship_content", row.section_key);
    toast.success("Saved");
    void load();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Employees only see sections marked <strong>Published</strong>. Placeholders remain hidden until an admin publishes them.
      </p>
      {rows.map((r, i) => (
        <div key={r.section_key} className="rounded-2xl border border-border/70 p-4 bg-card space-y-2">
          <div className="flex items-center gap-2">
            <Input className="max-w-md" value={r.title}
              onChange={e => { const c = [...rows]; c[i] = { ...r, title: e.target.value }; setRows(c); }} />
            <Input className="w-20" type="number" value={r.order_index}
              onChange={e => { const c = [...rows]; c[i] = { ...r, order_index: parseInt(e.target.value) || 0 }; setRows(c); }} />
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${r.published ? "border-emerald-300 text-emerald-700" : "border-border text-muted-foreground"}`}>
              {r.published ? "Published" : "Draft"}
            </span>
            <Button size="sm" variant="outline" onClick={() => save(r)} className="ml-auto">Save</Button>
            {r.published
              ? <Button size="sm" variant="ghost" onClick={() => save(r, false)}>Unpublish</Button>
              : <Button size="sm" onClick={() => save(r, true)}>Publish</Button>}
          </div>
          <Textarea rows={5} placeholder="Section content — leave blank until finalized"
            value={r.body ?? ""} onChange={e => { const c = [...rows]; c[i] = { ...r, body: e.target.value }; setRows(c); }} />
        </div>
      ))}
    </div>
  );
}

// ---------- Fellowship applications
function ApplicationsTab({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("rbt_fellowship_applications" as any)
    .select("*").order("created_at", { ascending: false })
    .then(({ data }) => setRows((data as any[]) ?? []));
  useEffect(() => { void load(); }, []);

  const setStatus = async (row: any, status: string, decision?: string) => {
    const patch: any = { status };
    if (decision) { patch.decision = decision; patch.decision_at = new Date().toISOString(); patch.decision_by = actorId; }
    const { error } = await supabase.from("rbt_fellowship_applications" as any).update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    await audit(actorId, "fellowship_application.status_changed", { id: row.id, status, decision }, row.employee_id, "rbt_fellowship_applications", row.id);
    toast.success("Updated");
    void load();
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
      {rows.map(r => (
        <div key={r.id} className="rounded-2xl border border-border/70 p-3 bg-card flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{r.employee_id.slice(0, 8)}…</p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {String(r.status).replace(/_/g, " ")} · {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
          <select value={r.status} onChange={e => setStatus(r, e.target.value)}
            className="h-9 text-sm rounded-xl border border-border/70 bg-background px-2">
            {["started","submitted","under_review","accepted","waitlisted","not_selected","deferred","withdrawn"].map(s =>
              <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ---------- Mentor requests
function MentorRequestsTab({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("rbt_mentor_requests" as any).select("*").order("requested_at", { ascending: false })
    .then(({ data }) => setRows((data as any[]) ?? []));
  useEffect(() => { void load(); }, []);

  const setStatus = async (r: any, status: string) => {
    await supabase.from("rbt_mentor_requests" as any).update({ status, closed_at: status === "closed" ? new Date().toISOString() : null }).eq("id", r.id);
    await audit(actorId, "mentor_request.status_changed", { id: r.id, status }, r.employee_id, "rbt_mentor_requests", r.id);
    void load();
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No mentor requests.</p>}
      {rows.map(r => (
        <div key={r.id} className="rounded-2xl border border-border/70 p-3 bg-card flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{r.employee_id.slice(0,8)}…</p>
            {r.message && <p className="text-xs text-muted-foreground truncate">{r.message}</p>}
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {new Date(r.requested_at).toLocaleDateString()}
            </p>
          </div>
          <select value={r.status} onChange={e => setStatus(r, e.target.value)}
            className="h-9 text-sm rounded-xl border border-border/70 bg-background px-2">
            {["submitted","reviewing","matched","closed"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ---------- Opportunities
function OpportunitiesTab({ actorId }: { actorId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("rbt_internal_opportunity_interest" as any).select("*").order("created_at", { ascending: false })
    .then(({ data }) => setRows((data as any[]) ?? []));
  useEffect(() => { void load(); }, []);

  const setStatus = async (r: any, status: string) => {
    await supabase.from("rbt_internal_opportunity_interest" as any)
      .update({ status, reviewed_by: actorId, reviewed_at: new Date().toISOString() }).eq("id", r.id);
    await audit(actorId, "opportunity_interest.status_changed", { id: r.id, status }, r.employee_id, "rbt_internal_opportunity_interest", r.id);
    void load();
  };

  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No opportunity interest submissions.</p>}
      {rows.map(r => (
        <div key={r.id} className="rounded-2xl border border-border/70 p-3 bg-card flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{r.employee_id.slice(0,8)}… · {r.opportunity_type}</p>
            {r.message && <p className="text-xs text-muted-foreground truncate">{r.message}</p>}
          </div>
          <select value={r.status} onChange={e => setStatus(r, e.target.value)}
            className="h-9 text-sm rounded-xl border border-border/70 bg-background px-2">
            {["submitted","reviewed","contacted","closed"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

// ---------- Audit
function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    void supabase.from("rbt_growth_audit" as any).select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, []);
  return (
    <ul className="space-y-1">
      {rows.map(r => (
        <li key={r.id} className="text-xs flex items-center gap-2 border-b border-border/50 py-1.5">
          <span className="tabular-nums text-muted-foreground w-32 shrink-0">{new Date(r.created_at).toLocaleString()}</span>
          <span className="font-medium">{r.event_type}</span>
          {r.employee_id && <span className="text-muted-foreground">emp:{r.employee_id.slice(0,8)}</span>}
          {r.entity_id && <span className="text-muted-foreground truncate">{r.entity_table}:{String(r.entity_id).slice(0,12)}</span>}
        </li>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No audit events yet.</p>}
    </ul>
  );
}