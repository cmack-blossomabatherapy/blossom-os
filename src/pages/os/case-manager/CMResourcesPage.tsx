import { Link } from "react-router-dom";
import { BookOpen, HeartHandshake, MessageSquare, ShieldCheck, Activity, Flame, ArrowUpRight } from "lucide-react";

const COLLECTIONS = [
  { icon: BookOpen, title: "SOPs", desc: "Standard operating procedures for Case Managers.", href: "/resource-library?role=case_manager&type=sop" },
  { icon: HeartHandshake, title: "Parent support resources", desc: "Templates and guides for warm conversations.", href: "/resource-library?role=case_manager&category=parent" },
  { icon: MessageSquare, title: "Communication scripts", desc: "Voice and tone across every family touch-point.", href: "/resource-library?role=case_manager&category=communication" },
  { icon: Flame, title: "Escalation procedures", desc: "Clear steps for sensitive situations.", href: "/resource-library?role=case_manager&category=escalation" },
  { icon: Activity, title: "Service continuity", desc: "Keep care moving even through disruption.", href: "/resource-library?role=case_manager&category=continuity" },
  { icon: ShieldCheck, title: "Operational support", desc: "Everything you need to operate calmly.", href: "/resource-library?role=case_manager&category=operations" },
];

export default function CMResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <BookOpen className="h-3 w-3" /> Case Manager · Resources
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Resource Library</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          The global Blossom Resource Library, with collections curated for Case Managers.
        </p>
        <div className="mt-4">
          <Link to="/resource-library" className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Open full library <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <Link key={c.title} to={c.href} className="group rounded-2xl border border-border/60 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-foreground/30">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground/70">
              <c.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[14px] font-semibold">{c.title}</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{c.desc}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-foreground/70 group-hover:text-foreground">
              Open collection <ArrowUpRight className="h-3 w-3" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}