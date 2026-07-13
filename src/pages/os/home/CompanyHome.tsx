import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isSameDay, startOfDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  Megaphone,
  Sparkles,
  Pin,
  Settings,
  ExternalLink,
  User,
  MapPin,
  ArrowRight,
  Link2,
  Download,
  Copy,
  Pencil,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCompanyHome, useCanManageCompanyHome, type CompanyCalendarEvent } from "@/hooks/useCompanyHome";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [openEvent, setOpenEvent] = useState<CompanyCalendarEvent | null>(null);

  // Index events once by yyyy-mm-dd for O(1) day lookups instead of
  // scanning the full list on every render / calendar cell.
  const { eventsByDay, eventDays, sortedFutureEvents } = useMemo(() => {
    const byDay = new Map<string, CompanyCalendarEvent[]>();
    const days: Date[] = [];
    const seen = new Set<string>();
    const sorted = [...events].sort(
      (a, b) => safeDate(a.starts_on).getTime() - safeDate(b.starts_on).getTime(),
    );
    for (const ev of sorted) {
      const key = ev.starts_on.slice(0, 10);
      const list = byDay.get(key);
      if (list) list.push(ev);
      else byDay.set(key, [ev]);
      if (!seen.has(key)) {
        seen.add(key);
        days.push(startOfDay(safeDate(ev.starts_on)));
      }
    }
    return { eventsByDay: byDay, eventDays: days, sortedFutureEvents: sorted };
  }, [events]);

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = eventsByDay.get(selectedKey) ?? [];

  const upNext = useMemo(() => {
    const now = today.getTime();
    const out: CompanyCalendarEvent[] = [];
    for (const ev of sortedFutureEvents) {
      if (safeDate(ev.starts_on).getTime() >= now) {
        out.push(ev);
        if (out.length === 5) break;
      }
    }
    return out;
  }, [sortedFutureEvents, today]);

  const goToday = useCallback(() => {
    setSelectedDate(today);
    setMonth(today);
  }, [today]);

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
                  <EventRow key={ev.id} ev={ev} onOpen={setOpenEvent} />
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
                          setOpenEvent(ev);
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

        <EventDetailDrawer
          event={openEvent}
          onClose={() => setOpenEvent(null)}
          canManage={canManage}
        />

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

function EventRow({
  ev,
  onOpen,
}: {
  ev: CompanyCalendarEvent;
  onOpen: (ev: CompanyCalendarEvent) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(ev)}
        className="w-full text-left flex items-start gap-3 rounded-xl p-2 -mx-2 hover:bg-muted transition"
      >
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
          {ev.owner_name && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Owner · {ev.owner_name}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}

/* ---------------- Event detail drawer ---------------- */

function relatedRecordHref(ev: CompanyCalendarEvent): string | null {
  if (ev.related_url) return ev.related_url;
  const type = (ev.related_record_type ?? "").toLowerCase();
  const id = ev.related_record_id;
  if (!type || !id) return null;
  switch (type) {
    case "lead":            return `/os/leads?lead=${encodeURIComponent(id)}`;
    case "client":          return `/os/clients?client=${encodeURIComponent(id)}`;
    case "authorization":
    case "auth":            return `/os/authorizations?authId=${encodeURIComponent(id)}`;
    case "task":            return `/os/work-queue?selected=${encodeURIComponent(id)}`;
    case "candidate":       return `/os/recruiting?candidate=${encodeURIComponent(id)}`;
    case "employee":        return `/user-management?user=${encodeURIComponent(id)}`;
    default:                return null;
  }
}

function buildIcs(ev: CompanyCalendarEvent): string {
  const dt = (s: string) => s.replace(/-/g, "");
  const end = ev.ends_on ?? ev.starts_on;
  const uid = `${ev.id}@blossom-os`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Blossom OS//Company Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dt(ev.starts_on)}`,
    `DTEND;VALUE=DATE:${dt(end)}`,
    `SUMMARY:${esc(ev.title)}`,
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function EventDetailDrawer({
  event,
  onClose,
  canManage,
}: {
  event: CompanyCalendarEvent | null;
  onClose: () => void;
  canManage: boolean;
}) {
  const relatedHref = event ? relatedRecordHref(event) : null;

  const copyLink = async () => {
    if (!event) return;
    const url = `${window.location.origin}/home?event=${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Event link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const downloadIcs = () => {
    if (!event) return;
    const blob = new Blob([buildIcs(event)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/[^\w-]+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {event && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2 mb-1">
                {event.category && event.category !== "company_event" && (
                  <Badge variant="secondary" className="text-[10px]">
                    {prettyCategory(event.category)}
                  </Badge>
                )}
                {event.all_day && (
                  <Badge variant="outline" className="text-[10px]">All day</Badge>
                )}
              </div>
              <SheetTitle className="text-xl tracking-tight">{event.title}</SheetTitle>
              <SheetDescription>
                {format(safeDate(event.starts_on), "EEEE, MMM d, yyyy")}
                {event.ends_on && event.ends_on !== event.starts_on
                  ? ` – ${format(safeDate(event.ends_on), "MMM d, yyyy")}`
                  : ""}
                {!event.all_day ? ` · ${format(safeDate(event.starts_on), "h:mma")}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              {event.description && (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              )}

              <div className="rounded-xl border border-border/70 divide-y divide-border/60 text-sm">
                <DetailRow icon={<User className="size-4" />} label="Owner"
                  value={event.owner_name ?? "Unassigned"} />
                {event.location && (
                  <DetailRow icon={<MapPin className="size-4" />} label="Location"
                    value={event.location} />
                )}
                <DetailRow
                  icon={<Link2 className="size-4" />}
                  label="Related record"
                  value={
                    event.related_record_label ||
                    (event.related_record_type && event.related_record_id
                      ? `${prettyCategory(event.related_record_type)} · ${event.related_record_id.slice(0, 8)}`
                      : "None linked")
                  }
                  action={
                    relatedHref ? (
                      <Button asChild size="sm" variant="ghost" className="h-7 rounded-lg text-xs">
                        <Link to={relatedHref} onClick={onClose}>
                          Open <ExternalLink className="size-3 ml-1" />
                        </Link>
                      </Button>
                    ) : null
                  }
                />
                <DetailRow
                  icon={<ArrowRight className="size-4" />}
                  label="Next step"
                  value={event.next_step ?? "—"}
                />
              </div>

              {/* Quick actions */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                  Quick actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {relatedHref && (
                    <Button asChild variant="outline" size="sm" className="rounded-lg justify-start">
                      <Link to={relatedHref} onClick={onClose}>
                        <ExternalLink className="size-4" /> Open record
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg justify-start"
                    onClick={downloadIcs}
                  >
                    <Download className="size-4" /> Add to calendar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg justify-start"
                    onClick={copyLink}
                  >
                    <Copy className="size-4" /> Copy link
                  </Button>
                  {canManage && (
                    <Button asChild variant="outline" size="sm" className="rounded-lg justify-start">
                      <Link to={`/home/manage?event=${event.id}`} onClick={onClose}>
                        <Pencil className="size-4" /> Edit
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
      {action}
    </div>
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