import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  EvalStaff, EvalCycle, Evaluation, EvalMeeting, EvalNote, EvalEmail,
  EvalForm, EvalEmailTemplate, EvalResponse,
} from "./types";
import type { AuditEntry } from "./audit";

export interface EvalSettings {
  id: number;
  quarterly_enabled: boolean;
  annual_enabled: boolean;
  default_bcba_frequency: string;
  default_rbt_frequency: string;
  auto_create_next: boolean;
  self_due_days: number;
  leadership_due_days: number;
  meeting_due_days: number;
  finalize_due_days: number;
  reminder_7_before: boolean;
  reminder_3_before: boolean;
  reminder_on_due: boolean;
  reminder_3_overdue: boolean;
  reminder_7_overdue: boolean;
  reminder_weekly_overdue: boolean;
  sender_name: string | null;
  sender_email: string | null;
  reply_to_email: string | null;
  email_connected: boolean;
  staff_can_view_past: boolean;
  staff_can_download: boolean;
  reviewer_can_view_past: boolean;
  state_director_scope: boolean;
  hr_sees_all_states: boolean;
}

export interface EvaluationsData {
  staff: EvalStaff[];
  cycles: EvalCycle[];
  evaluations: Evaluation[];
  meetings: EvalMeeting[];
  notes: EvalNote[];
  emails: EvalEmail[];
  forms: EvalForm[];
  templates: EvalEmailTemplate[];
  responses: EvalResponse[];
  audit: AuditEntry[];
  settings: EvalSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useEvaluationsData(): EvaluationsData {
  const [staff, setStaff] = useState<EvalStaff[]>([]);
  const [cycles, setCycles] = useState<EvalCycle[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [meetings, setMeetings] = useState<EvalMeeting[]>([]);
  const [notes, setNotes] = useState<EvalNote[]>([]);
  const [emails, setEmails] = useState<EvalEmail[]>([]);
  const [forms, setForms] = useState<EvalForm[]>([]);
  const [templates, setTemplates] = useState<EvalEmailTemplate[]>([]);
  const [responses, setResponses] = useState<EvalResponse[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [settings, setSettings] = useState<EvalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, c, e, m, n, em, fr, tp, rs, au, st] = await Promise.all([
      supabase.from("evaluation_staff").select("*").order("last_name"),
      supabase.from("evaluation_cycles").select("*").order("start_date", { ascending: false }),
      supabase.from("evaluations").select("*").order("created_at", { ascending: false }),
      supabase.from("evaluation_meetings").select("*").order("meeting_date", { ascending: false }),
      supabase.from("evaluation_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("evaluation_emails").select("*").order("created_at", { ascending: false }),
      supabase.from("evaluation_forms").select("*").order("name"),
      supabase.from("evaluation_email_templates").select("*").order("name"),
      supabase.from("evaluation_responses").select("*").order("submitted_at", { ascending: false }),
      (supabase.from as any)("evaluation_audit_log").select("*").order("created_at", { ascending: false }).limit(500),
      (supabase.from as any)("evaluation_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    setStaff((s.data ?? []) as EvalStaff[]);
    setCycles((c.data ?? []) as EvalCycle[]);
    setEvaluations((e.data ?? []) as Evaluation[]);
    setMeetings((m.data ?? []) as EvalMeeting[]);
    setNotes((n.data ?? []) as EvalNote[]);
    setEmails((em.data ?? []) as EvalEmail[]);
    setForms((fr.data ?? []) as unknown as EvalForm[]);
    setTemplates((tp.data ?? []) as EvalEmailTemplate[]);
    setResponses((rs.data ?? []) as unknown as EvalResponse[]);
    setAudit(((au as any)?.data ?? []) as AuditEntry[]);
    setSettings(((st as any)?.data ?? null) as EvalSettings | null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { staff, cycles, evaluations, meetings, notes, emails, forms, templates, responses, audit, settings, loading, refresh };
}