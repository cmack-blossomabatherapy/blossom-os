import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Plus, MessageSquare, X, Loader2, Bot } from "lucide-react";
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

type Msg = { id?: string; role: "user" | "assistant"; content: string };
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
      .select("id,role,content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []).filter((m) => m.role !== "system") as Msg[]);
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

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let assistantText = "";
      let convId = activeConv;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") && !line.startsWith("event: ")) continue;
          if (line.startsWith("event: meta")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            if (parsed.conversationId) {
              convId = parsed.conversationId;
              setActiveConv(convId);
              continue;
            }
            const c = parsed?.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { role: "assistant", content: assistantText };
                return next;
              });
            }
          } catch { /* partial */ }
        }
      }
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

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary/80 px-4 py-3 text-primary-foreground shadow-[0_18px_40px_-12px_hsl(var(--primary)/0.6)] ring-1 ring-primary-foreground/10 transition-all hover:scale-[1.03] hover:shadow-[0_22px_50px_-12px_hsl(var(--primary)/0.7)]"
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
                      <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:my-2 dark:prose-invert">
                        {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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