import type { EvalStaff, EvalCoachingPlan, EvalPerformanceScore, Evaluation, StandingLevel } from "./types";

export function staffStanding(args: {
  staff: EvalStaff;
  coachingPlans: EvalCoachingPlan[];
  scores: EvalPerformanceScore[];
  evaluations: Evaluation[];
}): StandingLevel {
  const { staff, coachingPlans, scores, evaluations } = args;

  const activePlans = coachingPlans.filter(
    (c) => c.staff_id === staff.id && c.status !== "Completed",
  );
  if (activePlans.some((c) => c.status === "Escalated")) return "Improvement Plan Active";
  if (activePlans.length > 0) return "Needs Coaching";

  const myScores = scores
    .filter((s) => s.staff_id === staff.id)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 3);

  if (myScores.length > 0) {
    const avg = myScores.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / myScores.length;
    if (avg >= 4.5) return "Excellent Standing";
    if (avg >= 3.5) return "Good Standing";
    if (avg >= 2.5) return "Needs Coaching";
    return "Performance Concern";
  }

  const hasOverdue = evaluations.some(
    (e) => e.staff_id === staff.id && (e.final_status === "Overdue"
      || (e.next_review_date && new Date(e.next_review_date) < new Date() && e.final_status !== "Complete")),
  );
  if (hasOverdue) return "Needs Coaching";

  return "Good Standing";
}

export function standingTone(level: StandingLevel): "ok" | "info" | "warn" | "crit" {
  switch (level) {
    case "Excellent Standing": return "ok";
    case "Good Standing": return "info";
    case "Needs Coaching": return "warn";
    case "Performance Concern":
    case "Improvement Plan Active": return "crit";
    default: return "info";
  }
}