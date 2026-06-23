import { useEffect, useMemo, useState } from "react";
import {
  Mail, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Forward, Reply,
  Archive, Calendar, MessageSquare, ShieldAlert, Tags, Send, Edit3,
  X, ExternalLink, Clock, Bell, UserCheck, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { MicrosoftIntegrationsCard } from "@/components/os/system/MicrosoftIntegrationsCard";
import {
  startOutlookOAuth, probeOutlookConnection, listUserOAuthConnections,
  type OAuthConnectionRow,
} from "@/lib/os/integrations/backend";
import {
  listItems, listRecommendations, listQueue, listAudit,
  syncAndAnalyze, fetchEmailBody, approveAction, queueAction,
  updateQueueStatus, classifyItemLocally,
  type EmailCommandItem, type EmailRecommendation, type EmailActionQueueRow,
  type EmailAuditRow,
} from "@/lib/os/emailCommand/client";
import { startHereScore } from "@/lib/os/emailCommand/routingRules";

function relTime(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 36e5);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function MetricTile({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "warn" | "ok" | "risk" }) {
  const toneCls = {
    default: "bg-card border-border",
    warn: "bg-amber-50 border-amber-200",
    ok: "bg-emerald-50 border-emerald-200",
    risk: "bg-rose-50 border-rose-200",
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneCls}`}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ConnectionBanner({ conn, onConnect, busy }: { conn: OAuthConnectionRow | null; onConnect: () => void; busy: boolean }) {
  const connected = conn?.status === "connected";
  if (connected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="size-4" />
          Microsoft 365 connected · {conn?.provider_email ?? "—"}
        </div>
        <Badge variant="outline" className="bg-white">Outlook · Teams · Calendar</Badge>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="size-4" />
        Connect Microsoft 365 to activate Email Command Center.
      </div>
      <Button size="sm" onClick={onConnect} disabled={busy}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
        Connect Outlook / Microsoft 365
      </Button>
    </div>
  );
}

interface Joined {
  item: EmailCommandItem;
  rec: EmailRecommendation | null;
}

function ItemCard({ joined, onAction, onView }: {
  joined: Joined;
  onAction: (kind: string, j: Joined, payload?: Record<string, any>) => void;
  onView: (j: Joined) => void;
}) {
  const { item, rec } = joined;
  const tag = rec?.workflow_tag ?? item.workflow_tag ?? "Operations";
  const owner = rec?.suggested_owner ?? item.suggested_owner ?? "—";
  const conf = rec?.confidence ?? 0;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{item.sender_name ?? item.sender_email ?? "Unknown"}</span>
            <span>·</span>
            <span>{relTime(item.received_at)}</span>
            {item.risk_level === "high" && (
              <Badge variant="destructive" className="ml-1">Risk</Badge>
            )}
            {item.urgency === "critical" && (
              <Badge variant="destructive">Critical</Badge>
            )}
          </div>
          <div className="mt-1 truncate text-sm font-medium">{item.subject ?? "(no subject)"}</div>
          {rec?.ai_summary && (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{rec.ai_summary}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline">{tag}</Badge>
          <span className="text-[11px] text-muted-foreground">→ {owner}</span>
          <span className="text-[11px] text-muted-foreground">conf {Math.round(conf * 100)}%</span>
        </div>
      </div>
      {rec?.recommended_action && (
        <div className="mt-3 rounded-lg bg-muted/40 p-2 text-xs">
          <span className="font-medium">Recommended:</span> {rec.recommended_action}
          {rec.reason && <span className="text-muted-foreground"> · {rec.reason}</span>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(joined)}>
          <Mail className="size-3.5" /> View Email
        </Button>
        {rec?.draft_text && (
          <Button size="sm" onClick={() => onAction("outlook_reply", joined, { comment: rec.draft_text })}>
            <Send className="size-3.5" /> Approve Draft Reply
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onAction("outlook_forward", joined)}>
          <Forward className="size-3.5" /> Delegate / Forward
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAction("teams_message", joined)}>
          <MessageSquare className="size-3.5" /> Teams
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAction("calendar_event", joined)}>
          <Calendar className="size-3.5" /> Calendar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("outlook_archive", joined)}>
          <Archive className="size-3.5" /> Archive
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("internal_reminder", joined)}>
          <Bell className="size-3.5" /> Remind Me
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}

export default function EmailCommandCenter() {
  const { user } = useAuth();
  const { role } = useOSRole();
  const isAdmin = role === "super_admin";
  const [conn, setConn] = useState<OAuthConnectionRow | null>(null);
  const [connBusy, setConnBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState<EmailCommandItem[]>([]);
  const [recs, setRecs] = useState<EmailRecommendation[]>([]);
  const [queue, setQueue] = useState<EmailActionQueueRow[]>([]);
  const [audit, setAudit] = useState<EmailAuditRow[]>([]);
  const [viewing, setViewing] = useState<{ joined: Joined; body?: string; loading: boolean } | null>(null);
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");

  async function refresh() {
    if (!user?.id) return;
    const [i, r, q, a, c] = await Promise.all([
      listItems(user.id), listRecommendations(user.id),
      listQueue(user.id), listAudit(user.id),
      listUserOAuthConnections(user.id),
    ]);
    setItems(i); setRecs(r); setQueue(q); setAudit(a);
    setConn(c.find((x) => x.integration_id === "ms365") ?? null);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const joined = useMemo<Joined[]>(() => {
    const byItem = new Map<string, EmailRecommendation>();
    for (const r of recs) byItem.set(r.email_command_item_id, r);
    return items.map((item) => ({ item, rec: byItem.get(item.id) ?? null }));
  }, [items, recs]);

  const startHere = useMemo(() => {
    return [...joined]
      .sort((a, b) => {
        const rA = classifyItemLocally(a.item);
        const rB = classifyItemLocally(b.item);
        return startHereScore({ routing: rB, receivedAt: b.item.received_at })
          - startHereScore({ routing: rA, receivedAt: a.item.received_at });
      })
      .slice(0, 3);
  }, [joined]);

  const needsCorey = joined.filter((j) => j.item.status === "needs_corey");
  const calendarItems = joined.filter((j) => (j.rec?.workflow_tag ?? j.item.workflow_tag) === "Calendar / Meeting");
  const pendingDrafts = queue.filter((q) => q.status === "pending_approval" && q.action_type === "outlook_reply");
  const pendingDelegations = queue.filter((q) => q.status === "pending_approval" && (q.action_type === "outlook_forward" || q.action_type === "teams_message"));

  const metrics = {
    unread: items.filter((i) => i.is_unread).length,
    needsCorey: needsCorey.length,
    canDelegate: joined.filter((j) => j.rec?.recommended_action?.toLowerCase().includes("forward") || j.rec?.recommended_action?.toLowerCase().includes("route")).length,
    waitingOn: 0, // surfaced from internal reminders in v1
    draftsReady: recs.filter((r) => !!r.draft_text).length,
    risks: items.filter((i) => i.risk_level === "high").length,
    calendarRequests: calendarItems.length,
    teamsDelegations: queue.filter((q) => q.action_type === "teams_message" && q.status === "pending_approval").length,
  };

  async function handleConnect() {
    setConnBusy(true);
    const res = await startOutlookOAuth();
    setConnBusy(false);
    if (res.error || !res.authorizeUrl) return toast.error(res.error ?? "Could not start Outlook OAuth");
    window.open(res.authorizeUrl, "outlook-oauth", "width=520,height=720");
  }

  async function handleSync() {
    setSyncing(true);
    const res = await syncAndAnalyze();
    setSyncing(false);
    if (!res.ok) return toast.error(res.error ?? "Sync failed");
    toast.success(`Synced ${res.received ?? 0} · analyzed ${res.analyzed ?? 0}`);
    refresh();
  }

  async function handleView(j: Joined) {
    setViewing({ joined: j, loading: true });
    const res = await fetchEmailBody(j.item.external_message_id);
    setViewing({ joined: j, loading: false, body: res.ok ? res.body : `Error: ${res.error}` });
  }

  async function handleAction(kind: string, j: Joined, payload: Record<string, any> = {}) {
    if (!user?.id) return;
    const q = await queueAction({
      itemId: j.item.id, recommendationId: j.rec?.id ?? null,
      userId: user.id, actionType: kind,
      payload: { ...payload, draft_text: j.rec?.draft_text ?? null },
    });
    if (!q) return toast.error("Could not queue action");
    toast.success("Queued — review below to approve");
    refresh();
  }

  async function handleApprove(queueId: string, edits?: Record<string, any>) {
    const res = await approveAction(queueId, edits);
    if (!res.ok) return toast.error(res.error ?? "Action failed");
    toast.success("Action sent");
    setEditingQueueId(null);
    refresh();
  }

  async function handleReject(queueId: string) {
    await updateQueueStatus(queueId, { status: "rejected" });
    toast.success("Rejected");
    refresh();
  }

  const connected = conn?.status === "connected";

  return (
    <OSShell>
      <div className="space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Email Command Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Operational inbox for Corey — review, approve, delegate, and trigger actions across Outlook, Teams, and Outlook Calendar.
            </p>
          </div>
          <Button onClick={handleSync} disabled={!connected || syncing} size="sm">
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Sync + Analyze
          </Button>
        </header>

        <ConnectionBanner conn={conn} onConnect={handleConnect} busy={connBusy} />

        <MicrosoftIntegrationsCard
          conn={conn}
          isAdmin={isAdmin}
          onReconnect={handleConnect}
          reconnectBusy={connBusy}
        />

        {/* Executive Summary */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <MetricTile label="Unread" value={metrics.unread} />
          <MetricTile label="Needs Corey" value={metrics.needsCorey} tone={metrics.needsCorey > 0 ? "warn" : "default"} />
          <MetricTile label="Can Delegate" value={metrics.canDelegate} />
          <MetricTile label="Waiting On" value={metrics.waitingOn} />
          <MetricTile label="Drafts Ready" value={metrics.draftsReady} tone={metrics.draftsReady > 0 ? "ok" : "default"} />
          <MetricTile label="Risks" value={metrics.risks} tone={metrics.risks > 0 ? "risk" : "default"} />
          <MetricTile label="Calendar Requests" value={metrics.calendarRequests} />
          <MetricTile label="Teams Delegations" value={metrics.teamsDelegations} />
        </section>

        <Tabs defaultValue="start_here">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="start_here">Start Here</TabsTrigger>
            <TabsTrigger value="needs_corey">Needs Corey</TabsTrigger>
            <TabsTrigger value="drafts">Draft Queue</TabsTrigger>
            <TabsTrigger value="delegation">Delegation Queue</TabsTrigger>
            <TabsTrigger value="waiting">Waiting On</TabsTrigger>
            <TabsTrigger value="calendar">Calendar Requests</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="start_here" className="mt-4 space-y-3">
            <div className="text-xs text-muted-foreground">The 3 highest-priority items right now — ranked by risk, urgency, Corey-approval, age, and impact.</div>
            {startHere.length === 0 ? (
              <EmptyState msg={connected ? "No actionable email items right now." : "Connect Outlook to populate Start Here."} />
            ) : (
              startHere.map((j) => <ItemCard key={j.item.id} joined={j} onAction={handleAction} onView={handleView} />)
            )}
          </TabsContent>

          <TabsContent value="needs_corey" className="mt-4 space-y-3">
            {needsCorey.length === 0 ? (
              <EmptyState msg="Nothing waiting on Corey." />
            ) : (
              needsCorey.map((j) => <ItemCard key={j.item.id} joined={j} onAction={handleAction} onView={handleView} />)
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-4 space-y-3">
            <div className="text-xs text-muted-foreground">No email is ever sent automatically. Every send requires explicit approval.</div>
            {pendingDrafts.length === 0 ? (
              <EmptyState msg="No drafts waiting for approval." />
            ) : pendingDrafts.map((q) => {
              const j = joined.find((x) => x.item.id === q.email_command_item_id);
              if (!j) return null;
              const editing = editingQueueId === q.id;
              return (
                <Card key={q.id} className="p-4">
                  <div className="text-xs text-muted-foreground">To {j.item.sender_email} · re: {j.item.subject}</div>
                  {editing ? (
                    <Textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="mt-2 min-h-[120px]" />
                  ) : (
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs">{(q.action_payload?.comment ?? q.action_payload?.draft_text ?? "")}</pre>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleApprove(q.id, editing ? { comment: editDraft } : undefined)}>
                      <Send className="size-3.5" /> Send through Outlook
                    </Button>
                    {editing ? (
                      <Button size="sm" variant="outline" onClick={() => setEditingQueueId(null)}>Cancel</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setEditingQueueId(q.id); setEditDraft(q.action_payload?.comment ?? q.action_payload?.draft_text ?? ""); }}>
                        <Edit3 className="size-3.5" /> Edit Draft
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleReject(q.id)}>
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="delegation" className="mt-4 space-y-3">
            {pendingDelegations.length === 0 ? (
              <EmptyState msg="No delegations queued." />
            ) : pendingDelegations.map((q) => {
              const j = joined.find((x) => x.item.id === q.email_command_item_id);
              if (!j) return null;
              return (
                <Card key={q.id} className="p-4">
                  <div className="text-xs text-muted-foreground">
                    {q.action_type === "teams_message" ? "Teams message" : "Outlook forward"} · suggested to {j.rec?.suggested_owner ?? "—"}
                  </div>
                  <div className="mt-1 text-sm font-medium">{j.item.subject}</div>
                  <div className="mt-2 text-xs">{j.rec?.ai_summary}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleApprove(q.id)}>
                      {q.action_type === "teams_message" ? "Send Teams Message" : "Forward via Outlook"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReject(q.id)}>Reject</Button>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="waiting" className="mt-4">
            <EmptyState msg="Waiting On tracker activates once you mark items as 'awaiting reply'." />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4 space-y-3">
            {calendarItems.length === 0 ? (
              <EmptyState msg="No calendar requests detected." />
            ) : calendarItems.map((j) => (
              <Card key={j.item.id} className="p-4">
                <div className="text-xs text-muted-foreground">{j.item.sender_name} · {relTime(j.item.received_at)}</div>
                <div className="text-sm font-medium">{j.item.subject}</div>
                <div className="mt-1 text-xs">{j.rec?.ai_summary}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleAction("calendar_event", j, { subject: j.item.subject })}>
                    <Calendar className="size-3.5" /> Create Outlook Calendar Event
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleAction("outlook_reply", j, { comment: "Sharing my availability below…" })}>
                    Draft Scheduling Reply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleAction("internal_reminder", j)}>
                    Remind Me Later
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            {audit.length === 0 ? (
              <EmptyState msg="No actions taken yet." />
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Provider</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">{relTime(a.created_at)}</td>
                        <td className="px-3 py-2">{a.action_type}</td>
                        <td className="px-3 py-2">{a.provider ?? "—"}</td>
                        <td className="px-3 py-2">
                          <Badge variant={a.status === "completed" ? "default" : a.status === "failed" ? "destructive" : "outline"}>
                            {a.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{a.payload_summary ?? a.error_message ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Email modal */}
        {viewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewing(null)}>
            <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">{viewing.joined.item.sender_name} · {viewing.joined.item.sender_email}</div>
                  <div className="mt-1 text-sm font-semibold">{viewing.joined.item.subject}</div>
                </div>
                <div className="flex items-center gap-2">
                  {viewing.joined.item.web_link && (
                    <a href={viewing.joined.item.web_link} target="_blank" rel="noreferrer" className="text-xs text-primary">
                      <ExternalLink className="inline size-3.5" /> Open in Outlook
                    </a>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setViewing(null)}><X className="size-4" /></Button>
                </div>
              </div>
              <div className="mt-4 rounded-lg border bg-muted/20 p-3 text-xs">
                {viewing.loading ? <Loader2 className="size-4 animate-spin" /> :
                  <div dangerouslySetInnerHTML={{ __html: viewing.body ?? "" }} />}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Email body fetched on demand · never persisted server-side.</div>
            </div>
          </div>
        )}
      </div>
    </OSShell>
  );
}