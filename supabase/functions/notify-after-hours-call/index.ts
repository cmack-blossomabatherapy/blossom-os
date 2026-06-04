// Sends an email notification for an After-Hours AI call to the routed department.
// Looks up phone_ai_call_routing for the department (or 'unverified' fallback)
// and emails every address listed. Logs to phone_ai_call_notifications.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_ADDRESS = 'Blossom OS <noreply@blossom.abacommandcenter.com>'
const APP_URL = 'https://blossom.abacommandcenter.com/phone/ai-calls'
const LOGO_URL = 'https://uvkhjfjknnndunxcdbel.supabase.co/storage/v1/object/public/email-assets/blossom-logo.png'
const BRAND = '#2BA8B0'
const BRAND_DARK = '#1F8A91'
const URGENT = '#dc2626'
const URGENT_DARK = '#991b1b'

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function row(label: string, value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  return `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;vertical-align:top;">${esc(label)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${esc(value)}</td></tr>`
}

function header(urgent: boolean, deptLabel: string, title: string) {
  const bg = urgent
    ? `linear-gradient(135deg, ${URGENT}, ${URGENT_DARK})`
    : `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`
  return `
    <div style="background:#ffffff;padding:28px 24px 14px;text-align:center;border-bottom:1px solid #eef2f7;">
      <img src="${LOGO_URL}" alt="Blossom ABA Therapy" width="180" style="display:inline-block;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;" />
    </div>
    <div style="background:${bg};padding:22px 24px;color:#ffffff;">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.9;">After-Hours AI Receptionist</div>
      <div style="font-size:22px;font-weight:700;margin-top:6px;line-height:1.25;">${esc(title)}</div>
      <div style="font-size:13px;opacity:.95;margin-top:4px;">Routed to <strong>${esc(deptLabel)}</strong></div>
    </div>`
}

function ctaBlock(callId: string | null, phone: string | null, urgent: boolean) {
  const color = urgent ? URGENT : BRAND
  const primaryHref = callId
    ? `${APP_URL}?call=${encodeURIComponent(callId)}`
    : APP_URL
  const primaryLabel = callId ? 'Open call details' : 'Open After-Hours board'
  return `
    <div style="margin-top:26px;text-align:center;">
      <a href="${primaryHref}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:600;font-size:14px;box-shadow:0 4px 12px ${color}33;">${primaryLabel} →</a>
      ${phone ? `<a href="tel:${esc(phone)}" style="display:inline-block;margin-left:10px;background:#ffffff;color:${color};border:1.5px solid ${color};text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">📞 Call back</a>` : ''}
      ${callId ? `<div style="margin-top:12px;"><a href="${APP_URL}" style="color:#64748b;font-size:12px;text-decoration:none;">View all after-hours calls →</a></div>` : ''}
    </div>`
}

function footer() {
  return `<div style="background:#f8fafc;padding:18px 24px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
    <div style="font-weight:600;color:#64748b;margin-bottom:2px;">Blossom ABA Therapy · Operations Command Center</div>
    <div>This message contains operational information. Please handle in accordance with HIPAA and internal SOPs.</div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.json()
    const {
      call_id, force, test,
      department: testDept, to: testTo,
      triggered_by_user_id = null,
      triggered_by_email = null,
      triggered_by_name = null,
    } = body ?? {}

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

    // ---- Test mode: send a sample email to a specific address ----
    if (test) {
      const recipient = (testTo || '').toString().trim()
      const dept = (testDept || 'intake').toString()
      if (!recipient) {
        return new Response(JSON.stringify({ error: 'to (recipient) required for test' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: 'email not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      console.log('[notify-after-hours-call:test] starting', {
        to: recipient,
        department: dept,
        from: FROM_ADDRESS,
        hasLovableApiKey: Boolean(LOVABLE_API_KEY),
        hasResendApiKey: Boolean(RESEND_API_KEY),
      })
      const subject = `✅ Test — Blossom OS After-Hours routing (${dept})`
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;background:#f1f5f9;padding:24px;">
          <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px -12px rgba(15,23,42,0.1);">
            ${header(false, dept, 'Test notification')}
            <div style="padding:26px 28px;color:#0f172a;font-size:14px;line-height:1.6;">
              <p style="margin:0 0 14px 0;">This is a test from the After-Hours AI Calls page. If you received this, email routing for <strong>${esc(dept)}</strong> is working correctly.</p>
              <p style="margin:0;color:#64748b;font-size:13px;">Sent at ${new Date().toLocaleString()}</p>
              ${ctaBlock(null, null, false)}
            </div>
            ${footer()}
          </div>
        </div>`
      const resendRes = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': RESEND_API_KEY,
        },
        body: JSON.stringify({ from: FROM_ADDRESS, to: [recipient], subject, html }),
      })
      const respText = await resendRes.text()
      let respBody: Record<string, unknown> = {}
      try { respBody = respText ? JSON.parse(respText) : {} } catch { respBody = { raw: respText } }
      const resendMessage = String(respBody.message ?? respBody.error ?? respBody.raw ?? '')
      console.log('[notify-after-hours-call:test] resend response', {
        to: recipient,
        department: dept,
        status: resendRes.status,
        ok: resendRes.ok,
        body: respBody,
      })
      const { error: logErr } = await supabase.from('phone_ai_call_notifications').insert({
        call_id: null,
        retell_call_id: null,
        department: dept,
        recipients: [recipient],
        status: resendRes.ok ? 'sent' : 'failed',
        error: resendRes.ok ? null : JSON.stringify(respBody).slice(0, 500),
        subject,
        trigger_source: 'test',
        triggered_by_user_id,
        triggered_by_email,
        triggered_by_name,
        resend_message_id: (respBody as any)?.id ?? null,
        caller_snapshot: { test: true, department: dept, recipient },
      })
      if (logErr) console.error('[notify-after-hours-call:test] notification log insert failed', logErr.message)
      if (!resendRes.ok) {
        return new Response(JSON.stringify({
          error: resendMessage || 'email send failed',
          details: respBody,
          resend: { status: resendRes.status, ok: false, id: respBody.id ?? null, message: resendMessage || null },
        }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({
        ok: true,
        test: true,
        to: recipient,
        department: dept,
        resend: { status: resendRes.status, ok: true, id: respBody.id ?? null, message: resendMessage || null, body: respBody },
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!call_id) {
      return new Response(JSON.stringify({ error: 'call_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: call, error: cErr } = await supabase.from('phone_ai_calls').select('*').eq('id', call_id).single()
    if (cErr || !call) {
      return new Response(JSON.stringify({ error: cErr?.message ?? 'call not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Pick routing department: unverified webhook OR missing summary => 'unverified'
    const needsManualReview = call.verification_status === 'unverified_failed' || (!call.call_summary && !call.reason_for_call)
    const deptKey = needsManualReview ? 'unverified' : (call.department_to_notify || 'intake')

    const { data: routing } = await supabase
      .from('phone_ai_call_routing')
      .select('emails, enabled')
      .eq('department', deptKey)
      .maybeSingle()

    let recipients: string[] = (routing?.emails ?? []).filter((e: string) => !!e)
    const enabled = routing?.enabled ?? true

    // Always fall back to unverified routing list if dept has none
    if (recipients.length === 0 && deptKey !== 'unverified') {
      const { data: fallback } = await supabase
        .from('phone_ai_call_routing').select('emails').eq('department', 'unverified').maybeSingle()
      recipients = (fallback?.emails ?? []).filter((e: string) => !!e)
    }

    const triggerSource: string = force ? 'manual_resend' : 'auto_webhook'
    const callerSnapshot = {
      caller_name: call.caller_name ?? null,
      caller_type: call.caller_type ?? null,
      phone_number: call.phone_number ?? null,
      state: call.state ?? null,
      insurance_provider: call.insurance_provider ?? null,
      insurance_type: call.insurance_type ?? null,
      child_age: call.child_age ?? null,
      reason_for_call: call.reason_for_call ?? null,
      urgency_level: call.urgency_level ?? null,
      verification_status: call.verification_status ?? null,
      department_to_notify: call.department_to_notify ?? null,
      preferred_callback_time: call.preferred_callback_time ?? null,
      patient_ref: (call as any).patient_ref ?? null,
      referral_ref: (call as any).referral_ref ?? null,
      bcba_id: (call as any).bcba_id ?? null,
      rbt_id: (call as any).rbt_id ?? null,
      call_started_at: call.call_started_at ?? null,
    }

    if (!enabled || recipients.length === 0) {
      await supabase.from('phone_ai_call_notifications').insert({
        call_id: call.id, retell_call_id: call.retell_call_id, department: deptKey,
        recipients: [], status: 'skipped', error: !enabled ? 'department disabled' : 'no recipients configured',
        subject: null,
        trigger_source: triggerSource,
        triggered_by_user_id, triggered_by_email, triggered_by_name,
        caller_snapshot: callerSnapshot,
      })
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: !enabled ? 'disabled' : 'no recipients' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'email not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const urgent = call.emergency_flag || (call.urgency_level ?? '').toLowerCase() === 'high'
    const subject = `${urgent ? '🚨 URGENT — ' : ''}After-hours call: ${call.caller_name ?? 'Unknown caller'}${call.state ? ' (' + call.state + ')' : ''}`
    const headerTitle = urgent ? '🚨 Urgent callback needed' : 'New after-hours call'

    // Transcript preview (first ~600 chars) — quick context without opening the app.
    const transcriptPreview = typeof call.transcript === 'string' && call.transcript.trim()
      ? call.transcript.trim().slice(0, 600) + (call.transcript.length > 600 ? '…' : '')
      : null

    const sentimentTone = (call.sentiment ?? '').toLowerCase()
    const sentimentColor = sentimentTone.includes('neg') || sentimentTone.includes('frust') || sentimentTone.includes('angry')
      ? '#dc2626'
      : sentimentTone.includes('pos') || sentimentTone.includes('happy') ? '#059669' : '#64748b'

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;background:#f1f5f9;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px -12px rgba(15,23,42,0.1);">
          ${header(urgent, deptKey, headerTitle)}

          <div style="padding:24px 28px 8px;">
            <!-- Top callout: who/why at a glance -->
            <div style="display:block;background:${urgent ? '#fef2f2' : '#eff6ff'};border:1px solid ${urgent ? '#fecaca' : '#bfdbfe'};border-radius:12px;padding:16px 18px;margin-bottom:18px;">
              <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${urgent ? URGENT_DARK : BRAND_DARK};font-weight:600;margin-bottom:4px;">${urgent ? 'Urgent caller' : 'Caller'}</div>
              <div style="font-size:18px;font-weight:700;color:#0f172a;">${esc(call.caller_name ?? 'Unknown caller')}${call.caller_type ? ` <span style="font-weight:500;color:#64748b;font-size:14px;">· ${esc(call.caller_type)}</span>` : ''}</div>
              ${call.phone_number ? `<div style="margin-top:6px;font-size:14px;color:#334155;"><a href="tel:${esc(call.phone_number)}" style="color:${BRAND};text-decoration:none;font-weight:600;">${esc(call.phone_number)}</a>${call.preferred_callback_time ? ` <span style="color:#64748b;">· prefers ${esc(call.preferred_callback_time)}</span>` : ''}</div>` : ''}
            </div>

            ${call.call_summary ? `
              <div style="background:#f8fafc;border-left:3px solid ${BRAND};border-radius:8px;padding:14px 16px;margin-bottom:18px;color:#0f172a;font-size:14px;line-height:1.6;">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:${BRAND_DARK};font-weight:700;margin-bottom:6px;">AI Summary</div>
                ${esc(call.call_summary)}
              </div>` : ''}

            ${call.reason_for_call ? `
              <div style="margin-bottom:18px;">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;margin-bottom:4px;">Reason for call</div>
                <div style="color:#0f172a;font-size:14px;line-height:1.6;">${esc(call.reason_for_call)}</div>
              </div>` : ''}

            <!-- Details table -->
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;margin-bottom:8px;">Call details</div>
            <table style="width:100%;border-collapse:collapse;border-top:1px solid #eef2f7;">
              ${row('Called at', call.call_started_at ? new Date(call.call_started_at).toLocaleString() : null)}
              ${row('State', call.state)}
              ${row('Child age', call.child_age)}
              ${row('Insurance', [call.insurance_provider, call.insurance_type].filter(Boolean).join(' · '))}
              ${row('Urgency', call.urgency_level)}
              ${call.sentiment ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;vertical-align:top;">Sentiment</td><td style="padding:6px 0;color:${sentimentColor};font-size:14px;font-weight:600;">${esc(call.sentiment)}</td></tr>` : ''}
              ${row('Outcome', (call as any).call_outcome)}
              ${row('Department', call.department_to_notify)}
              ${row('Verification', call.verification_status)}
              ${(call as any).patient_ref ? row('Patient', (call as any).patient_ref) : ''}
              ${(call as any).referral_ref ? row('Referral', (call as any).referral_ref) : ''}
              ${(call as any).bcba_id ? row('BCBA', (call as any).bcba_id) : ''}
              ${(call as any).rbt_id ? row('RBT', (call as any).rbt_id) : ''}
            </table>

            ${transcriptPreview ? `
              <details style="margin-top:18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;">
                <summary style="cursor:pointer;font-size:12px;font-weight:600;color:${BRAND_DARK};text-transform:uppercase;letter-spacing:.06em;">Transcript preview</summary>
                <div style="margin-top:10px;color:#334155;font-size:13px;line-height:1.6;white-space:pre-wrap;">${esc(transcriptPreview)}</div>
              </details>` : ''}

            ${call.recording_url ? `<div style="margin-top:14px;font-size:13px;"><a href="${esc(call.recording_url)}" style="color:${BRAND};font-weight:600;text-decoration:none;">🎧 Listen to the full recording →</a></div>` : ''}

            ${needsManualReview ? `<div style="margin-top:18px;background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.55;"><strong>Manual review required.</strong> The AI could not fully process this call or the webhook was unverified. Please listen to the recording and update the case in the command center.</div>` : ''}

            ${ctaBlock(call.id, call.phone_number, urgent)}
          </div>

          ${footer()}
        </div>
      </div>`

    const resendRes = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: recipients, subject, html }),
    })
    const respBody = await resendRes.json().catch(() => ({}))

    const ok = resendRes.ok
    await supabase.from('phone_ai_call_notifications').insert({
      call_id: call.id, retell_call_id: call.retell_call_id, department: deptKey,
      recipients, status: ok ? 'sent' : 'failed', error: ok ? null : JSON.stringify(respBody).slice(0, 500),
      subject,
      trigger_source: triggerSource,
      triggered_by_user_id, triggered_by_email, triggered_by_name,
      resend_message_id: (respBody as any)?.id ?? null,
      caller_snapshot: callerSnapshot,
    })

    if (!ok) {
      return new Response(JSON.stringify({ error: 'email send failed', details: respBody }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ ok: true, recipients, department: deptKey }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('[notify-after-hours-call]', e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})