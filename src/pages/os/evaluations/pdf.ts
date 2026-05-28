import type { EvalStaff, Evaluation, EvalMeeting, EvalNote, EvalResponse } from "./types";
import { fmtDate } from "./statusBadges";

function ratingsTable(responses: EvalResponse[]): string {
  const rows: { type: string; question: string; rating: number }[] = [];
  responses.forEach((r) => {
    Object.entries(r.answers_json ?? {}).forEach(([k, v]) => {
      if (k.startsWith("rating::") && typeof v === "number") {
        rows.push({ type: r.response_type, question: k.replace("rating::", "").replace(/::/g, " · "), rating: v });
      }
    });
  });
  if (!rows.length) return "<p style='color:#777'>No numeric ratings.</p>";
  const avg = (rows.reduce((a, b) => a + b.rating, 0) / rows.length).toFixed(2);
  return `
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px">
      <thead><tr style="background:#f4f5f7"><th style="text-align:left;padding:6px;border:1px solid #e5e7eb">Type</th><th style="text-align:left;padding:6px;border:1px solid #e5e7eb">Question</th><th style="padding:6px;border:1px solid #e5e7eb">Rating</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td style="padding:6px;border:1px solid #e5e7eb">${r.type}</td><td style="padding:6px;border:1px solid #e5e7eb">${r.question}</td><td style="padding:6px;border:1px solid #e5e7eb;text-align:center">${r.rating}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="2" style="padding:6px;border:1px solid #e5e7eb;text-align:right;font-weight:600">Average</td><td style="padding:6px;border:1px solid #e5e7eb;text-align:center;font-weight:600">${avg}</td></tr></tfoot>
    </table>
  `;
}

function textAnswers(responses: EvalResponse[], type: "Self" | "Leadership"): string {
  const items: { q: string; a: string }[] = [];
  responses.filter((r) => r.response_type === type).forEach((r) => {
    Object.entries(r.answers_json ?? {}).forEach(([k, v]) => {
      if (k.startsWith("text::")) {
        items.push({ q: k.replace("text::", "").replace(/::/g, " · "), a: String(v) });
      }
    });
  });
  if (!items.length) return "<p style='color:#777'>No written responses.</p>";
  return items.map((i) => `<div style="margin:8px 0"><p style="font-weight:600;font-size:11px;color:#374151">${i.q}</p><p style="font-size:12px;white-space:pre-wrap;color:#111">${escapeHtml(i.a)}</p></div>`).join("");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function buildEvaluationSummaryHtml(args: {
  staff: EvalStaff;
  evaluation: Evaluation;
  reviewer?: { first_name: string; last_name: string } | null;
  meetings: EvalMeeting[];
  notes: EvalNote[];
  responses: EvalResponse[];
}): string {
  const { staff, evaluation, reviewer, meetings, notes, responses } = args;
  const latestMeeting = meetings[0];
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Evaluation Summary - ${staff.first_name} ${staff.last_name}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#111;padding:32px;max-width:780px;margin:auto}
  h1{font-size:22px;margin:0}
  h2{font-size:14px;margin:24px 0 8px;color:#1f2937;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  .meta{font-size:11px;color:#6b7280}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px;margin-top:12px}
  .grid div span{color:#6b7280;display:inline-block;width:120px}
  .sig{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px;font-size:11px}
  .sig div{border-top:1px solid #111;padding-top:6px}
  .brand{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #2B7BD5;padding-bottom:12px}
  .brand .name{font-weight:700;color:#2B7BD5}
  @media print{body{padding:0}}
</style></head><body>
  <div class="brand">
    <div><span class="name">Blossom ABA Therapy</span><div class="meta">Evaluation Summary</div></div>
    <div class="meta">Generated ${new Date().toLocaleDateString()}</div>
  </div>
  <h1 style="margin-top:16px">${staff.first_name} ${staff.last_name}</h1>
  <div class="grid">
    <div><span>Role</span>${staff.role}</div>
    <div><span>State</span>${staff.state ?? "—"}</div>
    <div><span>Email</span>${staff.email}</div>
    <div><span>Hire Date</span>${fmtDate(staff.hire_date)}</div>
    <div><span>Evaluation Type</span>${evaluation.evaluation_type}</div>
    <div><span>Reviewer</span>${reviewer ? `${reviewer.first_name} ${reviewer.last_name}` : staff.supervisor_name ?? "—"}</div>
    <div><span>Final Status</span>${evaluation.final_status}</div>
    <div><span>Started</span>${fmtDate(evaluation.created_at)}</div>
    <div><span>Completed</span>${fmtDate(evaluation.completed_at)}</div>
  </div>

  <h2>Self Evaluation Summary</h2>
  ${textAnswers(responses, "Self")}

  <h2>Leadership Evaluation Summary</h2>
  ${textAnswers(responses, "Leadership")}

  <h2>Ratings</h2>
  ${ratingsTable(responses)}

  <h2>Meeting Notes</h2>
  ${latestMeeting ? `<p class="meta">${fmtDate(latestMeeting.meeting_date)} · ${latestMeeting.meeting_status}</p><p style="font-size:12px;white-space:pre-wrap">${escapeHtml(latestMeeting.notes ?? "—")}</p>` : "<p class='meta'>No meeting recorded.</p>"}

  <h2>Internal Notes</h2>
  ${notes.length ? notes.map((n) => `<p style="font-size:12px;margin:6px 0"><span class="meta">${fmtDate(n.created_at)} · </span>${escapeHtml(n.note)}</p>`).join("") : "<p class='meta'>No notes.</p>"}

  <div class="sig">
    <div>Employee Signature</div>
    <div>Reviewer Signature</div>
  </div>
</body></html>`;
}

export function openPrintableSummary(html: string) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
}