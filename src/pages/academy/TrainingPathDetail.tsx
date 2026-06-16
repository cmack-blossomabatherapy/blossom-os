import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Clock, FileText, ClipboardCheck, Video,
  CheckCircle2, GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTrainingPath, RBT_BUCKETS } from "@/lib/academy/trainingPaths";

const STUB_COPY =
  "This training path is being built as part of Blossom OS. It will include lessons, documents, videos, worksheets, quizzes, acknowledgements, and completion tracking for this role.";

/** Detail page shown for every training path. RBT shows experience-level buckets. */
export default function TrainingPathDetail() {
  const { slug = "" } = useParams();
  const path = getTrainingPath(slug);

  if (!path) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground">Training path not found.</p>
        <Link to="/academy" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Training Academy
        </Link>
      </div>
    );
  }

  const isRbt = path.slug === "rbt";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <Link to="/academy" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Training Academy
      </Link>

      {/* Hero */}
      <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="h-3 w-3" /> {path.category}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{path.title}</h1>
          <p className="mt-2 max-w-2xl text-[14.5px] text-muted-foreground">
            {isRbt
              ? "The RBT Training Academy helps every RBT enter Blossom with the right support, expectations, resources, and growth path based on their experience level."
              : STUB_COPY}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{path.audience}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><BookOpen className="h-3 w-3" />{path.lessonCount} lessons</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock className="h-3 w-3" />~{path.estimatedHours}h</span>
        </div>
      </header>

      {/* RBT experience buckets */}
      {isRbt && (
        <section className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">RBT learning paths</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">By experience level</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RBT_BUCKETS.map((b) => (
              <div
                key={b.slug}
                className="rounded-2xl border border-border/70 bg-card p-5 transition hover:border-border"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-[14.5px] font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What's coming */}
      <section className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">What this path will include</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">Built for operational readiness</h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={FileText} title="Lessons & documents" body="Structured lessons paired with the SOPs and policies they reference." />
          <Feature icon={Video} title="Videos & walkthroughs" body="Tango walkthroughs and short videos for visual learners." />
          <Feature icon={ClipboardCheck} title="Worksheets & quizzes" body="Lightweight checks to confirm operational understanding." />
          <Feature icon={CheckCircle2} title="Acknowledgements & tracking" body="Completion tracking for compliance and personal progress." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof FileText; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{body}</p>
    </div>
  );
}