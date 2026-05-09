import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveSheet, SheetHeader, SheetTitle } from "@/components/ui/responsive-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronUp, ChevronDown, FileText, X, GraduationCap, Zap } from "lucide-react";

export interface SopDrawerSection {
  id: string;
  sopId: string;
  sopTitle: string;
  section: string;
  body: string;
  owner: string;
  updated: string;
  trainings: { id: string; title: string; minutes: number }[];
}

export interface SopCitation {
  /** Section id this citation belongs to. */
  sectionId: string;
  /** Human-relevant snippet text we want to highlight (substring of section.body). */
  snippet: string;
  /** Tokens to highlight (already lower-cased). */
  matched: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All sections for the SOP being viewed. */
  sections: SopDrawerSection[];
  /** Citations to highlight + jump between (in document order). */
  citations: SopCitation[];
  /** Optional starting citation index. */
  initialCitationIndex?: number;
  onOpenTraining?: (trainingId: string) => void;
}

/* ---------- Highlight rendering ---------- */

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renders body text with two layers of highlighting:
 *  - The cited snippet (if present in the body) is wrapped in a `<mark data-cite-id="...">`.
 *  - Matched query tokens within OR outside the snippet are wrapped in subtler `<mark>` highlights.
 */
function HighlightedBody({
  body,
  citation,
  matched,
  citeId,
}: {
  body: string;
  citation?: string;
  matched: string[];
  citeId: string;
}) {
  // Step 1: split by citation snippet boundary (if any)
  let parts: Array<{ text: string; isCitation: boolean }> = [{ text: body, isCitation: false }];
  if (citation && citation.length > 0) {
    const idx = body.toLowerCase().indexOf(citation.toLowerCase());
    if (idx >= 0) {
      parts = [
        { text: body.slice(0, idx), isCitation: false },
        { text: body.slice(idx, idx + citation.length), isCitation: true },
        { text: body.slice(idx + citation.length), isCitation: false },
      ].filter((p) => p.text.length > 0);
    }
  }

  const tokenRe = matched.length
    ? new RegExp(`(${matched.map(escapeRegex).join("|")})`, "gi")
    : null;

  const renderTokens = (text: string, baseClass: string) => {
    if (!tokenRe) return text;
    return text.split(tokenRe).map((piece, i) => {
      if (i % 2 === 1) {
        return (
          <mark key={i} className={baseClass}>
            {piece}
          </mark>
        );
      }
      return <span key={i}>{piece}</span>;
    });
  };

  return (
    <p className="text-sm leading-relaxed text-foreground">
      {parts.map((part, i) =>
        part.isCitation ? (
          <mark
            key={i}
            id={`cite-${citeId}`}
            data-citation="true"
            className="rounded-md bg-primary/20 px-1 py-0.5 text-foreground ring-1 ring-primary/30 transition-shadow"
          >
            {renderTokens(part.text, "rounded bg-primary/40 px-0.5 text-foreground")}
          </mark>
        ) : (
          <span key={i}>{renderTokens(part.text, "rounded bg-primary/15 px-0.5 text-foreground")}</span>
        ),
      )}
    </p>
  );
}

/* ---------- Drawer ---------- */

export function SopDetailDrawer({
  open,
  onOpenChange,
  sections,
  citations,
  initialCitationIndex = 0,
  onOpenTraining,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(initialCitationIndex);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  // Reset whenever the drawer opens or the citation set changes.
  useEffect(() => {
    if (open) setActiveIdx(initialCitationIndex);
  }, [open, initialCitationIndex, citations.length]);

  // Map sectionId -> citation (only one snippet highlighted per section in this view).
  const citationBySection = useMemo(() => {
    const map = new Map<string, SopCitation>();
    citations.forEach((c) => {
      if (!map.has(c.sectionId)) map.set(c.sectionId, c);
    });
    return map;
  }, [citations]);

  // Scroll the active citation into view.
  useEffect(() => {
    if (!open || citations.length === 0) return;
    const cite = citations[activeIdx];
    if (!cite) return;
    // Defer to allow render
    const t = setTimeout(() => {
      const el = document.getElementById(`cite-${cite.sectionId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1400);
    }, 60);
    return () => clearTimeout(t);
  }, [activeIdx, open, citations]);

  const sopMeta = sections[0];
  const goPrev = () => setActiveIdx((i) => (citations.length === 0 ? 0 : (i - 1 + citations.length) % citations.length));
  const goNext = () => setActiveIdx((i) => (citations.length === 0 ? 0 : (i + 1) % citations.length));

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      desktopClassName="w-full sm:max-w-2xl flex flex-col"
      mobileClassName="flex flex-col"
    >
      <SheetHeader className="space-y-1 border-b border-border/60 px-5 pb-3 pt-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <FileText className="h-3 w-3" /> {sopMeta?.sopId.toUpperCase()}
            </Badge>
            <SheetTitle className="text-base font-semibold leading-snug">
              {sopMeta?.sopTitle ?? "SOP"}
            </SheetTitle>
            {sopMeta && (
              <p className="text-[11px] text-muted-foreground">
                Owner {sopMeta.owner} · Updated {sopMeta.updated} · {sections.length} section{sections.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close SOP"
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Citation navigator */}
        {citations.length > 0 && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="min-w-0 text-xs">
              <span className="font-medium text-primary">
                Citation {activeIdx + 1} of {citations.length}
              </span>
              <span className="ml-2 truncate text-muted-foreground">
                in §{" "}
                {sections.find((s) => s.id === citations[activeIdx]?.sectionId)?.section ?? "—"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={goPrev}
                disabled={citations.length < 2}
                aria-label="Previous citation"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={goNext}
                disabled={citations.length < 2}
                aria-label="Next citation"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div ref={scrollRootRef} className="space-y-5 px-5 py-5">
          {sections.map((section) => {
            const cite = citationBySection.get(section.id);
            const matched = cite?.matched ?? [];
            const isCited = !!cite;
            return (
              <section
                key={section.id}
                className={isCited ? "rounded-xl border border-primary/30 bg-primary/[0.03] p-4" : "rounded-xl border border-border/60 p-4"}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Section
                    </p>
                    <h3 className="text-sm font-semibold text-foreground">§ {section.section}</h3>
                  </div>
                  {isCited && (
                    <Badge variant="secondary" className="bg-primary/15 text-primary">
                      Cited
                    </Badge>
                  )}
                </div>
                <HighlightedBody
                  body={section.body}
                  citation={cite?.snippet}
                  matched={matched}
                  citeId={section.id}
                />

                {section.trainings.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        <GraduationCap className="h-3 w-3" /> Recommended training
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {section.trainings.map((t) => (
                          <Button
                            key={t.id}
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => onOpenTraining?.(t.id)}
                          >
                            <Zap className="h-3 w-3 text-primary" />
                            {t.title}
                            <span className="ml-1 text-[10px] text-muted-foreground">{t.minutes}m</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      </ScrollArea>
    </ResponsiveSheet>
  );
}