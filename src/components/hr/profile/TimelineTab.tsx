import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/lib/hr/types";

interface Event { id: string; description: string; event_type: string; created_at: string; created_by_name: string | null }

export function TimelineTab({ employee }: { employee: Employee }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [employee.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_timeline")
      .select("id, description, event_type, created_at, created_by_name")
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false });
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  }

  if (loading) return <Skeleton className="h-40" />;
  if (events.length === 0) {
    return <Card className="p-8 text-center"><p className="text-sm text-muted-foreground">No activity yet.</p></Card>;
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-3 pb-3 border-b border-border/30 last:border-0 last:pb-0">
            <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{e.description}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(e.created_at).toLocaleString()} · {e.event_type.replace(/_/g, " ")}
                {e.created_by_name ? ` · ${e.created_by_name}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}