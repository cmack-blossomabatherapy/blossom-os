import { useMemo, useState } from "react";
import { Search, Sparkles, Crown, HeartHandshake, MapPin, Mail, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { JourneyHero } from "@/components/onboarding/JourneyHero";
import { StepCompleteButton } from "@/components/onboarding/StepCompleteButton";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const GRADIENTS = [
  "from-sky-400 to-blue-600", "from-emerald-400 to-teal-600", "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600", "from-amber-400 to-rose-600", "from-cyan-400 to-blue-500",
];
function gradientFor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function Avatar({ m, size = "md" }: { m: DirectoryEmployee; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-28 w-28 text-2xl" : "h-16 w-16 text-base";
  const [broken, setBroken] = useState(false);
  if (m.photo && !broken) {
    return (
      <img
        src={m.photo}
        alt={m.name}
        onError={() => setBroken(true)}
        className={cn(cls, "rounded-2xl object-cover ring-2 ring-background shadow-md")}
      />
    );
  }
  return (
    <div className={cn(cls, "rounded-2xl bg-gradient-to-br text-white font-semibold flex items-center justify-center ring-2 ring-background shadow-md", gradientFor(m.id))}>
      {initials(m.name)}
    </div>
  );
}

function MemberCard({ m, onOpen }: { m: DirectoryEmployee; onOpen: (m: DirectoryEmployee) => void }) {
  return (
    <button
      onClick={() => onOpen(m)}
      className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" aria-hidden />
      <div className="relative flex gap-3">
        <Avatar m={m} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {m.name}{m.credential && <span className="ml-1 text-xs font-medium text-muted-foreground">, {m.credential}</span>}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.title}</p>
            </div>
            {m.leadership && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{m.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {m.states?.map((s) => (
              <Badge key={s} variant="outline" className="h-5 gap-1 px-1.5 text-[10px]"><MapPin className="h-2.5 w-2.5" />{s}</Badge>
            ))}
            {m.supportsOnboarding && (
              <Badge className="h-5 gap-1 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"><HeartHandshake className="h-2.5 w-2.5" />Supports new hires</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function OnboardingTeam() {
  const { members, departments: DEPARTMENTS, states: ALL_STATES, orgFlow: ORG_FLOW, loading } = useEmployeeDirectory();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [leadershipOnly, setLeadershipOnly] = useState(false);
  const [supportOnly, setSupportOnly] = useState(false);
  const [open, setOpen] = useState<DirectoryEmployee | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (deptFilter !== "all" && m.departmentId !== deptFilter && m.department !== deptFilter) return false;
      if (stateFilter !== "all" && !m.states?.includes(stateFilter)) return false;
      if (leadershipOnly && !m.leadership) return false;
      if (supportOnly && !m.supportsOnboarding) return false;
      if (q && !`${m.name} ${m.title} ${m.blurb}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [members, search, deptFilter, stateFilter, leadershipOnly, supportOnly]);

  // Build a live department list from members so filters reflect actual data.
  const liveDepartments = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    members.forEach((m) => {
      if (m.departmentId && m.departmentName) {
        map.set(m.departmentId, { id: m.departmentId, name: m.departmentName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [members]);

  const grouped = useMemo(() => {
    // Group by live department (uuid). Falls back to "Team" for unassigned.
    const groups = new Map<string, { dept: { id: string; name: string; tagline: string; spotlight?: boolean }; members: typeof filtered }>();
    filtered.forEach((m) => {
      const key = m.departmentId ?? "unassigned";
      const name = m.departmentName ?? "Team";
      if (!groups.has(key)) {
        groups.set(key, {
          dept: {
            id: key,
            name,
            tagline: key === "unassigned" ? "Teammates not yet assigned to a department." : "",
          },
          members: [],
        });
      }
      groups.get(key)!.members.push(m);
    });
    return Array.from(groups.values()).sort((a, b) => a.dept.name.localeCompare(b.dept.name));
  }, [filtered, DEPARTMENTS]);

  const stats = {
    total: members.length,
    leadership: members.filter((m) => m.leadership).length,
    onboarding: members.filter((m) => m.supportsOnboarding).length,
    departments: DEPARTMENTS.length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-16 animate-fade-in">
      <JourneyHero
        eyebrow="Team Directory"
        title="The humans behind Blossom"
        description="Search, filter, and meet every teammate. Looking for the department write-up? Read the Meet the Team page."
      />
      {loading && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Syncing live directory…
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Teammates", value: stats.total },
          { label: "Departments", value: stats.departments },
          { label: "Leaders", value: stats.leadership },
          { label: "Onboarding allies", value: stats.onboarding },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card/70 p-4 text-center backdrop-blur-md">
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="sticky top-0 z-10 -mx-4 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm backdrop-blur-xl sm:mx-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teammates, titles, departments…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-xs">
              <option value="all">All departments</option>
              {liveDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-xs">
              <option value="all">All states</option>
              {ALL_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant={leadershipOnly ? "default" : "outline"} size="sm" onClick={() => setLeadershipOnly((v) => !v)}>
              <Crown className="mr-1 h-3.5 w-3.5" /> Leaders
            </Button>
            <Button variant={supportOnly ? "default" : "outline"} size="sm" onClick={() => setSupportOnly((v) => !v)}>
              <HeartHandshake className="mr-1 h-3.5 w-3.5" /> Onboarding
            </Button>
          </div>
        </div>
      </div>

      {/* Departments */}
      {grouped.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No teammates match your filters yet.
        </p>
      )}
      {grouped.map(({ dept, members }) => (
        <section key={dept.id} className={cn(
          "relative overflow-hidden rounded-3xl border p-5 sm:p-7",
          dept.spotlight ? "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-md" : "border-border/60 bg-card/70 backdrop-blur-md",
        )}>
          {dept.spotlight && (
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          )}
          <div className="relative mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {dept.spotlight && <Sparkles className="h-3 w-3" />}
                {members.length} {members.length === 1 ? "person" : "people"}
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{dept.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{dept.tagline}</p>
            </div>
          </div>
          <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => <MemberCard key={m.id} m={m} onOpen={setOpen} />)}
          </div>
        </section>
      ))}

      {/* Org flow */}
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-background to-primary/5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">How a family flows through Blossom</h2>
        <p className="mt-1 text-sm text-muted-foreground">From first contact to ongoing care — every department plays a role.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {ORG_FLOW.map((node, i) => (
            <div key={node.id} className="flex items-center gap-2">
              <div className="rounded-2xl border border-primary/30 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm">
                <span className="text-primary">●</span> {node.label}
              </div>
              {i < ORG_FLOW.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <StepCompleteButton stepId="team" />

      {/* Profile modal */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {open && (
            <>
              <div className="relative bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_60%,hsl(var(--accent))_120%)] p-6 text-primary-foreground">
                <div className="flex items-start gap-4">
                  <Avatar m={open} size="lg" />
                  <div className="min-w-0 pt-2">
                    {open.leadership && (
                      <Badge className="mb-2 bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/25"><Crown className="mr-1 h-3 w-3" /> Leadership</Badge>
                    )}
                    <DialogHeader className="text-left">
                      <DialogTitle className="text-2xl text-primary-foreground">
                        {open.name}{open.credential && <span className="ml-2 text-base font-normal opacity-80">{open.credential}</span>}
                      </DialogTitle>
                      <DialogDescription className="text-primary-foreground/85">{open.title}</DialogDescription>
                    </DialogHeader>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-foreground">{open.blurb}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{open.departmentName ?? DEPARTMENTS.find((d) => d.id === open.department)?.name ?? "Team"}</Badge>
                  {open.states?.map((s) => <Badge key={s} variant="outline"><MapPin className="mr-1 h-3 w-3" />{s}</Badge>)}
                  {open.supportsOnboarding && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                      <HeartHandshake className="mr-1 h-3 w-3" /> Supports new hires
                    </Badge>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button variant="outline" className="justify-start"><Mail className="mr-2 h-4 w-4" /> Email</Button>
                  <Button variant="outline" className="justify-start"><MessageSquare className="mr-2 h-4 w-4" /> Message on Teams</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
