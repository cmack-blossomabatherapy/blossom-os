import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Clock, AlertTriangle, Star } from "lucide-react";
import { useTicket, postTicketMessage, submitSatisfaction, STATUS_LABEL, URGENCY_LABEL } from "./useSupport";
import { toast } from "sonner";

export default function SupportTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { ticket, updates, loading, reload } = useTicket(ticketId);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const send = async () => {
    if (!ticketId || !msg.trim()) return;
    setSending(true);
    try { await postTicketMessage(ticketId, msg.trim()); setMsg(""); await reload(); }
    catch (e: any) { toast.error(e.message ?? "Could not send"); }
    finally { setSending(false); }
  };

  const rate = async () => {
    if (!ticketId || rating === 0) return;
    try { await submitSatisfaction(ticketId, rating, ratingComment); toast.success("Thanks for the feedback."); await reload(); }
    catch (e: any) { toast.error(e.message ?? "Could not save"); }
  };

  if (loading) return <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>;
  if (!ticket) return <p className="text-sm text-muted-foreground">Ticket not found.</p>;

  const closed = ["resolved","closed"].includes(ticket.status);
  const canRate = ticket.status === "resolved" && !ticket.satisfaction_rating;

  return (
    <div className="space-y-4 pb-8">
      <Link to="/rbt/app/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <section className={`rounded-2xl border p-5 ${ticket.is_urgent_safety ? "border-red-500/40 bg-red-500/5" : "border-border/70 bg-card"}`}>
        <div className="flex items-start gap-3">
          {ticket.is_urgent_safety && <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground tabular-nums">{ticket.ticket_number}</p>
            <h1 className="text-lg font-semibold tracking-tight mt-0.5">{ticket.subject || ticket.category.replace(/_/g," ")}</h1>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
              <span className="rounded-full bg-muted px-2 py-0.5">{URGENCY_LABEL[ticket.urgency]}</span>
              <span className="rounded-full bg-muted px-2 py-0.5">{ticket.category.replace(/_/g," ")}</span>
              {ticket.subcategory && <span className="rounded-full bg-muted px-2 py-0.5">{ticket.subcategory}</span>}
            </div>
          </div>
        </div>

        <p className="text-sm mt-4 whitespace-pre-wrap">{ticket.description}</p>

        <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Owner</p>
            <p className="mt-0.5 font-medium">{ticket.routed_to_role ? ticket.routed_to_role.replace(/_/g," ") : "Being routed"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Due by</p>
            <p className="mt-0.5 font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {ticket.due_at ? new Date(ticket.due_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {ticket.resolution_notes && (
          <div className="mt-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Resolution</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{ticket.resolution_notes}</p>
          </div>
        )}
      </section>

      {/* Thread */}
      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Updates</h2>
        <ol className="space-y-3">
          {updates.map(u => (
            <li key={u.id} className="flex gap-3">
              <div className="mt-1 shrink-0 h-2 w-2 rounded-full bg-primary/60" />
              <div className="flex-1 min-w-0">
                {u.update_type === "status_change" ? (
                  <p className="text-sm">Status → <span className="font-medium">{STATUS_LABEL[u.to_status ?? ""] ?? u.to_status}</span></p>
                ) : u.body ? (
                  <p className="text-sm whitespace-pre-wrap">{u.body}</p>
                ) : null}
                <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(u.created_at).toLocaleString()}</p>
              </div>
            </li>
          ))}
          {updates.length === 0 && <li className="text-sm text-muted-foreground">No updates yet.</li>}
        </ol>

        {!closed && (
          <div className="mt-4 pt-4 border-t border-border/60 flex gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="Add a message…" maxLength={1000}
              className="flex-1 h-11 rounded-xl bg-muted/60 border border-border px-3 text-sm" />
            <button onClick={send} disabled={!msg.trim() || sending}
              className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {canRate && (
        <section className="rounded-2xl border border-border/70 bg-card p-5">
          <h2 className="text-sm font-semibold">How did we do?</h2>
          <p className="text-xs text-muted-foreground mt-1">Your feedback helps us improve support.</p>
          <div className="flex gap-2 mt-3">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={`h-11 w-11 rounded-xl border transition ${rating >= n ? "bg-primary/10 border-primary text-primary" : "border-border/60 text-muted-foreground"}`}>
                <Star className="h-5 w-5 mx-auto" fill={rating >= n ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
            rows={2} maxLength={500} placeholder="Optional comment"
            className="w-full mt-3 rounded-xl bg-muted/60 border border-border p-3 text-sm" />
          <button onClick={rate} disabled={rating === 0}
            className="w-full mt-3 h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50">
            Submit feedback
          </button>
        </section>
      )}

      {ticket.satisfaction_rating && (
        <section className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
          You rated this {ticket.satisfaction_rating}/5. Thanks for the feedback.
        </section>
      )}
    </div>
  );
}