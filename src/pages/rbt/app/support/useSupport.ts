import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SupportCategory = {
  id: string; key: string; label: string; description: string | null; icon: string | null;
  order_index: number; default_urgency: string; default_sla_minutes: number;
  is_urgent_safety: boolean; allow_client_link: boolean; ai_advice_restricted: boolean;
  subcategories: string[]; active: boolean;
};

export type SupportTicket = {
  id: string; ticket_number: string | null; category: string; subcategory: string | null;
  subject: string | null; description: string; urgency: string; status: string;
  routed_to_role: string | null; routed_to_employee_id: string | null;
  due_at: string | null; sla_minutes: number | null; created_at: string; updated_at: string;
  resolved_at: string | null; is_urgent_safety: boolean; escalation_level: number;
  satisfaction_rating: number | null; satisfaction_comment: string | null;
  resolution_notes: string | null; attachment_url: string | null; attachment_name: string | null;
  preferred_contact_method: string | null; related_client_id: string | null;
  state: string | null; service_setting: string | null; assigned_bcba_id: string | null;
};

export type SupportUpdate = {
  id: string; ticket_id: string; author_id: string | null;
  update_type: string; body: string | null; from_status: string | null; to_status: string | null;
  created_at: string;
};

export type SupportContact = {
  id: string; scope: string; scope_state: string | null; scope_employee_id: string | null;
  role_key: string; contact_employee_id: string | null; contact_name: string | null;
  contact_email: string | null; contact_phone: string | null; notes: string | null; active: boolean;
};

export function useSupportCategories() {
  const [data, setData] = useState<SupportCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("rbt_support_categories" as any)
      .select("*").eq("active", true).order("order_index")
      .then(({ data, error }) => { if (error) setError(error.message); setData((data as any) ?? []); });
  }, []);
  return { categories: data, error };
}

export function useMyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    // employee_id is the auth user id (is_employee_self checks profiles map)
    const { data: profile } = await supabase.from("profiles").select("employee_id").eq("id", user.id).maybeSingle();
    const empId = (profile as any)?.employee_id ?? user.id;
    const { data, error } = await supabase.from("rbt_help_requests" as any)
      .select("*")
      .eq("rbt_employee_id", empId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setError(error.message);
    setTickets((data as any) ?? []);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { tickets, error, reload: load };
}

export function useTicket(ticketId: string | undefined) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [updates, setUpdates] = useState<SupportUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    const [t, u] = await Promise.all([
      supabase.from("rbt_help_requests" as any).select("*").eq("id", ticketId).maybeSingle(),
      supabase.from("rbt_support_ticket_updates" as any).select("*").eq("ticket_id", ticketId).order("created_at"),
    ]);
    if (t.error) setError(t.error.message); else setTicket(t.data as any);
    if (!u.error) setUpdates((u.data as any) ?? []);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);
  return { ticket, updates, error, loading, reload: load };
}

export function useSupportContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<SupportContact[] | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("rbt_support_team_contacts" as any)
      .select("*").eq("active", true)
      .then(({ data }) => setContacts((data as any) ?? []));
  }, [user?.id]);
  return { contacts };
}

export async function submitTicket(input: {
  employeeId: string;
  category: string; subcategory?: string; subject: string; description: string;
  urgency: string; is_urgent_safety?: boolean; emergency_acknowledged?: boolean;
  related_client_id?: string | null; preferred_contact_method?: string;
  attachment_url?: string | null; attachment_name?: string | null;
  state?: string | null; service_setting?: string | null; assigned_bcba_id?: string | null;
}) {
  const { data, error } = await supabase.from("rbt_help_requests" as any).insert({
    rbt_employee_id: input.employeeId,
    category: input.category,
    subcategory: input.subcategory ?? null,
    subject: input.subject,
    description: input.description,
    urgency: input.urgency,
    is_urgent_safety: input.is_urgent_safety ?? false,
    emergency_acknowledged: input.emergency_acknowledged ?? false,
    related_client_id: input.related_client_id ?? null,
    preferred_contact_method: input.preferred_contact_method ?? null,
    attachment_url: input.attachment_url ?? null,
    attachment_name: input.attachment_name ?? null,
    state: input.state ?? null,
    service_setting: input.service_setting ?? null,
    assigned_bcba_id: input.assigned_bcba_id ?? null,
  }).select("id, ticket_number").maybeSingle();
  if (error) throw error;
  return data as unknown as { id: string; ticket_number: string };
}

export async function postTicketMessage(ticketId: string, body: string) {
  const { error } = await supabase.from("rbt_support_ticket_updates" as any).insert({
    ticket_id: ticketId, update_type: "message", body, visible_to_employee: true,
  });
  if (error) throw error;
  // move status to "waiting_for_owner" if employee posts, but keep this trigger-less; just touch updated_at
  await supabase.from("rbt_help_requests" as any).update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
}

export async function submitSatisfaction(ticketId: string, rating: number, comment?: string) {
  const { error } = await supabase.from("rbt_help_requests" as any)
    .update({ satisfaction_rating: rating, satisfaction_comment: comment ?? null, status: "closed" })
    .eq("id", ticketId);
  if (error) throw error;
}

export const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  received: "Received",
  in_progress: "In progress",
  waiting_for_you: "Waiting for you",
  resolved: "Resolved",
  closed: "Closed",
  // legacy
  open: "Submitted",
};

export const STATUS_ORDER = ["submitted","received","in_progress","waiting_for_you","resolved","closed"];

export const URGENCY_LABEL: Record<string,string> = {
  low: "Low", normal: "Normal", high: "High", urgent: "Urgent",
};