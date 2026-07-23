/**
 * Lead Benefits Cheat Sheets
 * ---------------------------
 * Real payer-by-payer intake guidance synced from the original Monday board
 * "Lead Benefits Cheat Sheets" (workbook id 1782177836). Used by:
 *  - /intake/benefits-cheat-sheets (page)
 *  - Lead detail Insurance / VOB tab (auto-match panel)
 *
 * Status language matches the Monday board exactly:
 *   TAKE | TAKE-CONDITIONAL | CONDITIONAL | DON'T TAKE
 */

export type CheatSheetState =
  | "Georgia"
  | "Tennessee"
  | "Virginia"
  | "North Carolina"
  | "Maryland";

export type CheatSheetCategory =
  | "MCO"
  | "INN Commercials"
  | "OON Commercial"
  | "Misc";

export type CheatSheetStatus =
  | "TAKE"
  | "TAKE-CONDITIONAL"
  | "CONDITIONAL"
  | "DON'T TAKE";

export interface LeadBenefitsCheatSheet {
  state: CheatSheetState;
  payer: string;
  insuranceCategory: CheatSheetCategory;
  intakeStatus: CheatSheetStatus;
  notes: string;
  mondayItemId: string;
}

/**
 * Persisted row shape (mirrors public.benefits_knowledge). Optional id/active
 * fields distinguish it from the static fallback array.
 */
export interface BenefitsKnowledgeRow extends LeadBenefitsCheatSheet {
  id?: string;
  isActive?: boolean;
  updatedAt?: string | null;
}

/**
 * Source rows — exact mirror of the cleaned Lead Benefits Cheat Sheet
 * workbook (Monday board id 1782177836). Every row carries the real
 * Monday item id from the source board.
 *
 * Total length is fixed at 48 rows. Do not add, remove, or fabricate.
 */
export const leadBenefitsCheatSheets: LeadBenefitsCheatSheet[] = [
  // -- Georgia (15) --------------------------------------------------------
  { state: "Georgia", payer: "Amerigroup Real Solutions", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250880354" },
  { state: "Georgia", payer: "Care Source", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250786311" },
  { state: "Georgia", payer: "PeachState", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250869832" },
  { state: "Georgia", payer: "UHC-Optum- UBH", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250919263" },
  { state: "Georgia", payer: "Cigna", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250916439" },
  { state: "Georgia", payer: "ChampVA", insuranceCategory: "Misc", intakeStatus: "TAKE", notes: "", mondayItemId: "12250869992" },
  { state: "Georgia", payer: "Kaiser", insuranceCategory: "Misc", intakeStatus: "TAKE-CONDITIONAL", notes: "Only for bill denial", mondayItemId: "12250869953" },
  { state: "Georgia", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad- PUSH THROUGH", mondayItemId: "12250869981" },
  { state: "Georgia", payer: "Anthem", insuranceCategory: "OON Commercial", intakeStatus: "CONDITIONAL", notes: "Check plans below - Can be found on Card", mondayItemId: "12250909159" },
  { state: "Georgia", payer: "HSA", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Bad", mondayItemId: "12250908877" },
  { state: "Georgia", payer: "Credence", insuranceCategory: "OON Commercial", intakeStatus: "TAKE", notes: "Push Through", mondayItemId: "12250922409" },
  { state: "Georgia", payer: "National Benefits Fund", insuranceCategory: "OON Commercial", intakeStatus: "TAKE", notes: "Push Through", mondayItemId: "12250922361" },
  { state: "Georgia", payer: "Empire", insuranceCategory: "OON Commercial", intakeStatus: "TAKE", notes: "Push Through", mondayItemId: "12250918440" },
  { state: "Georgia", payer: "Anthem- No specific Plan", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250916964" },
  { state: "Georgia", payer: "Anthem- Through a Corp...", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250909247" },

  // -- Tennessee (8) -------------------------------------------------------
  { state: "Tennessee", payer: "Well Point- Amerigroup", insuranceCategory: "MCO", intakeStatus: "TAKE-CONDITIONAL", notes: "As long as insurance is active", mondayItemId: "12250787607" },
  { state: "Tennessee", payer: "TennCare Blue Care", insuranceCategory: "MCO", intakeStatus: "DON'T TAKE", notes: "", mondayItemId: "12250924302" },
  { state: "Tennessee", payer: "United Health Care", insuranceCategory: "MCO", intakeStatus: "DON'T TAKE", notes: "", mondayItemId: "12250899920" },
  { state: "Tennessee", payer: "BCBS", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250923551" },
  { state: "Tennessee", payer: "UHC", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250927315" },
  { state: "Tennessee", payer: "ChampVA", insuranceCategory: "Misc", intakeStatus: "TAKE", notes: "", mondayItemId: "12250923576" },
  { state: "Tennessee", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad- PUSH THROUGH", mondayItemId: "12250923561" },
  { state: "Tennessee", payer: "Cigna", insuranceCategory: "OON Commercial", intakeStatus: "DON'T TAKE", notes: "", mondayItemId: "12250937519" },

  // -- Virginia (10) -------------------------------------------------------
  { state: "Virginia", payer: "Aetna Better Health", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250944008" },
  { state: "Virginia", payer: "Anthem Healthkeepers", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250921735" },
  { state: "Virginia", payer: "Setara Health Plans Medicaid", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250946565" },
  { state: "Virginia", payer: "UHC Community", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active", mondayItemId: "12250938058" },
  { state: "Virginia", payer: "BCBS/ Anthem VA", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250946240" },
  { state: "Virginia", payer: "Care First Blue Choice", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250956369" },
  { state: "Virginia", payer: "Sentara", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250924958" },
  { state: "Virginia", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad- PUSH THROUGH", mondayItemId: "12250944290" },
  { state: "Virginia", payer: "UHC", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250950237" },
  { state: "Virginia", payer: "Cigna", insuranceCategory: "OON Commercial", intakeStatus: "DON'T TAKE", notes: "Especially if benefits are bad", mondayItemId: "12250944300" },

  // -- North Carolina (13) -------------------------------------------------
  { state: "North Carolina", payer: "Alliance - NC Medicaid", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "", mondayItemId: "12250962541" },
  { state: "North Carolina", payer: "Carolina Complete Health - NC Medicaid", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "", mondayItemId: "12250925685" },
  { state: "North Carolina", payer: "Healthy Blue - NC Medicaid", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "", mondayItemId: "12250962293" },
  { state: "North Carolina", payer: "Partners Behavioral Health Management - NC Medicaid", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "", mondayItemId: "12250962298" },
  { state: "North Carolina", payer: "Trillium Health Resources", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "", mondayItemId: "12250947274" },
  { state: "North Carolina", payer: "Vaya Health", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "", mondayItemId: "12250925179" },
  { state: "North Carolina", payer: "BCBS", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250962781" },
  { state: "North Carolina", payer: "ChampVA", insuranceCategory: "Misc", intakeStatus: "TAKE", notes: "", mondayItemId: "12250925857" },
  { state: "North Carolina", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad- PUSH THROUGH IF UCR", mondayItemId: "12250957292" },
  { state: "North Carolina", payer: "United Behavioral Health", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Does not seem to pay well", mondayItemId: "12250962835" },
  { state: "North Carolina", payer: "UMR", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad- PUSH THROUGH", mondayItemId: "12250947193" },
  { state: "North Carolina", payer: "Vaya Health", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Does not seem to pay well", mondayItemId: "12250947821" },
  { state: "North Carolina", payer: "Cigna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad", mondayItemId: "12250947867" },

  // -- Maryland (2) --------------------------------------------------------
  { state: "Maryland", payer: "-", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Take All", mondayItemId: "12250963311" },
  { state: "Maryland", payer: "-", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "Take All unless extremely bad benefits", mondayItemId: "12250970422" },
];

/* ---------------------------------------------------------------------- */
/* Normalization + matching                                               */
/* ---------------------------------------------------------------------- */

/** Lowercase, strip punctuation, collapse spaces, drop common filler words. */
export function normalizePayerName(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, " ");
  s = s.replace(/\b(of|the|inc|llc|plan|plans|insurance|health|healthcare|company|co|corp|group|managed|care)\b/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  // Brand normalizations
  const map: Array<[RegExp, string]> = [
    [/\b(uhc|united|unitedhealthcare|united health|united health care|optum|ubh|united behavioral)\b.*/, "uhc"],
    [/\b(bcbs|blue cross|blue shield|bluecross|blueshield|carefirst|anthem blue cross)\b.*/, "bcbs"],
    [/\banthem\b/, "anthem"],
    [/\bcaresource|care source\b/, "caresource"],
    [/\bamerigroup|wellpoint amerigroup|well point amerigroup\b/, "amerigroup"],
    [/\bpeachstate|peach state\b/, "peachstate"],
    [/\bcigna\b/, "cigna"],
    [/\baetna\b/, "aetna"],
    [/\bhumana\b/, "humana"],
    [/\btricare\b/, "tricare"],
    [/\bmolina\b/, "molina"],
    [/\bsentara\b/, "sentara"],
    [/\bwellcare|well care\b/, "wellcare"],
    [/\bmedicaid|medical assistance|tenncare|healthkeepers|cardinal\b/, "medicaid"],
    [/\bself pay|self-pay|selfpay|private pay\b/, "self pay"],
  ];
  for (const [re, replacement] of map) {
    if (re.test(s)) { s = replacement; break; }
  }
  return s.trim();
}

/** Normalize a state value to the canonical CheatSheetState. */
export function normalizeState(input: string | null | undefined): CheatSheetState | null {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  if (!s) return null;
  if (["ga", "georgia"].includes(s)) return "Georgia";
  if (["tn", "tennessee"].includes(s)) return "Tennessee";
  if (["va", "virginia"].includes(s)) return "Virginia";
  if (["nc", "north carolina", "n carolina"].includes(s)) return "North Carolina";
  if (["md", "maryland"].includes(s)) return "Maryland";
  return null;
}

export type MatchConfidence = "exact" | "strong" | "possible" | "none";

export interface CheatSheetMatch {
  sheet: LeadBenefitsCheatSheet | null;
  confidence: MatchConfidence;
  sameState: boolean;
  reason: string;
}

/**
 * Find the best cheat-sheet match for a lead's payer + state.
 * Prefers same-state matches. Falls back to cross-state with a warning.
 */
export function findBenefitsCheatSheetForLead(input: {
  insurance?: string | null;
  state?: string | null;
}): CheatSheetMatch {
  const target = normalizePayerName(input.insurance);
  const state = normalizeState(input.state);
  if (!target) {
    return { sheet: null, confidence: "none", sameState: false, reason: "No insurance on file." };
  }

  // Score every row: exact normalized payer match in same state > same-state token overlap > cross-state.
  type Scored = { sheet: LeadBenefitsCheatSheet; score: number; sameState: boolean };
  const scored: Scored[] = leadBenefitsCheatSheets.map((sheet) => {
    const norm = normalizePayerName(sheet.payer);
    const sameState = state ? sheet.state === state : false;
    let score = 0;
    if (norm === target) score = 100;
    else if (norm && (norm.includes(target) || target.includes(norm))) score = 70;
    else {
      // token overlap
      const a = new Set(target.split(" ").filter(Boolean));
      const b = new Set(norm.split(" ").filter(Boolean));
      let shared = 0;
      a.forEach((t) => { if (b.has(t)) shared += 1; });
      if (shared > 0) score = 30 + shared * 10;
    }
    if (sameState && score > 0) score += 25;
    return { sheet, score, sameState };
  }).filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) {
    return { sheet: null, confidence: "none", sameState: false, reason: "No payer match found in cheat sheets." };
  }

  let confidence: MatchConfidence = "possible";
  if (best.score >= 110) confidence = "exact";
  else if (best.score >= 80) confidence = "strong";
  else if (best.score >= 50) confidence = "possible";
  else confidence = "possible";

  const reason = best.sameState
    ? `Matched ${best.sheet.payer} in ${best.sheet.state}.`
    : `No same-state match. Showing cross-state guidance from ${best.sheet.state}. Verify before acting.`;

  return { sheet: best.sheet, confidence, sameState: best.sameState, reason };
}

/** UI tone for a Monday-board status value. */
export function mapCheatSheetStatusToTone(status: CheatSheetStatus | string): {
  label: string;
  className: string;
  recommendation: string;
} {
  switch (status) {
    case "TAKE":
      return {
        label: "TAKE",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        recommendation: "Proceed if insurance is active.",
      };
    case "TAKE-CONDITIONAL":
      return {
        label: "TAKE-CONDITIONAL",
        className: "bg-amber-50 text-amber-800 border-amber-200",
        recommendation: "Verify benefit quality before proceeding.",
      };
    case "CONDITIONAL":
      return {
        label: "CONDITIONAL",
        className: "bg-sky-50 text-sky-700 border-sky-200",
        recommendation: "Check plan / card details. Escalate if unclear.",
      };
    case "DON'T TAKE":
      return {
        label: "DON'T TAKE",
        className: "bg-rose-50 text-rose-700 border-rose-200",
        recommendation: "Do not proceed without leadership / finance review.",
      };
    default:
      return {
        label: String(status),
        className: "bg-muted text-foreground border-border",
        recommendation: "Review with intake lead.",
      };
  }
}

/* ---------------------------------------------------------------------- */
/* Live persistence layer (public.benefits_knowledge)                     */
/* ---------------------------------------------------------------------- */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch active benefit guidance rows from Supabase, falling back to the
 * canonical 48-row seed if the backend is unavailable or empty.
 */
export async function fetchBenefitsKnowledge(opts?: {
  includeInactive?: boolean;
}): Promise<BenefitsKnowledgeRow[]> {
  try {
    let query = (supabase as any).from("benefits_knowledge").select(
      "id,state,payer,insurance_category,intake_status,notes,monday_item_id,is_active,updated_at",
    );
    if (!opts?.includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query.order("state").order("payer");
    if (error) throw error;
    if (!data || data.length === 0) {
      return leadBenefitsCheatSheets.map((r) => ({ ...r, isActive: true }));
    }
    return (data as any[]).map((r) => ({
      id: r.id as string,
      state: r.state as CheatSheetState,
      payer: r.payer as string,
      insuranceCategory: r.insurance_category as CheatSheetCategory,
      intakeStatus: r.intake_status as CheatSheetStatus,
      notes: r.notes ?? "",
      mondayItemId: r.monday_item_id ?? "",
      isActive: Boolean(r.is_active),
      updatedAt: r.updated_at ?? null,
    }));
  } catch {
    return leadBenefitsCheatSheets.map((r) => ({ ...r, isActive: true }));
  }
}

/**
 * React hook — returns live persisted Benefits Knowledge (active only by
 * default) with the 48-row seed as a safe fallback while loading or offline.
 */
export function useBenefitsKnowledge(opts?: { includeInactive?: boolean }) {
  const [rows, setRows] = useState<BenefitsKnowledgeRow[]>(() =>
    leadBenefitsCheatSheets.map((r) => ({ ...r, isActive: true })),
  );
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetchBenefitsKnowledge(opts).then((r) => {
      if (!cancelled) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.includeInactive, reloadKey]);
  return { rows, loading, refresh: () => setReloadKey((k) => k + 1) };
}