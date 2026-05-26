import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  VOB_REVIEWS,
  type VobReview,
  type VobStatus,
  type Tone,
  type StaffingDifficulty,
  type PayorCategory,
} from "@/lib/vob/mockData";

type Row = Record<string, any>;

function mapStatus(r: Row): VobStatus {
  const vob = String(r.vob_status ?? "");
  const fin = String(r.financial_status ?? "");
  const pp = String(r.payment_plan_status ?? "");
  if (fin === "Not Viable") return r.out_of_network && !r.in_network ? "no_oon" : "declined";
  if (fin === "Approved" || vob === "Approved") return "approved";
  if (
    fin === "Payment Plan Required" ||
    vob === "Payment Plan Required" ||
    ["Sent", "Awaiting Signature", "Signed"].includes(pp)
  )
    return "payment_plan";
  if (vob === "Received" && fin === "Pending Review") return "finance_review";
  if (vob === "Sent" || vob === "Not Sent") return "needs_info";
  return "ready";
}

function payorCategory(payor: string, state: string): PayorCategory {
  const p = (payor || "").toLowerCase();
  if (!p) return "yellow";
  if (/bcbs tx/.test(p)) return "red";
  if (/cigna/.test(p) && state === "TN") return "red";
  if (/aetna|bcbs|tricare/.test(p)) return "green";
  if (/uhc|united|medicaid|cigna/.test(p)) return "yellow";
  return "yellow";
}

function tone(value: number, warn: number, crit: number): Tone {
  if (value >= crit) return "crit";
  if (value >= warn) return "warn";
  return "ok";
}

function staffingFromHours(hours: number): StaffingDifficulty {
  if (hours >= 35) return "high_risk";
  if (hours >= 28) return "difficult";
  if (hours >= 20) return "moderate";
  return "easy";
}

function relTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (!d) return "—";
  const diff = Date.now() - d;
  const h = Math.round(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return days <= 1 ? "Yesterday" : `${days}d ago`;
}

function rowToReview(r: Row): VobReview {
  const payor = r.primary_insurance || r.insurance || "Unknown";
  const state = r.state || "—";
  const fam = Number(r.estimated_client_responsibility ?? 0);
  const deductible = Number(r.deductible_amount ?? 0);
  const coins = Number(r.coinsurance_percent ?? 0);
  const hours = Number(r.expected_weekly_hours ?? 0);
  return {
    id: r.id,
    parentName: r.parent_name ?? "—",
    childName: r.child_name ?? "—",
    childAge: 0,
    state,
    payor,
    planType: r.insurance_type || "—",
    policyId: r.policy_id || "—",
    innOon: r.in_network ? "INN" : "OON",
    deductible,
    deductibleMet: Math.max(0, deductible - Number(r.deductible_remaining ?? deductible)),
    coinsurance: coins,
    copay: Number(r.copay ?? 0),
    moop: Number(r.max_out_of_pocket ?? 0),
    oonCoverage: r.out_of_network ? (deductible > 8000 ? "limited" : "covered") : "none",
    requestedHours: hours,
    requestedServices: ["97153", "97155"],
    staffing: staffingFromHours(hours),
    bcbaAvailability: "tight",
    rbtAvailability: "open",
    travelComplexity: "ok",
    marketDemand: "ok",
    urgency: tone(deductible, 5000, 10000),
    status: mapStatus(r),
    assignedReviewer: r.financial_owner ?? "Unassigned",
    intakeCoordinator: r.assigned_intake_coordinator ?? "—",
    stateDirector: "—",
    payorCategory: payorCategory(payor, state),
    estFamilyResponsibility: fam,
    financeRisk: tone(fam, 3000, 7500),
    operationalRisk: tone(hours, 28, 35),
    notes: r.notes
      ? [{ id: `${r.id}-n`, author: r.assigned_intake_coordinator ?? "Intake", role: "Intake", text: r.notes, createdAt: relTime(r.updated_at) }]
      : [],
    communications: [],
    createdAt: relTime(r.created_at),
    updatedAt: relTime(r.updated_at),
  };
}

export function useVobReviews() {
  const [reviews, setReviews] = useState<VobReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("intake_leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setReviews(VOB_REVIEWS);
        setUsingMock(true);
      } else {
        setReviews(data.map(rowToReview));
        setUsingMock(false);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { reviews, loading, usingMock };
}