import { useState } from "react";
import { Sparkles, MapPin, Clock, Award, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockRBTProfiles, getClientStaffingNeeds, getRBTUtilization, suggestStaffingMatches } from "@/data/staffing";
import { useClients } from "@/contexts/ClientsContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function StaffingMatchingView({ searchQuery }: { searchQuery: string }) {
  const { clients, assignRbt, updateClient, addTask } = useClients();
  const needs = getClientStaffingNeeds(clients).filter(
    (n) => !searchQuery || n.client.childName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const [selectedId, setSelectedId] = useState<string | null>(needs[0]?.client.id ?? null);
  const selected = needs.find((n) => n.client.id === selectedId);
  const suggestions = selected ? suggestStaffingMatches(selected) : [];

  const assignMatch = async (rbtId: string, rbtName: string, score: number) => {
    if (!selected) return;
    await supabase.from("staffing_matches").insert({
      client_id: selected.client.id,
      rbt_id: rbtId,
      rbt_name: rbtName,
      status: "Assigned",
      match_score: score,
      notes: "Assigned from staffing matching engine",
    } as never);
    await assignRbt([selected.client.id], rbtName);
    await addTask(selected.client.id, { id: `schedule-${Date.now()}`, title: "Confirm schedule", completed: false, dueDate: new Date().toISOString().split("T")[0] });
    toast.success(`${rbtName} assigned`, { description: "Client moved to Pending Start Date for scheduling." });
  };

  const markMatching = async () => {
    if (!selected) return;
    await updateClient(selected.client.id, { stage: "Matching in Progress", staffingStatus: "In Progress", nextAction: "Compare RBT matches" });
    await addTask(selected.client.id, { id: `candidate-${Date.now()}`, title: "Contact candidate", completed: false, dueDate: new Date().toISOString().split("T")[0] });
    toast.success("Matching started");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: client needs */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Client Needs</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{needs.length}</span>
        </div>
        <div className="space-y-1.5">
          {needs.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No clients awaiting staffing</p>
          )}
          {needs.map((n) => (
            <button
              key={n.client.id}
              onClick={() => setSelectedId(n.client.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                selectedId === n.client.id
                  ? "bg-primary/10 border-primary/40"
                  : "bg-secondary/30 border-border/40 hover:border-primary/30",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{n.client.childName}</p>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
                    n.priority === "High"
                      ? "bg-destructive/10 text-destructive"
                      : n.priority === "Medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {n.priority}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {n.client.state} · {n.client.clinic}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {n.requiredHours} hr/wk
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {n.availability.map((slot) => <span key={slot} className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">{slot}</span>)}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded",
                    n.daysWaiting > 5 ? "bg-destructive/10 text-destructive" : "bg-muted",
                  )}
                >
                  {n.daysWaiting}d waiting
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle: matches */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Suggested Matches
          </h3>
          {selected && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={markMatching}>Start Matching</Button>}
        </div>
        {!selected && <p className="text-xs text-muted-foreground italic">Select a client</p>}
        {selected && suggestions.length === 0 && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="mb-1 h-4 w-4" /> No available RBT in {selected.client.state}. Region shortage should be escalated.
          </div>
        )}
        {selected &&
          suggestions.map((match, idx) => {
            const rbt = mockRBTProfiles.find((profile) => profile.id === match.rbtId);
            if (!rbt) return null;
            const overloaded = match.capacityRemaining < selected.requiredHours;
            return (
            <div
              key={match.rbtId}
              className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{rbt.name}</p>
                    {idx === 0 && (
                      <span className="text-[10px] font-semibold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Top match
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{match.score}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {rbt.clinic} · {rbt.experience} · {match.distanceMiles} mi
                  </p>
                </div>
                <span className={cn("text-[11px] font-medium", overloaded ? "text-warning" : "text-success")}>
                  {match.capacityRemaining}h available
                </span>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {match.availabilityOverlap.map((slot) => <span key={slot} className="rounded bg-success/10 px-1.5 py-0.5 capitalize text-success">{slot}</span>)}
                <span className={cn("rounded px-1.5 py-0.5", overloaded ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground")}>{match.notes}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-7 text-xs flex-1" disabled={rbt.status === "Full"} onClick={() => assignMatch(match.rbtId, match.rbtName, match.score)}>
                  Assign <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Tentative
                </Button>
              </div>
            </div>
          );})}
      </div>

      {/* Right: RBT supply */}
      <div className="lg:col-span-4 bg-card rounded-xl border border-border/60 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">RBT Supply</h3>
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
          {mockRBTProfiles.map((rbt) => {
            const util = getRBTUtilization(rbt);
            return (
              <div key={rbt.id} className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{rbt.name}</p>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Award className="h-3 w-3" /> {rbt.experience}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {rbt.state} · {rbt.clinic}
                </p>
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{rbt.assignedHours}h / {rbt.capacityHours}h</span>
                    <span>{Math.round(util)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        util >= 95 ? "bg-destructive" : util >= 75 ? "bg-warning" : "bg-success",
                      )}
                      style={{ width: `${Math.min(util, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
