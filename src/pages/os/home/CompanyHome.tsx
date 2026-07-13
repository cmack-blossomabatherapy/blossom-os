import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Megaphone, Sparkles, Pin, Settings, ExternalLink } from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCompanyHome, useCanManageCompanyHome, type CompanyCalendarEvent } from "@/hooks/useCompanyHome";
import { useAuth } from "@/contexts/AuthContext";

function safeDate(d: string): Date {
  return parseISO(d);
}

export default function CompanyHome() {
  const { events, updates, highlights, loading } = useCompanyHome();
  const canManage = useCanManageCompanyHome();
  const { displayName } = useAuth();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [month, setMonth] = useState<Date>(today);

  const eventDays = useMemo(
    () => events.map((e) => startOfDay(safeDate(e.starts_on))),
    [events],
  );

  const selectedDayEvents = useMemo(
    () => events.filter((e) => isSameDay(safeDate(e.starts_on), selectedDate)),
    [events, selectedDate],
  );

  const upNext = useMemo(() => {
    const now = today.getTime();
    return [...events]
      .filter((e) => safeDate(e.starts_on).getTime() >= now)
      .sort((a, b) => safeDate(a.starts_on).getTime() - safeDate(b.starts_on).getTime())
      .slice(0, 5);
  }, [events, today]);

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

        {/* Calendar hero */}
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-2xl border-border/70 bg-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4" />
                <h2 className="text-sm font-medium uppercase tracking-widest">Company Calendar</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => {
                  setSelectedDate(today);
                  setMonth(today);
                }}
              >
                Today
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              month={month}
              onMonthChange={setMonth}
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{
                hasEvent:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
              }}
              className={cn("pointer-events-auto w-full")}
            />
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {isSameDay(selectedDate, today) ? "Today" : "Selected"}
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-foreground mt-1">
                {format(selectedDate, "EEEE, MMM d")}
              </h3>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Nothing scheduled.
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedDayEvents.map((ev) => (
                  <EventRow key={ev.id} ev={ev} />
                ))}
              </ul>
            )}

            {upNext.length > 0 && (
              <div className="pt-4 border-t border-border/60">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  Up next
                </p>
                <ul className="space-y-3">
                  {upNext.map((ev) => (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={() => {
                          const d = startOfDay(safeDate(ev.starts_on));
                          setSelectedDate(d);
                          setMonth(d);
                        }}
                        className="w-full text-left flex items-start gap-3 rounded-xl p-2 -mx-2 hover:bg-muted transition"
                      >
                        <div className="w-12 shrink-0 text-center rounded-lg bg-muted/60 border border-border/60 py-1.5">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {format(safeDate(ev.starts_on), "MMM")}
                          </p>
                          <p className="text-base font-semibold text-foreground tabular-nums leading-tight">
                            {format(safeDate(ev.starts_on), "d")}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ev.all_day ? "All day" : format(safeDate(ev.starts_on), "h:mma")}
                            {ev.location ? ` · ${ev.location}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {loading && events.length === 0 && <SkeletonList />}
          </Card>
        </section>

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
      </div>
    </OSShell>
  );
}

function prettyCategory(c: string): string {
  return c.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function EventRow({ ev }: { ev: CompanyCalendarEvent }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 size-2 rounded-full bg-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
        <p className="text-xs text-muted-foreground">
          {ev.all_day ? "All day" : format(safeDate(ev.starts_on), "h:mma")}
          {ev.location ? ` · ${ev.location}` : ""}
          {ev.category && ev.category !== "company_event"
            ? ` · ${prettyCategory(ev.category)}`
            : ""}
        </p>
        {ev.description && (
          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
            {ev.description}
          </p>
        )}
      </div>
    </li>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <h2 className="text-sm font-medium uppercase tracking-widest">{title}</h2>
    </div>
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