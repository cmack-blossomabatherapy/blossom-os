import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  format,
  parseISO,
  isSameDay,
  startOfDay,
  addDays,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  subMonths,
  addMonths,
  eachDayOfInterval,
  isWithinInterval,
} from "date-fns";
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
  Filter,
  X,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Grid3X3,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { MyTasksCard } from "./MyTasksCard";
import { MyGoalsCard } from "./MyGoalsCard";

function safeDate(d: string): Date {
  return parseISO(d);
}

type RangePreset = "all" | "7d" | "30d" | "month";

const RANGE_LABELS: Record<RangePreset, string> = {
  all: "All dates",
  "7d": "Next 7 days",
  "30d": "Next 30 days",
  month: "This month",
};

function formatCategory(c: string): string {
  return c
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// Deterministic color assignment per event category. Known categories get
// hand-picked hues; unknown ones fall back to a stable hash-based palette so
// the legend and event dots always agree.
const CATEGORY_COLORS: Record<string, { dot: string; label: string }> = {
  company_event: { dot: "bg-primary", label: "Company event" },
  holiday: { dot: "bg-rose-500", label: "Holiday / PTO" },
  pto: { dot: "bg-rose-400", label: "Holiday / PTO" },
  training: { dot: "bg-violet-500", label: "Training" },
  meeting: { dot: "bg-sky-500", label: "Meeting" },
  deadline: { dot: "bg-amber-500", label: "Deadline" },
  task: { dot: "bg-emerald-500", label: "Task" },
  qa_review: { dot: "bg-fuchsia-500", label: "QA review" },
  scheduling: { dot: "bg-teal-500", label: "Scheduling" },
  hr: { dot: "bg-orange-500", label: "HR" },
  onboarding: { dot: "bg-lime-500", label: "Onboarding" },
  finance: { dot: "bg-yellow-500", label: "Finance" },
};
const FALLBACK_PALETTE = [
  "bg-slate-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-emerald-600",
  "bg-amber-600",
];
export function categoryColor(category: string | null | undefined): string {
  if (!category) return "bg-primary";
  const known = CATEGORY_COLORS[category];
  if (known) return known.dot;
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

export default function CompanyHome() {
  const { events, updates, highlights, loading } = useCompanyHome();
  const canManage = useCanManageCompanyHome();
  const { displayName } = useAuth();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [month, setMonth] = useState<Date>(today);
  const [view, setView] = useState<"month" | "week">("month");
  const [openEvent, setOpenEvent] = useState<CompanyCalendarEvent | null>(null);
  const [dayDrawer, setDayDrawer] = useState<{ date: Date; category: string | null } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [rangePreset, setRangePreset] = useState<RangePreset>("all");
  const [jumpOpen, setJumpOpen] = useState(false);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      if (ev.category) set.add(ev.category);
    }
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = today.getTime();
    let rangeStart: number | null = null;
    let rangeEnd: number | null = null;
    if (rangePreset === "7d") {
      rangeStart = now;
      rangeEnd = addDays(today, 7).getTime();
    } else if (rangePreset === "30d") {
      rangeStart = now;
      rangeEnd = addDays(today, 30).getTime();
    } else if (rangePreset === "month") {
      rangeStart = startOfMonth(month).getTime();
      rangeEnd = endOfMonth(month).getTime();
    }
    return events.filter((ev) => {
      if (categoryFilter.size > 0 && !categoryFilter.has(ev.category)) return false;
      if (rangeStart !== null && rangeEnd !== null) {
        const t = safeDate(ev.starts_on).getTime();
        if (t < rangeStart || t > rangeEnd) return false;
      }
      return true;
    });
  }, [events, categoryFilter, rangePreset, today, month]);

  // Index events once by yyyy-mm-dd for O(1) day lookups instead of
  // scanning the full list on every render / calendar cell.
  const { eventsByDay, eventDays, sortedFutureEvents } = useMemo(() => {
    const byDay = new Map<string, CompanyCalendarEvent[]>();
    const days: Date[] = [];
    const seen = new Set<string>();
    const sorted = [...filteredEvents].sort(
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
  }, [filteredEvents]);

  const toggleCategory = useCallback((cat: string) => {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setCategoryFilter(new Set());
    setRangePreset("all");
  }, []);

  const activeFilterCount =
    categoryFilter.size + (rangePreset !== "all" ? 1 : 0);

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

  const goPrevious = useCallback(() => {
    if (view === "week") {
      const prevWeek = subWeeks(month, 1);
      setMonth(prevWeek);
      setSelectedDate(prevWeek);
    } else {
      const prevMonth = subMonths(month, 1);
      setMonth(prevMonth);
      setSelectedDate(prevMonth);
    }
  }, [view, month]);

  const goNext = useCallback(() => {
    if (view === "week") {
      const nextWeek = addWeeks(month, 1);
      setMonth(nextWeek);
      setSelectedDate(nextWeek);
    } else {
      const nextMonth = addMonths(month, 1);
      setMonth(nextMonth);
      setSelectedDate(nextMonth);
    }
  }, [view, month]);

  const jumpToDate = useCallback((d: Date) => {
    const normalized = startOfDay(d);
    setSelectedDate(normalized);
    setMonth(normalized);
    setJumpOpen(false);
  }, []);

  const weekRange = useMemo(() => {
    const start = startOfWeek(month, { weekStartsOn: 0 });
    const end = endOfWeek(month, { weekStartsOn: 0 });
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [month]);

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
        <section className="grid gap-6 items-start lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          {/* Colorful blossom-petal frame around the calendar */}
          <div
            className="relative min-w-0 rounded-[28px] p-[1.5px] shadow-[0_20px_60px_-30px_hsl(189_50%_45%/0.35)]"
            style={{
              backgroundImage:
                "conic-gradient(from 210deg at 50% 50%, hsl(189 55% 58% / 0.55), hsl(280 60% 70% / 0.5), hsl(330 75% 72% / 0.55), hsl(20 85% 68% / 0.5), hsl(45 90% 65% / 0.5), hsl(160 55% 60% / 0.5), hsl(189 55% 58% / 0.55))",
            }}
          >
            <Card className="relative overflow-hidden rounded-[26px] border-0 bg-card/95 backdrop-blur p-4 sm:p-6 md:p-9 min-h-[560px] flex flex-col">
              {/* Soft petal glow backdrop */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full opacity-60 blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(330 75% 72% / 0.45), transparent 65%)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full opacity-60 blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(189 55% 58% / 0.4), transparent 65%)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(45 90% 65% / 0.35), transparent 70%)" }}
              />

            <div className="relative flex flex-col gap-4 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarIcon className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80" style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
                      Company Calendar
                    </p>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
                      {view === "week"
                        ? `${format(weekRange.start, "MMM d")} – ${format(weekRange.end, "MMM d, yyyy")}`
                        : format(month, "MMMM yyyy")}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={view}
                    onValueChange={(v) => v && setView(v as "month" | "week")}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <ToggleGroupItem
                      value="month"
                      aria-label="Month view"
                      className="h-8 px-2.5 rounded-l-full rounded-r-none text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <Grid3X3 className="size-3.5 mr-1" /> Month
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="week"
                      aria-label="Week view"
                      className="h-8 px-2.5 rounded-l-none rounded-r-full text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <CalendarDays className="size-3.5 mr-1" /> Week
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-full p-0"
                      onClick={goPrevious}
                      aria-label="Previous period"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 rounded-full p-0"
                      onClick={goNext}
                      aria-label="Next period"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>

                  <Popover open={jumpOpen} onOpenChange={setJumpOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-xs gap-1.5"
                      >
                        <CalendarIcon className="size-3.5" />
                        Jump
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => d && jumpToDate(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full text-xs"
                    onClick={goToday}
                  >
                    Today
                  </Button>

                  <Select value={rangePreset} onValueChange={(v) => setRangePreset(v as RangePreset)}>
                    <SelectTrigger className="h-8 rounded-full text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RANGE_LABELS) as RangePreset[]).map((k) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {RANGE_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-xs gap-1.5"
                        disabled={availableCategories.length === 0}
                      >
                        <Filter className="size-3.5" />
                        Types
                        {categoryFilter.size > 0 && (
                          <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                            {categoryFilter.size}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                        Filter by type
                      </div>
                      <div className="max-h-64 overflow-auto space-y-0.5">
                        {availableCategories.map((cat) => {
                          const checked = categoryFilter.has(cat);
                          return (
                            <label
                              key={cat}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleCategory(cat)}
                              />
                              <span className="truncate">{formatCategory(cat)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full text-xs gap-1"
                      onClick={clearFilters}
                    >
                      <X className="size-3.5" />
                      Clear
                    </Button>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label="Event legend"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
                      >
                        <HelpCircle className="size-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                        Event legend
                      </p>
                      <ul className="space-y-1.5">
                        {(() => {
                          const seen = new Set<string>();
                          const rows: Array<{ key: string; label: string; dot: string }> = [];
                          const add = (cat: string, label?: string) => {
                            const known = CATEGORY_COLORS[cat];
                            const lbl = label ?? known?.label ?? formatCategory(cat);
                            if (seen.has(lbl)) return;
                            seen.add(lbl);
                            rows.push({ key: cat, label: lbl, dot: categoryColor(cat) });
                          };
                          // Always include core defaults so the legend never looks empty.
                          ["company_event", "training", "meeting", "deadline", "task", "holiday"].forEach((c) => add(c));
                          availableCategories.forEach((c) => add(c));
                          return rows.map((r) => (
                            <li key={r.key} className="flex items-center gap-2 text-sm">
                              <span className={cn("size-2.5 rounded-full", r.dot)} />
                              <span className="text-foreground">{r.label}</span>
                            </li>
                          ));
                        })()}
                      </ul>
                      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
                        Dots on days show that events are scheduled. Click a day to see details.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="relative flex flex-wrap gap-1.5 mb-3">
                {rangePreset !== "all" && (
                  <Badge variant="secondary" className="rounded-full text-[11px] gap-1">
                    {RANGE_LABELS[rangePreset]}
                    <button
                      type="button"
                      onClick={() => setRangePreset("all")}
                      className="hover:opacity-70"
                      aria-label="Clear date range"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}
                {Array.from(categoryFilter).map((cat) => (
                  <Badge key={cat} variant="secondary" className="rounded-full text-[11px] gap-1">
                    {formatCategory(cat)}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="hover:opacity-70"
                      aria-label={`Remove ${cat} filter`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {view === "month" ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                month={month}
                onMonthChange={setMonth}
                modifiers={{ hasEvent: eventDays }}
                classNames={{
                  months: "flex flex-col w-full",
                  month: "space-y-4 w-full",
                  caption: "hidden",
                  nav: "hidden",
                  table: "w-full border-collapse",
                  head_row: "grid grid-cols-7 w-full",
                  head_cell:
                    "text-muted-foreground/80 font-semibold text-[11px] uppercase tracking-[0.18em] h-9 flex items-center justify-center",
                  row: "grid grid-cols-7 w-full mt-1.5",
                  cell: "h-12 sm:h-14 md:h-16 lg:h-[84px] xl:h-[92px] w-full text-center p-0.5 relative focus-within:relative focus-within:z-20",
                  day: "h-full w-full rounded-2xl font-medium text-sm md:text-base hover:bg-muted/70 transition-all duration-200 aria-selected:opacity-100",
                  day_selected:
                    "bg-gradient-to-br from-primary to-[hsl(189_55%_58%)] text-primary-foreground shadow-[0_8px_20px_-8px_hsl(189_50%_45%/0.6)] hover:from-primary hover:to-[hsl(189_55%_58%)] hover:text-primary-foreground",
                  day_today:
                    "ring-2 ring-primary/40 ring-offset-2 ring-offset-card text-foreground font-semibold",
                  day_outside: "text-muted-foreground/30",
                }}
                components={{
                  DayContent: ({ date }) => {
                    const key = format(date, "yyyy-MM-dd");
                    const dayEvents = eventsByDay.get(key);
                    const label = <span className="tabular-nums">{date.getDate()}</span>;
                    if (!dayEvents || dayEvents.length === 0) {
                      return (
                        <span className="flex h-full w-full items-center justify-center">
                          {label}
                        </span>
                      );
                    }
                    // Group by category for the summary line.
                    const byCat = new Map<string, number>();
                    for (const ev of dayEvents) {
                      const c = ev.category || "company_event";
                      byCat.set(c, (byCat.get(c) ?? 0) + 1);
                    }
                    // Distinct category colors as multi-dots (max 3).
                    const dotCats = Array.from(byCat.keys()).slice(0, 3);
                    const extra = dayEvents.length > dotCats.length ? dayEvents.length - dotCats.reduce((a, c) => a + (byCat.get(c) ?? 0), 0) : 0;
                    return (
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <span className="relative flex h-full w-full flex-col items-center justify-center gap-0.5">
                            {label}
                            <span className="flex items-center gap-[3px] absolute bottom-1.5">
                              {dotCats.map((c) => (
                                <span
                                  key={c}
                                  className={cn(
                                    "size-1.5 rounded-full ring-1 ring-card",
                                    categoryColor(c),
                                  )}
                                />
                              ))}
                              {extra > 0 && (
                                <span className="text-[8px] font-semibold text-muted-foreground ml-0.5">
                                  +
                                </span>
                              )}
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3">
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
                            {format(date, "EEE, MMM d")} · {dayEvents.length} event
                            {dayEvents.length === 1 ? "" : "s"}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {Array.from(byCat.entries()).map(([cat, count]) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(date);
                                  setDayDrawer({ date, category: cat });
                                }}
                                className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] hover:bg-primary/10 hover:text-primary transition"
                              >
                                <span className={cn("size-1.5 rounded-full", categoryColor(cat))} />
                                {CATEGORY_COLORS[cat]?.label ?? formatCategory(cat)}
                                <span className="text-muted-foreground">· {count}</span>
                              </button>
                            ))}
                          </div>
                          <ul className="space-y-1">
                            {dayEvents.slice(0, 3).map((ev) => (
                              <li key={ev.id} className="flex items-start gap-2 text-xs">
                                <span className={cn("mt-1 size-1.5 rounded-full shrink-0", categoryColor(ev.category))} />
                                <span className="min-w-0">
                                  <span className="font-medium text-foreground">{ev.title}</span>
                                  <span className="text-muted-foreground">
                                    {" · "}
                                    {ev.all_day ? "All day" : format(safeDate(ev.starts_on), "h:mma")}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                          {dayEvents.length > 3 && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  },
                }}
                className={cn("pointer-events-auto w-full relative")}
              />
            ) : (
              <WeekView
                days={weekRange.days}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                eventsByDay={eventsByDay}
                onOpenEvent={setOpenEvent}
                onOpenDayDrawer={(date, category) => setDayDrawer({ date, category })}
              />
            )}
            </Card>
          </div>

          <Card className="relative overflow-hidden rounded-[26px] border-border/60 bg-card p-5 sm:p-6 md:p-7 space-y-5 min-w-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full opacity-70 blur-2xl"
              style={{ background: "radial-gradient(circle, hsl(20 85% 68% / 0.28), transparent 70%)" }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80" style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
                  {isSameDay(selectedDate, today) ? "Today" : "Selected day"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
                  {format(selectedDate, "EEEE")}
                </h3>
                <p className="text-sm text-muted-foreground">{format(selectedDate, "MMMM d, yyyy")}</p>
              </div>
              <div className="text-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-[hsl(330_75%_72%/0.15)] px-3 py-2 min-w-[64px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/80">
                  {format(selectedDate, "MMM")}
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums leading-none mt-0.5" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
                  {format(selectedDate, "d")}
                </p>
              </div>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="relative rounded-2xl border border-dashed border-border/70 bg-muted/40 p-8 text-center">
                <div className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-[hsl(330_75%_72%/0.2)]">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enjoy the calm — or get a head start on what's next.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-full h-8 text-xs">
                    <Link to="/tasks">Open my tasks</Link>
                  </Button>
                  {canManage && (
                    <Button asChild size="sm" className="rounded-full h-8 text-xs">
                      <Link to="/home/manage">Add event</Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="relative space-y-2">
                {selectedDayEvents.map((ev) => (
                  <EventRow key={ev.id} ev={ev} onOpen={setOpenEvent} />
                ))}
              </ul>
            )}

            {upNext.length > 0 ? (
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
            ) : (
              !loading && (
                <div className="pt-4 border-t border-border/60">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Up next
                  </p>
                  <div className="rounded-2xl bg-gradient-to-br from-primary/[0.06] to-[hsl(330_75%_72%/0.08)] border border-border/60 p-5 text-center">
                    <div className="mx-auto mb-2 inline-flex size-9 items-center justify-center rounded-full bg-card shadow-sm">
                      <CalendarIcon className="size-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      You're all caught up
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      No upcoming company events on the calendar.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {canManage ? (
                        <Button asChild size="sm" className="rounded-full h-8 text-xs">
                          <Link to="/home/manage">Add company event</Link>
                        </Button>
                      ) : (
                        <>
                          <Button asChild size="sm" variant="outline" className="rounded-full h-8 text-xs">
                            <Link to="/tasks">Open my tasks</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="rounded-full h-8 text-xs">
                            <Link to="/goals">View my goals</Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {loading && events.length === 0 && <SkeletonList />}
          </Card>
        </section>

        <EventDetailDrawer
          event={openEvent}
          onClose={() => setOpenEvent(null)}
          canManage={canManage}
        />

        <DayEventsDrawer
          state={dayDrawer}
          onClose={() => setDayDrawer(null)}
          eventsByDay={eventsByDay}
          onOpenEvent={(ev) => {
            setOpenEvent(ev);
            setDayDrawer(null);
          }}
        />

        {/* Personal workspace: tasks + goals */}
        <section className="grid gap-6 lg:grid-cols-2">
          <MyTasksCard />
          <MyGoalsCard />
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

function WeekView({
  days,
  selectedDate,
  onSelectDate,
  eventsByDay,
  onOpenEvent,
  onOpenDayDrawer,
}: {
  days: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  eventsByDay: Map<string, CompanyCalendarEvent[]>;
  onOpenEvent: (ev: CompanyCalendarEvent) => void;
  onOpenDayDrawer: (date: Date, category: string | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const selected = isSameDay(day, selectedDate);
          const today = isSameDay(day, new Date());
          const byCat = new Map<string, number>();
          for (const ev of dayEvents) {
            const c = ev.category || "company_event";
            byCat.set(c, (byCat.get(c) ?? 0) + 1);
          }
          const dotCats = Array.from(byCat.keys()).slice(0, 3);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex flex-col items-center justify-start rounded-2xl border p-2 transition-all duration-200 min-h-[92px]",
                selected
                  ? "border-primary/40 bg-gradient-to-b from-primary/10 to-primary/5 shadow-[0_8px_20px_-8px_hsl(189_50%_45%/0.35)]"
                  : "border-border/60 bg-card hover:bg-muted/60",
                today && !selected && "ring-2 ring-primary/40 ring-offset-1 ring-offset-card"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-xl font-semibold tabular-nums",
                  selected ? "text-primary" : "text-foreground"
                )}
                style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
              >
                {format(day, "d")}
              </span>
              <span className="mt-auto flex flex-wrap items-center justify-center gap-1">
                {dotCats.map((c) => (
                  <span
                    key={c}
                    className={cn("size-2 rounded-full ring-1 ring-card", categoryColor(c))}
                  />
                ))}
                {dayEvents.length > dotCats.length && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    +{dayEvents.length - dotCats.length}
                  </span>
                )}
              </span>
              {dayEvents.length > 0 && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold text-muted-foreground tabular-nums">
                  {dayEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            {format(selectedDate, "EEEE, MMMM d")}
          </p>
          {eventsByDay.get(format(selectedDate, "yyyy-MM-dd"))?.length ? (
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {eventsByDay.get(format(selectedDate, "yyyy-MM-dd"))!.length} event
              {eventsByDay.get(format(selectedDate, "yyyy-MM-dd"))!.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
        {eventsByDay.get(format(selectedDate, "yyyy-MM-dd"))?.length ? (
          <ul className="space-y-1">
            {eventsByDay.get(format(selectedDate, "yyyy-MM-dd"))!.map((ev) => (
              <EventRow key={ev.id} ev={ev} onOpen={onOpenEvent} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-foreground">Nothing scheduled</p>
            <p className="mt-1 text-xs text-muted-foreground">Select another day or switch to month view.</p>
          </div>
        )}
      </div>
    </div>
  );
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
        <div className={cn("mt-1 size-2 rounded-full shrink-0", categoryColor(ev.category))} />
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

function DayEventsDrawer({
  state,
  onClose,
  eventsByDay,
  onOpenEvent,
}: {
  state: { date: Date; category: string | null } | null;
  onClose: () => void;
  eventsByDay: Map<string, CompanyCalendarEvent[]>;
  onOpenEvent: (ev: CompanyCalendarEvent) => void;
}) {
  if (!state) return null;
  const key = format(state.date, "yyyy-MM-dd");
  const all = eventsByDay.get(key) ?? [];
  const filtered = state.category
    ? all.filter((e) => (e.category || "company_event") === state.category)
    : all;
  const typeLabel = state.category
    ? CATEGORY_COLORS[state.category]?.label ?? formatCategory(state.category)
    : "All events";
  return (
    <Sheet open={!!state} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>{format(state.date, "EEEE, MMM d")}</SheetTitle>
          <SheetDescription>
            <span className="inline-flex items-center gap-1.5">
              {state.category && (
                <span className={cn("size-2 rounded-full", categoryColor(state.category))} />
              )}
              {typeLabel} · {filtered.length} event{filtered.length === 1 ? "" : "s"}
            </span>
          </SheetDescription>
        </SheetHeader>
        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Nothing scheduled.
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {filtered.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onOpenEvent(ev)}
                  className="w-full text-left flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 hover:bg-muted/40 transition"
                >
                  <div className={cn("mt-1 size-2 rounded-full shrink-0", categoryColor(ev.category))} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.all_day ? "All day" : format(safeDate(ev.starts_on), "h:mma")}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                    {ev.owner_name && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Owner · {ev.owner_name}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
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