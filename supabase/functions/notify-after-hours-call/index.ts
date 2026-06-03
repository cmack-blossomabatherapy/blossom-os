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

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function row(label: string, value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  return `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;vertical-align:top;">${esc(label)}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${esc(value)}</td></tr>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { call_id, force } = await req.json()
    if (!call_id) {
      return new Response(JSON.stringify({ error: 'call_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
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

    if (!enabled || recipients.length === 0) {
      await supabase.from('phone_ai_call_notifications').insert({
        call_id: call.id, retell_call_id: call.retell_call_id, department: deptKey,
        recipients: [], status: 'skipped', error: !enabled ? 'department disabled' : 'no recipients configured',
      })
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: !enabled ? 'disabled' : 'no recipients' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'email not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const urgent = call.emergency_flag || (call.urgency_level ?? '').toLowerCase() === 'high'
    const subject = `${urgent ? '🚨 URGENT — ' : ''}After-hours call: ${call.caller_name ?? 'Unknown caller'}${call.state ? ' (' + call.state + ')' : ''}`

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;background:#f8fafc;padding:24px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <div style="background:${urgent ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#2B7BD5,#5BA9F2)'};padding:20px 24px;color:#fff;">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.85;">Blossom OS · After-Hours AI</div>
            <div style="font-size:20px;font-weight:600;margin-top:4px;">${urgent ? '🚨 Urgent callback needed' : 'New after-hours call'}</div>
            <div style="font-size:13px;opacity:.9;margin-top:2px;">Routed to: ${esc(deptKey)}</div>
          </div>
          <div style="padding:24px;">
            ${call.call_summary ? `<div style="background:#f1f5f9;border-radius:10px;padding:14px 16px;margin-bottom:16px;color:#0f172a;font-size:14px;line-height:1.55;"><strong style="display:block;font-size:11px;text-transform:uppercase;color:#64748b;margin-bottom:6px;letter-spacing:.05em;">AI Summary</strong>${esc(call.call_summary)}</div>` : ''}
            <table style="width:100%;border-collapse:collapse;">
              ${row('Caller', call.caller_name)}
              ${row('Caller type', call.caller_type)}
              ${row('Callback number', call.phone_number)}
              ${row('Preferred callback', call.preferred_callback_time)}
              ${row('State', call.state)}
              ${row('Child age', call.child_age)}
              ${row('Insurance', [call.insurance_provider, call.insurance_type].filter(Boolean).join(' · '))}
              ${row('Reason', call.reason_for_call)}
              ${row('Urgency', call.urgency_level)}
              ${row('Sentiment', call.sentiment)}
              ${row('Department', call.department_to_notify)}
              ${row('Verification', call.verification_status)}
              ${row('Called at', call.call_started_at ? new Date(call.call_started_at).toLocaleString() : null)}
            </table>
            ${needsManualReview ? `<div style="margin-top:16px;background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:10px;padding:12px 14px;font-size:13px;"><strong>Manual review required.</strong> AI could not fully process this call or the webhook was unverified. Please listen to the recording and update the case.</div>` : ''}
            <div style="margin-top:24px;text-align:center;">
              <a href="${APP_URL}" style="display:inline-block;background:#2B7BD5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Open in Blossom OS</a>
              ${call.phone_number ? `<a href="tel:${esc(call.phone_number)}" style="display:inline-block;margin-left:8px;background:#fff;color:#2B7BD5;border:1px solid #2B7BD5;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Call back</a>` : ''}
            </div>
            ${call.recording_url ? `<div style="margin-top:14px;text-align:center;font-size:13px;"><a href="${esc(call.recording_url)}" style="color:#2B7BD5;">Listen to recording →</a></div>` : ''}
          </div>
          <div style="background:#f8fafc;padding:14px 24px;font-size:11px;color:#94a3b8;text-align:center;">Blossom OS · After-Hours AI Receptionist</div>
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