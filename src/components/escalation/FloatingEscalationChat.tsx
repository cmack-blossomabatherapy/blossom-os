import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Plus, ArrowLeft, CheckCircle2, AlertTriangle, ListTodo, StickyNote, CalendarIcon, UserCog } from "lucide-react";
import { Search as SearchIcon, Filter as FilterIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { EscalationLinkPicker, LINK_TYPE_LABEL, linkToHref, type LinkValue, type LinkEntityType } from "./EscalationLinkPicker";
import { AttachmentComposer, AttachmentList, type Attachment } from "./EscalationAttachments";

type Category = "escalation" | "task" | "note";
type Priority = "low" | "medium" | "high" | "urgent";
export type EscalationStatus = "Open" | "Assigned" | "In Review" | "Resolved";

const STATUS_OPTIONS: EscalationStatus[] = ["Open", "Assigned", "In Review", "Resolved"];

const STATUS_STYLES: Record<EscalationStatus, string> = {
  Open: "bg-amber-100 text-amber-800 border-amber-200",
  Assigned: "bg-blue-100 text-blue-800 border-blue-200",
  "In Review": "bg-purple-100 text-purple-800 border-purple-200",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

type Thread = {
  id: string;
  subject: string;
  category: Category;
  priority: Priority;
  status: EscalationStatus;
  from_user_id: string;
  to_user_id: string;
  owner_id: string | null;
  due_date: string | null;
  blocker: string | null;
  next_step: string | null;
  state: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  linked_entity_label: string | null;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachments?: Attachment[] | null;
};

type Recipient = {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  state: string | null;
};

const CATEGORY_ICON: Record<Category, typeof AlertTriangle> = {
  escalation: AlertTriangle,
  task: ListTodo,
  note: StickyNote,
};

export function FloatingEscalationChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "compose" | "thread">("list");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [unreadThreads, setUnreadThreads] = useState<Set<string>>(new Set());
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Refs so realtime callbacks always see current values without re-subscribing.
  const openRef = useRef(open);
  const activeThreadIdRef = useRef<string | null>(null);
  const profileNamesRef = useRef<Record<string, string>>({});
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { activeThreadIdRef.current = activeThread?.id ?? null; }, [activeThread]);
  useEffect(() => { profileNamesRef.current = profileNames; }, [profileNames]);

  // Clear per-thread unread badge whenever the user opens a thread.
  useEffect(() => {
    if (!open || !activeThread) return;
    setUnreadThreads((prev) => {
      if (!prev.has(activeThread.id)) return prev;
      const next = new Set(prev);
      next.delete(activeThread.id);
      return next;
    });
  }, [open, activeThread]);

  // compose state
  const [toUserId, setToUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("escalation");
  const [priority, setPriority] = useState<Priority>("medium");
  const [body, setBody] = useState("");
  const [composeDue, setComposeDue] = useState<string>("");
  const [composeLink, setComposeLink] = useState<LinkValue>(null);
  const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);

  // List filters
  const [filterQuery, setFilterQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | EscalationStatus>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterRecipient, setFilterRecipient] = useState<"all" | string>("all");
  const [filterLinkType, setFilterLinkType] = useState<"all" | LinkEntityType | "any">("all");
  const [sortBy, setSortBy] = useState<"activity" | "created" | "due" | "priority">("activity");
  const [pageSize, setPageSize] = useState(50);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const uid = user?.id ?? null;

  /* ---------- Load threads ---------- */
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      setLoadingMore(true);
      const { data, error } = await supabase
        .from("escalation_threads")
        .select("*")
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .order("updated_at", { ascending: false })
        .limit(pageSize + 1);
      if (cancelled) return;
      setLoadingMore(false);
      if (error) {
        console.warn("[escalation] load threads failed", error);
        return;
      }
      const rows = (data ?? []) as Thread[];
      setHasMore(rows.length > pageSize);
      setThreads(rows.slice(0, pageSize));
    })();
    return () => { cancelled = true; };
  }, [uid, open, pageSize]);

  /* ---------- Realtime new thread messages -> bump unread ---------- */
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel("escalation_threads_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "escalation_threads" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Thread | undefined;
          if (!row) return;
          if (row.from_user_id !== uid && row.to_user_id !== uid) return;
          setThreads((prev) => {
            const filtered = prev.filter((t) => t.id !== row.id);
            if (payload.eventType === "DELETE") return filtered;
            return [row as Thread, ...filtered].sort(
              (a, b) => (b.updated_at > a.updated_at ? 1 : -1),
            );
          });
          if (payload.eventType === "INSERT" && row.to_user_id === uid) {
            const isActive = openRef.current && activeThreadIdRef.current === row.id;
            if (!isActive) {
              setUnreadThreads((prev) => {
                const next = new Set(prev);
                next.add(row.id);
                return next;
              });
              const senderName = profileNamesRef.current[row.from_user_id] || "A teammate";
              toast(`New escalation from ${senderName}`, {
                description: row.subject,
                action: {
                  label: "Open",
                  onClick: () => {
                    setOpen(true);
                    setActiveThread(row as Thread);
                    setView("thread");
                  },
                },
              });
            }
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  /* ---------- Global realtime for message replies -> badge + notify ---------- */
  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel("escalation_msgs_global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escalation_thread_messages" },
        async (payload) => {
          const m = payload.new as Message;
          if (!m || m.sender_id === uid) return; // ignore self-sends

          // Confirm the current user participates in the thread (RLS should already gate, belt-and-suspenders).
          const { data: t } = await supabase
            .from("escalation_threads")
            .select("id,subject,from_user_id,to_user_id")
            .eq("id", m.thread_id)
            .maybeSingle();
          if (!t) return;
          if (t.from_user_id !== uid && t.to_user_id !== uid) return;

          const isActive = openRef.current && activeThreadIdRef.current === t.id;
          if (isActive) return; // user is reading it; no badge/toast

          setUnreadThreads((prev) => {
            const next = new Set(prev);
            next.add(t.id);
            return next;
          });
          const senderName = profileNamesRef.current[m.sender_id] || "A teammate";
          const preview = m.body.length > 100 ? `${m.body.slice(0, 100)}…` : m.body;
          toast(`${senderName} · ${t.subject}`, {
            description: preview,
            action: {
              label: "Open",
              onClick: async () => {
                setOpen(true);
                // Load full thread and open it.
                const { data: full } = await supabase
                  .from("escalation_threads")
                  .select("*")
                  .eq("id", t.id)
                  .maybeSingle();
                if (full) {
                  setActiveThread(full as Thread);
                  setView("thread");
                }
              },
            },
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid]);

  /* ---------- Load recipients (active profiles) ---------- */
  useEffect(() => {
    if (!open || recipients.length) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id,display_name,job_title,state,active")
        .eq("active", true)
        .order("display_name", { ascending: true })
        .limit(500);
      const rows = (data ?? []).filter((r: any) => r.user_id && r.user_id !== uid) as Recipient[];
      setRecipients(rows);
      setProfileNames(
        Object.fromEntries(rows.map((r) => [r.user_id, r.display_name || "Teammate"])),
      );
    })();
  }, [open, recipients.length, uid]);

  /* ---------- Load messages for active thread + realtime ---------- */
  useEffect(() => {
    if (!activeThread) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("escalation_thread_messages")
        .select("*")
        .eq("thread_id", activeThread.id)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("[escalation] load messages failed", error);
        return;
      }
      setMessages((data ?? []) as Message[]);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    })();

    const ch = supabase
      .channel(`escalation_msgs_${activeThread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escalation_thread_messages", filter: `thread_id=eq.${activeThread.id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
          });
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [activeThread]);

  /* ---------- Actions ---------- */

  async function sendMessage() {
    if (!uid || !activeThread) return;
    if (!reply.trim() && replyAttachments.length === 0) return;
    const body = reply.trim();
    const attachments = replyAttachments;
    setReply("");
    setReplyAttachments([]);
    const { error } = await supabase.from("escalation_thread_messages").insert({
      thread_id: activeThread.id,
      sender_id: uid,
      body,
      attachments,
    });
    if (error) {
      toast.error("Message failed to send");
      setReply(body);
      setReplyAttachments(attachments);
    }
  }

  async function createThread() {
    if (!uid) return;
    if (!toUserId || !subject.trim() || !body.trim()) {
      toast.error("Choose a teammate, subject, and message");
      return;
    }
    const { data, error } = await supabase
      .from("escalation_threads")
      .insert({
        subject: subject.trim(),
        category,
        priority,
        from_user_id: uid,
        to_user_id: toUserId,
        owner_id: toUserId,
        status: "Open",
        due_date: composeDue || null,
        linked_entity_type: composeLink?.type ?? null,
        linked_entity_id: composeLink?.id ?? null,
        linked_entity_label: composeLink?.label ?? null,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast.error("Could not create thread");
      return;
    }
    const { error: msgErr } = await supabase.from("escalation_thread_messages").insert({
      thread_id: data.id,
      sender_id: uid,
      body: body.trim(),
      attachments: composeAttachments,
    });
    if (msgErr) toast.warning("Thread created but message failed — try again");
    toast.success("Sent");
    setSubject(""); setBody(""); setToUserId(""); setCategory("escalation"); setPriority("medium"); setComposeDue(""); setComposeLink(null); setComposeAttachments([]);
    setActiveThread(data as Thread);
    setView("thread");
  }

  async function patchThread(patch: Partial<Thread>) {
    if (!activeThread) return;
    const { error } = await supabase
      .from("escalation_threads")
      .update(patch)
      .eq("id", activeThread.id);
    if (error) { toast.error("Update failed"); return; }
    const merged = { ...activeThread, ...patch } as Thread;
    setActiveThread(merged);
    setThreads((prev) => prev.map((t) => t.id === activeThread.id ? merged : t));
  }

  async function setStatus(next: EscalationStatus) {
    await patchThread({ status: next });
  }
  async function setOwner(nextOwnerId: string) {
    // If moving out of Open, auto-advance to Assigned when still Open
    const status: EscalationStatus = activeThread?.status === "Open" ? "Assigned" : (activeThread?.status ?? "Open");
    await patchThread({ owner_id: nextOwnerId, status });
  }

  /* ---------- Derived ---------- */
  const otherId = (t: Thread) => (t.from_user_id === uid ? t.to_user_id : t.from_user_id);
  const nameOf = (id: string) => profileNames[id] || "Teammate";

  const filteredThreads = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const priorityRank: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 } as any;
    const filtered = threads.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterRecipient !== "all" && otherId(t) !== filterRecipient) return false;
      if (filterLinkType === "any" && !t.linked_entity_type) return false;
      if (filterLinkType !== "all" && filterLinkType !== "any" && t.linked_entity_type !== filterLinkType) return false;
      if (q) {
        const hay = [
          t.subject,
          t.linked_entity_label ?? "",
          nameOf(otherId(t)),
          t.blocker ?? "",
          t.next_step ?? "",
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "due") {
        // Threads with a due date come first, soonest first; no due date sinks to the bottom.
        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return ad - bd;
      }
      if (sortBy === "priority") {
        const diff = (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
        if (diff !== 0) return diff;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      // "activity" (default): most recently updated first
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return sorted;
  }, [threads, filterQuery, filterStatus, filterPriority, filterRecipient, filterLinkType, sortBy, uid, profileNames]);

  const activeFilterCount =
    (filterStatus !== "all" ? 1 : 0) +
    (filterPriority !== "all" ? 1 : 0) +
    (filterRecipient !== "all" ? 1 : 0) +
    (filterLinkType !== "all" ? 1 : 0);

  const sortedRecipients = useMemo(
    () => recipients.slice().sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? "")),
    [recipients],
  );

  if (!uid) return null;

  /* ---------- Render ---------- */
  return (
    <>
      {/* Floating button */}
      <button
        aria-label="Open escalation chat"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadThreads.size > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadThreads.size}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-5 z-50 flex w-[380px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl",
            "h-[560px] max-h-[80vh]",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              {view !== "list" && (
                <button
                  onClick={() => { setView("list"); setActiveThread(null); }}
                  className="rounded p-1 hover:bg-muted"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <div className="text-sm font-semibold">
                  {view === "compose" ? "New escalation"
                    : view === "thread" ? (activeThread?.subject ?? "Thread")
                    : "Escalations"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {view === "thread" && activeThread
                    ? `${nameOf(otherId(activeThread))} · ${activeThread.category}`
                    : "Tasks, escalations, notes"}
                </div>
              </div>
            </div>
            {view === "list" && (
              <Button size="sm" variant="ghost" onClick={() => setView("compose")}>
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            )}
            {view === "thread" && activeThread && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStatus(activeThread.status === "Resolved" ? "Open" : "Resolved")}
              >
                <CheckCircle2 className={cn("h-4 w-4 mr-1", activeThread.status === "Resolved" && "text-emerald-500")} />
                {activeThread.status === "Resolved" ? "Reopen" : "Resolve"}
              </Button>
            )}
          </div>

          {/* Body */}
          {view === "list" && (
            <div className="flex-1 overflow-y-auto">
              {/* Search + filters */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-3 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Search subject, person, record…"
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={showFilters || activeFilterCount > 0 ? "secondary" : "ghost"}
                    className="h-8 px-2"
                    onClick={() => setShowFilters((s) => !s)}
                  >
                    <FilterIcon className="h-3.5 w-3.5" />
                    {activeFilterCount > 0 && (
                      <span className="ml-1 text-[10px] font-semibold">{activeFilterCount}</span>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Sort by</span>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">Newest activity</SelectItem>
                      <SelectItem value="created">Newest created</SelectItem>
                      <SelectItem value="due">Due date (soonest)</SelectItem>
                      <SelectItem value="priority">Priority (urgent first)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {showFilters && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any status</SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterRecipient} onValueChange={(v) => setFilterRecipient(v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Person" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Anyone</SelectItem>
                        {sortedRecipients.map((r) => (
                          <SelectItem key={r.user_id} value={r.user_id}>{r.display_name ?? "Teammate"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterLinkType} onValueChange={(v) => setFilterLinkType(v as any)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Linked record" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any record</SelectItem>
                        <SelectItem value="any">Has linked record</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="authorization">Authorization</SelectItem>
                      </SelectContent>
                    </Select>
                    {activeFilterCount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="col-span-2 h-7 text-[11px]"
                        onClick={() => {
                          setFilterStatus("all");
                          setFilterPriority("all");
                          setFilterRecipient("all");
                          setFilterLinkType("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {threads.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No escalations yet. Tap <b>New</b> to send one to your state director or manager.
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No escalations match your filters.
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredThreads.map((t) => {
                    const Icon = CATEGORY_ICON[t.category] ?? AlertTriangle;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => { setActiveThread(t); setView("thread"); }}
                          className="w-full px-4 py-3 text-left hover:bg-muted/40 flex gap-3"
                        >
                          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate text-sm font-medium">{t.subject}</span>
                              {unreadThreads.has(t.id) && (
                                <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Unread" />
                              )}
                              <Badge variant="outline" className={cn("text-[10px] border", STATUS_STYLES[t.status])}>
                                {t.status}
                              </Badge>
                              {t.status !== "Resolved" && t.priority === "urgent" && (
                                <Badge className="text-[10px] bg-red-500 hover:bg-red-500">urgent</Badge>
                              )}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {t.from_user_id === uid ? "To" : "From"} {nameOf(otherId(t))}
                              {t.owner_id && t.owner_id !== otherId(t) ? ` · Owner ${nameOf(t.owner_id)}` : ""}
                              {t.due_date ? ` · Due ${new Date(t.due_date).toLocaleDateString()}` : ""}
                              {" · "}{new Date(t.updated_at).toLocaleString()}
                            </div>
                            {t.linked_entity_type && t.linked_entity_id && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-[10px] gap-1">
                                  <span className="opacity-70">{LINK_TYPE_LABEL[t.linked_entity_type as LinkEntityType]}:</span>
                                  <span className="truncate max-w-[180px]">{t.linked_entity_label ?? t.linked_entity_id}</span>
                                </Badge>
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {hasMore && (
                <div className="p-3 flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingMore}
                    onClick={() => setPageSize((n) => n + 50)}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {view === "thread" && activeThread && (
            <>
              {/* Workflow bar: status, owner, due date, blocker, next step */}
              <div className="border-b bg-muted/30 p-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground">Status</label>
                    <Select value={activeThread.status} onValueChange={(v) => setStatus(v as EscalationStatus)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <UserCog className="h-3 w-3" /> Owner
                    </label>
                    <Select value={activeThread.owner_id ?? ""} onValueChange={(v) => setOwner(v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Assign owner" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {sortedRecipients.map((r) => (
                          <SelectItem key={r.user_id} value={r.user_id} className="text-xs">
                            {r.display_name || "Teammate"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> Due
                    </label>
                    <Input
                      type="date"
                      value={activeThread.due_date ?? ""}
                      onChange={(e) => patchThread({ due_date: e.target.value || null })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground">Blocker</label>
                    <Input
                      value={activeThread.blocker ?? ""}
                      onChange={(e) => setActiveThread({ ...activeThread, blocker: e.target.value })}
                      onBlur={(e) => patchThread({ blocker: e.target.value || null })}
                      placeholder="What's holding this up?"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-muted-foreground">Next step</label>
                    <Input
                      value={activeThread.next_step ?? ""}
                      onChange={(e) => setActiveThread({ ...activeThread, next_step: e.target.value })}
                      onBlur={(e) => patchThread({ next_step: e.target.value || null })}
                      placeholder="What happens next?"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground">Context</label>
                  {activeThread.linked_entity_type && activeThread.linked_entity_id ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={linkToHref({
                          type: activeThread.linked_entity_type as LinkEntityType,
                          id: activeThread.linked_entity_id,
                          label: activeThread.linked_entity_label ?? "",
                        })}
                        className="text-xs font-medium text-primary underline underline-offset-2 truncate"
                      >
                        {LINK_TYPE_LABEL[activeThread.linked_entity_type as LinkEntityType]}: {activeThread.linked_entity_label ?? activeThread.linked_entity_id}
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => patchThread({
                          linked_entity_type: null,
                          linked_entity_id: null,
                          linked_entity_label: null,
                        } as Partial<Thread>)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <EscalationLinkPicker
                      value={null}
                      compact
                      onChange={(v) => v && patchThread({
                        linked_entity_type: v.type,
                        linked_entity_id: v.id,
                        linked_entity_label: v.label,
                      } as Partial<Thread>)}
                    />
                  )}
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_id === uid;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                          <AttachmentList items={m.attachments as Attachment[]} mine={mine} />
                        )}
                        <div className={cn("mt-1 text-[10px] opacity-70")}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t p-2 space-y-1.5">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Add a note…"
                    rows={2}
                    className="min-h-[44px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!reply.trim() && replyAttachments.length === 0}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {uid && (
                  <AttachmentComposer
                    value={replyAttachments}
                    onChange={setReplyAttachments}
                    uid={uid}
                    scope={activeThread.id}
                  />
                )}
              </div>
            </>
          )}

          {view === "compose" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Send to</label>
                <Select value={toUserId} onValueChange={setToUserId}>
                  <SelectTrigger><SelectValue placeholder="Pick a manager or director" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {sortedRecipients.map((r) => (
                      <SelectItem key={r.user_id} value={r.user_id}>
                        {r.display_name || "Teammate"}
                        {r.job_title ? ` — ${r.job_title}` : ""}
                        {r.state ? ` (${r.state})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Type</label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escalation">Escalation</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Priority</label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Escalate lead — missing VOB"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Due date (optional)</label>
                <Input
                  type="date"
                  value={composeDue}
                  onChange={(e) => setComposeDue(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Context (optional)</label>
                <EscalationLinkPicker value={composeLink} onChange={setComposeLink} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Notes</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add context — lead name, client, blocker, next step…"
                  rows={5}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Evidence (optional)</label>
                {uid && (
                  <AttachmentComposer
                    value={composeAttachments}
                    onChange={setComposeAttachments}
                    uid={uid}
                    scope="new"
                  />
                )}
              </div>
              <Button className="w-full" onClick={createThread}>
                <Send className="h-4 w-4 mr-2" /> Send
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default FloatingEscalationChat;