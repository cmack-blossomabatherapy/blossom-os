import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2, Clock, Loader2, Mail, ShieldCheck, UserCheck, UserX, XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessAdminHub } from "@/lib/adminAccess";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type AccessRequest = {
  id: string;
  name: string;
  email: string;
  role: string;
  clinic: string;
  note: string | null;
  status: "pending" | "approved" | "denied";
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

type StatusFilter = "pending" | "approved" | "denied" | "all";

const STATUS_META: Record<AccessRequest["status"], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30", icon: Clock },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  denied: { label: "Denied", className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30", icon: XCircle },
};

export default function AccessRequests() {
  const { user, roles } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const allowed = canAccessAdminHub(user, roles);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        toast.error("Couldn't load access requests");
        console.error(error);
      } else {
        setRequests((data ?? []) as AccessRequest[]);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel("access_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "access_requests" },
        (payload) => {
          setRequests((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as AccessRequest, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((r) => (r.id === (payload.new as AccessRequest).id ? (payload.new as AccessRequest) : r));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as AccessRequest).id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [allowed]);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    denied: requests.filter((r) => r.status === "denied").length,
    all: requests.length,
  }), [requests]);

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  if (!allowed) return <Navigate to="/" replace />;

  const review = async (id: string, status: "approved" | "denied") => {
    setActingId(id);
    const { error } = await supabase
      .from("access_requests")
      .update({
        status,
        review_note: reviewNotes[id]?.trim() || null,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setActingId(null);
    if (error) {
      toast.error("Couldn't update request");
      console.error(error);
      return;
    }
    toast.success(status === "approved" ? "Request approved" : "Request denied");
    setReviewNotes((prev) => {
      const { [id]: _omit, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      {/* Premium hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow,var(--primary)))_55%,hsl(var(--accent))_120%)] p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary-foreground)/0.25),transparent_45%),radial-gradient(circle_at_90%_120%,hsl(var(--primary-foreground)/0.18),transparent_50%)]" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Approval workflow
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Access Requests</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              Review staff requesting access to Blossom Academy. Approve to add them to the team, or deny with an optional note.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { l: "Pending", v: counts.pending },
              { l: "Approved", v: counts.approved },
              { l: "Denied", v: counts.denied },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur-md">
                <p className="text-2xl font-semibold">{s.v}</p>
                <p className="text-[11px] text-primary-foreground/85">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="pending">Pending<span className="ml-1.5 text-[10px] text-muted-foreground">{counts.pending}</span></TabsTrigger>
            <TabsTrigger value="approved">Approved<span className="ml-1.5 text-[10px] text-muted-foreground">{counts.approved}</span></TabsTrigger>
            <TabsTrigger value="denied">Denied<span className="ml-1.5 text-[10px] text-muted-foreground">{counts.denied}</span></TabsTrigger>
            <TabsTrigger value="all">All<span className="ml-1.5 text-[10px] text-muted-foreground">{counts.all}</span></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
          <UserCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">All caught up</p>
          <p className="text-xs text-muted-foreground">No {filter === "all" ? "" : filter} requests right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => {
            const meta = STATUS_META[req.status];
            const StatusIcon = meta.icon;
            const isPending = req.status === "pending";
            const acting = actingId === req.id;
            return (
              <article
                key={req.id}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{req.name}</h3>
                      <Badge variant="outline" className={`gap-1 border ${meta.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                      <a
                        href={`mailto:${req.email}`}
                        className="flex items-center gap-2 truncate text-foreground/90 hover:text-primary"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{req.email}</span>
                      </a>
                      <p><span className="text-muted-foreground">Role:</span> <span className="text-foreground/90">{req.role}</span></p>
                      <p><span className="text-muted-foreground">Clinic:</span> <span className="text-foreground/90">{req.clinic}</span></p>
                    </div>
                    {req.note && (
                      <p className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-foreground/80">
                        {req.note}
                      </p>
                    )}
                    {!isPending && req.review_note && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Reviewer note:</span> {req.review_note}
                      </p>
                    )}
                  </div>
                </div>

                {isPending && (
                  <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                    <Textarea
                      placeholder="Optional note for your records (not emailed to the requester)"
                      rows={2}
                      value={reviewNotes[req.id] ?? ""}
                      onChange={(e) => setReviewNotes((p) => ({ ...p, [req.id]: e.target.value }))}
                      className="resize-none rounded-xl text-sm"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => review(req.id, "denied")}
                        disabled={acting}
                        className="rounded-full"
                      >
                        {acting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserX className="mr-1.5 h-3.5 w-3.5" />}
                        Deny
                      </Button>
                      <Button
                        onClick={() => review(req.id, "approved")}
                        disabled={acting}
                        className="rounded-full font-semibold shadow-sm"
                      >
                        {acting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserCheck className="mr-1.5 h-3.5 w-3.5" />}
                        Approve
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}