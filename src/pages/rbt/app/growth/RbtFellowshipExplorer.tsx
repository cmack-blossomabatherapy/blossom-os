import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CardFrame } from "../CardFrame";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type Section = { section_key: string; title: string; body: string | null; order_index: number; published: boolean };

export default function RbtFellowshipExplorer() {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[] | null>(null);
  const [application, setApplication] = useState<any | null>(null);
  const [interestNote, setInterestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void supabase.from("rbt_fellowship_content" as any)
      .select("section_key,title,body,order_index,published")
      .eq("published", true).order("order_index")
      .then(({ data }) => setSections(((data as any[]) ?? []) as Section[]));
    if (user) {
      void supabase.from("rbt_fellowship_applications" as any)
        .select("*").eq("employee_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
        .then(({ data }) => setApplication(data ?? null));
    }
  }, [user?.id]);

  const interestForm = useMemo(() => sections?.find(s => s.section_key === "interest_form"), [sections]);

  const expressInterest = async () => {
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("rbt_fellowship_applications" as any)
      .insert({
        employee_id: user.id, status: "started",
        application_data: { interest_note: interestNote },
      } as any).select("*").maybeSingle();
    setSubmitting(false);
    if (error) { toast.error("Could not submit interest"); return; }
    setApplication(data);
    await supabase.from("rbt_growth_audit" as any).insert({
      employee_id: user.id, actor_id: user.id, event_type: "fellowship.interest_expressed",
      entity_table: "rbt_fellowship_applications", entity_id: (data as any)?.id,
      payload: { note: interestNote },
    } as any);
    toast.success("Interest recorded");
  };

  return (
    <div className="space-y-3">
      <Link to="/rbt/app/growth" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to My Growth
      </Link>

      <CardFrame title="Fellowship Explorer" subtitle="Learn what's currently known about the BCBA Fellowship" state="success">
        <p className="text-sm text-muted-foreground">
          Program details are still being finalized. Only sections approved by leadership appear here.
          Nothing on this page is a guarantee of acceptance, timing, or program design.
        </p>
      </CardFrame>

      {application && (
        <CardFrame title="Your Fellowship status" state="success">
          <p className="text-sm">
            Current status: <strong className="capitalize">{String(application.status).replace(/_/g, " ")}</strong>
          </p>
          {application.decision && (
            <p className="text-xs text-muted-foreground mt-1">
              Decision: {application.decision}{application.decision_at && ` on ${new Date(application.decision_at).toLocaleDateString()}`}
            </p>
          )}
        </CardFrame>
      )}

      {sections === null ? (
        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
      ) : sections.length === 0 ? (
        <CardFrame title="Details coming soon" state="empty"
          emptyLabel="Program information hasn't been published yet. Check back — administrators will publish sections as they're finalized." />
      ) : (
        sections.filter(s => s.section_key !== "interest_form").map(s => (
          <CardFrame key={s.section_key} title={s.title} state="success">
            {s.body ? (
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{s.body}</div>
            ) : (
              <p className="text-sm text-muted-foreground">This section is published without content.</p>
            )}
          </CardFrame>
        ))
      )}

      {interestForm && !application && (
        <CardFrame title="Express interest" subtitle="Submitting interest does not start or guarantee acceptance." state="success">
          {interestForm.body && (
            <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{interestForm.body}</p>
          )}
          <textarea value={interestNote} onChange={e => setInterestNote(e.target.value)}
            placeholder="What draws you to the Fellowship? (optional)"
            className="w-full text-sm p-3 rounded-xl bg-muted/40 border border-border/70 min-h-24 mb-2" />
          <button onClick={expressInterest} disabled={submitting}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
            {submitting ? "Submitting…" : "Express interest"}
          </button>
        </CardFrame>
      )}
    </div>
  );
}