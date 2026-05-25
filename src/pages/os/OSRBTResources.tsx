import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Search, Bookmark, BookOpen, PlayCircle, ClipboardCheck,
  FileText, Workflow, Sparkles, Sprout, Headphones, MessageSquare,
  ShieldAlert, HeartHandshake, MonitorSmartphone, Users, Video, Zap,
  ArrowUpRight, X,
} from "lucide-react";

type ResourceType = "SOP" | "Guide" | "Video" | "Checklist" | "Workflow" | "Quick Reference";

type SectionId =
  | "start" | "session" | "comms" | "safety" | "supervision"
  | "blossom" | "parent" | "training" | "quick";

type Resource = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  minutes: number;
  section: SectionId;
  tags: string[];
};

const SECTIONS: { id: SectionId; label: string; hint: string; icon: any }[] = [
  { id: "start", label: "Start here", hint: "Onboarding and the basics", icon: Sprout },
  { id: "session", label: "Session support", hint: "Be ready for every session", icon: ClipboardCheck },
  { id: "comms", label: "Communication & professionalism", hint: "How we show up", icon: MessageSquare },
  { id: "safety", label: "Safety & escalations", hint: "What to do under pressure", icon: ShieldAlert },
  { id: "supervision", label: "Supervision support", hint: "Grow with your BCBA", icon: HeartHandshake },
  { id: "blossom", label: "Blossom OS help", hint: "Use the app with confidence", icon: MonitorSmartphone },
  { id: "parent", label: "Parent & caregiver interaction", hint: "Build trust in the home", icon: Users },
  { id: "training", label: "Training recordings", hint: "Watch, learn, refresh", icon: Video },
  { id: "quick", label: "Quick reference guides", hint: "Fast answers in the field", icon: Zap },
];

const RESOURCES: Resource[] = [
  // Start here
  r("Welcome to Blossom", "What we stand for and how the day looks.", "Guide", 4, "start", ["onboarding"]),
  r("RBT role overview", "Your responsibilities and how you fit in.", "Guide", 5, "start", ["onboarding", "role"]),
  r("RBT expectations", "What success looks like in the field.", "SOP", 5, "start", ["onboarding"]),
  r("Daily workflow guide", "How to use My Day to stay on track.", "Workflow", 4, "start", ["my day"]),
  r("First week checklist", "Everything to do in week one.", "Checklist", 3, "start", ["onboarding"]),
  r("Working with your BCBA", "How the supervision relationship works.", "Guide", 4, "start", ["supervision", "bcba"]),
  r("Using Blossom OS", "A quick tour of the platform.", "Video", 6, "start", ["blossom os", "tutorial"]),
  r("Field readiness guide", "What 'ready' looks like before each session.", "Guide", 3, "start", ["session"]),

  // Session support
  r("Session preparation SOP", "Pre-session steps in order.", "SOP", 5, "session", ["session", "prep"]),
  r("Before session checklist", "10 quick things to confirm.", "Checklist", 2, "session", ["session", "prep"]),
  r("In-home session guidelines", "What's different about home sessions.", "Guide", 4, "session", ["session", "home"]),
  r("Clinic session expectations", "Clinic-specific norms.", "Guide", 3, "session", ["session", "clinic"]),
  r("School session expectations", "How to show up in schools.", "Guide", 4, "session", ["session", "school"]),
  r("Reinforcement reminders", "Quick refresher on reinforcement.", "Quick Reference", 2, "session", ["reinforcement"]),
  r("Transitions between sessions", "Move calmly between clients.", "Guide", 3, "session", ["transitions"]),
  r("What to bring to sessions", "Your essentials list.", "Checklist", 2, "session", ["session", "materials"]),

  // Communication & professionalism
  r("Parent communication standards", "Tone, timing, and topics.", "SOP", 4, "comms", ["parent", "communication"]),
  r("Professionalism expectations", "How we show up as Blossom.", "Guide", 4, "comms", ["professionalism"]),
  r("Running late workflow", "What to do, who to tell.", "Workflow", 2, "comms", ["scheduling", "running late"]),
  r("Communication do's & don'ts", "Quick clarity on what to say.", "Quick Reference", 3, "comms", ["communication"]),
  r("Texting guidelines", "When texting is OK and when it isn't.", "Guide", 3, "comms", ["communication"]),
  r("Documentation expectations", "Notes, timing, and clarity.", "SOP", 4, "comms", ["documentation"]),
  r("Attendance expectations", "Showing up reliably matters.", "Guide", 3, "comms", ["professionalism"]),

  // Safety & escalations
  r("Safety escalation SOP", "The full safety flow, simplified.", "SOP", 5, "safety", ["safety", "escalation"]),
  r("Emergency contact workflow", "Who to call, in what order.", "Workflow", 3, "safety", ["safety", "contacts"]),
  r("Unsafe environment guidance", "When and how to leave.", "Guide", 4, "safety", ["safety"]),
  r("Incident reporting expectations", "Calm, clear reporting steps.", "SOP", 4, "safety", ["safety", "documentation"]),
  r("Mandated reporting guidance", "Your responsibilities, explained.", "Guide", 5, "safety", ["safety", "compliance"]),
  r("Illness & emergency procedures", "Health-related session protocols.", "SOP", 4, "safety", ["safety", "health"]),
  r("Safety decision tree", "Quick visual for the field.", "Quick Reference", 3, "safety", ["safety"]),
  r("Client injury workflow", "Step-by-step response.", "Workflow", 4, "safety", ["safety"]),

  // Supervision support
  r("Supervision expectations", "How supervision works at Blossom.", "Guide", 4, "supervision", ["supervision"]),
  r("Preparing for supervision", "Show up ready, feel confident.", "Checklist", 3, "supervision", ["supervision"]),
  r("BCBA communication guide", "Best ways to reach your BCBA.", "Guide", 3, "supervision", ["bcba", "communication"]),
  r("Observation support tips", "Make the most of being observed.", "Guide", 4, "supervision", ["supervision"]),
  r("Receiving feedback positively", "Tools for a coaching mindset.", "Guide", 4, "supervision", ["supervision", "growth"]),
  r("Clinical question workflow", "Where to send clinical questions.", "Workflow", 2, "supervision", ["clinical"]),

  // Blossom OS
  r("Blossom OS mobile guide", "Get oriented on your phone.", "Guide", 4, "blossom", ["blossom os", "mobile"]),
  r("My Day walkthrough", "Run your day from one screen.", "Video", 5, "blossom", ["my day"]),
  r("My Schedule walkthrough", "Read and react to your schedule.", "Video", 4, "blossom", ["scheduling"]),
  r("Messages & Updates guide", "What's important, what's not.", "Guide", 3, "blossom", ["messages"]),
  r("Need help workflow", "How escalations are routed.", "Workflow", 2, "blossom", ["support", "escalation"]),
  r("Login & password help", "Reset and recovery steps.", "Quick Reference", 2, "blossom", ["account"]),
  r("Notifications guide", "Set notifications that help you.", "Guide", 3, "blossom", ["notifications"]),

  // Parent & caregiver
  r("Building parent trust", "Small moments that matter.", "Guide", 4, "parent", ["parent", "trust"]),
  r("Caregiver communication tips", "Practical phrases that work.", "Quick Reference", 3, "parent", ["parent", "communication"]),
  r("Difficult conversation guidance", "How to stay calm and kind.", "Guide", 5, "parent", ["parent", "difficult"]),
  r("Session arrival expectations", "First two minutes set the tone.", "Guide", 3, "parent", ["session", "arrival"]),
  r("Professional boundaries", "Where the line is, gently.", "SOP", 4, "parent", ["professionalism"]),
  r("Respectful communication guide", "Care, clarity, and consistency.", "Guide", 4, "parent", ["communication"]),

  // Training recordings
  r("RBT orientation recording", "Your full orientation, on demand.", "Video", 32, "training", ["orientation"]),
  r("Session expectations training", "Watch what 'great' looks like.", "Video", 18, "training", ["session"]),
  r("Communication training", "Real examples, real practice.", "Video", 22, "training", ["communication"]),
  r("Safety training", "Refresher on the safety basics.", "Video", 15, "training", ["safety"]),
  r("Supervision overview", "Behind-the-scenes of supervision.", "Video", 12, "training", ["supervision"]),
  r("Parent interaction training", "Caregiver scenarios in action.", "Video", 20, "training", ["parent"]),

  // Quick reference
  r("Who to contact quick guide", "One card. One answer.", "Quick Reference", 2, "quick", ["support", "contacts"]),
  r("Running late quick steps", "3 steps. Done.", "Quick Reference", 1, "quick", ["scheduling", "running late"]),
  r("Session checklist", "The classic before-session card.", "Checklist", 2, "quick", ["session"]),
  r("Escalation cheat sheet", "Pick the right path in seconds.", "Quick Reference", 2, "quick", ["escalation"]),
  r("Supervision quick guide", "What, when, and how often.", "Quick Reference", 2, "quick", ["supervision"]),
  r("BCBA contact flow", "How to reach your BCBA, fast.", "Quick Reference", 1, "quick", ["bcba"]),
  r("Safety quick guide", "The essentials, in one page.", "Quick Reference", 2, "quick", ["safety"]),
];

function r(
  title: string, description: string, type: ResourceType,
  minutes: number, section: SectionId, tags: string[]
): Resource {
  return {
    id: `${section}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title, description, type, minutes, section, tags,
  };
}

const SUGGESTED_TAGS = [
  "session", "supervision", "safety", "parent", "communication",
  "escalation", "scheduling", "blossom os", "professionalism", "support",
];

export default function OSRBTResources() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId | "all">("all");
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (activeSection !== "all" && r.section !== activeSection) return false;
      if (activeTag && !r.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q)) ||
        r.type.toLowerCase().includes(q)
      );
    });
  }, [query, activeTag, activeSection]);

  const isFiltering = !!query || !!activeTag || activeSection !== "all";

  const grouped = useMemo(() => {
    const map: Record<SectionId, Resource[]> = {} as any;
    for (const sec of SECTIONS) map[sec.id] = [];
    for (const r of filtered) map[r.section].push(r);
    return map;
  }, [filtered]);

  const savedCount = Object.values(saved).filter(Boolean).length;
  const toggleSave = (id: string) => setSaved((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* HEADER */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-6xl px-5 md:px-10 pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/rbt" className="hover:text-foreground transition-colors">RBT</Link>
            <ChevronRight className="size-3" />
            <span>Resource Library</span>
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Everything you need for the field.
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-xl">
            Curated guides, SOPs, and training — organized for RBTs. Nothing extra.
          </p>

          {/* SEARCH */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 100))}
              placeholder="Search resources, tags, or topics…"
              className="w-full h-12 rounded-2xl bg-card border border-border/70 pl-11 pr-11 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring focus:border-transparent transition shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full size-7 grid place-items-center hover:bg-muted transition-colors"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* TAGS */}
          <div className="mt-4 flex gap-1.5 flex-wrap">
            {SUGGESTED_TAGS.map((t) => {
              const on = activeTag === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTag(on ? null : t)}
                  className={`h-7 px-3 rounded-full text-xs font-medium transition border ${
                    on
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
                >
                  #{t}
                </button>
              );
            })}
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="h-7 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground transition"
              >
                Clear tag
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 md:px-10 pt-8 md:pt-10 space-y-10">
        <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-10">
          {/* SIDEBAR — section nav */}
          <aside className="md:sticky md:top-6 md:self-start space-y-1">
            <SidebarItem
              label="All resources"
              hint={`${RESOURCES.length} items`}
              active={activeSection === "all"}
              onClick={() => setActiveSection("all")}
              icon={Sparkles}
            />
            <SidebarItem
              label="Saved"
              hint={savedCount === 0 ? "None yet" : `${savedCount} saved`}
              active={false}
              onClick={() => {
                setActiveSection("all");
                setQuery("");
              }}
              icon={Bookmark}
              muted
            />
            <div className="h-px bg-border/60 my-2.5" />
            {SECTIONS.map((s) => (
              <SidebarItem
                key={s.id}
                label={s.label}
                hint={`${RESOURCES.filter((r) => r.section === s.id).length} items`}
                active={activeSection === s.id}
                onClick={() => setActiveSection(s.id)}
                icon={s.icon}
              />
            ))}
          </aside>

          {/* CONTENT */}
          <div className="space-y-10 min-w-0">
            {/* Saved row (when items exist) */}
            {savedCount > 0 && !isFiltering && (
              <SavedRow
                resources={RESOURCES.filter((r) => saved[r.id])}
                onToggle={toggleSave}
              />
            )}

            {SECTIONS
              .filter((sec) => activeSection === "all" || activeSection === sec.id)
              .map((sec) => {
                const list = grouped[sec.id];
                if (list.length === 0) return null;
                return (
                  <SectionBlock
                    key={sec.id}
                    section={sec}
                    resources={list}
                    saved={saved}
                    onToggle={toggleSave}
                  />
                );
              })}

            {filtered.length === 0 && (
              <div className="rounded-2xl bg-card border border-border/70 p-10 text-center">
                <div className="size-12 mx-auto rounded-full bg-muted grid place-items-center">
                  <Search className="size-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-base font-medium text-foreground">No matches</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try a different search or clear your filters.</p>
                <button
                  onClick={() => { setQuery(""); setActiveTag(null); setActiveSection("all"); }}
                  className="mt-4 h-9 px-4 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm hover:bg-muted transition"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ───────── pieces ───────── */

function SidebarItem({
  label, hint, active, onClick, icon: Icon, muted,
}: {
  label: string; hint?: string; active: boolean;
  onClick: () => void; icon: any; muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        active ? "bg-card border border-border/70 shadow-sm" : "hover:bg-muted/60"
      }`}
    >
      <Icon className={`size-4 ${active ? "text-primary" : muted ? "text-muted-foreground/70" : "text-muted-foreground"}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${active ? "text-foreground" : "text-foreground/80"}`}>{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
      </div>
    </button>
  );
}

function SectionBlock({
  section, resources, saved, onToggle,
}: {
  section: { id: SectionId; label: string; hint: string; icon: any };
  resources: Resource[];
  saved: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const Icon = section.icon;
  return (
    <section>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-muted grid place-items-center">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">{section.label}</h2>
          <p className="text-sm text-muted-foreground">{section.hint}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} saved={!!saved[r.id]} onToggle={() => onToggle(r.id)} />
        ))}
      </div>
    </section>
  );
}

function SavedRow({
  resources, onToggle,
}: { resources: Resource[]; onToggle: (id: string) => void }) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-primary/10 grid place-items-center">
          <Bookmark className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">Saved</h2>
          <p className="text-sm text-muted-foreground">Resources you've bookmarked.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} saved onToggle={() => onToggle(r.id)} />
        ))}
      </div>
    </section>
  );
}

function ResourceCard({
  resource, saved, onToggle,
}: { resource: Resource; saved: boolean; onToggle: () => void }) {
  const Icon = typeIcon(resource.type);
  return (
    <div className="group rounded-2xl bg-card border border-border/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border">
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeTag type={resource.type} />
            <span className="text-xs text-muted-foreground">
              {resource.minutes < 60 ? `${resource.minutes} min` : `${Math.round(resource.minutes / 60)} hr`}
              {" "}{resource.type === "Video" ? "watch" : "read"}
            </span>
          </div>
          <div className="mt-2 text-[15px] font-medium text-foreground">{resource.title}</div>
          <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{resource.description}</div>
        </div>
        <button
          onClick={onToggle}
          aria-label={saved ? "Remove from saved" : "Save"}
          className="rounded-full size-9 grid place-items-center hover:bg-muted transition-colors shrink-0"
        >
          <Bookmark className={`size-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-secondary text-secondary-foreground border border-border/70 text-sm font-medium hover:bg-muted transition">
          Open <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function typeIcon(t: ResourceType) {
  switch (t) {
    case "SOP": return FileText;
    case "Guide": return BookOpen;
    case "Video": return PlayCircle;
    case "Checklist": return ClipboardCheck;
    case "Workflow": return Workflow;
    case "Quick Reference": return Zap;
  }
}

function TypeTag({ type }: { type: ResourceType }) {
  const cls =
    type === "Video" ? "bg-primary/10 text-primary"
    : type === "Quick Reference" ? "bg-primary/10 text-primary"
    : "bg-muted text-foreground/70";
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{type}</span>;
}