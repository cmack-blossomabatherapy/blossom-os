import { Link } from "react-router-dom";
import {
  Heart, Sparkles, Gift, CalendarClock, Wallet, MessageSquare,
  LifeBuoy, ExternalLink, Download, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRBTResources, type RBTResource } from "@/lib/training/rbtResources";
import { RBT_RETENTION_GROUPS, RBT_RETENTION_CONTACTS } from "@/lib/training/rbtRetentionSection";
import { markViewed } from "@/lib/training/rbtResourcePrefs";

// A warm, supportive surface for RBTs — recognition, non-billable, payroll clarity.
// Drop this anywhere: Resources tab, Support tab, or its own page.

const GROUP_ICON = [Gift, CalendarClock, Wallet] as const;

export function RBTRetentionSection({ compact = false }: { compact?: boolean }) {
  const all = useRBTResources();
  const byId = new Map(all.map((r) => [r.id, r]));

  return (
    <section
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5",
        "shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_8px_24px_-12px_oklch(0.2_0.02_260/0.08)]",
      )}
      aria-labelledby="rbt-retention-heading"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Heart className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/80">
            RBT Support & Retention
          </p>
          <h2 id="rbt-retention-heading" className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
            We're in your corner.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Points, non-billable time, mileage, PTO — none of it is meant to trip you up.
            Here's the warm-and-simple version of how it all works, plus who to call when you need a hand.
          </p>
        </div>
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "sm:grid-cols-1" : "lg:grid-cols-3")}>
        {RBT_RETENTION_GROUPS.map((g, i) => {
          const Icon = GROUP_ICON[i] ?? Sparkles;
          const items = g.resourceIds.map((id) => byId.get(id)).filter(Boolean) as RBTResource[];
          return (
            <div key={g.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{g.title}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{g.blurb}</p>
              <ul className="mt-3 space-y-1.5">
                {items.map((r) => (
                  <li key={r.id}>
                    <RetentionLink r={r} />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">Coming soon.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* What counts / how to submit / how to request help — quick reminders */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Reminder
          icon={Sparkles}
          title="What counts as non-billable"
          body="Training, trainings you assist with, prep, peer support, drive time per policy, and approved extras."
        />
        <Reminder
          icon={LifeBuoy}
          title="How to submit proof"
          body="Use the Non-Billable Completion Signature Form. Submit weekly so your points and pay stay current."
        />
        <Reminder
          icon={CalendarClock}
          title="Avoid payroll & scheduling stress"
          body="Send schedule changes by email per the policy. Watch the payroll dates. Ask before you assume."
        />
        <Reminder
          icon={MessageSquare}
          title="How to request help"
          body="Message your Lead RBT Trainer, ping Scheduling, or ask Blossom AI any time — even at 11pm."
        />
      </div>

      {/* Who to contact */}
      <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Who to contact</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {RBT_RETENTION_CONTACTS.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-xs">
              <ChevronRight className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{c.label}</p>
                <p className="text-muted-foreground">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/rbt/messages"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <MessageSquare className="size-3.5" /> Message my team
          </Link>
        </div>
      </div>
    </section>
  );
}

function RetentionLink({ r }: { r: RBTResource }) {
  const isExternal = !!r.url && /^https?:\/\//.test(r.url);
  function open() {
    if (!r.url) return;
    markViewed(r.id);
    if (isExternal) window.open(r.url, "_blank", "noreferrer");
    else window.location.assign(r.url);
  }
  return (
    <button
      type="button"
      onClick={open}
      className="group flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-1.5 text-left text-xs transition hover:bg-muted"
    >
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{r.title}</span>
      <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
        {r.type}
        {isExternal ? <ExternalLink className="size-3" /> : <Download className="size-3" />}
      </span>
    </button>
  );
}

function Reminder({
  icon: Icon, title, body,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-card p-3">
      <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}