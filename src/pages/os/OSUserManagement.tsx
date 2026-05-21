import { useEffect, useMemo, useState, useCallback } from "react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users2, Pencil, Loader2, ExternalLink, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";
import { ROLE_META } from "@/lib/roles";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { allWorkforceUsers } from "@/lib/workforce/mockStaff";

interface Row {
  user_id: string;
  display_name: string | null;
  email: string | null;
  state: string | null;
  department: string | null;
  job_title: string | null;
  phone: string | null;
  hire_date: string | null;
  employment_type: string | null;
  viventium_employee_id: string | null;
  active: boolean;
  roles: AppRole[];
  isWorkforce?: boolean;
}

const roleLabel = (r: AppRole) => ROLE_META.find((m) => m.key === r)?.label ?? r;
const ROLE_GROUPS = ["Leadership", "Operations", "Pipeline", "Service", "People", "Support", "Legacy"] as const;
const EMPLOYEE_STATES = ["GA", "NC", "VA", "TN", "MD"] as const;

export default function OSUserManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);

  const load = useCallback(async () => {
      setLoading(true);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, state, active, department, job_title, phone, hire_date, employment_type, viventium_employee_id")
        .order("display_name", { ascending: true });
      const ids = (profiles ?? []).map((p) => p.user_id);
      let roleMap = new Map<string, AppRole[]>();
      if (ids.length) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids);
        (roles ?? []).forEach((r) => {
          const arr = roleMap.get(r.user_id) ?? [];
          arr.push(r.role as AppRole);
          roleMap.set(r.user_id, arr);
        });
      }
      setRows(
        (profiles ?? []).map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          email: p.email,
          state: p.state,
          department: p.department,
          job_title: p.job_title,
          phone: p.phone,
          hire_date: p.hire_date,
          employment_type: p.employment_type,
          viventium_employee_id: p.viventium_employee_id,
          active: p.active,
          roles: roleMap.get(p.user_id) ?? [],
        })),
      );
      setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.display_name, r.email, r.state, r.department, r.viventium_employee_id, r.roles.join(" ")].join(" ").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <OSShell>
      <header className="os-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(265_70%_55%)]">
            Blossom OS · Users
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-[32px]">User Management</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Manage who has access. Set roles, edit HR details, and link people to Viventium.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <UserPlus className="h-4 w-4" /> Invite user
        </Button>
      </header>

      <section className="os-card mt-6">
        <div className="flex items-center justify-between gap-3 border-b border-foreground/[0.06] px-5 py-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, role, department, Viventium ID…"
              className="h-10 pl-9"
            />
          </div>
          <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
            <Users2 className="h-3.5 w-3.5" />
            {filtered.length} user{filtered.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-foreground/[0.025] text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Roles</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">State</th>
                <th className="px-5 py-3 font-semibold">Viventium</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No users yet.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.user_id} className="border-t border-foreground/[0.05] hover:bg-foreground/[0.02]">
                  <td className="px-5 py-3 font-medium text-foreground">{r.display_name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.email ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length === 0 && <span className="text-muted-foreground">—</span>}
                      {r.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-[10.5px]">{roleLabel(role)}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.department ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.state ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-[12px]">
                    {r.viventium_employee_id ?? <span className="text-muted-foreground/60">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={r.active ? "default" : "outline"} className="text-[10.5px]">
                      {r.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(r)} className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <EditUserSheet
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); toast({ title: "User updated" }); }}
      />
    </OSShell>
  );
}

function EditUserSheet({
  user,
  onClose,
  onSaved,
}: {
  user: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Row | null>(user);
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(new Set());

  useEffect(() => {
    setForm(user);
    setSelectedRoles(new Set(user?.roles ?? []));
  }, [user]);

  if (!form) return null;

  const toggleRole = (role: AppRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      next.has(role) ? next.delete(role) : next.add(role);
      return next;
    });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          department: form.department,
          state: form.state,
          job_title: form.job_title,
          phone: form.phone,
          hire_date: form.hire_date,
          employment_type: form.employment_type,
          viventium_employee_id: form.viventium_employee_id,
          active: form.active,
        })
        .eq("user_id", form.user_id);
      if (pErr) throw pErr;

      const current = new Set(user?.roles ?? []);
      const toAdd = [...selectedRoles].filter((r) => !current.has(r));
      const toRemove = [...current].filter((r) => !selectedRoles.has(r));
      if (toRemove.length) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", form.user_id).in("role", toRemove);
        if (error) throw error;
      }
      if (toAdd.length) {
        const { error } = await supabase.from("user_roles").insert(toAdd.map((role) => ({ user_id: form.user_id, role })));
        if (error) throw error;
      }
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const grouped = ROLE_GROUPS.map((g) => ({
    group: g,
    roles: ROLE_META.filter((m) => m.group === g),
  })).filter((g) => g.roles.length > 0);

  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{form.display_name ?? form.email ?? "Edit user"}</SheetTitle>
          <SheetDescription>{form.email}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Profile</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Display name">
                <Input value={form.display_name ?? ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </Field>
              <Field label="Job title">
                <Input value={form.job_title ?? ""} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              </Field>
              <Field label="Department">
                <Input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </Field>
              <Field label="State">
                <Select
                  value={form.state ?? ""}
                  onValueChange={(v) => setForm({ ...form, state: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phone">
                <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Employment type">
                <Input value={form.employment_type ?? ""} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} placeholder="W2, 1099, Part-time…" />
              </Field>
              <Field label="Hire date">
                <Input type="date" value={form.hire_date ?? ""} onChange={(e) => setForm({ ...form, hire_date: e.target.value || null })} />
              </Field>
              <Field label="Active">
                <div className="flex h-10 items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  <span className="text-[12px] text-muted-foreground">{form.active ? "Active" : "Inactive"}</span>
                </div>
              </Field>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[12.5px] font-semibold">Viventium link</h3>
                <p className="text-[11.5px] text-muted-foreground">Paste this employee's Viventium ID to sync HR records later.</p>
              </div>
              <a
                href="https://app.viventium.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline"
              >
                Open Viventium <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input
              value={form.viventium_employee_id ?? ""}
              onChange={(e) => setForm({ ...form, viventium_employee_id: e.target.value })}
              placeholder="e.g. VIV-10234"
              className="font-mono"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Roles & access</h3>
              <span className="text-[11px] text-muted-foreground">{selectedRoles.size} selected</span>
            </div>
            <div className="space-y-4">
              {grouped.map(({ group, roles }) => (
                <div key={group}>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {roles.map((r) => {
                      const checked = selectedRoles.has(r.key);
                      return (
                        <label
                          key={r.key}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px] transition ${
                            checked ? "border-primary/40 bg-primary/[0.06]" : "border-foreground/[0.06] hover:bg-foreground/[0.03]"
                          }`}
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleRole(r.key)} className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{r.label}</p>
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">{r.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-foreground/[0.06] bg-background/95 px-6 py-3 backdrop-blur">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}