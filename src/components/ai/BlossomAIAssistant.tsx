import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, X, Send, ExternalLink, HelpCircle, Loader2, ThumbsUp, ThumbsDown, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useOSRole } from "@/contexts/OSRoleContext";
import { streamAskBlossom } from "@/lib/ai/askBlossomAdapter";
import type { AiSource } from "@/lib/ai/types";
import type { OSRole } from "@/lib/os/permissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentRecordContext, recordContextSuggestions } from "@/hooks/useCurrentRecordContext";

/* ------------------------------------------------------------------ */
/* Types & context                                                     */
/* ------------------------------------------------------------------ */

export type BlossomAISurface =
  | "global"
  | "resource-library"
  | "training"
  | "report"
  | "page-help";

export interface BlossomAIOpenOptions {
  surface?: BlossomAISurface;
  title?: string;
  /** Short natural-language description of the current page / record to prepend to the prompt. */
  contextText?: string;
  /** Suggested prompts shown as chips. */
  suggestions?: string[];
  /** Optional prompt to auto-send on open. */
  initialPrompt?: string;
  /** Extra guidance rendered under the header. */
  hint?: string;
  /** Restrict what the coach will and won't do (e.g. Training coach guardrails). */
  guardrails?: string[];
}

interface Ctx {
  open: (opts?: BlossomAIOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
}

const BlossomAICtx = createContext<Ctx | null>(null);

export function useBlossomAI(): Ctx {
  const ctx = useContext(BlossomAICtx);
  if (!ctx) throw new Error("useBlossomAI must be used inside <BlossomAIProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Roles allowed to use Blossom AI (permission gate)                   */
/* ------------------------------------------------------------------ */

// Blossom AI is available to every operational role in the OS.
// Retrieval itself is filtered by RLS (`match_resource_chunks` respects the
// caller's JWT), so the UI simply hides for un-authenticated / no-role users.
export function canUseBlossomAI(role: OSRole | null | undefined): boolean {
  return Boolean(role);
}

/* ------------------------------------------------------------------ */
/* Provider + Drawer                                                   */
/* ------------------------------------------------------------------ */

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AiSource[];
  streaming?: boolean;
  logId?: string | null;
  destructive?: boolean;
  feedback?: 1 | -1 | null;
}
// Keywords that suggest the user wants Blossom to *do* something sensitive.
// The server prompt already refuses; the UI adds a visible confirm-before-you-act banner.
const DESTRUCTIVE_INTENT_RE =
  /\b(send|email|update|change|delete|remove|submit|approve|deny|payroll|permission|role|reauth|authorization|credential|password|mfa|nfc)\b/i;

function isDestructiveIntent(text: string): boolean {
  return DESTRUCTIVE_INTENT_RE.test(text);
}

const DEFAULT_SUGGESTIONS: Record<BlossomAISurface, string[]> = {
  global: [
    "What should I focus on today?",
    "Summarize this week's operational risks",
    "Which SOP covers the intake call?",
  ],
  "resource-library": [
    "Show me resources for my role",
    "What SOP explains the VOB process?",
    "Find intake phone-call guidance",
    "Summarize this policy in plain language",
  ],
  training: [
    "Explain this module in simpler terms",
    "What should I review after this quiz?",
    "Which SOP goes with this training?",
    "Show me resources for my role's training",
  ],
  report: [
    "What do the columns on this report mean?",
    "How is this metric calculated?",
    "What does the uploaded data represent?",
  ],
  "page-help": [
    "What is this page for?",
    "What do I do next?",
    "Which SOP applies here?",
    "Who owns this workflow?",
  ],
};

const SURFACE_LABEL: Record<BlossomAISurface, string> = {
  global: "Blossom AI",
  "resource-library": "Resource Library assistant",
  training: "Training coach",
  report: "Report assistant",
  "page-help": "Page help",
};

export function BlossomAIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<BlossomAIOpenOptions>({});

  const open = useCallback((o?: BlossomAIOpenOptions) => {
    setOpts(o ?? {});
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<Ctx>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <BlossomAICtx.Provider value={value}>
      {children}
      <BlossomAIDrawer isOpen={isOpen} onClose={close} opts={opts} />
    </BlossomAICtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

function BlossomAIDrawer({
  isOpen,
  onClose,
  opts,
}: {
  isOpen: boolean;
  onClose: () => void;
  opts: BlossomAIOpenOptions;
}) {
  const { role, activeState } = useOSRole();
  const surface = opts.surface ?? "global";
  const title = opts.title ?? SURFACE_LABEL[surface];
  const record = useCurrentRecordContext();
  const suggestions =
    opts.suggestions ??
    (record.kind ? recordContextSuggestions(record.kind) ?? DEFAULT_SUGGESTIONS[surface] : DEFAULT_SUGGESTIONS[surface]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset conversation when drawer opens with a new context.
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput("");
      // Auto-send initial prompt if provided.
      if (opts.initialPrompt) {
        setTimeout(() => send(opts.initialPrompt!), 60);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, opts.initialPrompt, opts.contextText, opts.title]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const buildContextualPrompt = useCallback(
    (userText: string) => {
      const parts: string[] = [];
      // Auto-inject the currently selected record (lead/client/authorization) so
      // Blossom AI can answer "this" questions without the user re-typing IDs.
      if (record.contextText) {
        parts.push(`Selected record (${record.kind}):\n${record.contextText}`);
      }
      if (opts.contextText) parts.push(`Context: ${opts.contextText}`);
      if (opts.guardrails?.length) {
        parts.push(`Guardrails: ${opts.guardrails.join("; ")}`);
      }
      parts.push(`Question: ${userText}`);
      return parts.join("\n\n");
    },
    [opts.contextText, opts.guardrails, record.contextText, record.kind],
  );

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || busy) return;
      setBusy(true);
      const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: clean };
      const asstMsg: Msg = { id: `a-${Date.now()}`, role: "assistant", content: "", streaming: true };
      setMessages((prev) => [...prev, userMsg, asstMsg]);
      setInput("");

      try {
        const stream = streamAskBlossom(buildContextualPrompt(clean), role, activeState);
        let acc = "";
        const destructive = isDestructiveIntent(clean);
        while (true) {
          const next = await stream.next();
          if (next.done) {
            const final = next.value;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsg.id
                  ? {
                      ...m,
                      content: final?.content || acc,
                      sources: final?.sources ?? [],
                      streaming: false,
                      logId: final?.logId ?? null,
                      destructive,
                    }
                  : m,
              ),
            );
            break;
          }
          acc += next.value;
          setMessages((prev) =>
            prev.map((m) => (m.id === asstMsg.id ? { ...m, content: acc } : m)),
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "AI request failed.";
        setMessages((prev) =>
          prev.map((m) => (m.id === asstMsg.id ? { ...m, content: msg, streaming: false } : m)),
        );
      } finally {
        setBusy(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [buildContextualPrompt, role, activeState, busy],
  );

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (!v ? onClose() : null)}>
      <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-tight">{title}</SheetTitle>
              {opts.hint && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{opts.hint}</p>
              )}
              {record.label && (
                <p className="text-[11px] text-primary mt-0.5 truncate" title={record.contextText ?? undefined}>
                  Using context · {record.label}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>

        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ask about anything you can access. Answers cite the resources they came from.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-border/60 bg-background hover:bg-muted/60 text-foreground transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {opts.guardrails?.length ? (
                <div className="rounded-md border border-amber-200/60 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/40 px-3 py-2 text-[11px] leading-relaxed">
                  <div className="font-medium mb-0.5">Coach guardrails</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {opts.guardrails.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onClose={onClose} />
          ))}

          {busy && messages[messages.length - 1]?.streaming && !messages[messages.length - 1]?.content && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask Blossom…"
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm max-h-32 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              disabled={busy}
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Blossom AI only sees resources your role can access. Answers may be incomplete — verify critical information against the source.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Message bubble + sources                                            */
/* ------------------------------------------------------------------ */

function MessageBubble({ msg, onClose }: { msg: Msg; onClose: () => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted/60 text-foreground rounded-bl-sm",
        )}
      >
        {msg.content || (msg.streaming ? "…" : "")}
        {!isUser && !msg.streaming && msg.destructive && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-200/70 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Blossom AI can draft this, but it will not send or change records for you. Review and take the action yourself.</span>
          </div>
        )}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <SourcesList sources={msg.sources} onClose={onClose} />
        )}
        {!isUser && !msg.streaming && msg.logId && (
          <FeedbackControls logId={msg.logId} initial={msg.feedback ?? null} />
        )}
      </div>
    </div>
  );
}

function FeedbackControls({ logId, initial }: { logId: string; initial: 1 | -1 | null }) {
  const [vote, setVote] = useState<1 | -1 | null>(initial);
  const [busy, setBusy] = useState(false);

  const submit = async (rating: 1 | -1) => {
    if (busy || vote === rating) return;
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("ai_message_feedback").insert({
        user_id: userData?.user?.id ?? null,
        message_id: logId,
        rating,
      });
      if (error) throw error;
      setVote(rating);
      toast.success(rating > 0 ? "Thanks — noted" : "Thanks — we'll review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Feedback failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1 pt-1.5 border-t border-border/40">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Helpful?</span>
      <button
        onClick={() => submit(1)}
        disabled={busy}
        aria-label="Helpful"
        className={cn(
          "h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center transition",
          vote === 1 && "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
        )}
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => submit(-1)}
        disabled={busy}
        aria-label="Not helpful"
        className={cn(
          "h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center transition",
          vote === -1 && "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
        )}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}

function SourcesList({ sources, onClose }: { sources: AiSource[]; onClose: () => void }) {
  return (
    <div className="mt-3 pt-2.5 border-t border-border/40 space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        Sources
      </div>
      {sources.map((s, i) => {
        const to = s.sourceId ? `/resource-library/${s.sourceId}` : s.url;
        const inner = (
          <span className="flex items-center gap-1.5 text-xs text-foreground/90 hover:text-primary group">
            <span className="text-[10px] font-mono text-muted-foreground">[{i + 1}]</span>
            <span className="truncate">{s.title}</span>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-70 shrink-0" />
          </span>
        );
        if (!to) return <div key={s.id}>{inner}</div>;
        if (to.startsWith("http")) {
          return (
            <a key={s.id} href={to} target="_blank" rel="noreferrer" className="block">
              {inner}
            </a>
          );
        }
        return (
          <Link key={s.id} to={to} onClick={onClose} className="block">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public triggers                                                     */
/* ------------------------------------------------------------------ */

/** Floating global launcher — mounted once by OSShell. */
export function BlossomAILauncher() {
  const { role } = useOSRole();
  const { open, isOpen } = useBlossomAI();
  if (!canUseBlossomAI(role) || isOpen) return null;
  return (
    <button
      onClick={() => open({ surface: "global" })}
      className="fixed bottom-24 right-6 z-40 h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition flex items-center justify-center"
      aria-label="Open Blossom AI"
      title="Ask Blossom AI"
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}

/** Inline "Ask Blossom" pill button for embedding in any page/section. */
export function BlossomAIButton({
  surface = "page-help",
  label = "Ask Blossom",
  className,
  ...opts
}: BlossomAIOpenOptions & { label?: string; className?: string }) {
  const { role } = useOSRole();
  const { open } = useBlossomAI();
  if (!canUseBlossomAI(role)) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => open({ surface, ...opts })}
      className={cn(
        "gap-1.5 border-purple-200/60 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 hover:from-purple-100 hover:to-indigo-100 dark:from-purple-950/30 dark:to-indigo-950/30 dark:text-purple-200 dark:border-purple-900/40",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/** Compact icon-only trigger for headers/toolbars. */
export function PageHelpButton({
  title,
  contextText,
  suggestions,
}: {
  title?: string;
  contextText?: string;
  suggestions?: string[];
}) {
  const { role } = useOSRole();
  const { open } = useBlossomAI();
  if (!canUseBlossomAI(role)) return null;
  return (
    <button
      onClick={() =>
        open({
          surface: "page-help",
          title: title ? `Help · ${title}` : "Page help",
          contextText,
          suggestions,
        })
      }
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
      aria-label="Ask Blossom for help with this page"
    >
      <HelpCircle className="h-3.5 w-3.5" />
      <span>Help</span>
    </button>
  );
}

// Silence unused imports warnings where we intentionally re-export types.
export type { AiSource };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _navigateTypeRef = useNavigate;