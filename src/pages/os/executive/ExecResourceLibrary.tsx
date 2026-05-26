import { useMemo, useState } from "react";
import { BookOpen, Search, Star, ChevronRight, Sparkles } from "lucide-react";
import { ExecPage, ExecCard, AIPrompt } from "./_shared";
import { toast } from "sonner";

type Resource = { id: string; title: string; category: string; owner: string };

const CATEGORIES = [
  "Executive Operations SOPs",
  "Organizational Governance",
  "Operational Leadership",
  "Staffing Frameworks",
  "Escalation Systems",
  "Readiness Standards",
  "Reporting Frameworks",
  "Strategic Playbooks",
  "Organizational Intelligence",
] as const;

const RESOURCES: Resource[] = [
  { id: "1", title: "Executive Operational Cadence", category: "Executive Operations SOPs", owner: "CEO" },
  { id: "2", title: "Quarterly Leadership Rhythm", category: "Executive Operations SOPs", owner: "CEO" },
  { id: "3", title: "Multi-state Governance Charter", category: "Organizational Governance", owner: "COO" },
  { id: "4", title: "Decision Rights Framework", category: "Organizational Governance", owner: "COO" },
  { id: "5", title: "Department Leadership Playbook", category: "Operational Leadership", owner: "Ops" },
  { id: "6", title: "Cross-functional Coordination SOP", category: "Operational Leadership", owner: "Ops" },
  { id: "7", title: "State Staffing Model", category: "Staffing Frameworks", owner: "HR" },
  { id: "8", title: "BCBA/RBT Capacity Standards", category: "Staffing Frameworks", owner: "Clinical" },
  { id: "9", title: "Escalation Path & Owner Matrix", category: "Escalation Systems", owner: "Ops" },
  { id: "10", title: "Operational Readiness Scorecard", category: "Readiness Standards", owner: "Ops" },
  { id: "11", title: "Executive Reporting Template", category: "Reporting Frameworks", owner: "Ops" },
  { id: "12", title: "Growth Readiness Playbook", category: "Strategic Playbooks", owner: "CEO" },
  { id: "13", title: "Operational Intelligence Layer Brief", category: "Organizational Intelligence", owner: "Ops" },
];

export default function ExecResourceLibrary() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return RESOURCES.filter((r) => {
      if (cat && r.category !== cat) return false;
      if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, cat]);

  return (
    <ExecPage
      title="Resource Library"
      subtitle="Executive SOPs, governance, and operational leadership knowledge — curated for leadership."
    >
      <ExecCard>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search executive resources..."
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-3 py-1 text-[11.5px] transition ${
              cat === null ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted"
            }`}
          >
            All ({RESOURCES.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = RESOURCES.filter((r) => r.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1 text-[11.5px] transition ${
                  cat === c ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted"
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      </ExecCard>

      <ExecCard title="Resources" hint={`${filtered.length} item${filtered.length === 1 ? "" : "s"}`}>
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((r) => (
            <div key={r.id} className="group rounded-xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-0.5 hover:bg-muted/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[13.5px] font-medium">{r.title}</span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground">{r.category} · {r.owner}</div>
                </div>
                <button
                  onClick={() => toast.success(`Pinned: ${r.title}`)}
                  className="rounded-full p-1 text-muted-foreground hover:text-amber-500 transition"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => toast.info(`Opening: ${r.title}`)} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] hover:bg-muted transition">
                  Preview <ChevronRight className="h-3 w-3" />
                </button>
                <AIPrompt label="AI Summarize" prompt={`Summarize the resource "${r.title}" for an executive`} />
              </div>
            </div>
          ))}
        </div>
      </ExecCard>
    </ExecPage>
  );
}
