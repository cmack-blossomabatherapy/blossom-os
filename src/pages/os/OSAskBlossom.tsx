import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles, Send, Plus, Mic, Paperclip, History, Pin, BookOpen,
  Brain, Workflow, ShieldCheck, ExternalLink, Loader2, Search, Pencil, Trash2,
  MicOff, X, RefreshCw, AlertCircle,
} from "lucide-react";
import { OSShell } from "@/pages/os/OSShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { streamAskBlossom } from "@/lib/ai/askBlossomAdapter";
import { useBlossomAiInsights, type BlossomInsight } from "@/hooks/useBlossomAiInsights";
import { useNavigate } from "react-router-dom";
import { quickPromptsFor } from "@/lib/ai/quickPrompts";
import { listKnowledgeByCategory, searchKnowledge } from "@/lib/ai/knowledgeBase";
import { getAiScope } from "@/lib/ai/aiPermissions";
import { logAiQuery } from "@/lib/ai/aiAudit";
import { supabase } from "@/integrations/supabase/client";
import type { AiMessage, AiConversation, AskBlossomResponse } from "@/lib/ai/types";

type Tab = "chat" | "saved" | "knowledge" | "insights";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function OSAskBlossom() {
  const { user } = useAuth();
  const { role, activeState } = useOSRole();
  const scope = useMemo(() => getAiScope(role), [role]);
  const quickPrompts = useMemo(() => quickPromptsFor(role), [role]);
  const { insights, loading: insightsLoading, refreshing: insightsRefreshing, error: insightsError, refresh: refreshInsights } =
    useBlossomAiInsights(role, activeState);
  const kbByCategory = useMemo(() => listKnowledgeByCategory(role), [role]);
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("chat");
  const [convs, setConvs] = useState<AiConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Maps local conversation id → server-side chat_conversations.id for multi-turn memory. */
  const [serverConvIds, setServerConvIds] = useState<Record<string, string>>({});
  /** Reverse lookup: server id → local id (for hydrating server conversations). */
  const [localByServer, setLocalByServer] = useState<Record<string, string>>({});
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [kbSearch, setKbSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();

  // Attachments (text-readable inlined into prompt; binaries acknowledged only)
  type Attach = { id: string; name: string; size: number; kind: "text" | "binary"; text?: string };
  const [attachments, setAttachments] = useState<Attach[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 3;
  const MAX_BYTES = 5 * 1024 * 1024;
  const MAX_TEXT_CHARS = 20_000;
  const TEXT_EXT = /\.(txt|md|csv|json|log|tsv|yaml|yml)$/i;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_FILES} attachments`); return; }
    const picked = Array.from(files).slice(0, remaining);
    const next: Attach[] = [];
    for (const f of picked) {
      if (f.size > MAX_BYTES) { toast.error(`${f.name} is larger than 5 MB`); continue; }
      const isText = TEXT_EXT.test(f.name) || f.type.startsWith("text/") || f.type === "application/json";
      if (isText) {
        try {
          const raw = await f.text();
          next.push({
            id: newId(), name: f.name, size: f.size, kind: "text",
            text: raw.length > MAX_TEXT_CHARS ? raw.slice(0, MAX_TEXT_CHARS) + `\n…[truncated ${raw.length - MAX_TEXT_CHARS} chars]` : raw,
          });
        } catch {
          next.push({ id: newId(), name: f.name, size: f.size, kind: "binary" });
        }
      } else {
        next.push({ id: newId(), name: f.name, size: f.size, kind: "binary" });
      }
    }
    if (next.length) setAttachments((cur) => [...cur, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Voice dictation via Web Speech API (client-side, no server cost)
  type SR = { start: () => void; stop: () => void; onresult: ((e: unknown) => void) | null; onerror: ((e: unknown) => void) | null; onend: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };
  const recognitionRef = useRef<SR | null>(null);
  const [listening, setListening] = useState(false);
  const dictationSupported = typeof window !== "undefined" &&
    Boolean((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
            (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  function toggleDictation() {
    if (!dictationSupported) { toast.error("Voice dictation isn't supported in this browser"); return; }
    if (listening) { recognitionRef.current?.stop(); return; }
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR })
      .SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    const startingLen = input.length;
    const base = input + (input && !input.endsWith(" ") ? " " : "");
    rec.onresult = (e: unknown) => {
      const ev = e as { results: ArrayLike<ArrayLike<{ transcript: string }>> };
      let text = "";
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      setInput(base + text);
      void startingLen;
    };
    rec.onerror = (e: unknown) => {
      const ev = e as { error?: string };
      if (ev.error && ev.error !== "aborted" && ev.error !== "no-speech") {
        toast.error(`Mic error: ${ev.error}`);
      }
    };
    rec.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not start mic"); }
  }

  // Stop dictation if the page unmounts.
  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  /** Rename or delete a conversation locally + on the server. */
  async function renameConversation(localId: string) {
    const current = convs.find((c) => c.id === localId);
    const next = window.prompt("Rename conversation", current?.title ?? "");
    if (!next || next.trim() === "" || next === current?.title) return;
    const title = next.trim().slice(0, 120);
    setConvs((list) => list.map((c) => (c.id === localId ? { ...c, title } : c)));
    const serverId = serverConvIds[localId];
    if (serverId) {
      const { error } = await supabase.from("chat_conversations").update({ title }).eq("id", serverId);
      if (error) toast.error("Could not rename on server");
    }
  }
  async function deleteConversation(localId: string) {
    if (!window.confirm("Delete this conversation? This can't be undone.")) return;
    const serverId = serverConvIds[localId];
    setConvs((list) => list.filter((c) => c.id !== localId));
    if (activeId === localId) setActiveId(null);
    if (serverId) {
      const { error } = await supabase.from("chat_conversations").delete().eq("id", serverId);
      if (error) toast.error("Could not delete on server");
    }
  }

  const active = activeId ? convs.find((c) => c.id === activeId) ?? null : null;
  const messages = active?.messages ?? [];

  // Hydrate prior conversations from the server so history persists across sessions.
  useEffect(() => {
    if (!user?.id || historyLoaded) return;
    let cancelled = false;
    (async () => {
      const { data: convRows } = await supabase
        .from("chat_conversations")
        .select("id,title,created_at,last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(40);
      if (cancelled || !convRows?.length) { setHistoryLoaded(true); return; }
      const ids = convRows.map((c) => c.id);
      const { data: msgRows } = await supabase
        .from("chat_messages")
        .select("id,conversation_id,role,content,created_at,metadata")
        .in("conversation_id", ids)
        .order("created_at", { ascending: true });
      const grouped = new Map<string, AiMessage[]>();
      for (const m of msgRows ?? []) {
        const arr = grouped.get(m.conversation_id) ?? [];
        const meta = (m.metadata as any) ?? {};
        arr.push({
          id: m.id,
          role: m.role as AiMessage["role"],
          content: m.content,
          createdAt: m.created_at,
          sources: Array.isArray(meta.sources) ? meta.sources.map((s: any, i: number) => ({
            id: `${m.id}-s${i}`,
            title: s.title,
            category: s.category ?? "sop",
            sourceType: s.tool ?? "knowledge",
            url: s.url,
            snippet: s.snippet,
            similarity: s.similarity,
          })) : undefined,
        });
        grouped.set(m.conversation_id, arr);
      }
      const nextConvs: AiConversation[] = [];
      const sMap: Record<string, string> = {};
      const lMap: Record<string, string> = {};
      for (const c of convRows) {
        const localId = newId();
        sMap[localId] = c.id;
        lMap[c.id] = localId;
        nextConvs.push({
          id: localId,
          title: c.title || "New chat",
          createdAt: c.created_at,
          updatedAt: c.last_message_at,
          messages: grouped.get(c.id) ?? [],
        });
      }
      setConvs(nextConvs);
      setServerConvIds(sMap);
      setLocalByServer(lMap);
      setHistoryLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, historyLoaded]);

  // Deep-link: ?q=...
  useEffect(() => {
    const q = params.get("q");
    if (q && !streaming) {
      setInput("");
      void send(q);
      const next = new URLSearchParams(params); next.delete("q");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streaming]);

  function appendMessage(convId: string, msg: AiMessage) {
    setConvs((list) => list.map((c) => c.id === convId
      ? { ...c, messages: [...c.messages, msg], updatedAt: new Date().toISOString() }
      : c));
  }
  function patchLastAssistant(convId: string, patch: Partial<AiMessage>) {
    setConvs((list) => list.map((c) => {
      if (c.id !== convId) return c;
      const msgs = [...c.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") { msgs[i] = { ...msgs[i], ...patch }; break; }
      }
      return { ...c, messages: msgs };
    }));
  }

  async function send(prompt: string) {
    const text = prompt.trim();
    if (!text || streaming) return;
    setInput("");

    // Fold attachments into the prompt sent to the model.
    const attachedSnapshot = attachments;
    let composed = text;
    if (attachedSnapshot.length) {
      const parts: string[] = [];
      for (const a of attachedSnapshot) {
        if (a.kind === "text" && a.text) {
          parts.push(`\n\n--- Attached: ${a.name} (${Math.round(a.size / 1024)} KB) ---\n${a.text}`);
        } else {
          parts.push(`\n\n[attached ${a.name}, ${Math.round(a.size / 1024)} KB — binary; content not indexed yet]`);
        }
      }
      composed = text + parts.join("");
    }
    setAttachments([]);

    let convId = activeId;
    if (!convId) {
      const c: AiConversation = {
        id: newId(),
        title: text.length > 60 ? text.slice(0, 57) + "…" : text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setConvs((list) => [c, ...list]);
      setActiveId(c.id);
      convId = c.id;
    }

    const userMsg: AiMessage = { id: newId(), role: "user", content: text, createdAt: new Date().toISOString() };
    const assistantMsg: AiMessage = { id: newId(), role: "assistant", content: "", createdAt: new Date().toISOString() };
    appendMessage(convId, userMsg);
    appendMessage(convId, assistantMsg);
    setStreaming(true);

    try {
      const serverConvId = serverConvIds[convId];
      const stream = streamAskBlossom(composed, role, activeState, serverConvId);
      let acc = "";
      let result: (AskBlossomResponse & { conversationId?: string }) | undefined;
      while (true) {
        const next = await stream.next();
        if (next.done) { result = next.value as AskBlossomResponse & { conversationId?: string }; break; }
        acc += next.value;
        patchLastAssistant(convId, { content: acc });
      }
      if (result) {
        patchLastAssistant(convId, {
          content: result.content,
          sources: result.sources,
          suggestedActions: result.suggestedActions,
          recordsAccessed: result.recordsAccessed,
        });
        if (result.conversationId && !serverConvIds[convId]) {
          setServerConvIds((m) => ({ ...m, [convId!]: result!.conversationId! }));
        }
        logAiQuery({
          userId: user?.id ?? null,
          role,
          prompt: text,
          recordsAccessed: result.recordsAccessed,
          kbHits: result.sources.map((s) => s.id),
        });
      }
    } catch (e) {
      patchLastAssistant(convId, { content: "_Sorry — something went wrong._" });
      toast.error(e instanceof Error ? e.message : "AI error");
      // Restore attachments so the user can retry without re-picking files.
      if (attachedSnapshot.length) setAttachments(attachedSnapshot);
    } finally {
      setStreaming(false);
    }
  }

  const kbResults = kbSearch.trim()
    ? searchKnowledge(kbSearch, role, 20)
    : null;

  return (
    <OSShell>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600&display=swap');`}</style>
      <div className="os-rise mx-auto w-full max-w-6xl space-y-5" style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
        {/* Header — petal-glow frame to match Company Home */}
        <div
          className="relative rounded-[28px] p-[1.5px] shadow-[0_18px_60px_-30px_hsl(265_60%_50%/0.35)]"
          style={{
            backgroundImage:
              "conic-gradient(from 210deg at 50% 50%, hsl(189 55% 58% / 0.55), hsl(280 60% 70% / 0.5), hsl(330 75% 72% / 0.55), hsl(265 85% 65% / 0.5), hsl(189 55% 58% / 0.55))",
          }}
        >
          <div className="relative overflow-hidden rounded-[26px] bg-card/95 backdrop-blur px-5 py-5 md:px-7 md:py-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-60 blur-3xl"
              style={{ background: "radial-gradient(circle, hsl(280 75% 72% / 0.45), transparent 65%)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-50 blur-3xl"
              style={{ background: "radial-gradient(circle, hsl(189 55% 58% / 0.4), transparent 65%)" }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_10px_26px_-12px_hsl(265_85%_60%/0.6)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                    Blossom AI
                  </p>
                  <h1 className="text-xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
                    Ask, summarize, and decide — beautifully.
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-[hsl(265_70%_85%)] bg-[hsl(265_100%_98%)] text-[hsl(265_60%_45%)]">
                  <ShieldCheck className="mr-1 h-3 w-3" /> {scope.label}
                </Badge>
                <Badge variant="outline" className="rounded-full">{activeState}</Badge>
              </div>
            </div>

            {/* Tabs */}
            <div className="relative mt-4 flex flex-wrap gap-1.5">
              {([
                { id: "chat", label: "Conversation", icon: Sparkles },
                { id: "saved", label: "Saved & Recent", icon: History },
                { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
                { id: "insights", label: "AI Insights", icon: Brain },
              ] as { id: Tab; label: string; icon: typeof Sparkles }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
                    tab === t.id
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-foreground/[0.05] text-foreground/70 hover:bg-foreground/[0.09]",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        {tab === "chat" && (
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
            {/* LEFT: conversations */}
            <aside className="hidden flex-col rounded-2xl border border-border/60 bg-card/90 p-3 backdrop-blur lg:flex lg:max-h-[calc(100vh-240px)]">
              <Button
                variant="default"
                className="mb-3 w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white hover:opacity-95"
                onClick={() => { setActiveId(null); setInput(""); }}
              >
                <Plus className="h-4 w-4" /> New conversation
              </Button>
              <ScrollArea className="flex-1 -mx-1 px-1">
                {convs.length === 0 ? (
                  <p className="px-2 py-4 text-[12px] text-muted-foreground">No conversations yet.</p>
                ) : (
                  <div className="space-y-1">
                    {convs.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "group flex items-start gap-1 rounded-xl px-2 py-2 text-[12.5px] transition-colors",
                          activeId === c.id ? "bg-foreground/[0.07] text-foreground" : "hover:bg-foreground/[0.04] text-foreground/80",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveId(c.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            {c.pinned && <Pin className="h-3 w-3 text-[hsl(265_70%_55%)]" />}
                            <p className="truncate font-medium">{c.title}</p>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground">
                            {new Date(c.updatedAt).toLocaleString()}
                          </p>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label="Rename"
                            onClick={() => void renameConversation(c.id)}
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete"
                            onClick={() => void deleteConversation(c.id)}
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </aside>

            {/* CENTER */}
            <section
              className="relative rounded-[26px] p-[1.5px] shadow-[0_18px_50px_-30px_hsl(265_60%_50%/0.3)]"
              style={{
                backgroundImage:
                  "conic-gradient(from 210deg at 50% 50%, hsl(189 55% 58% / 0.35), hsl(280 60% 70% / 0.35), hsl(330 75% 72% / 0.4), hsl(265 85% 65% / 0.35), hsl(189 55% 58% / 0.35))",
              }}
            >
             <div className="relative flex min-h-[62vh] flex-col overflow-hidden rounded-[24px] bg-card/95 backdrop-blur">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, hsl(280 75% 72% / 0.35), transparent 65%)" }}
              />
              {/* Command bar */}
              <div className="relative border-b border-foreground/[0.06] p-3">
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-white/80 px-2.5 py-1 text-[11.5px]"
                        title={a.kind === "text" ? "Text will be sent inline" : "Binary — filename only"}
                      >
                        <Paperclip className="h-3 w-3 text-[hsl(265_70%_55%)]" />
                        <span className="max-w-[180px] truncate">{a.name}</span>
                        <span className="text-muted-foreground">{Math.round(a.size / 1024)}KB</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((cur) => cur.filter((x) => x.id !== a.id))}
                          className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => { e.preventDefault(); void send(input); }}
                  className="flex items-center gap-2 rounded-2xl border border-foreground/[0.08] bg-white/80 px-3 py-2 shadow-[0_8px_24px_-18px_hsl(265_60%_50%/0.25)] focus-within:border-[hsl(265_70%_70%)] focus-within:shadow-[0_0_0_4px_hsl(265_85%_92%/0.7)]"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-[hsl(265_70%_60%)]" />
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={listening ? "Listening…" : "Ask anything about Blossom operations…"}
                    disabled={streaming}
                    className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/70"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.csv,.json,.log,.tsv,.yaml,.yml,.pdf,text/*,image/*,application/json,application/pdf"
                    className="hidden"
                    onChange={(e) => void handleFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={toggleDictation}
                    disabled={!dictationSupported}
                    aria-pressed={listening}
                    aria-label={listening ? "Stop dictation" : "Start dictation"}
                    title={dictationSupported ? (listening ? "Stop dictation" : "Dictate a message") : "Voice dictation isn't supported in this browser"}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full transition-colors",
                      !dictationSupported && "opacity-40 cursor-not-allowed",
                      listening
                        ? "bg-rose-500/15 text-rose-600 animate-pulse"
                        : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
                    )}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach files"
                    title={`Attach up to ${MAX_FILES} files (5 MB each)`}
                    className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <Button type="submit" size="sm" disabled={streaming || !input.trim()} className="h-8 rounded-xl">
                    {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>

              {/* Stream */}
              <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-5">
                {messages.length === 0 ? (
                  <EmptyState prompts={quickPrompts} onPick={(p) => void send(p)} />
                ) : (
                  <div className="mx-auto max-w-3xl space-y-5">
                    {messages.map((m) => (
                      <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[88%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
                          m.role === "user"
                            ? "bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_10px_26px_-14px_hsl(265_85%_60%/0.5)]"
                            : "bg-white/85 text-foreground ring-1 ring-foreground/[0.05]",
                        )}>
                          {m.role === "assistant" ? (
                            <>
                              {m.content ? (
                                <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span className="text-[12px]">Thinking…</span>
                                </div>
                              )}
                              {m.sources && m.sources.length > 0 && (
                                <div className="mt-3 border-t border-foreground/[0.06] pt-2.5">
                                  <div className="mb-1.5 flex items-center gap-1.5">
                                    <BookOpen className="h-3 w-3 text-[hsl(265_70%_55%)]" />
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                      Citations · {m.sources.length}
                                    </span>
                                  </div>
                                  <div className="grid gap-1.5 sm:grid-cols-2">
                                    {m.sources.map((s, idx) => {
                                      const sim = typeof s.similarity === "number" ? Math.round(s.similarity * 100) : null;
                                      const inner = (
                                        <div className="group rounded-xl border border-foreground/[0.08] bg-white/70 p-2.5 transition-all hover:border-[hsl(265_70%_75%)] hover:bg-white hover:shadow-[0_8px_22px_-18px_hsl(265_60%_50%/0.45)]">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-md bg-[hsl(265_85%_96%)] text-[9.5px] font-semibold text-[hsl(265_60%_45%)]">
                                                {idx + 1}
                                              </span>
                                              <p className="truncate text-[11.5px] font-semibold text-foreground">{s.title}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                              {sim !== null && (
                                                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-600">
                                                  {sim}%
                                                </span>
                                              )}
                                              {s.url && <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />}
                                            </div>
                                          </div>
                                          {s.snippet && (
                                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                                              {s.snippet}
                                            </p>
                                          )}
                                        </div>
                                      );
                                      return s.url ? (
                                        <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="block">
                                          {inner}
                                        </a>
                                      ) : (
                                        <div key={s.id}>{inner}</div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {m.suggestedActions && m.suggestedActions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {m.suggestedActions.map((a) => (
                                    <Button
                                      key={a.id}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 rounded-full px-3 text-[11.5px]"
                                      onClick={() => {
                                        if (a.to) window.location.assign(a.to);
                                        else toast.message(a.label, { description: "Action will run once AI execution is enabled." });
                                      }}
                                    >
                                      {a.label}
                                      {a.to && <ExternalLink className="ml-1 h-3 w-3" />}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
             </div>
            </section>

            {/* RIGHT: insights + actions */}
            <aside className="hidden flex-col rounded-2xl border border-border/60 bg-card/90 p-4 backdrop-blur lg:flex lg:max-h-[calc(100vh-240px)] overflow-y-auto">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Live Insights</h3>
                <button
                  type="button"
                  onClick={refreshInsights}
                  disabled={insightsRefreshing}
                  aria-label="Refresh insights"
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", insightsRefreshing && "animate-spin")} />
                </button>
              </div>
              <InsightsList
                insights={insights}
                loading={insightsLoading}
                error={insightsError}
                onOpen={(i) => i.href && navigate(i.href)}
              />
              <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Shortcuts</h3>
              <div className="space-y-1">
                {quickPrompts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => void send(p.prompt)}
                    className="w-full rounded-xl px-3 py-2 text-left text-[12px] text-foreground/80 transition-colors hover:bg-foreground/[0.04]"
                  >
                    <Workflow className="mr-1.5 inline h-3 w-3 text-[hsl(265_70%_60%)]" />
                    {p.label}
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        {tab === "saved" && (
          <div className="rounded-2xl border border-border/60 bg-card/90 p-5 backdrop-blur">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">Recent conversations</h3>
            {convs.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">Conversations you start will appear here.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {convs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveId(c.id); setTab("chat"); }}
                    className="rounded-2xl border border-foreground/[0.06] bg-white/80 p-3 text-left transition hover:border-[hsl(265_70%_80%)] hover:shadow-[0_8px_24px_-18px_hsl(265_60%_50%/0.3)]"
                  >
                    <p className="text-[13px] font-semibold text-foreground">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground">{c.messages.length} messages · {new Date(c.updatedAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "knowledge" && (
          <div className="rounded-2xl border border-border/60 bg-card/90 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-foreground/[0.08] bg-white/80 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                placeholder="Search SOPs, workflows, policies, directory…"
                className="flex-1 bg-transparent text-[13px] outline-none"
              />
            </div>
            {kbResults ? (
              <div className="space-y-2">
                {kbResults.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground">No results.</p>
                ) : kbResults.map((e) => (
                  <KbCard key={e.id} title={e.title} content={e.content} category={e.category} />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(kbByCategory).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{cat}</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {items.map((e) => <KbCard key={e.id} title={e.title} content={e.content} category={e.category} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "insights" && (
          <div className="rounded-2xl border border-border/60 bg-card/90 p-5 backdrop-blur">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">Proactive insights</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {insights.map((i) => (
                <div key={i.id} className="rounded-2xl border border-foreground/[0.06] bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-foreground">{i.title}</p>
                    <Badge variant="outline" className={cn(
                      "rounded-full text-[10px]",
                      i.severity === "risk" && "border-rose-200 bg-rose-50 text-rose-600",
                      i.severity === "watch" && "border-amber-200 bg-amber-50 text-amber-700",
                      i.severity === "info" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    )}>{i.severity}</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{i.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OSShell>
  );
}

function EmptyState({ prompts, onPick }: { prompts: ReturnType<typeof quickPromptsFor>; onPick: (p: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-8 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-[hsl(265_85%_65%)] to-[hsl(280_85%_70%)] text-white shadow-[0_18px_40px_-18px_hsl(265_85%_60%/0.6)]">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="text-[18px] font-semibold tracking-tight text-foreground">What can I help with today?</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">Ask anything about training, SOPs, workflows, or your operational data.</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {prompts.slice(0, 8).map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p.prompt)}
            className="group rounded-2xl border border-foreground/[0.06] bg-white/85 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(265_70%_80%)] hover:shadow-[0_18px_36px_-22px_hsl(265_60%_50%/0.4)]"
          >
            <p className="text-[12.5px] font-semibold text-foreground">{p.label}</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground line-clamp-2">{p.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function KbCard({ title, content, category }: { title: string; content: string; category: string }) {
  return (
    <div className="rounded-2xl border border-foreground/[0.06] bg-white/80 p-3.5">
      <div className="mb-1 flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-[hsl(265_70%_60%)]" />
        <p className="text-[12.5px] font-semibold text-foreground">{title}</p>
        <Badge variant="outline" className="ml-auto rounded-full text-[10px]">{category}</Badge>
      </div>
      <p className="text-[11.5px] text-muted-foreground line-clamp-3">{content}</p>
    </div>
  );
}
