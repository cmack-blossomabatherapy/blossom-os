import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCrSync(source = "centralreach") {
  const [row, setRow] = useState<any | null>(null);
  useEffect(() => {
    supabase.from("rbt_data_sync_status" as any)
      .select("last_success_at,last_attempt_at,status,message,stale_after_hours")
      .eq("source", source)
      .maybeSingle()
      .then(({ data }) => setRow(data ?? null));
  }, [source]);
  return row;
}