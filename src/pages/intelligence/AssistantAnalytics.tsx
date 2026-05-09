import { useEffect, useMemo, useState } from "react";
import { Bot, MessageSquare, ThumbsUp, ThumbsDown, Wrench, BookOpen, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/shared/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

type Range = "7" | "30" | "90";

interface AssistantMessageRow {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  metadata: any;
}
interface FeedbackRow { message_id: string; vote: "up" | "down"; created_at: string; }

function startOf(range: Range): Date {
  const days = parseInt(range, 10);
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

export default function AssistantAnalytics() {
  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(true);
  const [assistantMsgs, setAssistantMsgs] = useState<AssistantMessageRow[]>([]);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const since = startOf(range).toISOString();

      const [aRes, uRes, fbRes, convRes] = await Promise.all([
        supabase.from("chat_messages")
          .select("id,conversation_id,content,created_at,metadata")
          .eq("role", "assistant")
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
        supabase.from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("role", "user")
          .gte("created_at", since),
        supabase.from("chat_message_feedback")
          .select("message_id,vote,created_at")
          .gte("created_at", since),
        supabase.from("chat_conversations")
          .select("id,user_id")
          .gte("last_message_at", since),
      ]);

      if (cancelled) return;
      const aMsgs = (aRes.data ?? []) as AssistantMessageRow[];
      setAssistantMsgs(aMsgs);
      setUserMsgCount(uRes.count ?? 0);
      setFeedback((fbRes.data ?? []) as FeedbackRow[]);
      const convs = (convRes.data ?? []) as { id: string; user_id: string }[];
      setConversationCount(convs.length);
      setUniqueUsers(new Set(convs.map((c) => c.user_id)).size);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [range]);

  const stats = useMemo(() => {
    const ups = feedback.filter((f) => f.vote === "up").length;
    const downs = feedback.filter((f) => f.vote === "down").length;
    const total = ups + downs;
    const successRate = total > 0 ? Math.round((ups / total) * 100) : null;
    const failures = assistantMsgs.filter(
      (m) => m.metadata?.success === false || /wasn't able/i.test(m.content),
    ).length;
    const failureRate = assistantMsgs.length > 0
      ? Math.round((failures / assistantMsgs.length) * 100)
      : 0;
    const latencies = assistantMsgs
      .map((m) => Number(m.metadata?.latency_ms))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;
    const coverage = assistantMsgs.length > 0
      ? Math.round((total / assistantMsgs.length) * 100)
      : 0;
    return { ups, downs, total, successRate, failures, failureRate, avgLatency, coverage };
  }, [feedback, assistantMsgs]);

  const dailySeries = useMemo(() => {
    const days = parseInt(range, 10);
    const buckets = new Map<string, { date: string; queries: number; success: number; failure: number }>();
    const start = startOf(range);
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, queries: 0, success: 0, failure: 0 });
    }
    for (const m of assistantMsgs) {
      const k = m.created_at.slice(0, 10);
      const b = buckets.get(k); if (!b) continue;
      b.queries++;
      if (m.metadata?.success === false || /wasn't able/i.test(m.content)) b.failure++;
      else b.success++;
    }
    return Array.from(buckets.values()).map((b) => ({
      ...b,
      label: b.date.slice(5),
    }));
  }, [assistantMsgs, range]);

  const topSources = useMemo(() => {
    const counts = new Map<string, { title: string; url?: string; count: number }>();
    for (const m of assistantMsgs) {
      const sources = (m.metadata?.sources ?? []) as { title: string; url?: string }[];
      for (const s of sources) {
        if (!s?.title) continue;
        const key = s.title;
        const existing = counts.get(key);
        if (existing) existing.count++;
        else counts.set(key, { title: s.title, url: s.url, count: 1 });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [assistantMsgs]);

  const topTools = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of assistantMsgs) {
      const tools = (m.metadata?.tools_used ?? []) as string[];
      for (const t of tools) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [assistantMsgs]);

  const recentDownvoted = useMemo(() => {
    const downIds = new Set(feedback.filter((f) => f.vote === "down").map((f) => f.message_id));
    return assistantMsgs.filter((m) => downIds.has(m.id)).slice(0, 8);
  }, [feedback, assistantMsgs]);

  return (
    <PageShell
      title="Assistant Analytics"
      description="Monitor Blossom Assistant adoption, answer quality, and most-cited knowledge."
      icon={<Bot className="h-5 w-5" />}
      actions={
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="7">7d</TabsTrigger>
            <TabsTrigger value="30">30d</TabsTrigger>
            <TabsTrigger value="90">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<MessageSquare className="h-4 w-4" />} label="Queries"
             value={assistantMsgs.length} hint={`${userMsgCount} user messages`} loading={loading} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Active users"
             value={uniqueUsers} hint={`${conversationCount} conversations`} loading={loading} />
        <Kpi icon={<ThumbsUp className="h-4 w-4" />} label="Success rate"
             value={stats.successRate === null ? "—" : `${stats.successRate}%`}
             hint={`${stats.ups}↑ / ${stats.downs}↓ · ${stats.coverage}% rated`} loading={loading} />
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Avg latency"
             value={stats.avgLatency === null ? "—" : `${(stats.avgLatency / 1000).toFixed(1)}s`}
             hint={`${stats.failures} unanswered (${stats.failureRate}%)`} loading={loading} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Queries per day</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="queries" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Queries" />
                  <Line type="monotone" dataKey="failure" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Unanswered" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Wrench className="h-4 w-4 text-muted-foreground" /> Tools used</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : topTools.length === 0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">No tool calls in this window.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTools} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><BookOpen className="h-4 w-4 text-muted-foreground" /> Top cited sources</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : topSources.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No sources cited yet in this window.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {topSources.map((s) => (
                  <li key={s.title} className="flex items-center justify-between gap-3 py-2 text-sm">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="truncate text-foreground hover:text-primary">{s.title}</a>
                    ) : (
                      <span className="truncate text-foreground">{s.title}</span>
                    )}
                    <Badge variant="secondary" className="shrink-0">{s.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><ThumbsDown className="h-4 w-4 text-muted-foreground" /> Recent downvoted answers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : recentDownvoted.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No downvotes yet — nice.</p>
            ) : (
              <ul className="space-y-3">
                {recentDownvoted.map((m) => (
                  <li key={m.id} className="rounded-lg border border-border/60 bg-card/40 p-3 text-xs">
                    <p className="line-clamp-3 text-foreground">{m.content}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(m.created_at).toLocaleString()}
                      {m.metadata?.tools_used?.length ? ` · ${m.metadata.tools_used.join(", ")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Kpi({ icon, label, value, hint, loading }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          {icon}{label}
        </div>
        <div className="mt-1 text-2xl font-semibold text-foreground">
          {loading ? <Skeleton className="h-7 w-20" /> : value}
        </div>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}