import type { Preset, PresetKey } from "./types";

export const PRESETS: Preset[] = [
  {
    key: "monthly_ops",
    title: "Monthly ABA Operations Report",
    description: "Executive summary, supervision %, parent training presence, auth concerns, cancellations.",
    required: ["client_name", "procedure_code", "worked_hours", "service_date"],
    prompt:
      "Build the Monthly ABA Operations Report. Cover total clients reviewed, total worked hours, totals for CPT 97153 (direct), 97155 (supervision), and 97156 (parent training), clients missing parent training, supervision concerns, authorization concerns, cancelled sessions, and 3–5 leadership insights.",
  },
  {
    key: "auth_utilization",
    title: "Authorization Utilization Report",
    description: "Per-client/auth utilization %, flags for low / near-max / over / missing.",
    required: ["client_name", "procedure_code", "authorized_hours", "worked_hours"],
    prompt:
      "Build the Authorization Utilization Report by client, authorization #, and procedure code. Show authorized, worked, pending, remaining, utilization %, and flag low (<50%), near-max (>=90%), over-utilization (>100%), and missing auth rows.",
  },
  {
    key: "cancellation",
    title: "Cancellation Report",
    description: "Cancelled sessions, top reasons, classification, repeat-offender clients.",
    required: ["client_name", "session_status"],
    prompt:
      "Build the Cancellation Report. Include total cancelled sessions, breakdown by reason, classification (client/provider/no-show/illness/weather/other), top cancellation reasons, and clients with 3 or more cancellations.",
  },
  {
    key: "supervision",
    title: "Supervision Report",
    description: "97155 / 97153 supervision % per client with under-5% / under-10% flags.",
    required: ["client_name", "procedure_code", "worked_hours"],
    prompt:
      "Build the Supervision Report. For each client compute total 97153 (direct) hours, total 97155 (supervision) hours, supervision % = 97155 / 97153, flag missing 97155, under 5%, under 10%, and show the average supervision %.",
  },
  {
    key: "parent_training",
    title: "Parent Training Report",
    description: "97156 presence per client, totals, and percentage with/without parent training.",
    required: ["client_name", "procedure_code", "worked_hours"],
    prompt:
      "Build the Parent Training Report. Show whether each client had any 97156 hours, total 97156 hours, count of clients with and without parent training, and overall percentage with parent training.",
  },
  {
    key: "billing",
    title: "Billing / Service Code Report",
    description: "Hours by procedure code with per-provider and per-client breakdowns.",
    required: ["procedure_code", "worked_hours"],
    prompt:
      "Build a Billing / Service Code Report. Summarize hours by procedure code, by client, and by provider when those columns are available.",
  },
  {
    key: "custom",
    title: "Custom Report",
    description: "Write your own prompt — the engine will still compute totals from the CSV.",
    required: [],
    prompt: "",
  },
];

export function getPreset(key: PresetKey): Preset {
  return PRESETS.find(p => p.key === key) ?? PRESETS[PRESETS.length - 1];
}