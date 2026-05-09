import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeepLink, useConsumeDeepLink } from "@/lib/deepLink";
import {
  Search, BookOpen, Sparkles, FileText, ArrowUpRight,
  History, Zap, Plus, Pencil, Trash2, Loader2, RefreshCw,
  ThumbsUp, ThumbsDown, EyeOff, BarChart3,
} from "lucide-react";
import { GlassPageShell } from "@/components/shared/GlassPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SopDetailDrawer, type SopCitation } from "@/components/enterprise/SopDetailDrawer";
import { AddSopDialog } from "@/components/enterprise/AddSopDialog";
import { SopFeedbackAnalytics } from "@/components/enterprise/SopFeedbackAnalytics";
import {
  fetchAllSops, deleteSop, seedStarterSopsIfEmpty,
  type SopDocumentRow, type SopSectionRow,
} from "@/lib/sop/repository";
import { relativeTime } from "@/lib/sop/indexer";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAllFeedback, setFeedback, normalizeQuery, normalizeFilters, boostFor,
  fetchFeedbackWeights, DEFAULT_FEEDBACK_WEIGHTS,
  type SopFeedbackRow, type SopFeedbackVote, type SopFeedbackWeights,
} from "@/lib/sop/feedback";
import { cn } from "@/lib/utils";

/* ---------- Live SOP corpus (loaded from the database) ---------- */

interface SopSection {
  id: string;
  sopId: string;
  sopTitle: string;
  section: string;
  body: string;
  owner: string;
  updated: string;
  tags: string[];
}

const STOP = new Set(["the","a","an","and","or","of","to","in","on","for","is","are","what","how","do","does","with","by","at","from","my","our","their","this","that","i","we","you","be","can","should","when","why","who"]);

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(t => t && !STOP.has(t) && t.length > 1);
}

interface ScoredSection extends SopSection {
  score: number;
  matched: string[];
  snippet: string;
}

function scoreSections(
  query: string,
  sections: SopSection[],
  feedback: SopFeedbackRow[],
  filtersNorm: string = "",
  weights?: SopFeedbackWeights,
): ScoredSection[] {
  const q = tokenize(query);
  if (q.length === 0) return [];
  const queryNorm = normalizeQuery(query);
  return sections.map(sec => {
    const haystack = [sec.section, sec.body, sec.tags.join(" "), sec.sopTitle].join(" ").toLowerCase();
    const docTokens = new Set(tokenize(haystack));
    const matched = q.filter(t => docTokens.has(t) || haystack.includes(t));
    // weighted: title/section/tag matches count more
    let score = matched.length / q.length;
    const titleHits = q.filter(t => sec.sopTitle.toLowerCase().includes(t) || sec.section.toLowerCase().includes(t)).length;
    const tagHits = q.filter(t => sec.tags.some(tag => tag.includes(t))).length;
    score = score * 0.6 + (titleHits / q.length) * 0.25 + (tagHits / q.length) * 0.15;
    const boost = boostFor(feedback, sec.id, queryNorm, filtersNorm, weights);
    if (boost.hide) return null;
    score *= boost.multiplier;
    // snippet: sentence containing first matched term
    const sentences = sec.body.split(/(?<=\.)\s+/);
    const snippet = sentences.find(s => matched.some(m => s.toLowerCase().includes(m))) ?? sentences[0];
    return { ...sec, score, matched, snippet };
  })
    .filter((s): s is ScoredSection => !!s)
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
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [openSop, setOpenSop] = useState<{ sopId: string; initialCiteIdx: number } | null>(null);
  // For library taps with no active query, we explicitly mark a section as the "focus".
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  const [docs, setDocs] = useState<SopDocumentRow[]>([]);
  const [rawSections, setRawSections] = useState<SopSectionRow[]>([]);
  const [feedback, setFeedbackState] = useState<SopFeedbackRow[]>([]);
  const [weights, setWeights] = useState<SopFeedbackWeights>(DEFAULT_FEEDBACK_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<{ doc: SopDocumentRow; body: string } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const deepLink = useDeepLink();
  useConsumeDeepLink();

  const reload = async () => {
    setLoading(true);
    try {
      await seedStarterSopsIfEmpty();
      const [{ documents, sections }, fb] = await Promise.all([
        fetchAllSops(),
        fetchAllFeedback().catch(() => [] as SopFeedbackRow[]),
      ]);
      setDocs(documents);
      setRawSections(sections);
      setFeedbackState(fb);
      try {
        setWeights(await fetchFeedbackWeights());
      } catch {
        setWeights(DEFAULT_FEEDBACK_WEIGHTS);
      }
    } catch (e) {
      toast({
        title: "Couldn't load SOPs",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Honor deep-link: open a specific SOP and pre-run a query if provided.
  useEffect(() => {
    if (loading || docs.length === 0) return;
    if (deepLink.q) { setQuery(deepLink.q); setSubmitted(deepLink.q); }
    if (deepLink.sop) {
      const needle = deepLink.sop.toLowerCase();
      const doc = docs.find(d => d.title.toLowerCase().includes(needle));
      const firstSec = doc && rawSections.find(s => s.sop_id === doc.id);
      if (doc && firstSec) {
        setFocusSectionId(firstSec.id);
        setOpenSop({ sopId: doc.id, initialCiteIdx: 0 });
        if (deepLink.action === "acknowledge") {
          toast({ title: "SOP opened for acknowledgement", description: doc.title });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, docs.length]);

  // Project DB rows into the shape the search engine expects.
  const SOP_SECTIONS = useMemo<SopSection[]>(() => {
    const docMap = new Map(docs.map(d => [d.id, d]));
    return rawSections
      .map(s => {
        const d = docMap.get(s.sop_id);
        if (!d) return null;
        return {
          id: s.id,
          sopId: s.sop_id,
          sopTitle: d.title,
          section: s.section,
          body: s.body,
          owner: d.owner ?? "—",
          updated: relativeTime(s.updated_at),
          tags: s.tags,
        } satisfies SopSection;
      })
      .filter((x): x is SopSection => !!x);
  }, [docs, rawSections]);

  const sectionBodyByDoc = useMemo(() => {
    const m = new Map<string, string>();
    docs.forEach(d => {
      const ordered = rawSections
        .filter(s => s.sop_id === d.id)
        .sort((a, b) => a.position - b.position);
      const text = ordered.map(s => `# ${s.section}\n${s.body}`).join("\n\n");
      m.set(d.id, text);
    });
    return m;
  }, [docs, rawSections]);

  const submittedNorm = useMemo(() => normalizeQuery(submitted), [submitted]);
  // Currently SOP search has no faceted filter UI, so the filter scope is empty
  // for now. When filter chips are added (state, owner, tag, etc.), pass that
  // object here so feedback is recorded against the same scope it was given in.
  const submittedFilters = useMemo<Record<string, unknown>>(() => ({}), []);
  const submittedFiltersNorm = useMemo(
    () => normalizeFilters(submittedFilters),
    [submittedFilters],
  );

  const results = useMemo(
    () => scoreSections(submitted, SOP_SECTIONS, feedback, submittedFiltersNorm),
    [submitted, SOP_SECTIONS, feedback, submittedFiltersNorm],
  );

  const voteFor = (sectionId: string): SopFeedbackVote | null => {
    const f = feedback.find(x => x.section_id === sectionId && x.query_norm === submittedNorm);
    return f?.vote ?? null;
  };

  const handleVote = async (sectionId: string, vote: SopFeedbackVote) => {
    const existing = feedback.find(x => x.section_id === sectionId && x.query_norm === submittedNorm) ?? null;
    // optimistic
    const next = feedback.filter(x => !(x.section_id === sectionId && x.query_norm === submittedNorm));
    const isToggleOff = existing && existing.vote === vote;
    if (!isToggleOff) {
      next.push({
        id: existing?.id ?? `tmp-${sectionId}-${submittedNorm}`,
        section_id: sectionId,
        query: submitted,
        query_norm: submittedNorm,
        vote,
        updated_at: new Date().toISOString(),
        filters: submittedFilters,
        filters_norm: submittedFiltersNorm,
      });
    }
    setFeedbackState(next);
    try {
      const saved = await setFeedback({
        sectionId,
        query: submitted,
        vote,
        filters: submittedFilters,
        existing,
      });
      setFeedbackState(prev => {
        const cleaned = prev.filter(x => !(x.section_id === sectionId && x.query_norm === submittedNorm));
        return saved ? [...cleaned, saved] : cleaned;
      });
      if (vote === "not_relevant" && saved) {
        toast({ title: "Hidden from this search", description: "We'll demote it next time too." });
      }
    } catch (e) {
      // revert
      setFeedbackState(feedback);
      toast({
        title: "Couldn't save feedback",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const recentChanges = useMemo(
    () => docs.slice(0, 5).map(d => ({
      id: d.id,
      sopTitle: d.title,
      changedAt: relativeTime(d.updated_at),
      changedBy: d.owner ?? "—",
      summary: `${rawSections.filter(s => s.sop_id === d.id).length} sections indexed`,
    })),
    [docs, rawSections]
  );

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
  }, [openSop, SOP_SECTIONS]);

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
  }, [openSop, drawerSections, results, focusSectionId]);

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

  const onEditDoc = (doc: SopDocumentRow) => {
    setEditing({ doc, body: sectionBodyByDoc.get(doc.id) ?? "" });
    setAddOpen(true);
  };

  const onDeleteDoc = async (doc: SopDocumentRow) => {
    if (!confirm(`Delete "${doc.title}" and all its sections?`)) return;
    try {
      await deleteSop(doc.id);
      toast({ title: "SOP deleted" });
      await reload();
    } catch (e) {
      toast({
        title: "Couldn't delete",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
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
            <div className="text-xl font-semibold">{docs.length}</div>
            <div className="text-[11px] text-muted-foreground">SOPs</div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur px-3 py-2">
            <div className="text-xl font-semibold">
              {SOP_SECTIONS.reduce((n, s) => n + s.tags.length, 0)}
            </div>
            <div className="text-[11px] text-muted-foreground">Auto tags</div>
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
              <Button
                type="button"
                variant="outline"
                className="h-12 md:h-11 gap-2 active:scale-[0.98]"
                onClick={() => { setEditing(null); setAddOpen(true); }}
              >
                <Plus className="h-4 w-4" /> Add SOP
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 md:h-11 gap-2 active:scale-[0.98]"
                onClick={() => setAnalyticsOpen(true)}
              >
                <BarChart3 className="h-4 w-4" /> Feedback
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-12 w-12 md:h-11 md:w-11 shrink-0"
                onClick={reload}
                aria-label="Refresh index"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
                  {loading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading SOPs…
                    </div>
                  )}
                  {!loading && docs.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8">
                      No SOPs yet. Click <span className="text-foreground">Add SOP</span> to index your first document.
                    </div>
                  )}
                  {docs.map(d => {
                    const ownSecs = SOP_SECTIONS.filter(s => s.sopId === d.id);
                    return (
                      <div key={d.id} className="rounded-lg border border-border/50 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => ownSecs[0] && openLibraryDrawer(d.id, ownSecs[0].id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="font-medium text-sm truncate">{d.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {ownSecs.length} section{ownSecs.length === 1 ? "" : "s"} · {d.owner ?? "—"} · Updated {relativeTime(d.updated_at)}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditDoc(d)} aria-label="Edit SOP">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteDoc(d)} aria-label="Delete SOP">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {ownSecs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ownSecs.slice(0, 6).map(s => (
                              <button
                                key={s.id}
                                onClick={() => openLibraryDrawer(d.id, s.id)}
                                className="text-[10px] rounded-full border border-border/60 bg-background/60 px-2 py-0.5 hover:border-primary/60"
                              >
                                § {s.section}
                              </button>
                            ))}
                            {ownSecs.length > 6 && (
                              <span className="text-[10px] text-muted-foreground self-center">+{ownSecs.length - 6} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              {recentChanges.length === 0 && (
                <div className="text-xs text-muted-foreground">No changes yet.</div>
              )}
              {recentChanges.map(c => (
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

                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.slice(0, 8).map(t => (
                        <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                    <div className="text-[11px] text-muted-foreground">Was this helpful?</div>
                    {(() => {
                      const v = voteFor(r.id);
                      return (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 px-2 gap-1.5 text-xs",
                              v === "up" && "bg-primary/15 text-primary hover:bg-primary/20",
                            )}
                            onClick={() => handleVote(r.id, "up")}
                            aria-pressed={v === "up"}
                            aria-label="Helpful result"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Helpful</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 px-2 gap-1.5 text-xs",
                              v === "down" && "bg-destructive/15 text-destructive hover:bg-destructive/20",
                            )}
                            onClick={() => handleVote(r.id, "down")}
                            aria-pressed={v === "down"}
                            aria-label="Not helpful"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Not helpful</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 px-2 gap-1.5 text-xs",
                              v === "not_relevant" && "bg-muted text-foreground",
                            )}
                            onClick={() => handleVote(r.id, "not_relevant")}
                            aria-pressed={v === "not_relevant"}
                            aria-label="Not relevant to this query"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Not relevant</span>
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <Card className="border-border/50 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-primary" /> Top matched tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const counts = new Map<string, number>();
                  results.slice(0, 8).forEach(r => r.tags.forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)));
                  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
                  if (top.length === 0) return <div className="text-xs text-muted-foreground">No tags matched.</div>;
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {top.map(([t, n]) => (
                        <Badge key={t} variant="outline" className="text-[10px]">#{t} <span className="ml-1 text-muted-foreground">{n}</span></Badge>
                      ))}
                    </div>
                  );
                })()}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => openResultDrawer(r.sopId, r.id)}
                    >
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

      <SopDetailDrawer
        open={!!openSop}
        onOpenChange={handleDrawerOpenChange}
        sections={drawerSections.map(s => ({ ...s, trainings: [] }))}
        citations={drawerCitations}
        initialCitationIndex={openSop?.initialCiteIdx ?? 0}
        onOpenTraining={() => navigate("/training")}
      />
      <AddSopDialog
        open={addOpen}
        onOpenChange={(v) => { setAddOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        onSaved={reload}
      />
      <SopFeedbackAnalytics
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        feedback={feedback}
        sections={SOP_SECTIONS.map((s) => ({
          id: s.id,
          sopId: s.sopId,
          sopTitle: s.sopTitle,
          section: s.section,
        }))}
      />
    </GlassPageShell>
  );
}