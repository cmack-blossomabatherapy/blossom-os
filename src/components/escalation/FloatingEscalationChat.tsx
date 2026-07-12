import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Plus, ArrowLeft, CheckCircle2, AlertTriangle, ListTodo, StickyNote } from "lucide-react";
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

type Category = "escalation" | "task" | "note";
type Priority = "low" | "medium" | "high" | "urgent";
type Status = "open" | "resolved";

type Thread = {
  id: string;
  subject: string;
  category: Category;
  priority: Priority;
  status: Status;
  from_user_id: string;
  to_user_id: string;
  state: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
  const [unread, setUnread] = useState(0);
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // compose state
  const [toUserId, setToUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Category>("escalation");
  const [priority, setPriority] = useState<Priority>("medium");
  const [body, setBody] = useState("");

  const uid = user?.id ?? null;

  /* ---------- Load threads ---------- */
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("escalation_threads")
        .select("*")
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        console.warn("[escalation] load threads failed", error);
        return;
      }
      setThreads((data ?? []) as Thread[]);
    })();
    return () => { cancelled = true; };
  }, [uid, open]);

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
          if (!open && payload.eventType === "INSERT" && row.to_user_id === uid) {
            setUnread((n) => n + 1);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, open]);

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
    if (!uid || !activeThread || !reply.trim()) return;
    const body = reply.trim();
    setReply("");
    const { error } = await supabase.from("escalation_thread_messages").insert({
      thread_id: activeThread.id,
      sender_id: uid,
      body,
    });
    if (error) {
      toast.error("Message failed to send");
      setReply(body);
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
    });
    if (msgErr) toast.warning("Thread created but message failed — try again");
    toast.success("Sent");
    setSubject(""); setBody(""); setToUserId(""); setCategory("escalation"); setPriority("medium");
    setActiveThread(data as Thread);
    setView("thread");
  }

  async function toggleResolved() {
    if (!activeThread) return;
    const next: Status = activeThread.status === "open" ? "resolved" : "open";
    const { error } = await supabase
      .from("escalation_threads")
      .update({ status: next })
      .eq("id", activeThread.id);
    if (error) { toast.error("Update failed"); return; }
    setActiveThread({ ...activeThread, status: next });
    setThreads((prev) => prev.map((t) => t.id === activeThread.id ? { ...t, status: next } : t));
  }

  /* ---------- Derived ---------- */
  const otherId = (t: Thread) => (t.from_user_id === uid ? t.to_user_id : t.from_user_id);
  const nameOf = (id: string) => profileNames[id] || "Teammate";

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
        onClick={() => { setOpen((o) => !o); setUnread(0); }}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
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
              <Button size="sm" variant="ghost" onClick={toggleResolved}>
                <CheckCircle2 className={cn("h-4 w-4 mr-1", activeThread.status === "resolved" && "text-emerald-500")} />
                {activeThread.status === "resolved" ? "Reopen" : "Resolve"}
              </Button>
            )}
          </div>

          {/* Body */}
          {view === "list" && (
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No escalations yet. Tap <b>New</b> to send one to your state director or manager.
                </div>
              ) : (
                <ul className="divide-y">
                  {threads.map((t) => {
                    const Icon = CATEGORY_ICON[t.category] ?? AlertTriangle;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => { setActiveThread(t); setView("thread"); }}
                          className="w-full px-4 py-3 text-left hover:bg-muted/40 flex gap-3"
                        >
                          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{t.subject}</span>
                              {t.status === "resolved" && (
                                <Badge variant="outline" className="text-[10px]">resolved</Badge>
                              )}
                              {t.status === "open" && t.priority === "urgent" && (
                                <Badge className="text-[10px] bg-red-500 hover:bg-red-500">urgent</Badge>
                              )}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {t.from_user_id === uid ? "To" : "From"} {nameOf(otherId(t))} · {new Date(t.updated_at).toLocaleString()}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {view === "thread" && activeThread && (
            <>
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
                        <div className={cn("mt-1 text-[10px] opacity-70")}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t p-2 flex items-end gap-2">
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
                <Button size="icon" onClick={sendMessage} disabled={!reply.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
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
                <label className="text-xs font-medium">Notes</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add context — lead name, client, blocker, next step…"
                  rows={5}
                />
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