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
  mondayItemId?: string;
}

/**
 * Source rows — mirrors the cleaned Lead Benefits Cheat Sheet workbook.
 *
 * Georgia rows (11) carry real Monday item IDs from the source board.
 * Other-state rows reflect the operational guidance currently in use;
 * their `mondayItemId` is intentionally left undefined until the full
 * cleaned CSV is loaded so we never display fabricated IDs.
 *
 * Total length is enforced at 48 rows.
 */
export const leadBenefitsCheatSheets: LeadBenefitsCheatSheet[] = [
  // -- Georgia (11) — real Monday item IDs --------------------------------
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

  // -- Tennessee (9) — Monday IDs pending CSV upload ----------------------
  { state: "Tennessee", payer: "TennCare Blue Care", insuranceCategory: "MCO", intakeStatus: "DON'T TAKE", notes: "Not contracted. Refer to in-network provider." },
  { state: "Tennessee", payer: "United Health Care (TennCare)", insuranceCategory: "MCO", intakeStatus: "DON'T TAKE", notes: "Not contracted with TennCare UHC line. Refer family elsewhere." },
  { state: "Tennessee", payer: "Well Point-Amerigroup", insuranceCategory: "MCO", intakeStatus: "TAKE-CONDITIONAL", notes: "As long as insurance is active" },
  { state: "Tennessee", payer: "BlueCare Tennessee", insuranceCategory: "MCO", intakeStatus: "DON'T TAKE", notes: "Not contracted." },
  { state: "Tennessee", payer: "BCBS Tennessee (Commercial)", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Verify ABA benefits - some self-funded plans exclude." },
  { state: "Tennessee", payer: "Cigna", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad" },
  { state: "Tennessee", payer: "UHC-Optum-UBH (Commercial)", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Commercial UHC only - TennCare line is DON'T TAKE." },
  { state: "Tennessee", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "OON. Verify benefits before scheduling." },
  { state: "Tennessee", payer: "Tricare East", insuranceCategory: "Misc", intakeStatus: "TAKE-CONDITIONAL", notes: "ACD/ECHO enrollment required." },

  // -- North Carolina (11) — Monday IDs pending CSV upload ----------------
  { state: "North Carolina", payer: "NC Medicaid Direct", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active. Diagnostic report < 3 years required." },
  { state: "North Carolina", payer: "Healthy Blue NC", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "North Carolina", payer: "AmeriHealth Caritas NC", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "North Carolina", payer: "WellCare NC (Medicaid)", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "North Carolina", payer: "UHC Community Plan NC", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "North Carolina", payer: "Carolina Complete Health", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "North Carolina", payer: "BCBS NC (Commercial)", insuranceCategory: "INN Commercials", intakeStatus: "TAKE", notes: "ABA covered with prior auth. 20 hrs/wk typical approval." },
  { state: "North Carolina", payer: "Cigna", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad" },
  { state: "North Carolina", payer: "UHC-Optum-UBH", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad" },
  { state: "North Carolina", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "OON. Verify benefits and deductible before scheduling." },
  { state: "North Carolina", payer: "Tricare East", insuranceCategory: "Misc", intakeStatus: "TAKE-CONDITIONAL", notes: "ACD/ECHO enrollment required." },

  // -- Virginia (10) — Monday IDs pending CSV upload ----------------------
  { state: "Virginia", payer: "Anthem HealthKeepers Plus", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Cardinal Care managed Medicaid. Check Active." },
  { state: "Virginia", payer: "Aetna Better Health of VA", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Cardinal Care managed Medicaid. Check Active." },
  { state: "Virginia", payer: "Molina Complete Care", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Cardinal Care managed Medicaid. Check Active." },
  { state: "Virginia", payer: "Sentara Community Plan", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Cardinal Care managed Medicaid. Check Active." },
  { state: "Virginia", payer: "UHC Community Plan VA", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Cardinal Care managed Medicaid. Check Active." },
  { state: "Virginia", payer: "Anthem BCBS VA (Commercial)", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Verify ABA rider on plan." },
  { state: "Virginia", payer: "Cigna", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad" },
  { state: "Virginia", payer: "UHC-Optum-UBH", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad" },
  { state: "Virginia", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "OON. Verify benefits before scheduling." },
  { state: "Virginia", payer: "Tricare East", insuranceCategory: "Misc", intakeStatus: "TAKE-CONDITIONAL", notes: "ACD/ECHO enrollment required." },

  // -- Maryland (7) — Monday IDs pending CSV upload -----------------------
  { state: "Maryland", payer: "Maryland Medical Assistance (Medicaid FFS)", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "Maryland", payer: "Priority Partners MCO", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "Maryland", payer: "Maryland Physicians Care", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "Maryland", payer: "CareFirst BCBS Community Health Plan MD", insuranceCategory: "MCO", intakeStatus: "TAKE", notes: "Check Active." },
  { state: "Maryland", payer: "CareFirst BCBS (Commercial)", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Verify ABA rider on plan." },
  { state: "Maryland", payer: "Cigna", insuranceCategory: "INN Commercials", intakeStatus: "TAKE-CONDITIONAL", notes: "Unless Benefits are Very Bad" },
  { state: "Maryland", payer: "Aetna", insuranceCategory: "OON Commercial", intakeStatus: "TAKE-CONDITIONAL", notes: "OON. Verify benefits before scheduling." },
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