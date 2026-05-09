import { Link } from "react-router-dom";
import { Check, ExternalLink, ArrowUpRight, ListChecks, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { acknowledge, hasAcknowledged, unacknowledge, getOnboardingState, setNote } from "@/lib/onboarding/storage";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

export interface ActionItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;            // internal route or external URL
  external?: boolean;       // open in new tab
  icon?: LucideIcon;
  optional?: boolean;       // doesn't gate completion
  /** When true, surfaces a textarea — action only completable once typed. */
  prompt?: boolean;
  promptPlaceholder?: string;
}

interface Props {
  moduleKey: string;
  actions: ActionItem[];
  onAllComplete?: () => void;
  /** Bumped externally when state should refresh (e.g. parent tick). */
  refreshTick?: number;
}

const ackKey = (mod: string, id: string) => `${mod}:action:${id}`;

export function ActionChecklist({ moduleKey, actions, onAllComplete, refreshTick }: Props) {
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  useEffect(() => {
    const r = () => bump();
    window.addEventListener("blossom:onboarding-change", r);
    return () => window.removeEventListener("blossom:onboarding-change", r);
  }, []);
  useEffect(() => { bump(); }, [refreshTick]);

  const required = actions.filter((a) => !a.optional);
  const doneCount = useMemo(
    () => required.filter((a) => hasAcknowledged(ackKey(moduleKey, a.id))).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actions, moduleKey, refreshTick],
  );
  const percent = required.length === 0 ? 100 : Math.round((doneCount / required.length) * 100);

  const notes = getOnboardingState().notes || {};

  const setDone = (a: ActionItem, value: boolean) => {
    const k = ackKey(moduleKey, a.id);
    if (value) {
      // Prompt items require typed text before they can be marked done
      if (a.prompt) {
        const text = (notes[k] || "").trim();
        if (text.length === 0) return;
      }
      if (!hasAcknowledged(k)) acknowledge(k);
    } else {
      if (hasAcknowledged(k)) unacknowledge(k);
    }
    bump();
    setTimeout(() => {
      if (value && required.every((x) => hasAcknowledged(ackKey(moduleKey, x.id)))) {
        onAllComplete?.();
      }
    }, 0);
  };
  const toggle = (a: ActionItem) => setDone(a, !hasAcknowledged(ackKey(moduleKey, a.id)));

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Quick checklist</p>
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">{doneCount}/{required.length} done</span>
      </div>
      <Progress value={percent} className="h-1.5" />
      <ul className="space-y-1.5">
        {actions.map((a) => {
          const k = ackKey(moduleKey, a.id);
          const done = hasAcknowledged(k);
          const Icon = a.icon;
          const isExternal = a.external || (a.href ? /^https?:\/\//.test(a.href) : false);
          const noteText = notes[k] || "";
          const promptReady = !a.prompt || noteText.trim().length > 0;

          const inner = (
            <div
              className={cn(
                "group flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                done
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border/50 bg-background hover:border-primary/40 hover:bg-primary/[0.03]",
              )}
            >
              <button
                type="button"
                aria-label={done ? "Completed" : "Mark complete"}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(a); }}
                disabled={!done && !promptReady}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-background hover:border-primary/60",
                  !done && !promptReady && "opacity-50 cursor-not-allowed",
                )}
              >
                {done && <Check className="h-3 w-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", done ? "text-emerald-600" : "text-primary")} />}
                  <p className={cn(
                    "text-sm font-medium leading-tight",
                    done ? "text-muted-foreground line-through" : "text-foreground",
                  )}>
                    {a.label}
                  </p>
                  {a.optional && (
                    <span className="rounded-full border border-border/60 px-1.5 py-0 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Optional</span>
                  )}
                </div>
                {a.hint && (
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{a.hint}</p>
                )}
                {a.prompt && (
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="mt-2">
                    <Textarea
                      value={noteText}
                      onChange={(e) => { setNote(k, e.target.value); bump(); }}
                      placeholder={a.promptPlaceholder || "Type your reflection here…"}
                      rows={3}
                      className="resize-none text-sm"
                    />
                    {!done && (
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {noteText.trim().length > 0 ? `${noteText.trim().split(/\s+/).length} words` : "Type a few words to enable completion"}
                        </span>
                        <button
                          type="button"
                          disabled={!promptReady}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDone(a, true); }}
                          className={cn(
                            "rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground",
                            !promptReady && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          Save & complete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {a.href && !a.prompt && (
                <span className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all",
                  "group-hover:bg-primary group-hover:text-primary-foreground",
                )}>
                  {isExternal ? <ExternalLink className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                </span>
              )}
              {done && (
                <button
                  type="button"
                  aria-label="Uncheck"
                  title="Uncheck"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDone(a, false); }}
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );

          // The whole row navigates AND auto-marks complete when href present.
          if (a.href && !a.prompt) {
            const handleNavClick = () => {
              if (!done) setDone(a, true);
            };
            return (
              <li key={a.id}>
                {isExternal ? (
                  <a href={a.href} target="_blank" rel="noopener noreferrer" onClick={handleNavClick}>
                    {inner}
                  </a>
                ) : (
                  <Link to={a.href} onClick={handleNavClick}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          }
          // Prompt items: render plain (textarea handles its own clicks)
          if (a.prompt) {
            return <li key={a.id}>{inner}</li>;
          }
          // No href — click anywhere toggles
          return (
            <li key={a.id}>
              <button type="button" onClick={() => toggle(a)} className="block w-full">
                {inner}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
