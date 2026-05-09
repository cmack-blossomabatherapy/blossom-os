import { Mail, MessageCircle, BookOpen, LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  { icon: Mail, title: "Email HR", body: "Reach the People team for any onboarding or policy question.", to: "mailto:hr@blossomabatherapy.com", external: true },
  { icon: MessageCircle, title: "Ask the Assistant", body: "Use the in-app assistant for quick how-tos.", to: "/profile" },
  { icon: BookOpen, title: "Onboarding Roadmap", body: "Jump back into your guided journey.", to: "/onboarding" },
];

export default function Help() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <LifeBuoy className="h-3 w-3 text-primary" /> Help & Support
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">We're here for you</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Stuck on something? Pick the fastest path below — Blossom is built so you never have to figure things out alone.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ icon: Icon, title, body, to, external }) => {
          const inner = (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{body}</p>
            </>
          );
          return external ? (
            <a key={title} href={to} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              {inner}
            </a>
          ) : (
            <Link key={title} to={to} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              {inner}
            </Link>
          );
        })}
      </section>
    </div>
  );
}