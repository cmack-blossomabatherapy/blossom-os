import { parseCSVText } from "@/lib/os/reportEngine/csv";
import { extractDomain, normalizeCompanyName, safeDate, safeInt } from "./utils";

/** A normalized referral row produced from a CSV import. */
export interface MappedReferralRow {
  rowIndex: number;
  original_record_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  domain: string | null;
  company_name: string | null;
  full_address: string | null;
  state: string | null;
  status: string | null;
  contact_owner: string | null;
  last_activity_date: string | null;
  last_contacted_at: string | null;
  last_meeting_booked_at: string | null;
  next_follow_up_at: string | null;
  recent_email_opened_at: string | null;
  number_of_referrals_sent: number;
  number_of_sales_activities: number;
  number_of_times_contacted: number;
  raw: Record<string, string>;
}

/** Find a header case-insensitively, returning the first match. */
function pick(row: Record<string, string>, ...candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const k = keys.find((h) => h.toLowerCase().trim() === cand.toLowerCase().trim());
    if (k && row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  return null;
}

export function mapHubspotRow(row: Record<string, string>, rowIndex: number): MappedReferralRow {
  const first = pick(row, "First Name", "FirstName");
  const last = pick(row, "Last Name", "LastName");
  const email = pick(row, "Email");
  const website = pick(row, "Website URL", "Website");
  const companyName = pick(row, "Company Name", "Company");
  const domain = extractDomain(email, website);
  const status = pick(row, "Status");

  return {
    rowIndex,
    original_record_id: pick(row, "Record ID"),
    first_name: first,
    last_name: last,
    full_name: [first, last].filter(Boolean).join(" ") || null,
    email,
    phone: pick(row, "Phone Number", "Phone"),
    website_url: website,
    domain,
    company_name: companyName,
    full_address: pick(row, "Street Address", "Address"),
    state: pick(row, "State/Region", "State"),
    status,
    contact_owner: pick(row, "Contact owner", "Contact Owner", "Owner"),
    last_activity_date: safeDate(pick(row, "Last Activity Date")),
    last_contacted_at: safeDate(pick(row, "Last Contacted")),
    last_meeting_booked_at: safeDate(pick(row, "Date of last meeting booked in meetings tool", "Last Meeting Booked")),
    next_follow_up_at: safeDate(pick(row, "Next Activity Date", "Next Follow-Up Date")),
    recent_email_opened_at: safeDate(pick(row, "Recent Sales Email Opened Date")),
    number_of_referrals_sent: safeInt(pick(row, "Number of referrals sent")),
    number_of_sales_activities: safeInt(pick(row, "Number of Sales Activities")),
    number_of_times_contacted: safeInt(pick(row, "Number of times contacted")),
    raw: row,
  };
}

export interface ParsedCsv {
  headers: string[];
  rows: MappedReferralRow[];
}

export async function parseReferralsCsv(file: File): Promise<ParsedCsv> {
  const name = file.name.toLowerCase();
  const isExcel =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type.includes("spreadsheetml") ||
    file.type.includes("ms-excel");

  if (isExcel) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    const headers = json.length ? Object.keys(json[0]) : [];
    const rows = json.map((r) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) out[k] = v == null ? "" : String(v);
      return out;
    });
    return { headers, rows: rows.map((r, i) => mapHubspotRow(r, i + 2)) };
  }

  const text = await file.text();
  const { headers, rows } = parseCSVText(text);
  return {
    headers,
    rows: rows.map((r, i) => mapHubspotRow(r, i + 2)), // +2: header row + 1-index
  };
}

/** Allowed contact statuses in DB (others get coerced to "New"). */
const ALLOWED_CONTACT_STATUSES = new Set([
  "Active", "Needs Follow-Up", "New", "Connected", "Unresponsive",
  "Do Not Contact", "Duplicate", "Archived",
]);

export function coerceContactStatus(s: string | null | undefined): string {
  if (!s) return "New";
  const trimmed = s.trim();
  if (ALLOWED_CONTACT_STATUSES.has(trimmed)) return trimmed;
  // Common HubSpot variants
  const lower = trimmed.toLowerCase();
  if (lower.includes("follow")) return "Needs Follow-Up";
  if (lower.includes("connect")) return "Connected";
  if (lower.includes("unrespons")) return "Unresponsive";
  if (lower.includes("do not")) return "Do Not Contact";
  if (lower.includes("active")) return "Active";
  if (lower.includes("archiv")) return "Archived";
  return "New";
}

export { normalizeCompanyName };