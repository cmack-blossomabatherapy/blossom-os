import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOSRole } from "@/contexts/OSRoleContext";

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
  "hr",
  "hr_lead",
  "hr_admin",
  "hr_manager",
  "executive_leadership",
  "ceo",
  "coo",
  "director_of_operations",
]);

export function useCanManageCompanyHome(): boolean {
  const { roles, isAdmin } = useAuth();
  const { role: activeOsRole } = useOSRole();
  return useMemo(
    () => {
      // Respect the "view as role" switcher: even a super admin previewing
      // as intake should NOT see the Manage button.
      if (!HR_MANAGE_ROLES.has(activeOsRole as string)) return false;
      return isAdmin || (roles ?? []).some((r) => HR_MANAGE_ROLES.has(r as string));
    },
    [roles, isAdmin, activeOsRole],
  );
}

/**
 * Company Home data hook.
 *
 * Uses React Query so:
 *  - all consumers share one cache,
 *  - remounts are instant (stale-while-revalidate),
 *  - re-focus doesn't refetch aggressively,
 *  - the calendar query is bounded (upcoming window only) to stay
 *    responsive with large datasets.
 */
const COMPANY_HOME_KEYS = {
  events: ["company-home", "events"] as const,
  updates: ["company-home", "updates"] as const,
  highlights: ["company-home", "highlights"] as const,
};

// Lightweight column projection — no `select("*")` payload bloat.
const EVENT_COLS =
  "id,title,description,category,starts_on,ends_on,all_day,location,owner_name,related_record_type,related_record_id,related_record_label,related_url,next_step";
const UPDATE_COLS = "id,title,body,author_name,pinned,published,published_at";
const HIGHLIGHT_COLS = "id,title,body,image_url,link_url,sort_order,published";

async function fetchUpcomingEvents(): Promise<CompanyCalendarEvent[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("company_calendar_events")
    .select(EVENT_COLS)
    .gte("starts_on", today.toISOString().slice(0, 10))
    .order("starts_on", { ascending: true })
    .limit(200);
  return (data ?? []) as CompanyCalendarEvent[];
}

async function fetchTopUpdates(): Promise<CompanyUpdate[]> {
  const { data } = await supabase
    .from("company_updates")
    .select(UPDATE_COLS)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(25);
  return (data ?? []) as CompanyUpdate[];
}

async function fetchPublishedHighlights(): Promise<CompanyHighlight[]> {
  const { data } = await supabase
    .from("company_highlights")
    .select(HIGHLIGHT_COLS)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .limit(20);
  return (data ?? []) as CompanyHighlight[];
}

export function useCompanyHome() {
  const qc = useQueryClient();

  const eventsQ = useQuery({
    queryKey: COMPANY_HOME_KEYS.events,
    queryFn: fetchUpcomingEvents,
    staleTime: 5 * 60 * 1000,       // 5 min: calendar doesn't change often
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // keep last data while refetching
  });
  const updatesQ = useQuery({
    queryKey: COMPANY_HOME_KEYS.updates,
    queryFn: fetchTopUpdates,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
  const highlightsQ = useQuery({
    queryKey: COMPANY_HOME_KEYS.highlights,
    queryFn: fetchPublishedHighlights,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const reload = () => {
    void qc.invalidateQueries({ queryKey: ["company-home"] });
  };

  return {
    events: eventsQ.data ?? [],
    updates: updatesQ.data ?? [],
    highlights: highlightsQ.data ?? [],
    loading:
      (eventsQ.isLoading && !eventsQ.data) ||
      (updatesQ.isLoading && !updatesQ.data) ||
      (highlightsQ.isLoading && !highlightsQ.data),
    reload,
  };
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