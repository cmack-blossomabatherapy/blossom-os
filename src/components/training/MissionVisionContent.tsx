import { Heart, Compass, Sparkles, Target } from "lucide-react";

/**
 * Canonical Blossom ABA Therapy Mission, Vision, Values, and What/How/Why
 * content shown inside the State Director Mission & Vision training module
 * (/training/sd-w1d1-mission-vision). Source: Leadership L10 — Future Focus
 * & Short-Term Focus working doc.
 */

export const BLOSSOM_MISSION =
  "We deliver high-quality, evidence-based ABA therapy that creates meaningful progress for every child we serve.";

export const BLOSSOM_VISION =
  "Become the most trusted ABA provider across every state we operate in — known for clinical quality, operational excellence, and how we treat the families and teammates who trust us.";

export const BLOSSOM_HOW =
  "By partnering with exceptional providers, holding a high standard, and consistently going above and beyond for the families who trust us.";

export const BLOSSOM_WHY =
  "Because this work matters. We have the opportunity to change lives — not just for the children we serve, but for their entire families. We're not just providing a service. We're creating support, stability, and real progress where it's needed most.";

export const BLOSSOM_CORE_VALUES: { title: string; body: string }[] = [
  {
    title: "Data Over Emotion",
    body: "We make decisions from the facts in front of us — utilization, outcomes, scheduling, authorizations — not from how loud the room is.",
  },
  {
    title: "Extreme Ownership",
    body: "If it's in your state, it's yours. We don't pass blame, we don't wait to be asked, and we own the follow-through end-to-end.",
  },
  {
    title: "Always Improving",
    body: "Every week the bar moves up a notch. We expect honest feedback, we run the playbook, and we make the next version better than the last.",
  },
  {
    title: "Family First, Always",
    body: "Every operational decision ladders back to the family experience. If a choice hurts the family, it isn't the right choice — find another path.",
  },
];

export const BLOSSOM_DIFFERENTIATORS: string[] = [
  "Attention to the details — we focus on the small things that others overlook because those create the biggest impact.",
  "Mission-driven culture — our team is aligned on the vision and committed to raising the standard.",
  "Right people, right seats — we place the right individuals in the right roles so every part of the org runs at its best.",
  "Operational excellence in QA — quality isn't a department; it's embedded in everything we do.",
];

export default function MissionVisionContent() {
  return (
    <div
      data-testid="sd-mission-vision-content"
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary" />
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Mission, Vision & Values
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Target className="h-3 w-3" /> Mission
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/90">
            {BLOSSOM_MISSION}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Compass className="h-3 w-3" /> Vision
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/90">
            {BLOSSOM_VISION}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { eyebrow: "What", body: BLOSSOM_MISSION },
          { eyebrow: "How", body: BLOSSOM_HOW },
          { eyebrow: "Why", body: BLOSSOM_WHY },
        ].map((b) => (
          <div key={b.eyebrow} className="rounded-2xl border border-border/60 bg-background p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {b.eyebrow}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/90">{b.body}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Core values
          </p>
        </div>
        <ol className="mt-2 grid gap-2 sm:grid-cols-2">
          {BLOSSOM_CORE_VALUES.map((v, i) => (
            <li
              key={v.title}
              className="rounded-2xl border border-border/60 bg-background p-4"
              data-testid={`sd-mission-vision-value-${i + 1}`}
            >
              <p className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {i + 1}
                </span>
                {v.title}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{v.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          What makes us different
        </p>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-foreground/90">
          {BLOSSOM_DIFFERENTIATORS.map((d) => (
            <li key={d} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 text-[12px] text-muted-foreground">
        Read each section, rewrite the mission in one sentence in your own words, then connect each
        value to one operational metric you'll watch in your state. You'll use this language on the
        practice scenario and knowledge check below.
      </p>
    </div>
  );
}