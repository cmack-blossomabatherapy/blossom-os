import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listContacts, listCompanies, listActivities, listBatches, listTasks, type ReferralCrmTask } from "./api";
import type { ReferralCompany, ReferralContact, ReferralActivity, ReferralImportBatch } from "./types";

function useChannelRefresh(table: string, refresh: () => void) {
  const channelNameRef = useRef(`realtime-${table}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const ch = supabase
      .channel(channelNameRef.current)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [table, refresh]);
}

export function useReferralContacts() {
  const [data, setData] = useState<ReferralContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    try { setError(null); setData(await listContacts()); } catch (e) { setError(e instanceof Error ? e : new Error(String(e))); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_contacts", refresh);
  return { data, loading, error, refresh };
}

export function useReferralCompanies() {
  const [data, setData] = useState<ReferralCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    try { setError(null); setData(await listCompanies()); } catch (e) { setError(e instanceof Error ? e : new Error(String(e))); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_companies", refresh);
  return { data, loading, error, refresh };
}

export function useReferralActivities(filter: { contactId?: string; companyId?: string } = {}) {
  const [data, setData] = useState<ReferralActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const key = `${filter.contactId ?? ""}|${filter.companyId ?? ""}`;
  const refresh = useCallback(async () => {
    try { setError(null); setData(await listActivities(filter)); } catch (e) { setError(e instanceof Error ? e : new Error(String(e))); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useReferralBatches() {
  const [data, setData] = useState<ReferralImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    try { setError(null); setData(await listBatches()); } catch (e) { setError(e instanceof Error ? e : new Error(String(e))); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_import_batches", refresh);
  return { data, loading, error, refresh };
}

export function useReferralTasks(filter: { companyId?: string; contactId?: string; includeArchived?: boolean } = {}) {
  const [data, setData] = useState<ReferralCrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const key = `${filter.companyId ?? ""}|${filter.contactId ?? ""}|${filter.includeArchived ? "1" : "0"}`;
  const refresh = useCallback(async () => {
    try { setError(null); setData(await listTasks(filter)); } catch (e) { setError(e instanceof Error ? e : new Error(String(e))); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_crm_tasks", refresh);
  return { data, loading, error, refresh };
}