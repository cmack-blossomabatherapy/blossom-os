import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, Crown, Network, ArrowLeft, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JourneyHero } from "@/components/onboarding/JourneyHero";
import { useEmployeeDirectory, type DirectoryEmployee } from "@/hooks/useEmployeeDirectory";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const GRADIENTS = [
  "from-sky-400 to-blue-600", "from-emerald-400 to-teal-600", "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600", "from-amber-400 to-orange-600", "from-cyan-400 to-blue-500",
];
function gradientFor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

function Avatar({ m, size = "md" }: { m: DirectoryEmployee; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-10 w-10 text-xs" : "h-14 w-14 text-sm";
  if (m.photo) {
    return <img src={m.photo} alt={m.name} className={cn(cls, "rounded-xl object-cover ring-2 ring-background shadow-sm")} />;
  }
  return (
    <div className={cn(cls, "rounded-xl bg-gradient-to-br text-white font-semibold flex items-center justify-center ring-2 ring-background shadow-sm", gradientFor(m.id))}>
      {initials(m.name)}
    </div>
  );
}

function PersonCard({ m, size = "md" }: { m: DirectoryEmployee; size?: "sm" | "md" }) {
  return (
    <div className={cn(
      "min-w-[200px] max-w-[240px] rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
    )}>
      <div className="flex items-center gap-2.5">
        <Avatar m={m} size={size} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
            {m.leadership && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
          </div>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{m.title}</p>
          {m.credential && (
            <Badge variant="outline" className="mt-1 h-4 px-1 text-[9px]">{m.credential}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function Branch({ node, all }: { node: DirectoryEmployee; all: DirectoryEmployee[] }) {
  const reports = node.uuid ? all.filter((m) => m.managerId === node.uuid) : [];
  return (
    <div className="flex flex-col items-center gap-4">
      <PersonCard m={node} />
      {reports.length > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap items-start justify-center gap-4">
            {reports.map((r) => <Branch key={r.id} node={r} all={all} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function OnboardingOrgChart() {
  const { members, loading } = useEmployeeDirectory();

  // Roots = leaders without a manager in the directory
  const roots = useMemo(() => {
    const uuids = new Set(members.map((m) => m.uuid).filter(Boolean) as string[]);
    return members.filter((m) => !m.managerId || !uuids.has(m.managerId));
  }, [members]);

  // Group roots: executives first
  const exec = roots.filter((r) => r.leadershipLevel === "executive" || r.leadership);
  const otherRoots = roots.filter((r) => !(r.leadershipLevel === "executive" || r.leadership));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-16 animate-fade-in">
      <JourneyHero
        eyebrow="Organizational Chart"
        title="How Blossom is organized"
        description="See who leads each area and how teams report up. Click any name to learn more."
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/onboarding"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to journey</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/onboarding/team"><Users className="mr-1 h-3.5 w-3.5" /> Team Directory</Link>
        </Button>
      </div>

      {loading && members.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading org chart…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur-md sm:p-8">
          <div className="flex min-w-fit flex-col items-center gap-10">
            {exec.length > 0 && (
              <div className="flex flex-wrap items-start justify-center gap-6">
                {exec.map((r) => <Branch key={r.id} node={r} all={members} />)}
              </div>
            )}
            {otherRoots.length > 0 && (
              <div className="w-full">
                <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Network className="h-3.5 w-3.5" /> Additional teams
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {otherRoots.map((m) => <PersonCard key={m.id} m={m} size="sm" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}