import { Link } from "react-router-dom";
import {
  LifeBuoy,
  Mail,
  MessageCircle,
  BookOpen,
  Laptop,
  GraduationCap,
  CalendarClock,
  ShieldCheck,
  FileText,
  Users,
  Phone,
  ArrowRight,
  Search,
  HeartHandshake,
} from "lucide-react";

const primaryContacts = [
  {
    name: "Human Resources",
    role: "PTO, payroll, benefits, policies, time off, conflicts",
    email: "hr@blossomabatherapy.com",
    icon: HeartHandshake,
    accent: "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-300",
  },
  {
    name: "Systems & Software",
    role: "Logins, app access, password resets, hardware, Blossom OS issues",
    email: "cmack@blossomabatherapy.com",
    icon: Laptop,
    accent: "from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-300",
    contact: "Corey Mack",
  },
];

const quickHelp = [
  { icon: GraduationCap, title: "Training & onboarding", body: "Where am I in my journey? What's due?", to: "/my-learning" },
  { icon: CalendarClock, title: "PTO, hours, payroll", body: "Request time off or check your hours.", to: "/profile" },
  { icon: ShieldCheck, title: "My logins (Vault)", body: "Securely access assigned company logins.", to: "/profile" },
  { icon: FileText, title: "HR documents", body: "Handbook, policies, signed forms.", to: "/profile" },
  { icon: Users, title: "Find a coworker", body: "Search the employee directory.", to: "/team" },
  { icon: BookOpen, title: "Resource Hub", body: "SOPs, guides, training materials.", to: "/resources" },
];

const faqs = [
  {
    q: "How do I request time off?",
    a: "Open your profile, choose the PTO tab, and submit a request. HR will be notified automatically.",
  },
  {
    q: "I can't log into a company tool.",
    a: "Check your Logins vault on your profile first. If it's missing or invalid, email cmack@blossomabatherapy.com.",
  },
  {
    q: "Where is the employee handbook?",
    a: "It's on your profile under HR Documents, and the Assistant can pull specific sections for you instantly.",
  },
  {
    q: "Who assigns my training?",
    a: "Your supervisor and HR. New courses appear in My Learning and you'll get a notification.",
  },
  {
    q: "How do I reset my password?",
    a: "Use the Forgot Password link on the sign-in page. For other apps, contact Systems & Software.",
  },
  {
    q: "Something is broken in Blossom OS.",
    a: "Email cmack@blossomabatherapy.com with a short description and a screenshot if possible.",
  },
];

export default function Help() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-16">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            <LifeBuoy className="h-3 w-3 text-primary" /> Help & Support
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              We've got your back.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Need a hand? Browse quick help below, or reach out to HR or Systems — they're one click away.
            </p>
          </div>
        </div>
      </header>

      {/* Quick help grid */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Quick help</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickHelp.map(({ icon: Icon, title, body, to }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Talk to a human</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {primaryContacts.map(({ name, role, email, icon: Icon, accent, contact }) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} opacity-60`} aria-hidden />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {name}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {contact ?? "Email the team"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{role}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{email}</span>
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Frequently asked</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              className={`group ${i !== 0 ? "border-t border-border/60" : ""}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
                <span className="text-sm font-medium text-foreground">{f.q}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Emergency footer */}
      <section className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-foreground ring-1 ring-border/60">
            <Phone className="h-4 w-4" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">Urgent client or safety concern?</p>
            <p className="mt-1 text-muted-foreground">
              Contact your direct supervisor or clinical lead immediately. For after-hours HR matters, email{" "}
              <a href="mailto:hr@blossomabatherapy.com" className="font-medium text-primary hover:underline">
                hr@blossomabatherapy.com
              </a>{" "}
              and we'll respond on the next business day.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
