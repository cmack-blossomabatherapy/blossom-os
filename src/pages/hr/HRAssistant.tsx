import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Plus, MessageSquare, Loader2, Bot, Trash2, Search, BookOpen, Users, GraduationCap, FileText, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { GlassPanel } from "@/components/shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Conv = { id: string; title: string; last_message_at: string };

const QUICK_PROMPTS = [
  { icon: GraduationCap, label: "What training do I have due?", q: "What training do I have assigned, and what's overdue?" },
  { icon: User, label: "Show my profile", q: "What's my profile info — title, department, hire date?" },
  { icon: Users, label: "Find a coworker", q: "Help me find a coworker. I'll tell you the name." },
  { icon: BookOpen, label: "PTO policy", q: "What's our PTO request policy and how do I submit a request?" },
  { icon: FileText, label: "Find a handbook section", q: "Where can I find the section about session note documentation in the handbook?" },
  { icon: GraduationCap, label: "Onboarding for RBTs", q: "What does onboarding look like for a new RBT?" },
];

export default function HRAssistant() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) void loadConvs(); }, [user]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function loadConvs() {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id,title,last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(50);
    setConvs((data ?? []) as Conv[]);
  }

  async function loadConv(id: string) {
    setActiveConv(id);
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
  }

  async function deleteConv(id: string) {
    const { error } = await supabase.from("chat_conversations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (activeConv === id) newChat();
    void loadConvs();
  }

  async function send(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId: activeConv, message: text }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed to reach assistant" }));
        throw new Error(err.error || "Failed");
      }
      const json = await resp.json();
      if (json.conversationId) setActiveConv(json.conversationId);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: json.content || "_(no response)_" };
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
      setBusy(false);
    }
  }

  const filteredConvs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return convs;
    return convs.filter((c) => c.title.toLowerCase().includes(q));
  }, [convs, search]);

  return (
    <GlassPageShell
      eyebrow="HR · AI Assistant"
      eyebrowIcon={Sparkles}
      title="Blossom Assistant"
      description="Ask anything about training, the handbook, HR policies, your coworkers, or your own profile. The assistant searches across Blossom OS in real time."
      actions={
        <Button size="sm" onClick={newChat}><Plus className="h-3.5 w-3.5 mr-1" /> New chat</Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[300px,1fr]">
        {/* History panel */}
        <GlassPanel bodyClassName="p-3 flex flex-col">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute z-10 left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats…" className="pl-9 h-9" />
          </div>
          <ScrollArea className="max-h-[60vh]">
            {filteredConvs.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">No conversations yet.</p>
            ) : (
              <div className="space-y-1">
                {filteredConvs.map((c) => (
                  <div key={c.id} className={cn("group flex items-center gap-1 rounded-lg px-1 transition-colors", activeConv === c.id && "bg-muted/60")}>
                    <button
                      onClick={() => loadConv(c.id)}
                      className="flex-1 min-w-0 px-2 py-2 text-left rounded-md hover:bg-muted/40"
                    >
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</p>
                    </button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteConv(c.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </GlassPanel>

        {/* Chat panel */}
        <GlassPanel bodyClassName="p-0 flex flex-col h-[75vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4 max-w-2xl mx-auto pt-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold">How can I help?</h2>
                  <p className="text-sm text-muted-foreground">Try one of these or ask your own question.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => void send(p.q)}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <p.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{p.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.q}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground",
                )}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-pre:my-2 dark:prose-invert">
                      {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-xs">Looking it up…</span>
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

          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="border-t border-border/60 bg-background/60 px-4 py-3 backdrop-blur-xl"
          >
            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Blossom anything — training, HR, coworkers, policies…"
                disabled={busy}
                className="flex-1 bg-card"
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()} className="h-10 w-10 shrink-0">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Public directory info only (name, role, work email/phone). For pay, benefits, or personal records, contact HR.</p>
          </form>
        </GlassPanel>
      </div>
    </GlassPageShell>
  );
}
