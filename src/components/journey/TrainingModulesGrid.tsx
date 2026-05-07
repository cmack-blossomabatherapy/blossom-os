import { useState } from "react";
import { Check, Clock, ExternalLink, Info, Mail, Play, User } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import type { TrainingModule } from "@/data/journey";

interface Props {
  modules: TrainingModule[];
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
}

const CATEGORY_TONE: Record<TrainingModule["category"], string> = {
  Compliance: "bg-warning/10 text-warning border-warning/30",
  Clinical: "bg-info/10 text-info border-info/30",
  Operations: "bg-primary/10 text-primary border-primary/30",
  Methodology: "bg-success/10 text-success border-success/30",
};

export function TrainingModulesGrid({ modules, completed, onToggle }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = modules.find((m) => m.id === openId) ?? null;

  return (
    <div className="glass-surface rounded-3xl p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Training modules</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Click a module to see links, materials, and your training contact.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((m) => {
          const isDone = !!completed[m.id];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setOpenId(m.id)}
              className={cn(
                "text-left rounded-xl border p-4 transition-all w-full",
                isDone
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50"
                  : "border-border/60 hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", CATEGORY_TONE[m.category])}>
                  {m.category}
                </span>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                  isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {isDone ? "Completed" : "Not started"}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>Assigned by <span className="font-medium text-foreground">{m.assignedBy}</span></span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {m.estMinutes} min</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-primary">
                <Info className="h-3 w-3" /> View details
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border", CATEGORY_TONE[active.category])}>
                    {active.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {active.estMinutes} min
                  </span>
                </div>
                <DialogTitle className="mt-2">{active.title}</DialogTitle>
                <DialogDescription>{active.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {active.moreInfo && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">More information</p>
                    <p className="text-sm text-foreground/90">{active.moreInfo}</p>
                  </div>
                )}

                {active.links && active.links.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Helpful links</p>
                    <div className="grid grid-cols-1 gap-2">
                      {active.links.map((l) => {
                        const internal = l.url.startsWith("/");
                        const inner = (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{l.label}</p>
                              {l.description && <p className="text-[11px] text-muted-foreground truncate">{l.description}</p>}
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </>
                        );
                        const cls = "flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 hover:border-primary/40 hover:bg-muted/40 transition-colors";
                        return internal ? (
                          <Link key={l.url} to={l.url} className={cls} onClick={() => setOpenId(null)}>{inner}</Link>
                        ) : (
                          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(active.coordinatorName || active.coordinatorEmail) && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Training contact</p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{active.coordinatorName ?? "Training Coordinator"}</p>
                        {active.coordinatorRole && <p className="text-[11px] text-muted-foreground truncate">{active.coordinatorRole}</p>}
                      </div>
                      {active.coordinatorEmail && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`mailto:${active.coordinatorEmail}?subject=${encodeURIComponent(`Question about: ${active.title}`)}`}>
                            <Mail className="h-3.5 w-3.5" /> Email
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground">
                  Assigned by <span className="font-medium text-foreground">{active.assignedBy}</span>
                </div>
              </div>

              <DialogFooter className="flex-row gap-2 sm:justify-between">
                <Button variant="ghost" onClick={() => setOpenId(null)}>Close</Button>
                <Button
                  variant={completed[active.id] ? "outline" : "default"}
                  onClick={() => onToggle(active.id)}
                >
                  {completed[active.id] ? <><Check className="h-3.5 w-3.5" /> Mark incomplete</> : <><Play className="h-3.5 w-3.5" /> Mark started / complete</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
