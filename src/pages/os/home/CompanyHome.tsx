import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isSameMonth, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Megaphone, Sparkles, Pin, Settings, ExternalLink } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompanyHome, useCanManageCompanyHome, type CompanyCalendarEvent } from "@/hooks/useCompanyHome";
import { useAuth } from "@/contexts/AuthContext";

function safeDate(d: string): Date {
  return parseISO(d);
}

function groupEventsByMonth(events: CompanyCalendarEvent[]) {
  const groups: { label: string; items: CompanyCalendarEvent[] }[] = [];
  for (const ev of events) {
    const d = safeDate(ev.starts_on);
    const label = format(d, "MMMM yyyy");
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(ev);
    else groups.push({ label, items: [ev] });
  }
  return groups;
}

export default function CompanyHome() {
  const { events, updates, highlights, loading } = useCompanyHome();
  const canManage = useCanManageCompanyHome();
  const { displayName } = useAuth();

  const grouped = useMemo(() => groupEventsByMonth(events), [events]);
  const today = new Date();
  const todayEvents = events.filter((e) => isSameDay(safeDate(e.starts_on), today));
  const thisMonth = events.filter((e) => isSameMonth(safeDate(e.starts_on), today));

  return (
    <OSShell>
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 md:py-12 space-y-10">
        {/* Hero */}
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Blossom Company Home
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Welcome back, {displayName}.
            </h1>
            <p className="text-sm md:text-[15px] text-muted-foreground mt-2 max-w-xl">
              Company updates, upcoming dates, and highlights from across Blossom — all in one calm place.
            </p>
          </div>
          {canManage && (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/home/manage">
                <Settings className="size-4" />
                Manage
              </Link>
            </Button>
          )}
        </header>

        {/* Today / this month strip */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatTile
            label="Today"
            value={todayEvents.length === 0 ? "Nothing on the calendar" : todayEvents.map((e) => e.title).join(" · ")}
            icon={<CalendarIcon className="size-4" />}
          />
          <StatTile
            label="This month"
            value={`${thisMonth.length} event${thisMonth.length === 1 ? "" : "s"}`}
            icon={<CalendarIcon className="size-4" />}
          />
          <StatTile
            label="New updates"
            value={`${updates.filter((u) => u.published).length} posted`}
            icon={<Megaphone className="size-4" />}
          />
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <section className="space-y-4">
            <SectionHeader icon={<Sparkles className="size-4" />} title="Highlights" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {highlights.map((h) => (
                <Card
                  key={h.id}
                  className="overflow-hidden rounded-2xl border-border/70 bg-card p-0 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {h.image_url && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      <img src={h.image_url} alt={h.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-semibold tracking-tight">{h.title}</h3>
                    {h.body && <p className="text-sm text-muted-foreground leading-relaxed">{h.body}</p>}
                    {h.link_url && (
                      <a
                        href={h.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Learn more <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Updates */}
          <section className="space-y-4">
            <SectionHeader icon={<Megaphone className="size-4" />} title="Company Updates" />
            {loading && updates.length === 0 ? (
              <SkeletonList />
            ) : updates.length === 0 ? (
              <EmptyBlock text="No updates yet." />
            ) : (
              <div className="space-y-4">
                {updates.filter((u) => u.published || canManage).map((u) => (
                  <Card key={u.id} className="rounded-2xl border-border/70 bg-card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {u.pinned && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Pin className="size-3" /> Pinned
                            </Badge>
                          )}
                          {!u.published && (
                            <Badge variant="outline" className="text-[10px]">Draft</Badge>
                          )}
                          <h3 className="text-base font-semibold tracking-tight truncate">
                            {u.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(safeDate(u.published_at), "MMM d, yyyy")}
                          {u.author_name ? ` · ${u.author_name}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                      {u.body}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Calendar */}
          <section className="space-y-4">
            <SectionHeader icon={<CalendarIcon className="size-4" />} title="Company Calendar" />
            {loading && events.length === 0 ? (
              <SkeletonList />
            ) : events.length === 0 ? (
              <EmptyBlock text="No upcoming events." />
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/60">
                {grouped.map((g) => (
                  <div key={g.label} className="p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                      {g.label}
                    </p>
                    <ul className="space-y-3">
                      {g.items.map((ev) => (
                        <li key={ev.id} className="flex items-start gap-3">
                          <div className="w-14 shrink-0 text-center rounded-xl bg-muted/60 border border-border/60 py-2">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {format(safeDate(ev.starts_on), "MMM")}
                            </p>
                            <p className="text-lg font-semibold text-foreground tabular-nums">
                              {format(safeDate(ev.starts_on), "d")}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {ev.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ev.all_day
                                ? "All day"
                                : format(safeDate(ev.starts_on), "h:mma")}
                              {ev.location ? ` · ${ev.location}` : ""}
                              {ev.category && ev.category !== "company_event"
                                ? ` · ${prettyCategory(ev.category)}`
                                : ""}
                            </p>
                            {ev.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </OSShell>
  );
}

function prettyCategory(c: string): string {
  return c.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <h2 className="text-sm font-medium uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-2 text-sm text-foreground truncate">{value}</p>
    </Card>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
      ))}
    </div>
  );
}