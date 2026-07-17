import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CardFrame } from "../CardFrame";
import { usePreboarding } from "./usePreboarding";
import { Sparkles, Calendar, Users, Phone, Mail, ChevronRight, PlayCircle } from "lucide-react";
import { STATUS_META } from "./types";

const SUPPORT_TEAM = [
  { name: "Your Recruiter", email: "recruiting@blossomabatherapy.com", role: "Onboarding contact" },
  { name: "HR Team",         email: "hr@blossomabatherapy.com",         role: "Paperwork & benefits" },
  { name: "Training",        email: "training@blossomabatherapy.com",   role: "Orientation & learning" },
];

export function PreboardingHomeCards() {
  const { user } = useAuth();
  const { rows, stats } = usePreboarding(user?.id);
  const [stage, setStage] = useState<{ key: string; employee_message: string | null; name: string } | null>(null);
  const [orientationAt, setOrientationAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_lifecycle_state" as any).select("stage").eq("employee_id", user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: cfg } = await supabase.from("rbt_lifecycle_stages" as any)
          .select("key,name,employee_message").eq("key", (data as any).stage).maybeSingle();
        if (cfg) setStage(cfg as any);
      });
    supabase.from("recruiting_orientation_slots" as any)
      .select("scheduled_at").eq("candidate_id", user.id).order("scheduled_at").limit(1).maybeSingle()
      .then(({ data }) => setOrientationAt((data as any)?.scheduled_at ?? null));
  }, [user?.id]);

  const displayName = (user as any)?.user_metadata?.first_name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* Welcome */}
      <div className="md:col-span-2">
        <CardFrame title={`Welcome, ${displayName}`} subtitle="We're so glad you're joining Blossom" state="success">
          <p className="text-[15px] leading-relaxed">
            {stage?.employee_message ?? "You've been set up with Blossom OS — your home for everything you need before your first day. Take it one step at a time; we'll guide you the whole way."}
          </p>
          <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noreferrer"
             className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground border border-border/70 h-10 px-4 text-sm font-medium hover:bg-muted transition">
            <PlayCircle className="h-4 w-4" /> Watch welcome video
          </a>
        </CardFrame>
      </div>

      {/* Next Step */}
      <div className="md:col-span-2">
        <CardFrame title="Your next step" state="success">
          {stats.next ? (
            <Link to="/rbt/app/preboarding" className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-4 hover:bg-muted transition">
              <div className="min-w-0">
                <p className="text-[15px] font-medium tracking-tight truncate">{stats.next.requirement.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  <span className={STATUS_META[stats.next.item.status].tone}>{STATUS_META[stats.next.item.status].label}</span>
                  {stats.next.item.due_at && <> · Due {new Date(stats.next.item.due_at).toLocaleDateString()}</>}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4" /> You're all caught up — nice work.</p>
          )}
        </CardFrame>
      </div>

      {/* Progress */}
      <CardFrame title="Preboarding progress" subtitle={`${stats.complete} of ${stats.total} required`} state="success">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${stats.percent}%` }} />
        </div>
        <Link to="/rbt/app/preboarding" className="mt-3 inline-flex items-center gap-1 text-sm text-primary">View checklist <ChevronRight className="h-3.5 w-3.5" /></Link>
      </CardFrame>

      {/* Orientation */}
      <CardFrame title="Orientation" state="success">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" strokeWidth={1.75} />
          <div>
            {orientationAt ? (
              <>
                <p className="text-[15px] font-medium tracking-tight">{new Date(orientationAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
                <p className="text-xs text-muted-foreground">{new Date(orientationAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Your orientation date will appear here once selected.</p>
            )}
          </div>
        </div>
      </CardFrame>

      {/* Support team */}
      <CardFrame title="Meet your support team" state="success">
        <ul className="space-y-2.5">
          {SUPPORT_TEAM.map((p) => (
            <li key={p.email} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted grid place-items-center"><Users className="h-4 w-4 text-muted-foreground" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.role}</p>
              </div>
              <a href={`mailto:${p.email}`} aria-label={`Email ${p.name}`} className="rounded-full h-9 w-9 grid place-items-center hover:bg-muted transition">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </CardFrame>

      {/* Contacts */}
      <CardFrame title="Important contacts" state="success">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Main office <span className="ml-auto text-muted-foreground">(919) 555-0100</span></li>
          <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Support <a className="ml-auto text-primary" href="mailto:support@blossomabatherapy.com">support@blossomabatherapy.com</a></li>
        </ul>
      </CardFrame>

      {/* What to expect */}
      <CardFrame title="What to expect next" state="success">
        <ol className="space-y-2.5 text-sm">
          <li className="flex gap-3"><span className="tabular-nums text-muted-foreground w-5">1.</span> Finish your preboarding checklist here in Blossom.</li>
          <li className="flex gap-3"><span className="tabular-nums text-muted-foreground w-5">2.</span> Attend orientation on your selected date.</li>
          <li className="flex gap-3"><span className="tabular-nums text-muted-foreground w-5">3.</span> Get access to CentralReach and your first shifts.</li>
          <li className="flex gap-3"><span className="tabular-nums text-muted-foreground w-5">4.</span> Meet your BCBA and start your first sessions.</li>
        </ol>
      </CardFrame>
    </div>
  );
}

export function isPreboardingStage(stage?: string | null) {
  return stage === "offer_accepted" || stage === "preboarding" || stage === "orientation_scheduled";
}