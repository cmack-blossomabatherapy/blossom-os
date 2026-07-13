import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CompanyCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starts_on: string;
  ends_on: string | null;
  all_day: boolean;
  location: string | null;
  owner_name?: string | null;
  related_record_type?: string | null;
  related_record_id?: string | null;
  related_record_label?: string | null;
  related_url?: string | null;
  next_step?: string | null;
}

export interface CompanyUpdate {
  id: string;
  title: string;
  body: string;
  author_name: string | null;
  pinned: boolean;
  published: boolean;
  published_at: string;
}

export interface CompanyHighlight {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  published: boolean;
}

const HR_MANAGE_ROLES = new Set([
  "super_admin",
  "admin",
  "systems_admin",
  "hr",
  "hr_lead",
  "hr_admin",
  "hr_manager",
]);

export function useCanManageCompanyHome(): boolean {
  const { roles, isAdmin } = useAuth();
  return useMemo(
    () => isAdmin || (roles ?? []).some((r) => HR_MANAGE_ROLES.has(r as string)),
    [roles, isAdmin],
  );
}

export function useCompanyHome() {
  const [events, setEvents] = useState<CompanyCalendarEvent[]>([]);
  const [updates, setUpdates] = useState<CompanyUpdate[]>([]);
  const [highlights, setHighlights] = useState<CompanyHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [e, u, h] = await Promise.all([
      supabase
        .from("company_calendar_events")
        .select("*")
        .gte("starts_on", today.toISOString().slice(0, 10))
        .order("starts_on", { ascending: true })
        .limit(50),
      supabase
        .from("company_updates")
        .select("*")
        .order("pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(25),
      supabase
        .from("company_highlights")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .limit(20),
    ]);
    setEvents((e.data ?? []) as CompanyCalendarEvent[]);
    setUpdates((u.data ?? []) as CompanyUpdate[]);
    setHighlights((h.data ?? []) as CompanyHighlight[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, updates, highlights, loading, reload: load };
}

export async function fetchAllCalendarEvents(): Promise<CompanyCalendarEvent[]> {
  const { data } = await supabase
    .from("company_calendar_events")
    .select("*")
    .order("starts_on", { ascending: true });
  return (data ?? []) as CompanyCalendarEvent[];
}

export async function fetchAllUpdates(): Promise<CompanyUpdate[]> {
  const { data } = await supabase
    .from("company_updates")
    .select("*")
    .order("published_at", { ascending: false });
  return (data ?? []) as CompanyUpdate[];
}

export async function fetchAllHighlights(): Promise<CompanyHighlight[]> {
  const { data } = await supabase
    .from("company_highlights")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as CompanyHighlight[];
}