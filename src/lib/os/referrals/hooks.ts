import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listContacts, listCompanies, listActivities, listBatches } from "./api";
import type { ReferralCompany, ReferralContact, ReferralActivity, ReferralImportBatch } from "./types";

function useChannelRefresh(table: string, refresh: () => void) {
  const channelNameRef = useRef(`realtime-${table}-${crypto.randomUUID()}`);

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
  const refresh = useCallback(async () => {
    try { setData(await listContacts()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_contacts", refresh);
  return { data, loading, refresh };
}

export function useReferralCompanies() {
  const [data, setData] = useState<ReferralCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setData(await listCompanies()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_companies", refresh);
  return { data, loading, refresh };
}

export function useReferralActivities(filter: { contactId?: string; companyId?: string } = {}) {
  const [data, setData] = useState<ReferralActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const key = `${filter.contactId ?? ""}|${filter.companyId ?? ""}`;
  const refresh = useCallback(async () => {
    try { setData(await listActivities(filter)); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useReferralBatches() {
  const [data, setData] = useState<ReferralImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setData(await listBatches()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useChannelRefresh("referral_import_batches", refresh);
  return { data, loading, refresh };
}