# Plan — CTM Integration + Purge Test Data

## Part 1 — CTM (CallTrackingMetrics) integration

### What I need from you
- **CTM API Access Key** and **API Secret** (Settings → Integrations → API in CTM). I'll request these via a secure secret form as `CTM_API_KEY` / `CTM_API_SECRET`.
- **Confirm your CTM account ID** (visible in the CTM URL, e.g. `app.calltrackingmetrics.com/accounts/<id>`).
- **Webhook step (after I deploy the endpoint):** in CTM → Notifications, add webhook subscriptions for `Call Started`, `Call Completed`, `Voicemail`, `SMS Received` pointing to the URL I give you, using the shared secret I mint.
- **Tracking number → State/Source mapping** — either a CSV or a quick list mapping each CTM tracking number to (state, marketing source, campaign). Without it, calls land as `state = unassigned` and you route them manually.

### What I'll build

**Schema (migration)**
- `ctm_call_events` — one row per CTM `call_id` (number, direction, from/to, duration, recording_url, transcript, tags[], source_name, campaign_name, tracking_number, called_at, raw jsonb). Unique on `call_id`.
- `ctm_number_mapping` — tracking_number → state, marketing_source_id, campaign_id, default_intake_owner. HR/Admin-editable.
- `ctm_sync_runs` — timestamped run log (backfill vs webhook, counts, error).
- Adds `ctm_call_id` FK column on `intake_leads` and `marketing_call_events` so calls resolve to a lead + attribution.
- RLS: state-scoped read for intake/marketing/leadership; service_role writes; explicit GRANTs.

**Edge functions**
- `ctm-sync` — scheduled (hourly) + on-demand. Pulls `/api/v1/accounts/{id}/calls` since `last_synced_at`, upserts into `ctm_call_events`, downloads transcripts, resolves state/source via `ctm_number_mapping`.
- `ctm-webhook` — public endpoint (no JWT), verifies HMAC signature against a shared `CTM_WEBHOOK_SECRET`, upserts the event, then:
  - Matches caller number → existing `intake_leads` (append to `intake_communications` timeline) OR creates a new state-scoped lead when no match.
  - Emits a realtime notification so the Intake dashboard updates instantly.

**Frontend surfaces (no route/menu changes)**
- `/phone` gets a new "CTM Live Calls" panel (Intake + Admin only, per existing role guard).
- Intake lead detail shows the linked CTM calls (recording player + transcript).
- Marketing Command Center's source/campaign rollups start reading `ctm_call_events` for real call volume.
- `/admin` gets a small "CTM Number Mapping" editor for HR/Admin.

**Ask flow order:** I'll deploy `ctm-webhook` first so you get the URL + secret, then request `CTM_API_KEY` / `CTM_API_SECRET`, then trigger the initial backfill.

---

## Part 2 — Purge all test/operational data (keep users)

### Explicitly KEPT (untouched)
- `profiles`, `employees`, `user_roles`, `role_permissions`, `permissions`, `employee_role_assignments`, `employee_hr_profiles`, `employee_logins`, `employee_pin_settings`, `employee_nfc_tags`, `employee_devices`, `org_chart_nodes`, `departments`, `department_members`.
- Content you authored: `training_courses`, `academy_modules`, `academy_phases`, `academy_weeks`, `academy_tracks`, `academy_module_resources`, `sop_documents`, `sop_sections`, `hr_resources`, `hr_documents`, `hr_departments`, `hr_settings`, `email_templates`, `integration_catalog`, `system_workflows`, `system_issues`, `payer_requirements`, `authorization_requirements`.

### Wiped (single migration, `TRUNCATE ... RESTART IDENTITY CASCADE`)
Grouped by domain:
- **Intake/CRM:** `intake_leads`, `intake_communications`, `intake_documents`, `intake_tasks`, `referral_crm_referrals`, `referral_crm_tasks`, `referral_crm_attachments`, `referral_crm_audit_log`, `referral_activities`, `referral_lead_links`, `referral_import_batches`.
- **Clients/Clinical:** `clients`, `client_authorizations`, `client_reauth_cycles`, `client_assessments`, `client_documents`, `client_compliance_flags`, `client_qa_reviews`, `client_schedule_slots`, `client_service_sessions`, `client_tasks`, `client_timeline`, `assessment_documents`, `case_manager_*` (all 9).
- **Scheduling:** `scheduling_actions`, `scheduling_cancellations`, `scheduling_client_overrides`, `scheduling_client_schedule_slots`, `scheduling_contact_attempts`, `scheduling_coverage_cases`, `scheduling_session_adjustments`, `attendance_exceptions`, `family_staffing_preferences`, `staffing_matches`, `staffing_case_activity`, `staffing_integration_handoffs`.
- **BCBA/RBT ops:** `bcba_*` (all), `rbt_*` (all — sessions, supervision, messages, help_requests, readiness, competency, resource_prefs, assignments).
- **Authorizations:** `authorization_operational_records`, `authorization_activity`, `authorization_tasks`, `authorization_saved_views`.
- **Marketing:** `marketing_*` (all), `bd_territories`, `bd_territory_leads`.
- **Recruiting:** `recruiting_*` (all).
- **Behavioral support:** `behavioral_support_*` (all).
- **Credentialing:** `credentialing_*` (all), `va_credentialing_raw`.
- **Executive/Ops/State:** `executive_*`, `operations_work_items`, `operations_work_item_events`, `state_operational_*`, `state_department_handoffs`, `state_centralreach_outbox`, `state_daily_health_notes`, `department_kpis`, `department_resources`, `kpi_scorecards`, `kpi_values`, `kpi_notes`, `kpi_imports`.
- **Phone/AI/Escalation:** `phone_ai_calls`, `phone_ai_call_notifications`, `phone_ai_call_routing` (config kept? no — you asked wipe-all), `escalation_threads`, `escalation_thread_messages`, `chat_conversations`, `chat_messages`, `chat_message_feedback`, `ai_audit_log`, `ai_memory_entries`, `ai_message_feedback`.
- **Reports/QA:** `report_requests`, `report_saved_snapshots`, `report_followups`, `shared_report_recents`, `qa_note_monitoring`, `qa_work_item_overrides`, `clinical_*`.
- **Company Home:** `company_calendar_events`, `company_updates`, `company_highlights` (you'll re-enter real ones).
- **HR ops (not people):** `hr_announcements`, `hr_announcement_reads`, `hr_messages`, `hr_activity_events`, `hr_audit_logs`, `hr_saved_reports`, `hr_document_acknowledgements`, `employee_notes`, `employee_reviews`, `employee_cases`, `employee_bonuses`, `employee_pay_changes`, `employee_hours_snapshots`, `employee_onboarding`, `employee_onboarding_tasks`, `employee_trainings`, `employee_documents_hr`, `employee_timeline`, `employee_relationships`.
- **Evaluation suite:** `evaluation_*` (all).
- **Time/PTO/Payroll:** `time_clock_punches`, `hours_timesheets`, `hours_timesheet_entries`, `pto_requests`, `mileage_trips`, `mileage_reimbursement_exports`, `payroll_*`.
- **Import staging:** `monday_*_raw` (all), `data_uploads`, `knowledge_documents`, `knowledge_chunks`.
- **Misc activity/audit:** `academy_audit_log`, `academy_enrollment_audit`, `academy_enrollments`, `academy_progress`, `academy_runtime_progress`, `academy_certificates`, `academy_user_certificates`, `academy_quiz_attempts`, `academy_shadow_sessions`, `academy_checkins`, `academy_competency_scores`, `training_progress`, `training_assignments`, `training_lesson_progress`, `training_quiz_attempts`, `training_reflections`, `training_followups`, `training_track_enrollments`, `training_module_defaults`, `user_training_progress`, `user_training_badges`, `leadership_video_progress`, `journey_events`, `journey_module_overrides`, `journey_phase_overrides`, `journey_step_attachments`, `onboarding_state`, `onboarding_milestone_progress`, `onboarding_audit_log`, `onboarding_route_locks`, `role_audit_log`, `login_access_logs`, `secure_unlock_events`, `invite_email_logs`, `access_requests`, `critical_alerts`, `critical_alert_audit`, `alert_reads`, `mobile_alert_dismissals`, `push_deliveries`, `push_subscriptions`, `push_notification_preferences`.

Handled as one migration with dependency-safe ordering (CASCADE). Sequences reset.

### Frontend guardrails (not in this ask — will flag only)
I will **not** rip out the `STATE_*_SEED` fallbacks in code this turn — that was a previous pass's scope and the empty-state UI already respects `awaiting`. If you want those code paths audited too, say the word and I'll add a follow-up pass.

---

## Order of execution
1. Purge migration (fast, one shot).
2. CTM schema migration + GRANTs + RLS.
3. Deploy `ctm-webhook` → give you the URL + `CTM_WEBHOOK_SECRET`.
4. Deploy `ctm-sync`; request `CTM_API_KEY` / `CTM_API_SECRET`; kick off first backfill.
5. Wire the Intake / Marketing / Phone panels to `ctm_call_events`.
6. Ship the `ctm_number_mapping` admin editor.

Approve and I'll start with the purge migration so you're on a clean slate before CTM data flows in.
