import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Users2, MapPin, Building2, ShieldCheck, GraduationCap,
  ClipboardCheck, Activity, ChevronRight, Filter,
} from "lucide-react";
import { OSShell } from "../OSShell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";

const STATES = ["All", "GA", "NC", "VA", "TN", "MD", "FL"] as const;
const STATUSES = ["All", "Active", "Inactive"] as const;

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function StatDot({ tone }: { tone: "ok" | "warn" | "off" }) {
  const cls = tone === "ok" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-muted-foreground/40";
  return <span className={cn("inline-block size-1.5 rounded-full", cls)} />;
}

function EmployeeCard({ m }: { m: DirectoryEmployee }) {
  // Deterministic-ish demo metrics derived from name length so the UI feels alive
  const seed = (m.name?.length ?? 5) * 7;
  const trainingPct = 30 + (seed % 70);
  const evalDone = seed % 3 === 0;
  const lastLogin = ["Just now", "2h ago", "Yesterday", "3d ago", "1w ago"][seed % 5];
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
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{m.name}</p>
          <p className="truncate text-[13px] text-muted-foreground">{m.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{m.states?.[0] ?? "—"}</span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{m.departmentName ?? "Unassigned"}</span>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground/50 transition group-hover:text-foreground" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-[11px]">
        <div>
          <div className="mb-1 flex items-center justify-between text-muted-foreground">
            <span className="inline-flex items-center gap-1"><GraduationCap className="size-3" />Training</span>
            <span className="font-medium text-foreground">{trainingPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary/80" style={{ width: `${trainingPct}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-muted-foreground"><ClipboardCheck className="size-3" />Eval</span>
          <span className="inline-flex items-center gap-1.5 text-foreground"><StatDot tone={evalDone ? "ok" : "warn"} />{evalDone ? "Current" : "Due"}</span>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Activity className="size-3" />Last login</span>
          <span className="text-foreground">{lastLogin}</span>
        </div>
      </div>
    </Link>
  );
}

export default function UsersHome() {
  const { members, departments, loading } = useEmployeeDirectory();
  const [q, setQ] = useState("");
  const [state, setState] = useState<string>("All");
  const [dept, setDept] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");

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
      <div className="mx-auto w-full max-w-7xl px-1 md:px-2">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Users2 className="size-3.5" /> User Management
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Everyone at Blossom, in one place.</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
            Manage employees, training, evaluations, devices, permissions, and system access — the calm command center for your people.
          </p>
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
            {filtered.map((m) => <EmployeeCard key={m.id} m={m} />)}
          </div>
        )}
      </div>
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