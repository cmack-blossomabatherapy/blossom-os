import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Users2, MapPin, Building2, ChevronRight, Filter, Plus, BadgeCheck, Sparkles,
} from "lucide-react";
import { OSShell } from "../OSShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";
import { AddEmployeeDialog } from "@/components/hr/AddEmployeeDialog";
import { supabase } from "@/integrations/supabase/client";
import type { Department } from "@/lib/hr/types";

const STATES = ["All", "GA", "NC", "VA", "TN", "MD", "NJ"] as const;
const STATUSES = ["All", "Active", "Inactive"] as const;

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function EmployeeCard({ m, completion }: { m: DirectoryEmployee; completion?: number }) {
  return (
    <Link
      to={`/user-management/${m.id}`}
      className={cn(
        "group relative block rounded-2xl border border-border/70 bg-card p-5 transition-all duration-300",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.06)]",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_18px_36px_-18px_oklch(0.2_0.02_260/0.18)]",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {m.photo ? (
            <img src={m.photo} alt="" className="size-14 rounded-full object-cover ring-1 ring-border/60" />
          ) : (
            <div className="size-14 rounded-full bg-muted grid place-items-center text-sm font-medium text-muted-foreground ring-1 ring-border/60">
              {initials(m.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-foreground inline-flex items-center gap-1.5">
            {m.name}
            {m.leadership && <BadgeCheck className="size-3.5 text-primary" />}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{m.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{m.states?.[0] ?? "—"}</span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{m.departmentName ?? "Unassigned"}</span>
            {typeof completion === "number" && (
              <>
                <span className="opacity-40">·</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                    completion >= 80 ? "text-emerald-600 bg-emerald-500/10" :
                    completion >= 40 ? "text-amber-600 bg-amber-500/10" :
                                       "text-muted-foreground bg-muted",
                  )}
                  title="Profile completion"
                >
                  <Sparkles className="size-3" /> {completion}%
                </span>
              </>
            )}
          </div>
          {m.email && (
            <p className="mt-2 truncate text-[11px] text-muted-foreground">{m.email}</p>
          )}
        </div>
        <ChevronRight className="size-4 text-muted-foreground/50 transition group-hover:text-foreground" />
      </div>
    </Link>
  );
}

export default function UsersHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { members, departments, loading } = useEmployeeDirectory();
  const [q, setQ] = useState("");
  const [state, setState] = useState<string>("All");
  const [dept, setDept] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [hrDepartments, setHrDepartments] = useState<Department[]>([]);
  const [completion, setCompletion] = useState<Record<string, number>>({});

  useEffect(() => {
    void supabase.from("hr_departments").select("*").order("name").then(({ data }) => {
      if (data) setHrDepartments(data as Department[]);
    });
  }, []);

  useEffect(() => {
    if (searchParams.get("add") === "1") setOpenAdd(true);
  }, [searchParams]);

  const handleAddOpenChange = (nextOpen: boolean) => {
    setOpenAdd(nextOpen);
    if (!nextOpen && searchParams.get("add") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("add");
      setSearchParams(next, { replace: true });
    }
  };

  // Live profile-completion percentages from the Identity System view.
  useEffect(() => {
    let cancelled = false;
    void supabase
      .from("employee_profile_completion")
      .select("employee_id,score")
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: Record<string, number> = {};
        (data as Array<{ employee_id: string; score: number | null }>).forEach((r) => {
          if (r.employee_id) next[r.employee_id] = Math.round(Number(r.score ?? 0));
        });
        setCompletion(next);
      });
    return () => { cancelled = true; };
  }, [members.length]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((m) => {
      if (state !== "All" && !(m.states ?? []).includes(state)) return false;
      if (dept !== "All" && m.departmentName !== dept && m.department !== dept) return false;
      if (!term) return true;
      return [m.name, m.title, m.email, m.departmentName, ...(m.states ?? [])]
        .some((v) => String(v ?? "").toLowerCase().includes(term));
    });
  }, [members, q, state, dept, status]);

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.departmentName && set.add(m.departmentName));
    return ["All", ...Array.from(set).sort()];
  }, [members]);

  return (
    <OSShell>
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Users2 className="size-3.5" /> User Management
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Everyone at Blossom, in one place.</h1>
              <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
                Manage employees, training, evaluations, devices, permissions, and system access — the calm command center for your people.
              </p>
            </div>
            <Button onClick={() => setOpenAdd(true)} className="shrink-0 rounded-xl">
              <Plus className="size-4" /> Add Employee
            </Button>
          </div>
        </header>

        {/* Search + filters */}
        <section className="mb-10 rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, role, department, state…"
                className="h-11 rounded-xl border-border/70 bg-muted/40 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill label="State" value={state} options={[...STATES]} onChange={setState} />
              <Pill label="Dept" value={dept} options={deptOptions} onChange={setDept} />
              <Pill label="Status" value={status} options={[...STATUSES]} onChange={setStatus} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Filter className="size-3" />
            <span>{filtered.length} of {members.length} employees</span>
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-12 text-center">
            <Users2 className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No employees match the current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <EmployeeCard key={m.id} m={m} completion={m.uuid ? completion[m.uuid] : undefined} />
            ))}
          </div>
        )}
      </div>
      <AddEmployeeDialog
        open={openAdd}
        onOpenChange={handleAddOpenChange}
        departments={hrDepartments}
        onCreated={(employeeId) => {
          setOpenAdd(false);
          navigate(`/user-management/${employeeId}`);
          window.dispatchEvent(new Event("employee-directory:refresh"));
          window.dispatchEvent(new Event("team-directory:refresh"));
        }}
      />
    </OSShell>
  );
}

function Pill({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 h-9 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-foreground outline-none cursor-pointer"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}