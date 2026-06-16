import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, ArrowLeft, BarChart3, Users as UsersIcon, AlertTriangle, FileText, Plus, Trash2, Save, ExternalLink } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Dept {
  id: string; slug: string; name: string; description: string | null;
  primary_queue_path: string | null; workspace_id: string | null;
  head_user_id: string | null; backup_user_id: string | null;
  escalation_rules: { trigger: string; action: string }[];
}
interface Profile { user_id: string; display_name: string | null; email: string | null; }
interface Member { id: string; user_id: string; role: string; }
interface Kpi { id: string; label: string; target_value: string | null; current_value: string | null; unit: string | null; sort_order: number; }
interface Resource { id: string; kind: string; label: string; path: string | null; sort_order: number; }

export default function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [dept, setDept] = useState<Dept | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    if (!id) return;
    const [d, m, k, r] = await Promise.all([
      supabase.from("departments").select("*").eq("id", id).maybeSingle(),
      supabase.from("department_members").select("*").eq("department_id", id),
      supabase.from("department_kpis").select("*").eq("department_id", id).order("sort_order"),
      supabase.from("department_resources").select("*").eq("department_id", id).order("sort_order"),
    ]);
    if (d.data) {
      const row = d.data as any;
      setDept({ ...row, escalation_rules: Array.isArray(row.escalation_rules) ? row.escalation_rules : [] });
    }
    setMembers((m.data ?? []) as Member[]);
    setKpis((k.data ?? []) as Kpi[]);
    setResources((r.data ?? []) as Resource[]);
    const { data: profs } = await supabase
      .from("profiles").select("user_id,display_name,email")
      .eq("active", true).order("display_name");
    setProfiles((profs ?? []) as Profile[]);
    setLoading(false);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

  const profileMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    profiles.forEach((p) => { map[p.user_id] = p; });
    return map;
  }, [profiles]);
  const labelOf = (uid: string | null) => uid ? (profileMap[uid]?.display_name || profileMap[uid]?.email || "Unknown") : "Unassigned";

  const saveDept = async (patch: Partial<Dept>) => {
    if (!dept) return;
    setSaving(true);
    const { error } = await supabase.from("departments").update(patch as any).eq("id", dept.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); setDept({ ...dept, ...patch }); }
  };

  if (loading) return <GlassPageShell title="Loading…" description=""><div /></GlassPageShell>;
  if (!dept) return (
    <GlassPageShell title="Department not found" description="">
      <Link to="/blossom/departments" className="text-sm text-primary">← Back</Link>
    </GlassPageShell>
  );

  const canEdit = isAdmin;

  return (
    <GlassPageShell
      eyebrow="Department"
      eyebrowIcon={Building2}
      title={dept.name}
      description={dept.description ?? undefined}
      actions={<Link to="/blossom/departments"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />KPIs</h3>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={async () => {
                  const { error } = await supabase.from("department_kpis").insert({ department_id: dept.id, label: "New KPI", sort_order: kpis.length });
                  if (error) toast.error(error.message); else reload();
                }}><Plus className="h-3.5 w-3.5" /> Add</Button>
              )}
            </div>
            {kpis.length === 0 ? <p className="text-xs text-muted-foreground">No KPIs yet.</p> : (
              <div className="space-y-2">
                {kpis.map((k) => (
                  <KpiRow key={k.id} kpi={k} canEdit={canEdit} onChange={reload} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" />Escalation rules</h3>
            <div className="space-y-2">
              {dept.escalation_rules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={rule.trigger} placeholder="Trigger" disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...dept.escalation_rules]; next[i] = { ...next[i], trigger: e.target.value };
                      setDept({ ...dept, escalation_rules: next });
                    }} />
                  <Input value={rule.action} placeholder="Action" disabled={!canEdit}
                    onChange={(e) => {
                      const next = [...dept.escalation_rules]; next[i] = { ...next[i], action: e.target.value };
                      setDept({ ...dept, escalation_rules: next });
                    }} />
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => {
                      const next = dept.escalation_rules.filter((_, x) => x !== i);
                      setDept({ ...dept, escalation_rules: next });
                    }}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              {canEdit && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => setDept({ ...dept, escalation_rules: [...dept.escalation_rules, { trigger: "", action: "" }] })}>
                    <Plus className="h-3.5 w-3.5" /> Add rule
                  </Button>
                  <Button size="sm" onClick={() => saveDept({ escalation_rules: dept.escalation_rules })} disabled={saving}>
                    <Save className="h-3.5 w-3.5" /> Save rules
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Related reports, resources & training</h3>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={async () => {
                  const { error } = await supabase.from("department_resources").insert({ department_id: dept.id, kind: "resource", label: "New link", sort_order: resources.length });
                  if (error) toast.error(error.message); else reload();
                }}><Plus className="h-3.5 w-3.5" /> Add</Button>
              )}
            </div>
            {resources.length === 0 ? <p className="text-xs text-muted-foreground">No links yet.</p> : (
              <div className="space-y-2">
                {resources.map((r) => (
                  <ResourceRow key={r.id} resource={r} canEdit={canEdit} onChange={reload} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Ownership</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Department Head</label>
                <OwnerSelect value={dept.head_user_id} profiles={profiles} disabled={!canEdit}
                  onChange={(v) => saveDept({ head_user_id: v })} />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Backup Owner</label>
                <OwnerSelect value={dept.backup_user_id} profiles={profiles} disabled={!canEdit}
                  onChange={(v) => saveDept({ backup_user_id: v })} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" />Team members</h3>
              <Badge variant="outline" className="text-[10px]">{members.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {members.length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted/40">
                  <span>{labelOf(m.user_id)} <span className="text-[10px] text-muted-foreground">· {m.role}</span></span>
                  {canEdit && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={async () => {
                      await supabase.from("department_members").delete().eq("id", m.id); reload();
                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              ))}
              {canEdit && (
                <AddMember departmentId={dept.id} profiles={profiles} onAdded={reload} existing={members.map((m) => m.user_id)} />
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Workspace & queue</h3>
            {dept.primary_queue_path ? (
              <Link to={dept.primary_queue_path} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                Open primary queue <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : <p className="text-xs text-muted-foreground">No queue path set.</p>}
            <p className="mt-2 text-[11px] text-muted-foreground">Workspace · <span className="text-foreground">{dept.workspace_id ?? "—"}</span></p>
          </Card>
        </div>
      </div>
    </GlassPageShell>
  );
}

function OwnerSelect({ value, profiles, disabled, onChange }: { value: string | null; profiles: Profile[]; disabled?: boolean; onChange: (v: string | null) => void; }) {
  return (
    <Select value={value ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? null : v)} disabled={disabled}>
      <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value="__none">Unassigned</SelectItem>
        {profiles.map((p) => (
          <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || p.email || p.user_id}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KpiRow({ kpi, canEdit, onChange }: { kpi: Kpi; canEdit: boolean; onChange: () => void }) {
  const [k, setK] = useState(kpi);
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_0.7fr_auto] gap-2">
      <Input value={k.label} disabled={!canEdit} onChange={(e) => setK({ ...k, label: e.target.value })} placeholder="Label" />
      <Input value={k.target_value ?? ""} disabled={!canEdit} onChange={(e) => setK({ ...k, target_value: e.target.value })} placeholder="Target" />
      <Input value={k.current_value ?? ""} disabled={!canEdit} onChange={(e) => setK({ ...k, current_value: e.target.value })} placeholder="Current" />
      <Input value={k.unit ?? ""} disabled={!canEdit} onChange={(e) => setK({ ...k, unit: e.target.value })} placeholder="Unit" />
      {canEdit && (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={async () => {
            const { error } = await supabase.from("department_kpis").update({ label: k.label, target_value: k.target_value, current_value: k.current_value, unit: k.unit }).eq("id", k.id);
            if (error) toast.error(error.message); else toast.success("Saved");
          }}><Save className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={async () => {
            await supabase.from("department_kpis").delete().eq("id", k.id); onChange();
          }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

function ResourceRow({ resource, canEdit, onChange }: { resource: Resource; canEdit: boolean; onChange: () => void }) {
  const [r, setR] = useState(resource);
  return (
    <div className="grid grid-cols-[1fr_2fr_2fr_auto] gap-2">
      <Select value={r.kind} onValueChange={(v) => setR({ ...r, kind: v })} disabled={!canEdit}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="report">Report</SelectItem>
          <SelectItem value="resource">Resource</SelectItem>
          <SelectItem value="training">Training</SelectItem>
        </SelectContent>
      </Select>
      <Input value={r.label} disabled={!canEdit} onChange={(e) => setR({ ...r, label: e.target.value })} placeholder="Label" />
      <Input value={r.path ?? ""} disabled={!canEdit} onChange={(e) => setR({ ...r, path: e.target.value })} placeholder="/path or URL" />
      {canEdit && (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={async () => {
            const { error } = await supabase.from("department_resources").update({ kind: r.kind, label: r.label, path: r.path }).eq("id", r.id);
            if (error) toast.error(error.message); else toast.success("Saved");
          }}><Save className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={async () => {
            await supabase.from("department_resources").delete().eq("id", r.id); onChange();
          }}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

function AddMember({ departmentId, profiles, existing, onAdded }: { departmentId: string; profiles: Profile[]; existing: string[]; onAdded: () => void }) {
  const [userId, setUserId] = useState<string>("");
  const [role, setRole] = useState<string>("member");
  const choices = profiles.filter((p) => !existing.includes(p.user_id));
  return (
    <div className="mt-2 flex gap-2 border-t border-border/40 pt-2">
      <Select value={userId} onValueChange={setUserId}>
        <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Add member…" /></SelectTrigger>
        <SelectContent className="max-h-80">
          {choices.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || p.email}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="lead">Lead</SelectItem>
          <SelectItem value="backup">Backup</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" disabled={!userId} onClick={async () => {
        const { error } = await supabase.from("department_members").insert({ department_id: departmentId, user_id: userId, role });
        if (error) toast.error(error.message); else { setUserId(""); onAdded(); }
      }}><Plus className="h-3.5 w-3.5" /></Button>
    </div>
  );
}
