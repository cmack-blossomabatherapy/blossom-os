import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Sparkles, GraduationCap, FileText, ArrowUpRight, History, Zap } from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sopChanges } from "@/data/blossomEnterprise";
import { SopDetailDrawer, type SopCitation } from "@/components/enterprise/SopDetailDrawer";

/* ---------- Mock SOP corpus (sectioned for semantic-style retrieval) ---------- */

interface SopSection {
  id: string;
  sopId: string;
  sopTitle: string;
  section: string;
  body: string;
  owner: string;
  updated: string;
  tags: string[];
  trainings: { id: string; title: string; minutes: number }[];
}

const SOP_SECTIONS: SopSection[] = [
  {
    id: "sec-1", sopId: "sop-12", sopTitle: "Authorization Denial Playbook",
    section: "Resubmission SLA",
    body: "When an authorization is denied the assigned coordinator receives an immediate task. The team has 1 business day to resubmit. Medical-necessity denials require a BCBA justification note before resubmission. Devorah is the default escalation owner.",
    owner: "Devorah Singh", updated: "2 days ago",
    tags: ["authorization", "denial", "resubmit", "sla", "escalation"],
    trainings: [
      { id: "t-44", title: "Auth Submission Mastery", minutes: 35 },
      { id: "t-77", title: "Working with Devorah on Escalations", minutes: 18 },
    ],
  },
  {
    id: "sec-2", sopId: "sop-12", sopTitle: "Authorization Denial Playbook",
    section: "Documentation Correction",
    body: "Use the documentation correction workflow to attach corrected session notes, treatment plan excerpts, and the BCBA medical necessity rationale. Submit through CentralReach with the denial reason code attached.",
    owner: "Devorah Singh", updated: "2 days ago",
    tags: ["documentation", "correction", "centralreach", "notes"],
    trainings: [
      { id: "t-21", title: "Clean Documentation Habits", minutes: 22 },
    ],
  },
  {
    id: "sec-3", sopId: "sop-15", sopTitle: "Financial Gate SOP",
    section: "Payor Routing",
    body: "After VOB is received leads enter Financial Review. Medicaid auto-approves. Commercial payors require Gabi's review and may trigger a payment plan or non-viable status. Approved gates create a client pipeline conversion task automatically.",
    owner: "Gabi Romero", updated: "1 week ago",
    tags: ["financial", "gate", "vob", "medicaid", "commercial", "payor", "review"],
    trainings: [
      { id: "t-12", title: "Financial Review Fundamentals", minutes: 28 },
      { id: "t-13", title: "Communicating Payment Plans to Families", minutes: 19 },
    ],
  },
  {
    id: "sec-4", sopId: "sop-08", sopTitle: "VOB Process",
    section: "Solum Submission",
    body: "Initiate verification of benefits by submitting a Solum request with the correct payor packet. Attach insurance card front/back, demographics form, and prescriber referral. Common errors: missing subscriber DOB, wrong group ID, mismatched address.",
    owner: "Intake Team", updated: "3 weeks ago",
    tags: ["vob", "solum", "intake", "insurance", "verification"],
    trainings: [
      { id: "t-08", title: "VOB Mastery — From Lead to Verified", minutes: 42 },
    ],
  },
  {
    id: "sec-5", sopId: "sop-21", sopTitle: "Onboarding — Georgia New Hires",
    section: "State Signature Packet",
    body: "Georgia new hires must complete the GA Sworn Statement and GA Background Authorization on day one. HR uploads the signed packet to the employee record before clinical orientation begins.",
    owner: "HR Admin", updated: "5 days ago",
    tags: ["onboarding", "georgia", "compliance", "background", "new hire"],
    trainings: [
      { id: "t-31", title: "Onboarding Compliance Essentials", minutes: 25 },
    ],
  },
  {
    id: "sec-6", sopId: "sop-30", sopTitle: "Parent Intake Call SOP",
    section: "Discovery & Empathy",
    body: "Open every intake call by acknowledging the family's journey. Capture diagnosis, current services, geographic constraints, and parent goals. Avoid clinical jargon. Confirm next step in writing within 1 hour.",
    owner: "Intake Team", updated: "1 month ago",
    tags: ["intake", "parent", "call", "discovery", "empathy"],
    trainings: [
      { id: "t-50", title: "Empathy-First Intake Calls", minutes: 30 },
    ],
  },
  {
    id: "sec-7", sopId: "sop-44", sopTitle: "Scheduling Conflict Resolution",
    section: "RBT Reassignment",
    body: "When an RBT calls out, scheduling first checks the float pool, then in-clinic coverage, then offers virtual parent training as a bridge. Notify the family within 30 minutes. Log the conflict in the scheduling tracker.",
    owner: "Scheduling Lead", updated: "2 weeks ago",
    tags: ["scheduling", "rbt", "callout", "conflict", "coverage"],
    trainings: [
      { id: "t-66", title: "Scheduling Conflict Walkthrough", minutes: 14 },
    ],
  },
  {
    id: "sec-8", sopId: "sop-55", sopTitle: "QA Session Review Checklist",
    section: "Note Quality Standards",
    body: "Every session note must include: behavior data, intervention used, parent involvement, response to programming, and next session focus. QA flags any note missing two or more elements for BCBA review.",
    owner: "QA Director", updated: "10 days ago",
    tags: ["qa", "notes", "session", "quality", "bcba", "review"],
    trainings: [
      { id: "t-72", title: "Writing Defensible Session Notes", minutes: 24 },
    ],
  },
];

const STOP = new Set(["the","a","an","and","or","of","to","in","on","for","is","are","what","how","do","does","with","by","at","from","my","our","their","this","that","i","we","you","be","can","should","when","why","who"]);

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(t => t && !STOP.has(t) && t.length > 1);
}

interface ScoredSection extends SopSection {
  score: number;
  matched: string[];
  snippet: string;
}

function scoreSections(query: string): ScoredSection[] {
  const q = tokenize(query);
  if (q.length === 0) return [];
  return SOP_SECTIONS.map(sec => {
    const haystack = [sec.section, sec.body, sec.tags.join(" "), sec.sopTitle].join(" ").toLowerCase();
    const docTokens = new Set(tokenize(haystack));
    const matched = q.filter(t => docTokens.has(t) || haystack.includes(t));
    // weighted: title/section/tag matches count more
    let score = matched.length / q.length;
    const titleHits = q.filter(t => sec.sopTitle.toLowerCase().includes(t) || sec.section.toLowerCase().includes(t)).length;
    const tagHits = q.filter(t => sec.tags.some(tag => tag.includes(t))).length;
    score = score * 0.6 + (titleHits / q.length) * 0.25 + (tagHits / q.length) * 0.15;
    // snippet: sentence containing first matched term
    const sentences = sec.body.split(/(?<=\.)\s+/);
    const snippet = sentences.find(s => matched.some(m => s.toLowerCase().includes(m))) ?? sentences[0];
    return { ...sec, score, matched, snippet };
  })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

function highlight(text: string, terms: string[]) {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((part, i) =>
    re.test(part) ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark> : <span key={i}>{part}</span>
  );
}

const SUGGESTED = [
  "How do auth denials work?",
  "What is the financial gate process?",
  "What does QA look for in session notes?",
  "How do we handle an RBT callout?",
  "Georgia new-hire compliance",
];

export default function SopIntelligence() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [openSop, setOpenSop] = useState<{ sopId: string; initialCiteIdx: number } | null>(null);
  // For library taps with no active query, we explicitly mark a section as the "focus".
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  const results = useMemo(() => scoreSections(submitted), [submitted]);

  const recommendedTrainings = useMemo(() => {
    const map = new Map<string, { id: string; title: string; minutes: number; from: string[]; weight: number }>();
    results.slice(0, 5).forEach((r, idx) => {
      r.trainings.forEach(t => {
        const prev = map.get(t.id);
        const weight = (results.length - idx) + r.score * 5;
        if (prev) {
          prev.weight += weight;
          if (!prev.from.includes(r.sopTitle)) prev.from.push(r.sopTitle);
        } else {
          map.set(t.id, { ...t, from: [r.sopTitle], weight });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.weight - a.weight).slice(0, 4);
  }, [results]);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitted(query.trim());
  };

  const runSuggested = (q: string) => {
    setQuery(q);
    setSubmitted(q);
  };

  const drawerSections = useMemo(() => {
    if (!openSop) return [];
    return SOP_SECTIONS.filter((s) => s.sopId === openSop.sopId);
  }, [openSop]);

  const drawerCitations = useMemo<SopCitation[]>(() => {
    if (!openSop) return [];
    const sectionOrder = new Map(drawerSections.map((s, i) => [s.id, i]));
    const fromResults = results
      .filter((r) => r.sopId === openSop.sopId)
      .map((r) => ({ sectionId: r.id, snippet: r.snippet, matched: r.matched }))
      .sort((a, b) => (sectionOrder.get(a.sectionId) ?? 0) - (sectionOrder.get(b.sectionId) ?? 0));
    if (fromResults.length > 0) return fromResults;
    if (focusSectionId && drawerSections.some((s) => s.id === focusSectionId)) {
      return [{ sectionId: focusSectionId, snippet: "", matched: [] }];
    }
    return [];
  }, [openSop, drawerSections, results]);

  const openResultDrawer = (sopId: string, sectionId: string) => {
    // Build the same citation order as the drawer to compute the right initial index.
    const sections = SOP_SECTIONS.filter((s) => s.sopId === sopId);
    const order = new Map(sections.map((s, i) => [s.id, i]));
    const ordered = results
      .filter((r) => r.sopId === sopId)
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const idx = Math.max(0, ordered.findIndex((r) => r.id === sectionId));
    setOpenSop({ sopId, initialCiteIdx: idx });
  };

  const openLibraryDrawer = (sopId: string, sectionId: string) => {
    setFocusSectionId(sectionId);
    setOpenSop({ sopId, initialCiteIdx: 0 });
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) {
      setOpenSop(null);
      setFocusSectionId(null);
    }
  };

  return (
    <GlassPageShell
      eyebrow="Enterprise Intelligence"
      eyebrowIcon={Sparkles}
      title="SOP Intelligence"
      description="Ask any operational question. Get cited answers from your SOP library and the trainings that prepare your team to act."
      stats={
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur px-3 py-2">
            <div className="text-xl font-semibold">{SOP_SECTIONS.length}</div>
            <div className="text-[11px] text-muted-foreground">Indexed sections</div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur px-3 py-2">
            <div className="text-xl font-semibold">{new Set(SOP_SECTIONS.map(s => s.sopId)).size}</div>
            <div className="text-[11px] text-muted-foreground">SOPs</div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur px-3 py-2">
            <div className="text-xl font-semibold">{new Set(SOP_SECTIONS.flatMap(s => s.trainings.map(t => t.id))).size}</div>
            <div className="text-[11px] text-muted-foreground">Linked trainings</div>
          </div>
        </div>
      }
    >
      {/* Search bar — sticky on mobile for one-handed reach */}
      <div className="sticky top-0 z-20 -mx-3 md:mx-0 md:static px-3 md:px-0 py-2 md:py-0 bg-background/80 md:bg-transparent backdrop-blur md:backdrop-blur-0">
        <Card className="border-border/50 bg-card/80 md:bg-card/60 backdrop-blur">
          <CardContent className="p-3 md:p-5">
            <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-2 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question or search the SOP library…"
                  inputMode="search"
                  enterKeyHint="search"
                  className="pl-9 h-12 md:h-11 text-base md:text-sm"
                />
              </div>
              <Button type="submit" className="h-12 md:h-11 gap-2 active:scale-[0.98]">
                <Sparkles className="h-4 w-4" /> Search
              </Button>
            </form>
            <ScrollArea className="mt-3 max-w-full">
              <div className="flex gap-2 pb-1 md:flex-wrap">
                <span className="text-xs text-muted-foreground self-center shrink-0">Try:</span>
                {SUGGESTED.map(s => (
                  <button
                    key={s}
                    onClick={() => runSuggested(s)}
                    className="text-xs rounded-full border border-border/60 bg-background/60 px-3 py-1.5 min-h-[32px] hover:border-primary/60 hover:text-foreground text-muted-foreground transition shrink-0 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {!submitted && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/50 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" /> SOP Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                <div className="space-y-2">
                  {SOP_SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => openLibraryDrawer(s.sopId, s.id)}
                      className="w-full text-left rounded-lg border border-border/50 bg-background/40 p-3 hover:border-primary/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{s.sopTitle}</div>
                        <Badge variant="outline" className="text-[10px]">{s.updated}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">§ {s.section} · {s.owner}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary" /> Recent SOP changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sopChanges.map(c => (
                <div key={c.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="text-sm font-medium">{c.sopTitle}</div>
                  <div className="text-[11px] text-muted-foreground">{c.changedAt} · {c.changedBy}</div>
                  <p className="text-xs mt-1.5">{c.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {submitted && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {results.length > 0
                  ? <>Showing <span className="text-foreground font-medium">{results.length}</span> result{results.length === 1 ? "" : "s"} for <span className="text-foreground font-medium">"{submitted}"</span></>
                  : <>No matches for <span className="text-foreground font-medium">"{submitted}"</span>. Try a broader question.</>}
              </div>
            </div>

            {results.map((r, idx) => (
              <Card key={r.id} className="border-border/50 bg-card/60 backdrop-blur">
                <CardContent className="p-4 md:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <FileText className="h-3 w-3" /> {r.sopTitle}
                        </Badge>
                        <Badge className="text-[10px]" variant="secondary">§ {r.section}</Badge>
                        {idx === 0 && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/20" variant="outline">Best match</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Updated {r.updated} · Owner {r.owner} · Relevance {Math.round(r.score * 100)}%
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 -mr-2"
                      onClick={() => openResultDrawer(r.sopId, r.id)}
                    >
                      Open SOP <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openResultDrawer(r.sopId, r.id)}
                    className="block w-full rounded-md text-left text-sm leading-relaxed hover:bg-muted/40 -mx-1 px-1 py-0.5 transition"
                  >
                    {highlight(r.snippet, r.matched)}
                  </button>

                  {r.trainings.length > 0 && (
                    <div className="rounded-lg bg-background/40 border border-border/40 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3" /> Recommended training
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.trainings.map(t => (
                          <Button
                            key={t.id}
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => navigate("/training")}
                          >
                            <Zap className="h-3 w-3 text-primary" />
                            {t.title}
                            <span className="text-[10px] text-muted-foreground ml-1">{t.minutes}m</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <Card className="border-border/50 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-4 w-4 text-primary" /> Recommended trainings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendedTrainings.length === 0 && (
                  <div className="text-xs text-muted-foreground">No training recommendations yet.</div>
                )}
                {recommendedTrainings.map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate("/training")}
                    className="w-full text-left rounded-lg border border-border/50 bg-background/40 p-3 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{t.title}</div>
                      <Badge variant="outline" className="text-[10px]">{t.minutes}m</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Cited by {t.from.join(", ")}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" /> Cited SOPs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from(new Map(results.map(r => [r.sopId, r])).values()).slice(0, 6).map(r => (
                  <div key={r.sopId} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/40 p-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.sopTitle}</div>
                      <div className="text-[11px] text-muted-foreground truncate">Updated {r.updated}</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {results.length === 0 && <div className="text-xs text-muted-foreground">No SOPs cited.</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </GlassPageShell>
  );
}