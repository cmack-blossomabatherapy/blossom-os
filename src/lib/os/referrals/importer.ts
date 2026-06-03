import { supabase } from "@/integrations/supabase/client";
import { findOrCreateCompany } from "./api";
import { coerceContactStatus, type MappedReferralRow } from "./csv";

export interface ImportProgress {
  current: number;
  total: number;
}

export interface ImportResult {
  batchId: string;
  createdContacts: number;
  updatedContacts: number;
  createdCompanies: number;
  duplicateContacts: number;
  failedRows: number;
  errors: { row: number; reason: string; data: Record<string, string> }[];
}

/** Run an import. Creates a batch row, then processes each mapped row.
 *  Companies are matched by normalized_name (+ domain). Contacts are
 *  matched by (email) or (original_record_id) or (first+last + company).
 */
export async function importReferralRows(
  fileName: string,
  rows: MappedReferralRow[],
  onProgress?: (p: ImportProgress) => void,
): Promise<ImportResult> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;

  const { data: batch, error: batchErr } = await supabase
    .from("referral_import_batches")
    .insert({
      file_name: fileName,
      uploaded_by: uid,
      total_rows: rows.length,
      status: "Processing",
    })
    .select("*")
    .single();
  if (batchErr || !batch) throw batchErr ?? new Error("Failed to create batch");

  const result: ImportResult = {
    batchId: batch.id,
    createdContacts: 0,
    updatedContacts: 0,
    createdCompanies: 0,
    duplicateContacts: 0,
    failedRows: 0,
    errors: [],
  };

  // Pre-load company id cache so we don't double-create within one import
  const companyCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.({ current: i + 1, total: rows.length });
    try {
      // Need at minimum a name or email or company
      if (!row.full_name && !row.email && !row.company_name) {
        throw new Error("Empty row");
      }

      // Resolve company
      let companyId: string | null = null;
      if (row.company_name) {
        const cacheKey = `${row.company_name.toLowerCase()}|${row.domain ?? ""}`;
        const cached = companyCache.get(cacheKey);
        if (cached) companyId = cached;
        else {
          const before = await supabase
            .from("referral_companies")
            .select("id")
            .ilike("company_name", row.company_name)
            .limit(1);
          const wasExisting = !!(before.data && before.data.length);
          companyId = await findOrCreateCompany({
            company_name: row.company_name,
            domain: row.domain,
            state: row.state,
            website_url: row.website_url,
            full_address: row.full_address,
            relationship_owner: row.contact_owner ? [row.contact_owner] : null,
            source: "HubSpot Import",
            import_batch_id: batch.id,
          });
          if (!wasExisting) result.createdCompanies += 1;
          companyCache.set(cacheKey, companyId);
        }
      }

      // Dedupe contact
      let existing: { id: string } | null = null;
      if (row.email) {
        const { data } = await supabase
          .from("referral_contacts")
          .select("id")
          .ilike("email", row.email)
          .limit(1);
        if (data && data.length) existing = data[0];
      }
      if (!existing && row.original_record_id) {
        const { data } = await supabase
          .from("referral_contacts")
          .select("id")
          .eq("original_record_id", row.original_record_id)
          .limit(1);
        if (data && data.length) existing = data[0];
      }
      if (!existing && row.first_name && row.last_name && companyId) {
        const { data } = await supabase
          .from("referral_contacts")
          .select("id")
          .eq("first_name", row.first_name)
          .eq("last_name", row.last_name)
          .eq("company_id", companyId)
          .limit(1);
        if (data && data.length) existing = data[0];
      }

      const payload = {
        company_id: companyId,
        first_name: row.first_name,
        last_name: row.last_name,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        website_url: row.website_url,
        full_address: row.full_address,
        state: row.state,
        contact_owner: row.contact_owner ? [row.contact_owner] : null,
        status: coerceContactStatus(row.status),
        last_activity_date: row.last_activity_date,
        last_contacted_at: row.last_contacted_at,
        last_meeting_booked_at: row.last_meeting_booked_at,
        next_follow_up_at: row.next_follow_up_at,
        recent_email_opened_at: row.recent_email_opened_at,
        number_of_referrals_sent: row.number_of_referrals_sent,
        number_of_sales_activities: row.number_of_sales_activities,
        number_of_times_contacted: row.number_of_times_contacted,
        original_record_id: row.original_record_id,
        import_batch_id: batch.id,
        source: "HubSpot Import",
      };

      if (existing) {
        // Only set fields that have a value (don't blank out existing data)
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(payload)) {
          if (v != null && v !== "" && v !== 0) patch[k] = v;
        }
        // Always store new batch id reference + numeric counters if higher
        patch.import_batch_id = batch.id;
        if (row.number_of_referrals_sent > 0) patch.number_of_referrals_sent = row.number_of_referrals_sent;
        if (row.number_of_sales_activities > 0) patch.number_of_sales_activities = row.number_of_sales_activities;
        if (row.number_of_times_contacted > 0) patch.number_of_times_contacted = row.number_of_times_contacted;
        const { error } = await supabase.from("referral_contacts").update(patch as never).eq("id", existing.id);
        if (error) throw error;
        result.updatedContacts += 1;
        result.duplicateContacts += 1;
      } else {
        const { error } = await supabase.from("referral_contacts").insert(payload);
        if (error) throw error;
        result.createdContacts += 1;
      }
    } catch (err) {
      result.failedRows += 1;
      result.errors.push({
        row: row.rowIndex,
        reason: err instanceof Error ? err.message : String(err),
        data: row.raw,
      });
    }
  }

  await supabase
    .from("referral_import_batches")
    .update({
      successful_rows: result.createdContacts + result.updatedContacts,
      failed_rows: result.failedRows,
      duplicate_contacts: result.duplicateContacts,
      duplicate_companies: 0,
      error_log: result.errors as unknown as never,
      status: result.failedRows > 0 ? "Completed with Errors" : "Completed",
    })
    .eq("id", batch.id);

  return result;
}

export function failedRowsToCsv(errors: ImportResult["errors"]): string {
  if (!errors.length) return "";
  const headers = Array.from(new Set(["__reason", ...errors.flatMap((e) => Object.keys(e.data))]));
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const e of errors) {
    lines.push(headers.map((h) => esc(h === "__reason" ? e.reason : e.data[h] ?? "")).join(","));
  }
  return lines.join("\n");
}