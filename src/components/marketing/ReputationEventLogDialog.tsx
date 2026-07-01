import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogged?: () => void;
}

const SOURCES = [
  "google_reviews",
  "facebook",
  "yelp",
  "website_testimonial",
  "complaint",
  "review_request_sent",
  "manual",
];

/** Manual reputation event logger -> marketing_reputation_events. */
export function ReputationEventLogDialog({ open, onOpenChange, onLogged }: Props) {
  const [sourceSystem, setSourceSystem] = useState("google_reviews");
  const [rating, setRating] = useState<string>("5");
  const [reviewer, setReviewer] = useState("");
  const [text, setText] = useState("");
  const [state, setState] = useState("");
  const [sentiment, setSentiment] = useState("positive");
  const [responseStatus, setResponseStatus] = useState("open");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("marketing_reputation_events" as never).insert([{
        source_system: sourceSystem,
        occurred_at: new Date().toISOString(),
        rating: rating ? Number(rating) : null,
        reviewer_name: reviewer.trim() || null,
        review_text: text.trim() || null,
        state: state.trim().toUpperCase() || null,
        sentiment,
        response_status: responseStatus,
        raw_payload: {},
      } as never]);
      if (error) throw error;
      toast.success("Reputation event logged");
      onLogged?.();
      onOpenChange(false);
      setReviewer(""); setText(""); setState("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log event");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log reputation event</DialogTitle>
          <DialogDescription>
            Record a review, testimonial, or complaint into marketing_reputation_events.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Source</Label>
              <Select value={sourceSystem} onValueChange={setSourceSystem}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Rating (1-5)</Label>
              <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Reviewer</Label>
              <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} maxLength={2} placeholder="GA" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Review / note</Label>
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Sentiment</Label>
              <Select value={sentiment} onValueChange={setSentiment}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">positive</SelectItem>
                  <SelectItem value="neutral">neutral</SelectItem>
                  <SelectItem value="negative">negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Response status</Label>
              <Select value={responseStatus} onValueChange={setResponseStatus}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">open</SelectItem>
                  <SelectItem value="responded">responded</SelectItem>
                  <SelectItem value="escalated">escalated</SelectItem>
                  <SelectItem value="closed">closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Log event"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}