import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KeyRound,
  Plus,
  ShieldAlert,
  Loader2,
  Trash2,
  Search,
  Building2,
  Users,
  Activity,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";

type EmployeeRow = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  job_title: string;
  department_id: string | null;
  state: string;
  status: string;
  avatar_url: string | null;
};

type LoginRow = {
  id: string;
  user_id: string;
  system_name: string;
  system_category: string | null;
  login_url: string | null;
  username: string | null;
  encrypted_password: string | null;
  notes: string | null;
  password_reset_required: boolean;
  is_active: boolean;
  created_at: string;
  last_updated_at: string;
};

const blankForm = {
  user_id: "",
  system_name: "",
  system_category: "",
  login_url: "",
  username: "",
  encrypted_password: "",
  notes: "",
};

export default function LoginVaultAdmin() {
  const { user, roles } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blankForm });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  if (!canAccessAdminHub(user, roles)) return <Navigate to="/" replace />;

  const { data: logins, isLoading: loadingLogins } = useQuery({
    queryKey: ["admin_logins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_logins")
        .select("*")
        .order("last_updated_at", { ascending: false });
      if (error) throw error;
      return data as LoginRow[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["vault_employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, user_id, first_name, last_name, email, job_title, department_id, state, status, avatar_url")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data as EmployeeRow[];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["admin_login_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_access_logs")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data as any[];
    },
  });

  const employeeByUser = useMemo(() => {
    const m = new Map<string, EmployeeRow>();
    for (const e of employees ?? []) if (e.user_id) m.set(e.user_id, e);
    return m;
  }, [employees]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of logins ?? []) if (l.system_category) set.add(l.system_category);
    return Array.from(set).sort();
  }, [logins]);

  const activeLogins = useMemo(() => (logins ?? []).filter((l) => l.is_active), [logins]);
  const filteredLogins = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeLogins.filter((l) => {
      if (categoryFilter !== "all" && (l.system_category ?? "") !== categoryFilter) return false;
      if (!q) return true;
      const emp = employeeByUser.get(l.user_id);
      const haystack = `${l.system_name} ${l.username ?? ""} ${l.system_category ?? ""} ${
        emp ? `${emp.first_name} ${emp.last_name} ${emp.email ?? ""}` : ""
      }`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeLogins, categoryFilter, search, employeeByUser]);

  const coverageByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of activeLogins) {
      map.set(l.user_id, (map.get(l.user_id) ?? 0) + 1);
    }
    return map;
  }, [activeLogins]);

  const stats = {
    totalLogins: activeLogins.length,
    employeesCovered: coverageByEmployee.size,
    employeesTotal: (employees ?? []).filter((e) => !!e.user_id).length,
    pendingResets: activeLogins.filter((l) => (l as any).password_reset_required).length,
  };

  function openAssign(prefillUserId?: string) {
    setForm({ ...blankForm, user_id: prefillUserId ?? "" });
    setOpen(true);
  }

  async function create() {
    if (!form.user_id) return toast({ title: "Pick an employee", variant: "destructive" });
    if (!form.system_name.trim()) return toast({ title: "System name is required", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("employee_logins").insert({
      user_id: form.user_id,
      system_name: form.system_name.trim(),
      system_category: form.system_category.trim() || null,
      login_url: form.login_url.trim() || null,
      username: form.username.trim() || null,
      encrypted_password: form.encrypted_password || null,
      notes: form.notes.trim() || null,
      assigned_by: user!.id,
    });
    setBusy(false);
    if (error) return toast({ title: "Couldn't assign", description: error.message, variant: "destructive" });
    toast({ title: "Login assigned" });
    setOpen(false);
    setForm({ ...blankForm });
    qc.invalidateQueries({ queryKey: ["admin_logins"] });
  }

  async function archive(id: string) {
    const { error } = await supabase.from("employee_logins").update({ is_active: false }).eq("id", id);
    if (error) return toast({ title: "Couldn't archive", description: error.message, variant: "destructive" });
    toast({ title: "Login archived" });
    qc.invalidateQueries({ queryKey: ["admin_logins"] });
  }

  function employeeLabel(e: EmployeeRow) {
    return `${e.first_name} ${e.last_name}`.trim();
  }

  function gotoEmployee(employeeId: string | undefined) {
    if (!employeeId) return;
    nav(`/user-management/${employeeId}#logins`);
  }

  const employeesWithCoverage = useMemo(() => {
    return (employees ?? [])
      .filter((e) => !!e.user_id)
      .map((e) => ({ employee: e, count: coverageByEmployee.get(e.user_id!) ?? 0 }))
      .sort((a, b) => b.count - a.count || employeeLabel(a.employee).localeCompare(employeeLabel(b.employee)));
  }, [employees, coverageByEmployee]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12">
      {/* HERO */}
      <section className="os-glass-panel relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 0% 0%, hsl(265 100% 96%) 0%, transparent 60%), radial-gradient(50% 40% at 100% 20%, hsl(220 100% 96%) 0%, transparent 65%)",
          }} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
              <KeyRound className="h-3.5 w-3.5 text-primary" /> Login Vault
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Centralized credential management
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Assign system credentials to staff in one place. Employees unlock with their personal PIN or registered security key — passwords are never exposed in plain text in the UI.
            </p>
          </div>
          <Button onClick={() => openAssign()} className="gap-1.5">
            <Plus className="h-4 w-4" /> Assign login
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={KeyRound} label="Active logins" value={stats.totalLogins} tone="violet" />
          <StatTile icon={Users} label="Staff covered" value={`${stats.employeesCovered} / ${stats.employeesTotal}`} tone="sky" />
          <StatTile icon={Activity} label="Recent activity" value={logs?.length ?? 0} tone="mint" />
          <StatTile icon={ShieldAlert} label="Reset required" value={stats.pendingResets} tone={stats.pendingResets > 0 ? "amber" : "lilac"} />
        </div>
      </section>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, system, or username…"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-10 w-[180px] rounded-xl">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LOGINS LIST */}
        <section className="os-glass-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Assigned logins
              <span className="ml-2 text-xs font-normal text-muted-foreground">({filteredLogins.length})</span>
            </h2>
          </div>
          {loadingLogins ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogins.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              <KeyRound className="mx-auto mb-2 h-6 w-6 opacity-60" />
              {search || categoryFilter !== "all"
                ? "No matches for the current filters."
                : "No logins assigned yet. Click Assign login to get started."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogins.map((l) => {
                const emp = employeeByUser.get(l.user_id);
                const empLabel = emp ? employeeLabel(emp) : "Unknown staff";
                const initials = emp
                  ? `${emp.first_name[0] ?? ""}${emp.last_name[0] ?? ""}`.toUpperCase()
                  : "??";
                return (
                  <div
                    key={l.id}
                    className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-3 py-2.5 transition hover:border-primary/30 hover:bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => gotoEmployee(emp?.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[11px] font-semibold text-primary hover:bg-primary/15"
                      title={`Open ${empLabel}`}
                    >
                      {initials}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{l.system_name}</p>
                        {l.system_category && (
                          <Badge variant="outline" className="text-[10px]">{l.system_category}</Badge>
                        )}
                        {l.password_reset_required && (
                          <Badge variant="destructive" className="text-[10px]">Reset due</Badge>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {empLabel}
                        {l.username && <> · {l.username}</>}
                        <> · updated {new Date(l.last_updated_at).toLocaleDateString()}</>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {l.login_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(l.login_url!, "_blank", "noreferrer")}
                          title="Open login URL"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => gotoEmployee(emp?.id)}
                        title="Manage on employee profile"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => archive(l.id)}
                        title="Archive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SIDE PANEL */}
        <div className="space-y-5">
          <section className="os-glass-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Coverage by staff
              </h2>
            </div>
            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
              {employeesWithCoverage.slice(0, 50).map(({ employee: e, count }) => (
                <button
                  key={e.id}
                  onClick={() => gotoEmployee(e.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-transparent px-2 py-1.5 text-left text-xs hover:border-border/60 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold text-muted-foreground">
                      {`${e.first_name[0] ?? ""}${e.last_name[0] ?? ""}`.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{employeeLabel(e)}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{e.job_title} · {e.state}</p>
                    </div>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                      (count > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="os-glass-panel p-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent vault activity</h2>
            </div>
            <div className="divide-y divide-border/60 text-xs">
              {(logs ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between py-1.5">
                  <span className="capitalize text-foreground">{String(l.action).replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {new Date(l.occurred_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {logs && logs.length === 0 && <p className="py-2 text-muted-foreground">No activity yet.</p>}
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-300">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Passwords stored here are placeholders only — wire the encrypted vault edge function before saving production credentials.</span>
          </div>
        </div>
      </div>

      {/* ASSIGN DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Assign a login
            </DialogTitle>
            <DialogDescription>
              The employee will see this in their Profile → My Logins tab and unlock it with their PIN.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Employee</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {(employees ?? [])
                    .filter((e) => !!e.user_id)
                    .map((e) => (
                      <SelectItem key={e.user_id!} value={e.user_id!}>
                        {employeeLabel(e)} — {e.job_title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>System name</Label>
              <Input value={form.system_name} onChange={(e) => setForm({ ...form, system_name: e.target.value })} placeholder="e.g. CentralReach" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.system_category} onChange={(e) => setForm({ ...form, system_category: e.target.value })} placeholder="EMR, Payroll, HR…" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Login URL</Label>
              <Input value={form.login_url} onChange={(e) => setForm({ ...form, login_url: e.target.value })} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.encrypted_password}
                onChange={(e) => setForm({ ...form, encrypted_password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof KeyRound;
  label: string;
  value: number | string;
  tone: "violet" | "sky" | "mint" | "amber" | "lilac";
}) {
  return (
    <div className="os-card !p-4">
      <div className="flex items-center gap-3">
        <div className={`os-kpi-icon os-tone-${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}