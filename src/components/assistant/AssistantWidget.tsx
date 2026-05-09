import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Plus, MessageSquare, X, Loader2, Bot, ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Source = { title: string; url?: string; tool?: string };
type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  vote?: "up" | "down" | null;
};
type Conv = { id: string; title: string; last_message_at: string };

const SUGGESTIONS = [
  "What's our PTO request process?",
  "How do I submit a session note?",
  "Show me onboarding modules for RBTs.",
  "What's the dress code at the clinic?",
];

export function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    void loadConvs();
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function loadConvs() {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id,title,last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(30);
    setConvs((data ?? []) as Conv[]);
  }

  async function loadConv(id: string) {
    setActiveConv(id);
    setShowHistory(false);
    const { data } = await supabase
      .from("chat_messages")
      .select("id,role,content,metadata")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    const rows = (data ?? []).filter((m) => m.role !== "system");
    const ids = rows.filter((m) => m.role === "assistant").map((m) => m.id);
    let voteMap: Record<string, "up" | "down"> = {};
    if (ids.length > 0) {
      const { data: fb } = await supabase
        .from("chat_message_feedback")
        .select("message_id,vote")
        .in("message_id", ids);
      voteMap = Object.fromEntries((fb ?? []).map((r) => [r.message_id as string, r.vote as "up" | "down"]));
    }
    setMessages(
      rows.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: (m.metadata?.sources as Source[]) ?? undefined,
        vote: m.role === "assistant" ? voteMap[m.id] ?? null : undefined,
      })),
    );
  }

  function newChat() {
    setActiveConv(null);
    setMessages([]);
    setShowHistory(false);
  }

  async function send(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: activeConv, message: text }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed to reach assistant" }));
        throw new Error(err.error || "Failed");
      }

      const json = await resp.json();
      if (json.conversationId) setActiveConv(json.conversationId);
      const assistantText = json.content || "_(no response)_";
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          id: json.messageId,
          role: "assistant",
          content: assistantText,
          sources: (json.sources as Source[]) ?? undefined,
          vote: null,
        };
        return next;
      });
      void loadConvs();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Assistant error";
      toast.error(msg);
      setMessages((m) => {
        const next = [...m];
        if (next[next.length - 1]?.role === "assistant" && !next[next.length - 1].content) {
          next[next.length - 1] = { role: "assistant", content: `_Sorry — ${msg}_` };
        }
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  async function vote(messageId: string | undefined, v: "up" | "down") {
    if (!messageId || !user) return;
    const current = messages.find((m) => m.id === messageId)?.vote ?? null;
    const nextVote = current === v ? null : v;
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, vote: nextVote } : m)));
    try {
      if (nextVote === null) {
        await supabase.from("chat_message_feedback").delete().eq("message_id", messageId).eq("user_id", user.id);
      } else {
        await supabase
          .from("chat_message_feedback")
          .upsert(
            { message_id: messageId, user_id: user.id, vote: nextVote },
            { onConflict: "message_id" },
          );
      }
    } catch (e) {
      toast.error("Couldn't save feedback");
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, vote: current } : m)));
    }
  }

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
       className="fixed bottom-20 right-5 z-40 group flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary/80 px-4 py-3 text-primary-foreground shadow-[0_18px_40px_-12px_hsl(var(--primary)/0.6)] ring-1 ring-primary-foreground/10 transition-all hover:scale-[1.03] hover:shadow-[0_22px_50px_-12px_hsl(var(--primary)/0.7)] md:bottom-5"
        aria-label="Open Blossom Assistant"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden text-sm font-semibold md:inline">Ask Blossom</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex h-dvh w-full max-w-md flex-col border-0 bg-gradient-to-b from-background to-background/95 p-0 sm:max-w-md">
          <header className="flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold">Blossom Assistant</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI · trained on your handbook</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory((v) => !v)} title="History">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={newChat} title="New chat">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {showHistory ? (
            <ScrollArea className="flex-1 px-3 py-2">
              {convs.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-muted-foreground">No conversations yet.</p>
              ) : convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadConv(c.id)}
                  className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50", activeConv === c.id && "bg-muted/60")}
                >
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</p>
                </button>
              ))}
            </ScrollArea>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Ask anything about training, the handbook, SOPs, or how to use Blossom OS.</p>
                  <div className="grid gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void send(s)}
                        className="rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-left text-xs text-foreground transition-all hover:border-primary/40 hover:bg-card"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground",
                  )}>
                    {m.role === "assistant" ? (
                      <div>
                        <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:my-2 dark:prose-invert">
                          {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        </div>
                        {m.sources && m.sources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sources</span>
                            {m.sources.slice(0, 6).map((s, si) => (
                              s.url ? (
                                <a key={si} href={s.url} target="_blank" rel="noreferrer"
                                  className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10px] text-foreground hover:border-primary/50 hover:text-primary">
                                  <span className="truncate">{s.title}</span>
                                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              ) : (
                                <span key={si} className="inline-flex max-w-[180px] truncate rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {s.title}
                                </span>
                              )
                            ))}
                          </div>
                        )}
                        {m.id && m.content && !streaming && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void vote(m.id, "up")}
                              aria-label="Helpful"
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                                m.vote === "up" && "bg-primary/15 text-primary",
                              )}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void vote(m.id, "down")}
                              aria-label="Not helpful"
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                                m.vote === "down" && "bg-destructive/15 text-destructive",
                              )}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="border-t border-border/60 bg-background/80 px-3 py-3 backdrop-blur-xl"
          >
            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Blossom anything…"
                disabled={streaming}
                className="flex-1 bg-card"
              />
              <Button type="submit" size="icon" disabled={streaming || !input.trim()} className="h-10 w-10 shrink-0">
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}