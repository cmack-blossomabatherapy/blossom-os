import { useEffect, useMemo, useState, useCallback } from "react";
import { OSShell } from "./OSShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users2, Pencil, Loader2, ExternalLink, Check, MailCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";
import { ROLE_META } from "@/lib/roles";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

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
  welcome_sent_at: string | null;
  active: boolean;
  roles: AppRole[];
  isWorkforce?: boolean;
}

interface InviteDeliveryStatus {
  log: {
    created_at: string;
    status: "sent" | "failed" | "skipped" | string;
    resend_message_id: string | null;
    error_message: string | null;
    recipient_email: string;
  } | null;
  provider: {
    last_event?: string;
    created_at?: string;
    subject?: string;
    to?: string[];
  } | null;
  providerError?: string | null;
}

const roleLabel = (r: AppRole) => ROLE_META.find((m) => m.key === r)?.label ?? r;
const ROLE_GROUPS = ["Leadership", "Operations", "Pipeline", "Service", "People", "Support", "Legacy"] as const;
const EMPLOYEE_STATES = ["GA", "NC", "VA", "TN", "MD", "NJ"] as const;

export default function OSUserManagement() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [evalStaff, setEvalStaff] = useState<Array<{ id: string; first_name: string; last_name: string; email: string; role: string; state: string | null; active_status: boolean; hire_date: string | null; }>>([]);

  const load = useCallback(async () => {
      setLoading(true);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, state, active, department, job_title, phone, hire_date, employment_type, viventium_employee_id, welcome_sent_at")
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
          welcome_sent_at: p.welcome_sent_at,
          active: p.active,
          roles: roleMap.get(p.user_id) ?? [],
        })),
      );
      setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("evaluation_staff")
        .select("id, first_name, last_name, email, role, state, active_status, hire_date");
      setEvalStaff((data ?? []) as any);
    })();
  }, []);

  const filtered = useMemo(() => {
    const evalRows: Row[] = evalStaff.map((w) => ({
      user_id: `eval:${w.id}`,
      display_name: `${w.first_name} ${w.last_name}`.trim(),
      email: w.email,
      state: w.state,
      department: w.role === "BCBA" ? "Clinical · BCBA" : "Clinical · RBT",
      job_title: w.role === "BCBA" ? "Board Certified Behavior Analyst" : "Registered Behavior Technician",
      phone: null,
      hire_date: w.hire_date,
      employment_type: null,
      viventium_employee_id: null,
      welcome_sent_at: null,
      active: w.active_status,
      roles: [w.role === "BCBA" ? "bcba" : "rbt"] as AppRole[],
      isWorkforce: true,
    }));
    const existingEmails = new Set(rows.map((r) => (r.email ?? "").toLowerCase()).filter(Boolean));
    const merged = [
      ...rows,
      ...evalRows.filter((w) => !existingEmails.has((w.email ?? "").toLowerCase())),
    ];
    const needle = q.trim().toLowerCase();
    if (!needle) return merged;
    return merged.filter((r) =>
      [r.display_name, r.email, r.state, r.department, r.viventium_employee_id, r.roles.join(" ")].join(" ").toLowerCase().includes(needle),
    );
  }, [rows, q, evalStaff]);

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
            <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <tr
                  key={r.user_id}
                  onClick={() => setEditing(r)}
                  className="cursor-pointer border-t border-foreground/[0.05] transition hover:bg-foreground/[0.03]"
                >
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); setEditing(r); }}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
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
  const [delivery, setDelivery] = useState<InviteDeliveryStatus | null>(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setForm(user);
    setSelectedRoles(new Set(user?.roles ?? []));
    setDelivery(null);
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
      if (form.isWorkforce) {
        const evalId = form.user_id.replace(/^eval:/, "");
        const [firstName, ...rest] = (form.display_name ?? "").trim().split(/\s+/);
        const lastName = rest.join(" ");
        const { error: eErr } = await supabase
          .from("evaluation_staff")
          .update({
            first_name: firstName || "",
            last_name: lastName || "",
            email: form.email ?? "",
            phone: form.phone,
            state: form.state,
            hire_date: form.hire_date,
            active_status: form.active,
          })
          .eq("id", evalId);
        if (eErr) throw eErr;
        onSaved();
        return;
      }
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

      // Sync the central employees record so the directory + employee profile
      // header (which read from `employees.state` / `states_supported`)
      // reflect the state chosen here. Only updates if a linked employee row
      // exists for this user_id — silently no-op otherwise.
      await supabase
        .from("employees")
        .update({
          first_name: (form.display_name ?? "").trim().split(/\s+/)[0] || null,
          last_name: (form.display_name ?? "").trim().split(/\s+/).slice(1).join(" ") || null,
          state: form.state,
          states_supported: form.state ? [form.state] : [],
        })
        .eq("user_id", form.user_id);
      window.dispatchEvent(new Event("employee-directory:refresh"));
      window.dispatchEvent(new Event("team-directory:refresh"));

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

  const checkInviteDelivery = async () => {
    if (!form || form.isWorkforce) return;
    setCheckingDelivery(true);
    const { data, error } = await supabase.functions.invoke("admin-check-welcome-email", {
      body: { userId: form.user_id, email: form.email },
    });
    setCheckingDelivery(false);
    if (error || !data?.ok) {
      toast({ title: "Delivery check failed", description: data?.error ?? error?.message ?? "Could not check the latest invite.", variant: "destructive" });
      return;
    }
    setDelivery(data as InviteDeliveryStatus);
  };

  const resendWelcome = async () => {
    if (!form || form.isWorkforce || !form.email) return;
    setResending(true);
    const { data, error } = await supabase.functions.invoke("admin-resend-welcome-email", {
      body: {
        userId: form.user_id,
        email: form.email,
        displayName: form.display_name ?? undefined,
        roles: Array.from(selectedRoles),
        jobTitle: form.job_title ?? undefined,
        siteUrl: window.location.origin,
      },
    });
    setResending(false);
    if (error || !data?.ok) {
      toast({ title: "Email not sent", description: data?.error ?? error?.message ?? "The welcome email could not be resent.", variant: "destructive" });
      return;
    }
    setForm({ ...form, welcome_sent_at: data.welcomeSentAt ?? new Date().toISOString() });
    setDelivery(null);
    toast({ title: "Welcome email resent" });
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
          <SheetDescription className="flex items-center gap-2">
            <span>{form.email}</span>
            {form.isWorkforce && (
              <Badge variant="outline" className="text-[10px] font-normal">Evaluations record</Badge>
            )}
          </SheetDescription>
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

          {!form.isWorkforce && (
          <section className="space-y-3 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[12.5px] font-semibold">Welcome email</h3>
                <p className="text-[11.5px] text-muted-foreground">
                  {form.welcome_sent_at ? `Last marked sent ${new Date(form.welcome_sent_at).toLocaleString()}` : "No confirmed welcome timestamp on this profile yet."}
                </p>
              </div>
              <Badge variant="outline" className="gap-1 text-[10.5px]">
                <MailCheck className="h-3 w-3" /> Invite
              </Badge>
            </div>
            {delivery && (
              <div className="rounded-lg border border-foreground/[0.06] bg-background px-3 py-2 text-[12px]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={delivery.provider?.last_event === "delivered" ? "default" : delivery.provider?.last_event === "bounced" ? "destructive" : "secondary"} className="text-[10.5px]">
                    {delivery.provider?.last_event ?? delivery.log?.status ?? "No provider event"}
                  </Badge>
                  <span className="text-muted-foreground">
                    {delivery.log?.created_at ? new Date(delivery.log.created_at).toLocaleString() : "No invite log found"}
                  </span>
                </div>
                {delivery.provider?.subject && <p className="mt-2 text-muted-foreground">Subject: {delivery.provider.subject}</p>}
                {delivery.providerError && <p className="mt-2 flex gap-1 text-destructive"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" /> {delivery.providerError}</p>}
                {delivery.log?.error_message && <p className="mt-2 text-destructive">{delivery.log.error_message}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={checkInviteDelivery} disabled={checkingDelivery || resending} className="gap-2">
                {checkingDelivery ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Check delivery
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={resendWelcome} disabled={checkingDelivery || resending || !form.email} className="gap-2">
                {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
                Resend welcome
              </Button>
            </div>
          </section>
          )}

          {!form.isWorkforce && (
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
          )}

          {!form.isWorkforce && (
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
          )}

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