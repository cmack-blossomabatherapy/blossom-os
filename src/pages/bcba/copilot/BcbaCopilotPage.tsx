import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOSRole } from "@/contexts/OSRoleContext";
import { streamAskBlossom } from "@/lib/ai/askBlossomAdapter";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which clients on my caseload have PRs due in the next 30 days?",
  "Summarize this week's supervision status for my RBTs.",
  "Which authorizations on my caseload expire soon?",
  "What QA corrections are open on my clients?",
];

/**
 * BCBA Caseload Copilot — scoped Blossom AI experience for BCBAs.
 * Constrained server-side by role="bcba" (permissions filter to assigned
 * caseload, supervision, PRs, and QA feedback). No cross-caseload data.
 */
export default function BcbaCopilotPage() {
  const { activeState } = useOSRole();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [convId, setConvId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || streaming) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: prompt };
    const asstId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: asstId, role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      const gen = streamAskBlossom(prompt, "bcba", activeState ?? "", convId);
      let acc = "";
      while (true) {
        const { value, done } = await gen.next();
        if (done) {
          if (value?.conversationId) setConvId(value.conversationId);
          break;
        }
        acc += value;
        setMessages((m) => m.map((msg) => (msg.id === asstId ? { ...msg, content: acc } : msg)));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Copilot request failed.";
      setMessages((m) => m.map((x) => (x.id === asstId ? { ...x, content: msg } : x)));
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Caseload Copilot</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Scoped to your caseload — supervision, PRs, and QA feedback for your assigned clients and RBTs.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-3 w-3" /> Caseload-scoped
        </Badge>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-card/40 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Ask about your caseload</p>
              <p className="text-xs text-muted-foreground">Cross-caseload and org-wide data are not available here.</p>
            </div>
            <div className="grid w-full max-w-lg gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background/70 p-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about your caseload…"
          className="min-h-[40px] max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}