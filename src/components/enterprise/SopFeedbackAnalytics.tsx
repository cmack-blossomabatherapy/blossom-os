import { useMemo, useState } from "react";
import {
  ResponsiveSheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/responsive-sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, ThumbsDown, EyeOff, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { SopFeedbackRow } from "@/lib/sop/feedback";

type Range = "7" | "30" | "90";

export interface SopFeedbackSectionMeta {
  id: string;
  sopId: string;
  sopTitle: string;
  section: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: SopFeedbackRow[];
  sections: SopFeedbackSectionMeta[];
}

function startOf(range: Range): Date {
  const days = parseInt(range, 10);
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function dayKey(iso: string): string {
  // YYYY-MM-DD in local time
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDay(key: string) {
  const [, m, d] = key.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

export function SopFeedbackAnalytics({ open, onOpenChange, feedback, sections }: Props) {
  const [range, setRange] = useState<Range>("30");

  const sectionMeta = useMemo(() => {
    const map = new Map<string, SopFeedbackSectionMeta>();
    sections.forEach((s) => map.set(s.id, s));
    return map;
  }, [sections]);

  const filtered = useMemo(() => {
    const since = startOf(range).getTime();
    return feedback.filter((f) => new Date(f.updated_at).getTime() >= since);
  }, [feedback, range]);

  const totals = useMemo(() => {
    let up = 0, down = 0, nr = 0;
    filtered.forEach((f) => {
      if (f.vote === "up") up++;
      else if (f.vote === "down") down++;
      else if (f.vote === "not_relevant") nr++;
    });
    return { up, down, nr, total: up + down + nr };
  }, [filtered]);

  const series = useMemo(() => {
    const days = parseInt(range, 10);
    const start = startOf(range);
    const buckets: { key: string; date: string; up: number; down: number; not_relevant: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = dayKey(d.toISOString());
      buckets.push({ key, date: shortDay(key), up: 0, down: 0, not_relevant: 0 });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    filtered.forEach((f) => {
      const i = idx.get(dayKey(f.updated_at));
      if (i === undefined) return;
      buckets[i][f.vote] += 1;
    });
    return buckets;
  }, [filtered, range]);

  const bySection = useMemo(() => {
    const map = new Map<string, { up: number; down: number; not_relevant: number }>();
    filtered.forEach((f) => {
      const cur = map.get(f.section_id) ?? { up: 0, down: 0, not_relevant: 0 };
      cur[f.vote] += 1;
      map.set(f.section_id, cur);
    });
    return Array.from(map.entries())
      .map(([sectionId, counts]) => ({
        sectionId,
        meta: sectionMeta.get(sectionId),
        ...counts,
        total: counts.up + counts.down + counts.not_relevant,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, sectionMeta]);

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      desktopClassName="w-full sm:max-w-3xl flex flex-col"
      mobileClassName="flex flex-col"
    >
      <SheetHeader className="space-y-1 border-b border-border/60 px-5 pb-3 pt-4 text-left">
        <Badge variant="outline" className="w-fit gap-1 text-[10px]">
          <BarChart3 className="h-3 w-3" /> Feedback analytics
        </Badge>
        <SheetTitle className="text-base font-semibold">Search result feedback</SheetTitle>
        <SheetDescription className="text-xs">
          How the team is rating SOP search results — over time and by section.
        </SheetDescription>
        <div className="pt-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList className="h-8">
              <TabsTrigger value="7" className="text-xs">7d</TabsTrigger>
              <TabsTrigger value="30" className="text-xs">30d</TabsTrigger>
              <TabsTrigger value="90" className="text-xs">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-5 py-5">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              icon={<ThumbsUp className="h-3.5 w-3.5" />}
              label="Helpful"
              value={totals.up}
              total={totals.total}
              tone="primary"
            />
            <SummaryCard
              icon={<ThumbsDown className="h-3.5 w-3.5" />}
              label="Not helpful"
              value={totals.down}
              total={totals.total}
              tone="destructive"
            />
            <SummaryCard
              icon={<EyeOff className="h-3.5 w-3.5" />}
              label="Not relevant"
              value={totals.nr}
              total={totals.total}
              tone="muted"
            />
          </div>

          {/* Time series */}
          <Card className="border-border/50 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">Votes over time</div>
                <div className="text-[11px] text-muted-foreground">{totals.total} total in last {range}d</div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="up" name="Helpful" stackId="v" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="down" name="Not helpful" stackId="v" fill="hsl(var(--destructive))" />
                    <Bar dataKey="not_relevant" name="Not relevant" stackId="v" fill="hsl(var(--muted-foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* By section */}
          <Card className="border-border/50 bg-card/60">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium">By SOP section</div>
                <div className="text-[11px] text-muted-foreground">{bySection.length} section{bySection.length === 1 ? "" : "s"}</div>
              </div>
              {bySection.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No feedback in this range yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {bySection.map((row) => {
                    const max = Math.max(1, row.total);
                    const upPct = (row.up / max) * 100;
                    const downPct = (row.down / max) * 100;
                    const nrPct = (row.not_relevant / max) * 100;
                    return (
                      <div
                        key={row.sectionId}
                        className="rounded-lg border border-border/50 bg-background/40 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {row.meta?.sopTitle ?? "Unknown SOP"}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              § {row.meta?.section ?? row.sectionId.slice(0, 8)}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
                            <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                              <ThumbsUp className="h-3 w-3 text-primary" /> {row.up}
                            </Badge>
                            <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                              <ThumbsDown className="h-3 w-3 text-destructive" /> {row.down}
                            </Badge>
                            <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
                              <EyeOff className="h-3 w-3 text-muted-foreground" /> {row.not_relevant}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          {upPct > 0 && <div style={{ width: `${upPct}%` }} className="bg-primary" />}
                          {downPct > 0 && <div style={{ width: `${downPct}%` }} className="bg-destructive" />}
                          {nrPct > 0 && <div style={{ width: `${nrPct}%` }} className="bg-muted-foreground/60" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </ResponsiveSheet>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  total,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  tone: "primary" | "destructive" | "muted";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "destructive"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-3">
      <div className={`flex items-center gap-1.5 text-[11px] ${toneClass}`}>
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-xl font-semibold">{value}</div>
        <div className="text-[11px] text-muted-foreground">{pct}%</div>
      </div>
    </div>
  );
}