import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Search, Sparkles, Star } from "lucide-react";
import { ExecPage, ExecCard, AIPrompt } from "./_shared";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Importance = "Critical" | "Executive" | "Operational";
type Resource = {
  id: string;
  title: string;
  category: typeof CATEGORIES[number];
  owner: string;
  visibility: string;
  updated: string;
  importance: Importance;
  tags: string[];
  summary: string;
};

const CATEGORIES = [
  "Executive Operations",
  "Organizational Structure & Governance",
  "Staffing & Expansion Frameworks",
  "Operational Workflow Systems",
  "QA, Compliance & Reassessment",
  "Financial & Payor Operations",
  "Training & Organizational Enablement",
  "Systems & Software Operations",
  "Strategic Playbooks",
] as const;

const RESOURCES: Resource[] = [
  // 1 — Executive Operations
  { id: "eo1", title: "Executive Operations SOP", category: "Executive Operations", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this week", importance: "Critical", tags: ["Executive", "Leadership", "Operational"], summary: "Defines how executive leadership operates Blossom day-to-day, including weekly rhythm and decision cadence." },
  { id: "eo2", title: "Organizational Oversight Framework", category: "Executive Operations", owner: "Director of Operations", visibility: "Executive + Ops Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive", "Leadership"], summary: "How leadership maintains organizational visibility and operational alignment across all states." },
  { id: "eo3", title: "Executive Decision-Making Framework", category: "Executive Operations", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive", "Leadership"], summary: "Decision rights, escalation triggers, and operational thresholds for executive action." },
  { id: "eo4", title: "Executive Weekly Review Process", category: "Executive Operations", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this week", importance: "Operational", tags: ["Executive", "Operational"], summary: "Cadence and structure for the weekly executive operating review." },
  { id: "eo5", title: "Operational Risk Monitoring SOP", category: "Executive Operations", owner: "Director of Operations", visibility: "Executive + Ops Leadership", updated: "Updated this month", importance: "Critical", tags: ["Executive", "Critical", "Operational"], summary: "How operational risks are detected, escalated, and resolved at the executive layer." },
  { id: "eo6", title: "Executive KPI Philosophy", category: "Executive Operations", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Executive", "Leadership"], summary: "The principles guiding which KPIs leadership monitors and why." },

  // 2 — Organizational Structure & Governance
  { id: "og1", title: "Organizational Structure Overview", category: "Organizational Structure & Governance", owner: "CEO", visibility: "Leadership", updated: "Updated this month", importance: "Executive", tags: ["Leadership", "Executive"], summary: "Full organizational hierarchy across executive, state, and department leadership." },
  { id: "og2", title: "State Leadership Structure", category: "Organizational Structure & Governance", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Executive", tags: ["Leadership", "Expansion"], summary: "State Director architecture and multi-state reporting structure." },
  { id: "og3", title: "Department Ownership Map", category: "Organizational Structure & Governance", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Leadership", "Operational"], summary: "Which leader owns which operational department and outcome." },
  { id: "og4", title: "Escalation Routing Structure", category: "Organizational Structure & Governance", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this week", importance: "Critical", tags: ["Critical", "Leadership", "Operational"], summary: "How operational issues route through leadership for resolution." },
  { id: "og5", title: "Leadership Accountability Framework", category: "Organizational Structure & Governance", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Executive", "Leadership"], summary: "Defines how leadership accountability is measured supportively, not punitively." },

  // 3 — Staffing & Expansion Frameworks
  { id: "se1", title: "Staffing Readiness Framework", category: "Staffing & Expansion Frameworks", owner: "Director of Operations", visibility: "Executive + State Leadership", updated: "Updated this week", importance: "Critical", tags: ["Staffing", "Growth", "Critical"], summary: "How leadership evaluates if Blossom is staffed to safely support growth." },
  { id: "se2", title: "Expansion Readiness SOP", category: "Staffing & Expansion Frameworks", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Growth", "Expansion", "Executive"], summary: "Criteria and signals required before expanding into new clinics or states." },
  { id: "se3", title: "BCBA Coverage Framework", category: "Staffing & Expansion Frameworks", owner: "Clinical Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Staffing", "Operational"], summary: "Capacity standards for BCBA caseloads and coverage protection." },
  { id: "se4", title: "Recruiting Pipeline Standards", category: "Staffing & Expansion Frameworks", owner: "HR Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Staffing", "Operational"], summary: "Throughput and quality standards for the recruiting pipeline." },
  { id: "se5", title: "State Expansion Checklist", category: "Staffing & Expansion Frameworks", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Expansion", "Growth"], summary: "Step-by-step readiness checklist for safely entering a new state." },
  { id: "se6", title: "Onboarding Scalability Standards", category: "Staffing & Expansion Frameworks", owner: "HR Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Staffing", "Operational"], summary: "How onboarding capacity must scale alongside hiring throughput." },

  // 4 — Operational Workflow Systems
  { id: "ow1", title: "Intake Workflow SOP", category: "Operational Workflow Systems", owner: "Intake Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "End-to-end intake workflow from lead to client conversion." },
  { id: "ow2", title: "Authorization Lifecycle SOP", category: "Operational Workflow Systems", owner: "Auth Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational", "QA"], summary: "Full authorization lifecycle including reauth and escalation paths." },
  { id: "ow3", title: "Client Lifecycle Framework", category: "Operational Workflow Systems", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "How a client moves through Blossom from intake through active care." },
  { id: "ow4", title: "Scheduling Operational Flow", category: "Operational Workflow Systems", owner: "Scheduling Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational", "Staffing"], summary: "Scheduling operational mechanics and coverage coordination." },
  { id: "ow5", title: "Operational Handoff Standards", category: "Operational Workflow Systems", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "Cross-department handoff rules to prevent operational drift." },

  // 5 — QA, Compliance & Reassessment
  { id: "qa1", title: "QA Oversight SOP", category: "QA, Compliance & Reassessment", owner: "QA Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["QA", "Compliance", "Operational"], summary: "How QA oversees treatment plan and reassessment quality across states." },
  { id: "qa2", title: "Reassessment Timeline Standards", category: "QA, Compliance & Reassessment", owner: "QA Leadership", visibility: "Leadership", updated: "Updated this week", importance: "Critical", tags: ["QA", "Critical", "Operational"], summary: "Required reassessment timing to protect authorization continuity." },
  { id: "qa3", title: "BCBA Follow-Up Escalation SOP", category: "QA, Compliance & Reassessment", owner: "QA Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["QA", "Operational"], summary: "Escalation routing when BCBA follow-up stalls." },
  { id: "qa4", title: "Organizational Audit Readiness", category: "QA, Compliance & Reassessment", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Compliance", "Executive"], summary: "How Blossom maintains audit readiness at the organizational level." },
  { id: "qa5", title: "Documentation Readiness Framework", category: "QA, Compliance & Reassessment", owner: "QA Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["QA", "Compliance"], summary: "Documentation standards required for clean operational and compliance posture." },

  // 6 — Financial & Payor Operations
  { id: "fp1", title: "VOB Process Framework", category: "Financial & Payor Operations", owner: "Billing Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "How verification of benefits is conducted and reviewed operationally." },
  { id: "fp2", title: "OON Decision-Making Standards", category: "Financial & Payor Operations", owner: "Billing Leadership", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive", "Operational"], summary: "Out-of-network decision logic and operational financial impact." },
  { id: "fp3", title: "Authorization Financial Impact SOP", category: "Financial & Payor Operations", owner: "Billing Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "How auth activity translates into revenue and operational finance exposure." },
  { id: "fp4", title: "Insurance Risk Management Framework", category: "Financial & Payor Operations", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Executive", "Operational"], summary: "Mitigating payor-related operational and revenue risk." },

  // 7 — Training & Organizational Enablement
  { id: "tr1", title: "Leadership Onboarding Journey", category: "Training & Organizational Enablement", owner: "HR Leadership", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Training", "Leadership"], summary: "Structured onboarding ramp for new operational and clinical leaders." },
  { id: "tr2", title: "Multi-State Leadership Training", category: "Training & Organizational Enablement", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Training", "Leadership", "Expansion"], summary: "Training framework for leaders operating across multiple states." },
  { id: "tr3", title: "SOP Adoption Framework", category: "Training & Organizational Enablement", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Training", "Operational"], summary: "How new SOPs are rolled out and reinforced into operational behavior." },
  { id: "tr4", title: "Executive AI Workflow Training", category: "Training & Organizational Enablement", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive", "Training"], summary: "How executive leadership uses Operational Insights as an operating layer." },

  // 8 — Systems & Software Operations
  { id: "sw1", title: "Blossom OS System Architecture", category: "Systems & Software Operations", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive"], summary: "Overview of how Blossom OS connects operational systems into one layer." },
  { id: "sw2", title: "CentralReach Operational Structure", category: "Systems & Software Operations", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "How CentralReach is structured operationally inside Blossom workflows." },
  { id: "sw3", title: "Data Upload Standards", category: "Systems & Software Operations", owner: "Director of Operations", visibility: "Leadership", updated: "Updated this month", importance: "Operational", tags: ["Operational"], summary: "Source-of-truth standards for operational data uploads in Blossom OS." },
  { id: "sw4", title: "Operational Tech Stack Overview", category: "Systems & Software Operations", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Executive", "Operational"], summary: "All operational software and how it interconnects across departments." },

  // 9 — Strategic Playbooks
  { id: "sp1", title: "Organizational Scaling Playbook", category: "Strategic Playbooks", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Critical", tags: ["Critical", "Growth", "Executive"], summary: "Master playbook for scaling Blossom safely across states." },
  { id: "sp2", title: "Staffing Crisis Playbook", category: "Strategic Playbooks", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this month", importance: "Critical", tags: ["Critical", "Staffing"], summary: "Operational response when staffing pressure becomes acute." },
  { id: "sp3", title: "Operational Stabilization Playbook", category: "Strategic Playbooks", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive", "Operational"], summary: "Stabilizing operations when multiple workflows are under strain." },
  { id: "sp4", title: "Expansion Readiness Playbook", category: "Strategic Playbooks", owner: "CEO", visibility: "Executive Leadership", updated: "Updated this quarter", importance: "Executive", tags: ["Executive", "Growth", "Expansion"], summary: "Operational readiness blueprint before opening a new clinic or state." },
  { id: "sp5", title: "Organizational Alignment Playbook", category: "Strategic Playbooks", owner: "Director of Operations", visibility: "Executive Leadership", updated: "Updated this month", importance: "Executive", tags: ["Executive", "Leadership"], summary: "Re-aligning leadership and departments when operational drift appears." },
];

const IMPORTANCE_STYLE: Record<Importance, string> = {
  Critical: "border-rose-200/70 bg-rose-50/60 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300",
  Executive: "border-primary/20 bg-primary/5 text-primary",
  Operational: "border-border/60 bg-muted/40 text-muted-foreground",
};

const FREQUENTLY_USED = ["se1", "qa2", "og4", "sp1"];
const SUGGESTED = ["eo1", "sp1", "se1", "tr4"];

export default function ExecResourceLibrary() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return RESOURCES.filter((r) => {
      if (cat && r.category !== cat) return false;
      if (tag && !r.tags.includes(tag)) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (
          !r.title.toLowerCase().includes(needle) &&
          !r.summary.toLowerCase().includes(needle) &&
          !r.tags.join(" ").toLowerCase().includes(needle)
        ) return false;
      }
      return true;
    });
  }, [q, cat, tag]);

  const grouped = useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const r of filtered) {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const byId = useMemo(() => Object.fromEntries(RESOURCES.map((r) => [r.id, r])), []);
  const suggested = SUGGESTED.map((id) => byId[id]).filter(Boolean);
  const frequent = FREQUENTLY_USED.map((id) => byId[id]).filter(Boolean);
  const recent = useMemo(
    () => RESOURCES.filter((r) => r.updated.includes("this week")).slice(0, 4),
    [],
  );
  const critical = useMemo(() => RESOURCES.filter((r) => r.importance === "Critical"), []);

  const TAGS = ["Executive", "Critical", "Operational", "Staffing", "Growth", "QA", "Compliance", "Training", "Expansion", "Leadership"];

  return (
    <ExecPage
      title="Resource Library"
      subtitle="Curated executive operational frameworks, governance systems, staffing strategies, and scaling playbooks for Blossom ABA."
      actions={
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[12px]">
          <BookOpen className="size-3.5 text-primary/80" />
          <span className="font-medium text-foreground">{RESOURCES.length} curated resources</span>
          <span className="text-muted-foreground">· {CATEGORIES.length} executive categories</span>
        </div>
      }
    >
      {/* Search + filters */}
      <ExecCard>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search executive resources, frameworks, playbooks..."
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-3 py-1 text-[11.5px] transition ${cat === null ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted"}`}
          >
            All ({RESOURCES.length})
          </button>
          {CATEGORIES.map((c) => {
            const count = RESOURCES.filter((r) => r.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setCat(c === cat ? null : c)}
                className={`rounded-full border px-3 py-1 text-[11.5px] transition ${cat === c ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted"}`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-foreground self-center mr-1">Tags:</span>
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t === tag ? null : t)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${tag === t ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/40"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </ExecCard>

      {/* Suggested + Frequently Used + Recent + Critical */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <CuratedRail title="Suggested" hint="For your role" items={suggested} />
        <CuratedRail title="Frequently used" hint="Across leadership" items={frequent} />
        <CuratedRail title="Recently updated" hint="This week" items={recent} />
        <CuratedRail title="Critical operational" hint="Always-current" items={critical.slice(0, 4)} />
      </div>

      {/* Grouped library */}
      {grouped.map(([category, items]) => (
        <ExecCard key={category} title={category} hint={`${items.length} resource${items.length === 1 ? "" : "s"}`}>
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((r) => (
              <ResourceCard key={r.id} r={r} />
            ))}
          </div>
        </ExecCard>
      ))}

      {/* AI assistant */}
      <ExecCard title="AI resource assistant" hint="Curated, executive-aware">
        <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-background/40 to-background/60 p-4">
          <Sparkles className="mt-0.5 size-4 text-primary/80 shrink-0" />
          <p className="text-[13px] text-foreground/90 max-w-3xl">
            Operational Insights can surface the right executive framework, SOP, or playbook for the operational decision in front of you — without forcing you to browse folders.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <AIPrompt label="Show staffing escalation SOPs" prompt="Show me the staffing escalation SOPs and how they route operationally." variant="card" />
          <AIPrompt label="How does reassessment escalation work?" prompt="Explain how reassessment escalation works across QA and Auth at the executive level." variant="card" />
          <AIPrompt label="Growth readiness frameworks" prompt="Show me the growth and expansion readiness frameworks available." variant="card" />
          <AIPrompt label="Onboarding scalability process" prompt="Summarize the onboarding scalability process and standards." variant="card" />
          <AIPrompt label="Operational risk procedures" prompt="Show operational risk monitoring procedures and how leadership uses them." variant="card" />
        </div>
      </ExecCard>
    </ExecPage>
  );
}

function ResourceCard({ r }: { r: Resource }) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-background/40 p-4 transition hover:-translate-y-0.5 hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-[13.5px] font-medium truncate">{r.title}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{r.summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">{r.owner}</span>
            <span>· {r.visibility}</span>
            <span>· {r.updated}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${IMPORTANCE_STYLE[r.importance]}`}>
            {r.importance}
          </span>
          <button
            type="button"
            disabled
            title="Pinning coming soon - use /resource-library favorites"
            className="rounded-full p-1 text-muted-foreground/50 cursor-not-allowed transition"
          >
            <Star className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {r.tags.map((t) => (
          <span key={t} className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10.5px] text-muted-foreground">{t}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          href={`/resource-library?q=${encodeURIComponent(r.title)}`}
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] hover:bg-muted transition"
        >
          Open in library <ChevronRight className="size-3" />
        </a>
        <AIPrompt label="AI summarize" prompt={`Summarize the resource "${r.title}" for an executive in 3 lines, focused on operational use.`} />
        <AIPrompt label="Related resources" prompt={`Show resources related to "${r.title}" within the Blossom executive library.`} />
      </div>
    </div>
  );
}

function CuratedRail({ title, hint, items }: { title: string; hint: string; items: Resource[] }) {
  const navigate = useNavigate();
  return (
    <ExecCard title={title} hint={hint}>
      <div className="space-y-1.5">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => navigate(`/resource-library?q=${encodeURIComponent(r.title)}`)}
            className="w-full text-left rounded-xl border border-border/50 bg-background/30 px-3 py-2 hover:bg-muted/40 transition"
          >
            <div className="text-[12.5px] font-medium truncate">{r.title}</div>
            <div className="mt-0.5 text-[10.5px] text-muted-foreground truncate">{r.category}</div>
          </button>
        ))}
      </div>
    </ExecCard>
  );
}
