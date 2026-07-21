import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, PlayCircle, Sparkles, Heart, Compass, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * RBT-shell Welcome to Blossom. Renders the same Phase 0 welcome experience
 * inside the mobile-first RBT layout, tracks completion progress via
 * `user_training_progress` (welcome key), and returns the RBT to /rbt/app/learn.
 */
export default function RbtWelcome() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_training_progress" as any)
      .select("progress_percent,status")
      .eq("user_id", user.id)
      .eq("training_id", "welcome-to-blossom")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProgress(Number((data as any).progress_percent ?? 0));
      });
  }, [user?.id]);

  const markComplete = async () => {
    if (!user) return;
    await supabase.from("user_training_progress" as any).upsert(
      {
        user_id: user.id,
        training_id: "welcome-to-blossom",
        progress_percent: 100,
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,training_id" },
    );
    setProgress(100);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      <Link
        to="/rbt/app/learn"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Learn
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/15 p-2.5 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Phase 0 · Everyone starts here</p>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome to Blossom</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Meet the team, hear our mission, and get oriented — the same start no matter your role.
          </p>
          <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{progress}% complete</p>
        </div>
      </section>

      <Section icon={PlayCircle} title="Meet Blossom" body="A quick welcome video from our leadership team. Grab a comfortable spot — this is where every Blossom journey begins." />
      <Section icon={Heart} title="Our mission" body="Deliver the highest-quality ABA therapy while making Blossom a place where every teammate can grow." />
      <Section icon={Compass} title="Our values" body="Kindness, curiosity, ownership, and calm under pressure. You'll see these in everything we do." />
      <Section icon={Users} title="Meet your people" body="Your BCBA, scheduling, HR, and support team are all one click away in the app." />

      <div className="rounded-2xl border border-border/70 bg-card p-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Ready to continue?</p>
          <p className="text-xs text-muted-foreground">Mark Welcome complete and head back to your training path.</p>
          {saved && <p className="mt-1 text-xs text-primary">Nice — Welcome saved.</p>}
        </div>
        <button
          type="button"
          onClick={markComplete}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {progress >= 100 ? "Completed" : "Mark complete"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <Link
        to="/rbt/app/learn"
        className="block rounded-2xl border border-border/70 bg-card p-4 text-sm font-medium text-center hover:bg-muted/50"
      >
        Return to my training path
      </Link>
    </div>
  );
}

function Section({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-muted p-2.5 text-foreground/80"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
    </section>
  );
}