import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockCandidates, type Candidate, type CandidateRole } from "@/data/recruiting";

interface Props {
  role: CandidateRole;
  searchQuery: string;
  filter: (c: Candidate) => boolean;
}

const sections = [
  {
    id: "stuck",
    title: "Stuck — Needs Action",
    icon: AlertCircle,
    iconClass: "text-destructive",
    description: "Candidates not moving > 10 days",
    match: (c: Candidate) => c.daysInStage > 10,
  },
  {
    id: "missing-data",
    title: "Missing Interview Data",
    icon: AlertCircle,
    iconClass: "text-warning",
    description: "Schedule a screening to capture availability + travel + experience",
    match: (c: Candidate) => !c.interview && c.stage !== "New Applicant",
  },
  {
    id: "offer-stage",
    title: "Offer Stage — Awaiting Response",
    icon: Clock,
    iconClass: "text-info",
    description: "Offer sent or being prepared",
    match: (c: Candidate) => ["Offer Sent", "Offer", "Offer Accepted"].includes(c.stage),
  },
  {
    id: "ready",
    title: "Ready for Staffing",
    icon: CheckCircle2,
    iconClass: "text-success",
    description: "Onboarded and ready to be matched to a client",
    match: (c: Candidate) => c.stage === "Ready for Staffing" || c.stage === "Ready for Assignment",
  },
];

export function RecruitingQueueView({ role, searchQuery, filter }: Props) {
  const navigate = useNavigate();
  const candidates = mockCandidates.filter((c) => {
    if (c.role !== role) return false;
    if (!filter(c)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.recruiter.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        const items = candidates.filter(s.match);
        return (
          <div key={s.id} className="bg-card rounded-xl border border-border/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <s.icon className={cn("h-4 w-4", s.iconClass)} />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border/60">
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground italic text-center">No candidates in this group</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10">
                    {["Candidate", "Stage", "Location", "Recruiter", "Days", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/recruiting/${c.id}`)}
                      className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.stage}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.city}, {c.state}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.recruiter}</td>
                      <td className={cn("px-4 py-2.5 font-medium tabular-nums", c.daysInStage > 10 ? "text-destructive" : "text-muted-foreground")}>
                        {c.daysInStage}d
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          Open <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
