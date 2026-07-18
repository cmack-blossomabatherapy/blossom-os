import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, MessageSquare, GraduationCap, AlertTriangle, HeartHandshake, Sparkles, ClipboardList } from "lucide-react";
import { useSupervisionBrief } from "./useSupervisionBrief";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rbtEmployeeId: string | null;
  rbtName: string;
}

function Section({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {icon} {title}
      </div>
      {children ?? <span className="text-sm text-muted-foreground">{empty ?? "Nothing to review."}</span>}
    </div>
  );
}

function fmt(d?: string | null) { try { return d ? new Date(d).toLocaleDateString() : "—"; } catch { return "—"; } }

export function SupervisionBriefDrawer({ open, onOpenChange, rbtEmployeeId, rbtName }: Props) {
  const { data, isLoading } = useSupervisionBrief(rbtEmployeeId, rbtName);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Supervision brief — {rbtName}</SheetTitle>
          <SheetDescription>What to discuss before you meet.</SheetDescription>
        </SheetHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading brief…
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <Section title="Recommended discussion" icon={<Sparkles className="h-3.5 w-3.5" />}>
              {data.recommendedDiscussion.length ? (
                <ul className="text-sm space-y-1">
                  {data.recommendedDiscussion.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              ) : <span className="text-sm text-muted-foreground">All caught up.</span>}
            </Section>

            <Section title="RBT assignments" icon={<Users className="h-3.5 w-3.5" />}>
              {data.assignments.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.assignments.map((a, i) => (
                    <Badge key={i} variant="outline">{a.client_name ?? "Unnamed"} · {a.status ?? "active"}</Badge>
                  ))}
                </div>
              ) : <span className="text-sm text-muted-foreground">No active assignments.</span>}
            </Section>

            <Section title="Recent schedule (14 days)" icon={<Calendar className="h-3.5 w-3.5" />}>
              {data.recentSchedule.length ? (
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {data.recentSchedule.map((s, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>{fmt(s.session_date)} · {s.client_name ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{s.session_status ?? "scheduled"}</span>
                    </li>
                  ))}
                </ul>
              ) : <span className="text-sm text-muted-foreground">No recent sessions.</span>}
            </Section>

            <Section title="Prior feedback" icon={<MessageSquare className="h-3.5 w-3.5" />}>
              {data.priorFeedback.length ? (
                <ul className="text-sm space-y-2">
                  {data.priorFeedback.map((p, i) => (
                    <li key={i} className="border-l-2 border-border pl-2">
                      <div className="text-xs text-muted-foreground">{fmt(p.occurred_at)}</div>
                      <div>{p.feedback ?? "—"}</div>
                      {p.followup_action && <div className="text-xs italic mt-1">Follow-up: {p.followup_action}</div>}
                    </li>
                  ))}
                </ul>
              ) : <span className="text-sm text-muted-foreground">No prior feedback recorded.</span>}
            </Section>

            <Section title="Open training assignments" icon={<GraduationCap className="h-3.5 w-3.5" />}>
              {data.openTraining.length ? (
                <ul className="text-sm space-y-1">
                  {data.openTraining.map((t, i) => <li key={i}>• {t.course_id ?? "Course"} — {t.status}</li>)}
                </ul>
              ) : <span className="text-sm text-muted-foreground">None open.</span>}
            </Section>

            <Section title="RBT-submitted questions" icon={<MessageSquare className="h-3.5 w-3.5" />}>
              {data.submittedQuestions.length ? (
                <ul className="text-sm space-y-1">
                  {data.submittedQuestions.map(q => <li key={q.id}>• {q.body}</li>)}
                </ul>
              ) : <span className="text-sm text-muted-foreground">No open questions.</span>}
            </Section>

            <Section title="Family or case concerns" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
              {data.familyConcerns.length ? (
                <ul className="text-sm space-y-1">
                  {data.familyConcerns.map((c, i) => <li key={i}>• {c.concern} <span className="text-xs text-muted-foreground">({c.status})</span></li>)}
                </ul>
              ) : <span className="text-sm text-muted-foreground">None reported.</span>}
            </Section>

            <Section title="First-90-day responses" icon={<ClipboardList className="h-3.5 w-3.5" />}>
              {data.first90Responses.length ? (
                <ul className="text-sm space-y-1">
                  {data.first90Responses.map(r => <li key={r.id}>• {r.response ?? "—"}</li>)}
                </ul>
              ) : <span className="text-sm text-muted-foreground">No responses yet.</span>}
            </Section>

            <Section title="Recent recognition" icon={<HeartHandshake className="h-3.5 w-3.5" />}>
              {data.recentRecognition.length ? (
                <ul className="text-sm space-y-1">
                  {data.recentRecognition.map((r, i) => <li key={i}>• {r.note}</li>)}
                </ul>
              ) : <span className="text-sm text-muted-foreground">None recorded.</span>}
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}